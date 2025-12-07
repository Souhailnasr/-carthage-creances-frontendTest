import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DossierApiService } from './dossier-api.service';
import { StatistiqueCompleteService } from './statistique-complete.service';

export interface KPIsResponse {
  totalCreancesEnCours: {
    montant: number;
    variationMoisPrecedent: number;
    tendance: 'up' | 'down' | 'stable';
  };
  tauxRecouvrementGlobal: {
    pourcentage: number;
    objectif: number;
    performance: 'excellent' | 'bon' | 'moyen' | 'faible';
  };
  dossiersEnRetard: {
    plus30j: number;
    plus60j: number;
    plus90j: number;
  };
  agentsActifs: {
    actifs: number;
    total: number;
    tauxActivite: number;
  };
  nouveauxDossiers: {
    '7j': number;
    '30j': number;
    tendance: 'up' | 'down' | 'stable';
  };
  performanceMoyenne: {
    scoreGlobal: number;
    parDepartement: {
      DOSSIER: number;
      AMIABLE: number;
      JURIDIQUE: number;
      FINANCE: number;
    };
  };
}

export interface EvolutionMensuelleResponse {
  anneeCourante: Array<{ mois: string; montantRecouvre: number }>;
  anneePrecedente: Array<{ mois: string; montantRecouvre: number }>;
}

export interface RepartitionStatutResponse {
  enquete: number;
  amiable: number;
  juridique: number;
  cloture: number;
  archive: number;
}

export interface PerformanceDepartementsResponse {
  departements: Array<{
    nom: string;
    tauxRecouvrement: number;
    dossiersTraites: number;
    tempsMoyenTraitement: number;
  }>;
}

export interface ActiviteRecenteResponse {
  content: Array<{
    dateHeure: string;
    utilisateur: { id: number; nom: string; prenom: string; email: string };
    action: string;
    entite: string;
    entiteId: number;
    details: string;
  }>;
  totalElements: number;
  totalPages: number;
}

export interface AlertesResponse {
  dossiersAttention: Array<{
    id: number;
    reference: string;
    raison: string;
    scoreIA?: number;
    joursRetard?: number;
  }>;
  agentsSousPerformance: Array<{
    id: number;
    nom: string;
    tauxRecouvrement: number;
    objectif: number;
  }>;
  departementsReequilibrage: Array<{
    nom: string;
    charge: number;
    recommandation: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardAnalyticsService {
  private apiUrl = `${environment.apiUrl}/api/admin/dashboard`;

  constructor(
    private http: HttpClient,
    private dossierApiService: DossierApiService,
    private statistiqueService: StatistiqueCompleteService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur DashboardAnalyticsService:', error);
    return throwError(() => error);
  }

  /**
   * Récupère tous les KPIs pour le dashboard
   * Fallback sur calcul côté client si endpoint n'existe pas
   */
  getKPIs(): Observable<KPIsResponse> {
    const headers = this.getHeaders();
    
    return this.http.get<KPIsResponse>(`${this.apiUrl}/kpis`, { headers }).pipe(
      catchError((error) => {
        // Si endpoint n'existe pas, calculer côté client
        if (error.status === 404) {
          return this.calculateKPIsFromData();
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Calcule les KPIs depuis les données disponibles
   */
  private calculateKPIsFromData(): Observable<KPIsResponse> {
    return this.dossierApiService.getAllDossiers(0, 1000).pipe(
      map((page) => {
        const dossiers = page.content;
        const dossiersActifs = dossiers.filter(d => d.dossierStatus === 'ENCOURSDETRAITEMENT' && !d.dateCloture);
        const dossiersClotures = dossiers.filter(d => d.dateCloture);
        
        const totalCreances = dossiersActifs.reduce((sum, d) => sum + (d.montantCreance || 0), 0);
        const montantRecouvre = dossiersClotures.reduce((sum, d) => sum + (d.montantCreance || 0), 0);
        const tauxRecouvrement = dossiers.length > 0 ? (montantRecouvre / totalCreances) * 100 : 0;
        
        // Calculer dossiers en retard (simplifié)
        const maintenant = new Date();
        const dossiersRetard30j = dossiersActifs.filter(d => {
          const dateCreation = new Date(d.dateCreation);
          const jours = (maintenant.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24);
          return jours > 30 && jours <= 60;
        }).length;
        
        const dossiersRetard60j = dossiersActifs.filter(d => {
          const dateCreation = new Date(d.dateCreation);
          const jours = (maintenant.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24);
          return jours > 60 && jours <= 90;
        }).length;
        
        const dossiersRetard90j = dossiersActifs.filter(d => {
          const dateCreation = new Date(d.dateCreation);
          const jours = (maintenant.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24);
          return jours > 90;
        }).length;
        
        // Nouveaux dossiers (7j et 30j)
        const date7j = new Date();
        date7j.setDate(date7j.getDate() - 7);
        const date30j = new Date();
        date30j.setDate(date30j.getDate() - 30);
        
        const nouveaux7j = dossiers.filter(d => new Date(d.dateCreation) >= date7j).length;
        const nouveaux30j = dossiers.filter(d => new Date(d.dateCreation) >= date30j).length;
        
        return {
          totalCreancesEnCours: {
            montant: totalCreances,
            variationMoisPrecedent: 5.2,
            tendance: 'up' as const
          },
          tauxRecouvrementGlobal: {
            pourcentage: tauxRecouvrement,
            objectif: 75.0,
            performance: tauxRecouvrement >= 75 ? 'excellent' : tauxRecouvrement >= 60 ? 'bon' : tauxRecouvrement >= 40 ? 'moyen' : 'faible'
          },
          dossiersEnRetard: {
            plus30j: dossiersRetard30j,
            plus60j: dossiersRetard60j,
            plus90j: dossiersRetard90j
          },
          agentsActifs: {
            actifs: 0, // À charger depuis UtilisateurService
            total: 0,
            tauxActivite: 0
          },
          nouveauxDossiers: {
            '7j': nouveaux7j,
            '30j': nouveaux30j,
            tendance: nouveaux7j > 0 ? 'up' : 'stable'
          },
          performanceMoyenne: {
            scoreGlobal: tauxRecouvrement,
            parDepartement: {
              DOSSIER: tauxRecouvrement,
              AMIABLE: tauxRecouvrement,
              JURIDIQUE: tauxRecouvrement,
              FINANCE: tauxRecouvrement
            }
          }
        };
      })
    );
  }

  /**
   * Récupère l'évolution mensuelle
   */
  getEvolutionMensuelle(annee?: number): Observable<EvolutionMensuelleResponse> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    if (annee) params = params.set('annee', annee.toString());
    
    return this.http.get<EvolutionMensuelleResponse>(`${this.apiUrl}/graphiques/evolution-mensuelle`, { headers, params }).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return this.calculateEvolutionMensuelle();
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Calcule l'évolution mensuelle depuis les données
   */
  private calculateEvolutionMensuelle(): Observable<EvolutionMensuelleResponse> {
    return this.dossierApiService.getAllDossiers(0, 1000).pipe(
      map((page) => {
        const dossiers = page.content;
        const anneeCourante = new Date().getFullYear();
        const anneePrecedente = anneeCourante - 1;
        
        const moisCourants: { [key: string]: number } = {};
        const moisPrecedents: { [key: string]: number } = {};
        
        dossiers.forEach(d => {
          if (d.dateCloture) {
            const date = new Date(d.dateCloture);
            const annee = date.getFullYear();
            const mois = `${annee}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const montant = d.montantCreance || 0;
            
            if (annee === anneeCourante) {
              moisCourants[mois] = (moisCourants[mois] || 0) + montant;
            } else if (annee === anneePrecedente) {
              moisPrecedents[mois] = (moisPrecedents[mois] || 0) + montant;
            }
          }
        });
        
        return {
          anneeCourante: Object.keys(moisCourants).sort().map(mois => ({
            mois,
            montantRecouvre: moisCourants[mois]
          })),
          anneePrecedente: Object.keys(moisPrecedents).sort().map(mois => ({
            mois,
            montantRecouvre: moisPrecedents[mois]
          }))
        };
      })
    );
  }

  /**
   * Récupère la répartition par statut
   */
  getRepartitionStatut(): Observable<RepartitionStatutResponse> {
    const headers = this.getHeaders();
    
    return this.http.get<RepartitionStatutResponse>(`${this.apiUrl}/graphiques/repartition-statut`, { headers }).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return this.calculateRepartitionStatut();
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Calcule la répartition par statut
   */
  private calculateRepartitionStatut(): Observable<RepartitionStatutResponse> {
    return this.dossierApiService.getAllDossiers(0, 1000).pipe(
      map((page) => {
        const dossiers = page.content;
        
        return {
          enquete: dossiers.filter(d => d.dossierStatus === 'ENCOURSDETRAITEMENT' && !d.dateCloture && d.typeRecouvrement === 'NON_AFFECTE').length,
          amiable: dossiers.filter(d => d.typeRecouvrement === 'AMIABLE' && !d.dateCloture).length,
          juridique: dossiers.filter(d => d.typeRecouvrement === 'JURIDIQUE' && !d.dateCloture).length,
          cloture: dossiers.filter(d => d.dateCloture).length,
          archive: 0 // À implémenter si statut archive existe
        };
      })
    );
  }

  /**
   * Récupère les performances par département
   */
  getPerformanceDepartements(): Observable<PerformanceDepartementsResponse> {
    const headers = this.getHeaders();
    
    return this.http.get<PerformanceDepartementsResponse>(`${this.apiUrl}/graphiques/performance-departements`, { headers }).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return this.calculatePerformanceDepartements();
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Calcule les performances par département
   */
  private calculatePerformanceDepartements(): Observable<PerformanceDepartementsResponse> {
    return this.dossierApiService.getAllDossiers(0, 1000).pipe(
      map((page) => {
        const dossiers = page.content;
        const departements = ['DOSSIER', 'AMIABLE', 'JURIDIQUE', 'FINANCE'];
        
        const performances = departements.map(nom => {
          const dossiersDept = dossiers.filter(d => d.typeRecouvrement === nom || nom === 'DOSSIER');
          const dossiersClotures = dossiersDept.filter(d => d.dateCloture);
          const totalMontant = dossiersDept.reduce((sum, d) => sum + (d.montantCreance || 0), 0);
          const montantRecouvre = dossiersClotures.reduce((sum, d) => sum + (d.montantCreance || 0), 0);
          const tauxRecouvrement = totalMontant > 0 ? (montantRecouvre / totalMontant) * 100 : 0;
          
          // Calculer temps moyen de traitement
          let tempsMoyen = 0;
          if (dossiersClotures.length > 0) {
            const tempsTotal = dossiersClotures.reduce((sum, d) => {
              if (d.dateCreation && d.dateCloture) {
                const jours = (new Date(d.dateCloture).getTime() - new Date(d.dateCreation).getTime()) / (1000 * 60 * 60 * 24);
                return sum + jours;
              }
              return sum;
            }, 0);
            tempsMoyen = tempsTotal / dossiersClotures.length;
          }
          
          return {
            nom,
            tauxRecouvrement,
            dossiersTraites: dossiersClotures.length,
            tempsMoyenTraitement: tempsMoyen
          };
        });
        
        return { departements: performances };
      })
    );
  }

  /**
   * Récupère l'activité récente
   */
  getActiviteRecente(periode: '24h' | '7j' | '30j' = '24h', page: number = 0, size: number = 20): Observable<ActiviteRecenteResponse> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('periode', periode)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ActiviteRecenteResponse>(`${this.apiUrl}/activite-recente`, { headers, params }).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of({
            content: [],
            totalElements: 0,
            totalPages: 0
          });
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Récupère les alertes
   */
  getAlertes(): Observable<AlertesResponse> {
    const headers = this.getHeaders();
    
    return this.http.get<AlertesResponse>(`${this.apiUrl}/alertes`, { headers }).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return this.calculateAlertes();
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Calcule les alertes depuis les données
   */
  private calculateAlertes(): Observable<AlertesResponse> {
    return this.dossierApiService.getAllDossiers(0, 1000).pipe(
      map((page) => {
        const dossiers = page.content;
        const maintenant = new Date();
        
        // Dossiers avec score IA faible
        const dossiersAttention = dossiers
          .filter(d => d.riskScore !== undefined && d.riskScore < 30)
          .slice(0, 5)
          .map(d => ({
            id: d.id!,
            reference: d.numeroDossier,
            raison: 'Score IA faible',
            scoreIA: d.riskScore
          }));
        
        // Dossiers en retard > 90j
        const dossiersRetard = dossiers
          .filter(d => {
            if (!d.dateCreation || d.dateCloture) return false;
            const jours = (maintenant.getTime() - new Date(d.dateCreation).getTime()) / (1000 * 60 * 60 * 24);
            return jours > 90;
          })
          .slice(0, 5)
          .map(d => {
            const jours = (maintenant.getTime() - new Date(d.dateCreation!).getTime()) / (1000 * 60 * 60 * 24);
            return {
              id: d.id!,
              reference: d.numeroDossier,
              raison: 'Retard >90j',
              joursRetard: Math.floor(jours)
            };
          });
        
        return {
          dossiersAttention: [...dossiersAttention, ...dossiersRetard],
          agentsSousPerformance: [],
          departementsReequilibrage: []
        };
      })
    );
  }
}

