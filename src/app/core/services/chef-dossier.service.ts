import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { DossierApiService } from './dossier-api.service';
import { DossierApi, DossiersResponse } from '../../shared/models/dossier-api.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChefDossierService {
  private dossiersEnAttenteSubject = new BehaviorSubject<DossierApi[]>([]);
  public dossiersEnAttente$ = this.dossiersEnAttenteSubject.asObservable();

  private statistiquesSubject = new BehaviorSubject<any>({});
  public statistiques$ = this.statistiquesSubject.asObservable();

  constructor(
    private dossierApiService: DossierApiService,
    private authService: AuthService
  ) {}

  // ==================== GESTION DES DOSSIERS EN ATTENTE ====================

  /**
   * Charge les dossiers en attente de validation
   */
  loadDossiersEnAttente(): Observable<DossierApi[]> {
    return this.dossierApiService.getDossiersEnAttente().pipe(
      tap(dossiers => {
        this.dossiersEnAttenteSubject.next(dossiers);
        console.log('Dossiers en attente chargés:', dossiers);
      })
    );
  }

  /**
   * Récupère les dossiers en attente (depuis le cache)
   */
  getDossiersEnAttente(): DossierApi[] {
    return this.dossiersEnAttenteSubject.value;
  }

  /**
   * Filtre les dossiers par statut
   */
  getDossiersByStatus(status: string): Observable<DossierApi[]> {
    return this.dossiersEnAttente$.pipe(
      map(dossiers => dossiers.filter(d => d.dossierStatus === status))
    );
  }

  /**
   * Filtre les dossiers par urgence
   */
  getDossiersByUrgence(urgence: string): Observable<DossierApi[]> {
    return this.dossiersEnAttente$.pipe(
      map(dossiers => dossiers.filter(d => d.urgence === urgence))
    );
  }

  // ==================== VALIDATION DES DOSSIERS ====================

  /**
   * Valide un dossier
   */
  validerDossier(dossierId: number): Observable<DossierApi> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    return this.dossierApiService.validerDossier(dossierId, Number(currentUser.id)).pipe(
      tap(validatedDossier => {
        // Mettre à jour la liste locale
        const dossiers = this.dossiersEnAttenteSubject.value;
        const updatedDossiers = dossiers.filter(d => d.id !== dossierId);
        this.dossiersEnAttenteSubject.next(updatedDossiers);
        
        console.log('Dossier validé:', validatedDossier);
      })
    );
  }

  /**
   * Rejette un dossier
   */
  rejeterDossier(dossierId: number, commentaire: string): Observable<DossierApi> {
    return this.dossierApiService.rejeterDossier(dossierId, commentaire).pipe(
      tap(rejectedDossier => {
        // Mettre à jour la liste locale
        const dossiers = this.dossiersEnAttenteSubject.value;
        const updatedDossiers = dossiers.filter(d => d.id !== dossierId);
        this.dossiersEnAttenteSubject.next(updatedDossiers);
        
        console.log('Dossier rejeté:', rejectedDossier);
      })
    );
  }

  // ==================== STATISTIQUES ====================

  /**
   * Charge les statistiques du chef de département
   */
  loadStatistiques(): Observable<any> {
    return this.dossierApiService.countTotalDossiers().pipe(
      tap(total => {
        this.statistiquesSubject.next({
          ...this.statistiquesSubject.value,
          totalDossiers: total
        });
      })
    );
  }

  /**
   * Charge les statistiques détaillées
   */
  loadStatistiquesDetaillees(): Observable<any> {
    const stats$ = this.dossierApiService.countTotalDossiers();
    const enCours$ = this.dossierApiService.countDossiersEnCours();
    const valides$ = this.dossierApiService.countDossiersValides();
    const ceMois$ = this.dossierApiService.countDossiersCreesCeMois();

    return stats$.pipe(
      tap(total => {
        // Charger les autres statistiques en parallèle
        enCours$.subscribe(enCours => {
          valides$.subscribe(valides => {
            ceMois$.subscribe(ceMois => {
              this.statistiquesSubject.next({
                totalDossiers: total,
                dossiersEnCours: enCours,
                dossiersValides: valides,
                dossiersCreesCeMois: ceMois
              });
            });
          });
        });
      })
    );
  }

  /**
   * Récupère les statistiques (depuis le cache)
   */
  getStatistiques(): any {
    return this.statistiquesSubject.value;
  }

  // ==================== GESTION DES AGENTS ====================

  /**
   * Récupère les dossiers d'un agent spécifique
   */
  getDossiersByAgent(agentId: number): Observable<DossierApi[]> {
    return this.dossierApiService.getDossiersByAgent(agentId);
  }

  /**
   * Récupère les dossiers créés par un agent
   */
  getDossiersCreesByAgent(agentId: number): Observable<DossierApi[]> {
    return this.dossierApiService.getDossiersCreesByAgent(agentId);
  }

  /**
   * Compte les dossiers d'un agent
   */
  countDossiersByAgent(agentId: number): Observable<number> {
    return this.dossierApiService.countDossiersByAgent(agentId);
  }

  /**
   * Compte les dossiers créés par un agent
   */
  countDossiersCreesByAgent(agentId: number): Observable<number> {
    return this.dossierApiService.countDossiersCreesByAgent(agentId);
  }

  // ==================== RECHERCHE ET FILTRES ====================

  /**
   * Recherche des dossiers
   */
  searchDossiers(searchTerm: string): Observable<DossierApi[]> {
    return this.dossierApiService.searchDossiers(searchTerm);
  }

  /**
   * Filtre les dossiers par critères multiples
   */
  filterDossiers(criteres: {
    urgence?: string;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
    montantMin?: number;
    montantMax?: number;
  }): Observable<DossierApi[]> {
    return this.dossiersEnAttente$.pipe(
      map(dossiers => {
        return dossiers.filter(dossier => {
          if (criteres.urgence && dossier.urgence !== criteres.urgence) {
            return false;
          }
          if (criteres.statut && dossier.dossierStatus !== criteres.statut) {
            return false;
          }
          if (criteres.montantMin && dossier.montantCreance < criteres.montantMin) {
            return false;
          }
          if (criteres.montantMax && dossier.montantCreance > criteres.montantMax) {
            return false;
          }
          return true;
        });
      })
    );
  }

  // ==================== UTILITAIRES ====================

  /**
   * Rafraîchit les données
   */
  refreshData(): void {
    this.loadDossiersEnAttente().subscribe();
    this.loadStatistiquesDetaillees().subscribe();
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.dossiersEnAttenteSubject.next([]);
    this.statistiquesSubject.next({});
  }
}
