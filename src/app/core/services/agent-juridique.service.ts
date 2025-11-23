import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DossierApi } from '../../shared/models/dossier-api.model';
import { Avocat } from '../../juridique/models/avocat.model';
import { Huissier } from '../../juridique/models/huissier.model';

export interface Audience {
  id?: number;
  dossierId: number;
  dateAudience: string;
  typeAudience: string;
  tribunal?: string;
  avocatId?: number;
  huissierId?: number;
  agentId?: number;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  resultat?: string;
  commentaire?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentJuridiqueStats {
  totalDossiers: number;
  dossiersEnCours: number;
  dossiersClotures: number;
  totalAudiences: number;
  audiencesPlanifiees: number;
  audiencesTerminees: number;
  montantRecupere: number;
  montantEnCours: number;
}

@Injectable({
  providedIn: 'root'
})
export class AgentJuridiqueService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les statistiques personnelles de l'agent
   */
  getStatistiquesPersonnelles(agentId: number): Observable<AgentJuridiqueStats> {
    return this.http.get<AgentJuridiqueStats>(`${this.apiUrl}/agents-juridique/${agentId}/statistiques`).pipe(
      catchError((error) => {
        console.warn('⚠️ Endpoint statistiques non disponible, calcul côté client');
        return this.calculerStatistiques(agentId);
      })
    );
  }

  /**
   * Calcule les statistiques depuis les dossiers et audiences
   */
  private calculerStatistiques(agentId: number): Observable<AgentJuridiqueStats> {
    return this.getDossiersAffectes(agentId).pipe(
      map((dossiers) => {
        const totalDossiers = dossiers.length;
        const dossiersEnCours = dossiers.filter(d => !d.dateCloture && d.dossierStatus !== 'CLOTURE').length;
        const dossiersClotures = totalDossiers - dossiersEnCours;
        const montantEnCours = dossiers
          .filter(d => !d.dateCloture)
          .reduce((sum, d) => sum + (d.montantCreance || 0), 0);
        
        return {
          totalDossiers,
          dossiersEnCours,
          dossiersClotures,
          totalAudiences: 0,
          audiencesPlanifiees: 0,
          audiencesTerminees: 0,
          montantRecupere: 0,
          montantEnCours
        };
      })
    );
  }

  /**
   * Récupère les dossiers affectés à l'agent juridique
   */
  getDossiersAffectes(agentId: number, page: number = 0, size: number = 20): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/dossiers/juridique/agent/${agentId}`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(
      catchError((error) => {
        console.warn('⚠️ Endpoint dossiers juridique par agent non disponible');
        // Fallback: utiliser getAllDossiers et filtrer
        return this.http.get<{content: DossierApi[], totalElements: number}>(`${this.apiUrl}/dossiers`, {
          params: new HttpParams()
            .set('page', page.toString())
            .set('size', '100')
        }).pipe(
          map((response) => {
            return response.content.filter(d => 
              (d.agentResponsable?.id?.toString() === agentId.toString() ||
               d.agentCreateur?.id?.toString() === agentId.toString()) &&
              (d.typeRecouvrement === 'JURIDIQUE' || d.avocat || d.huissier)
            );
          })
        );
      })
    );
  }

  /**
   * Récupère la liste des avocats (lecture seule)
   */
  getAvocats(): Observable<Avocat[]> {
    return this.http.get<Avocat[]>(`${this.apiUrl}/avocats`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des avocats:', error);
        return throwError(() => new Error('Erreur lors de la récupération des avocats'));
      })
    );
  }

  /**
   * Récupère la liste des huissiers (lecture seule)
   */
  getHuissiers(): Observable<Huissier[]> {
    return this.http.get<Huissier[]>(`${this.apiUrl}/huissiers`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des huissiers:', error);
        return throwError(() => new Error('Erreur lors de la récupération des huissiers'));
      })
    );
  }

  /**
   * Récupère les audiences d'un dossier
   */
  getAudiencesByDossier(dossierId: number): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.apiUrl}/audiences/dossier/${dossierId}`).pipe(
      map(audiences => audiences.map(audience => ({
        ...audience,
        dateAudience: new Date(audience.dateAudience).toISOString()
      }))),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des audiences:', error);
        return throwError(() => new Error('Erreur lors de la récupération des audiences'));
      })
    );
  }

  /**
   * Récupère les audiences affectées à l'agent
   */
  getAudiencesAffectees(agentId: number): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.apiUrl}/audiences/agent/${agentId}`).pipe(
      map(audiences => audiences.map(audience => ({
        ...audience,
        dateAudience: new Date(audience.dateAudience).toISOString()
      }))),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des audiences affectées:', error);
        return throwError(() => new Error('Erreur lors de la récupération des audiences affectées'));
      })
    );
  }

  /**
   * Créer une audience
   */
  createAudience(audience: Partial<Audience>): Observable<Audience> {
    return this.http.post<Audience>(`${this.apiUrl}/audiences`, audience).pipe(
      map(audience => ({
        ...audience,
        dateAudience: new Date(audience.dateAudience!).toISOString()
      })),
      catchError((error) => {
        console.error('❌ Erreur lors de la création de l\'audience:', error);
        return throwError(() => new Error('Erreur lors de la création de l\'audience'));
      })
    );
  }

  /**
   * Modifier une audience
   */
  updateAudience(audienceId: number, audience: Partial<Audience>): Observable<Audience> {
    return this.http.put<Audience>(`${this.apiUrl}/audiences/${audienceId}`, audience).pipe(
      map(audience => ({
        ...audience,
        dateAudience: new Date(audience.dateAudience!).toISOString()
      })),
      catchError((error) => {
        console.error('❌ Erreur lors de la modification de l\'audience:', error);
        return throwError(() => new Error('Erreur lors de la modification de l\'audience'));
      })
    );
  }

  /**
   * Supprimer une audience
   */
  deleteAudience(audienceId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/audiences/${audienceId}`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la suppression de l\'audience:', error);
        return throwError(() => new Error('Erreur lors de la suppression de l\'audience'));
      })
    );
  }
}

