import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DossierApiService } from './dossier-api.service';

export interface UserPerformance {
  utilisateur: {
    id: number;
    nom: string;
    prenom: string;
  };
  metriques: {
    dossiersTraitesTotal: number;
    tauxRecouvrementPersonnel: number;
    tempsMoyenTraitement: number;
    dossiersEnCours: number;
    scorePerformance: number;
  };
  evolutionPerformance: Array<{
    mois: string;
    score: number;
  }>;
  repartitionParStatut: {
    CLOTURE: number;
    EN_COURS: number;
    ARCHIVE: number;
  };
  dossiersRecents: Array<{
    id: number;
    reference: string;
    performance: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class UserPerformanceService {
  private apiUrl = `${environment.apiUrl}/api/admin/utilisateurs`;

  constructor(
    private http: HttpClient,
    private dossierApiService: DossierApiService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur UserPerformanceService:', error);
    return throwError(() => error);
  }

  /**
   * Récupère la performance détaillée d'un utilisateur
   * Fallback sur calcul côté client si endpoint n'existe pas
   */
  getPerformance(userId: number): Observable<UserPerformance> {
    const headers = this.getHeaders();
    
    return this.http.get<UserPerformance>(`${this.apiUrl}/${userId}/performance`, { headers }).pipe(
      catchError((error) => {
        // Si endpoint n'existe pas, calculer côté client
        if (error.status === 404) {
          return this.calculatePerformanceFromData(userId);
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Calcule la performance depuis les données disponibles
   */
  private calculatePerformanceFromData(userId: number): Observable<UserPerformance> {
    return this.dossierApiService.getAllDossiers(0, 1000).pipe(
      map((page) => {
        const dossiers = page.content;
        const dossiersUtilisateur = dossiers.filter(d => 
          d.agentCreateur?.id === userId || d.agentResponsable?.id === userId
        );
        
        const dossiersClotures = dossiersUtilisateur.filter(d => d.dateCloture);
        const dossiersEnCours = dossiersUtilisateur.filter(d => !d.dateCloture);
        
        // Calculer métriques
        const dossiersTraitesTotal = dossiersUtilisateur.length;
        const montantTotal = dossiersUtilisateur.reduce((sum, d) => sum + (d.montantCreance || 0), 0);
        const montantRecouvre = dossiersClotures.reduce((sum, d) => sum + (d.montantCreance || 0), 0);
        const tauxRecouvrementPersonnel = montantTotal > 0 ? (montantRecouvre / montantTotal) * 100 : 0;
        
        // Calculer temps moyen de traitement
        let tempsMoyenTraitement = 0;
        if (dossiersClotures.length > 0) {
          const tempsTotal = dossiersClotures.reduce((sum, d) => {
            if (d.dateCreation && d.dateCloture) {
              const jours = (new Date(d.dateCloture).getTime() - new Date(d.dateCreation).getTime()) / (1000 * 60 * 60 * 24);
              return sum + jours;
            }
            return sum;
          }, 0);
          tempsMoyenTraitement = tempsTotal / dossiersClotures.length;
        }
        
        // Score de performance (simplifié)
        const scorePerformance = (tauxRecouvrementPersonnel * 0.6) + ((100 - tempsMoyenTraitement) * 0.4);
        
        // Évolution performance (simplifié: dernier mois)
        const maintenant = new Date();
        const dernierMois = new Date();
        dernierMois.setMonth(dernierMois.getMonth() - 1);
        
        const dossiersDernierMois = dossiersClotures.filter(d => {
          if (!d.dateCloture) return false;
          const date = new Date(d.dateCloture);
          return date >= dernierMois && date <= maintenant;
        });
        
        const evolutionPerformance = [
          {
            mois: `${dernierMois.getFullYear()}-${String(dernierMois.getMonth() + 1).padStart(2, '0')}`,
            score: scorePerformance * 0.9 // Approximation
          },
          {
            mois: `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`,
            score: scorePerformance
          }
        ];
        
        // Répartition par statut
        const repartitionParStatut = {
          CLOTURE: dossiersClotures.length,
          EN_COURS: dossiersEnCours.length,
          ARCHIVE: 0 // À implémenter si statut archive existe
        };
        
        // Dossiers récents (5 derniers)
        const dossiersRecents = dossiersUtilisateur
          .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
          .slice(0, 5)
          .map(d => ({
            id: d.id!,
            reference: d.numeroDossier,
            performance: tauxRecouvrementPersonnel // Simplifié
          }));
        
        return {
          utilisateur: {
            id: userId,
            nom: '',
            prenom: ''
          },
          metriques: {
            dossiersTraitesTotal,
            tauxRecouvrementPersonnel,
            tempsMoyenTraitement,
            dossiersEnCours: dossiersEnCours.length,
            scorePerformance: Math.max(0, Math.min(100, scorePerformance))
          },
          evolutionPerformance,
          repartitionParStatut,
          dossiersRecents
        };
      })
    );
  }

  /**
   * Calcule un score de performance rapide pour un utilisateur
   */
  getQuickPerformanceScore(userId: number): Observable<number> {
    return this.getPerformance(userId).pipe(
      map(perf => perf.metriques.scorePerformance)
    );
  }
}

