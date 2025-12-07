import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { DossierApiService } from './dossier-api.service';
import { DossierApi, DossierRequest } from '../../shared/models/dossier-api.model';
import { Page } from '../../shared/models/pagination.model';
import { AuthService } from './auth.service';
import { Role } from '../../shared/models/enums.model';
import { JwtAuthService } from './jwt-auth.service';
import { User } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AgentDossierService {
  private mesDossiersSubject = new BehaviorSubject<DossierApi[]>([]);
  public mesDossiers$ = this.mesDossiersSubject.asObservable();

  private dossiersAssignesSubject = new BehaviorSubject<DossierApi[]>([]);
  public dossiersAssignes$ = this.dossiersAssignesSubject.asObservable();

  private statistiquesPersonnellesSubject = new BehaviorSubject<any>({});
  public statistiquesPersonnelles$ = this.statistiquesPersonnellesSubject.asObservable();
 currentUser: User | null = null;
  constructor(
    private dossierApiService: DossierApiService,
    private jwtAuthService: JwtAuthService
  ) {}

  // ==================== GESTION DES MES DOSSIERS ====================

  /**
   * Charge les dossiers créés par l'agent
   */
  loadMesDossiers(page: number = 0, size: number = 100): Observable<DossierApi[]> {
    this.jwtAuthService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
    if (!this.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    return this.dossierApiService.getDossiersCreesByAgent(Number(this.currentUser.id), page, size).pipe(
      map((page: Page<DossierApi>) => page.content),
      tap(dossiers => {
        this.mesDossiersSubject.next(dossiers);
        console.log('Mes dossiers chargés:', dossiers.length);
      })
    );
  }

  /**
   * Récupère les dossiers créés par l'agent (depuis le cache)
   */
  getMesDossiers(): DossierApi[] {
    return this.mesDossiersSubject.value;
  }

  /**
   * Charge les dossiers assignés à l'agent
   */
  loadDossiersAssignes(): Observable<DossierApi[]> {
    this.jwtAuthService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
    if (!this.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    return this.dossierApiService.getDossiersByAgent(Number(this.currentUser.id)).pipe(
      tap(dossiers => {
        this.dossiersAssignesSubject.next(dossiers);
        console.log('Dossiers assignés chargés:', dossiers);
      })
    );
  }

  /**
   * Récupère les dossiers assignés à l'agent (depuis le cache)
   */
  getDossiersAssignes(): DossierApi[] {
    return this.dossiersAssignesSubject.value;
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Crée un nouveau dossier
   */
  creerDossier(dossierRequest: DossierRequest, isChefOverride?: boolean): Observable<DossierApi> {
    this.jwtAuthService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
    // Pas d'auth obligatoire: ne pas forcer l'agentCreateurId si inexistant

    // Si chef, le backend valide automatiquement (isChef=true)
    const isChef: boolean = typeof isChefOverride === 'boolean'
      ? isChefOverride
      : !!(this.currentUser && (this.currentUser.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER || this.currentUser.roleUtilisateur === Role.SUPER_ADMIN));

    // Utiliser une création robuste avec fallback si la route /create échoue
    return this.dossierApiService.createWithFallback(dossierRequest, isChef).pipe(
      tap(nouveauDossier => {
        // Ajouter à la liste locale
        const dossiers = this.mesDossiersSubject.value;
        this.mesDossiersSubject.next([nouveauDossier, ...dossiers]);
        
        console.log('Nouveau dossier créé:', nouveauDossier);
      })
    );
  }

  /**
   * Crée un nouveau dossier avec fichiers
   */
  creerDossierAvecFichiers(
    dossierRequest: DossierRequest,
    contratSigne?: File,
    pouvoir?: File,
    isChefOverride?: boolean
  ): Observable<DossierApi> {
    this.jwtAuthService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
    // Ne pas envoyer agentCreateurId si non nécessaire (pas d'auth)

    const isChef: boolean = typeof isChefOverride === 'boolean'
      ? isChefOverride
      : !!(this.currentUser && (this.currentUser.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER || this.currentUser.roleUtilisateur === Role.SUPER_ADMIN));

    return this.dossierApiService.createWithFiles(dossierRequest, contratSigne, pouvoir, isChef).pipe(
      tap(nouveauDossier => {
        // Ajouter à la liste locale
        const dossiers = this.mesDossiersSubject.value;
        this.mesDossiersSubject.next([nouveauDossier, ...dossiers]);
        
        console.log('Nouveau dossier créé avec fichiers:', nouveauDossier);
      })
    );
  }

  /**
   * Met à jour un dossier
   */
  modifierDossier(id: number, dossier: DossierApi): Observable<DossierApi> {
    return this.dossierApiService.updateDossier(id, dossier).pipe(
      tap(dossierModifie => {
        // Mettre à jour la liste locale
        const dossiers = this.mesDossiersSubject.value;
        const index = dossiers.findIndex(d => d.id === id);
        if (index !== -1) {
          dossiers[index] = dossierModifie;
          this.mesDossiersSubject.next([...dossiers]);
        }
        
        console.log('Dossier modifié:', dossierModifie);
      })
    );
  }

  /**
   * Supprime un dossier
   */
  supprimerDossier(id: number): Observable<void> {
    // Le backend n'attend pas de paramètres de requête, juste l'ID
    return this.dossierApiService.deleteDossier(id).pipe(
      tap(() => {
        // Retirer de la liste locale
        const dossiers = this.mesDossiersSubject.value;
        const dossiersFiltres = dossiers.filter(d => d.id !== id);
        this.mesDossiersSubject.next(dossiersFiltres);
        
        console.log('Dossier supprimé:', id);
      })
    );
  }

  // ==================== STATISTIQUES PERSONNELLES ====================

  /**
   * Charge les statistiques personnelles de l'agent
   */
  loadStatistiquesPersonnelles(): Observable<any> {
    this.jwtAuthService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
    if (!this.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    const agentId = Number(this.currentUser.id);
    
    return this.dossierApiService.countDossiersCreesByAgent(agentId).pipe(
      tap(dossiersCrees => {
        this.dossierApiService.countDossiersByAgent(agentId).subscribe(dossiersAssignes => {
          this.statistiquesPersonnellesSubject.next({
            dossiersCrees: dossiersCrees,
            dossiersAssignes: dossiersAssignes,
            dossiersEnCours: this.mesDossiersSubject.value.filter(d => d.dossierStatus === 'ENCOURSDETRAITEMENT').length, // Fixed enum value
            dossiersValides: this.mesDossiersSubject.value.filter(d => d.valide).length
          });
        });
      })
    );
  }

  /**
   * Récupère les statistiques personnelles (depuis le cache)
   */
  getStatistiquesPersonnelles(): any {
    return this.statistiquesPersonnellesSubject.value;
  }

  // ==================== FILTRES ET RECHERCHE ====================

  /**
   * Filtre les dossiers par statut
   */
  getDossiersByStatus(status: string): Observable<DossierApi[]> {
    return this.mesDossiers$.pipe(
      map(dossiers => dossiers.filter(d => d.dossierStatus === status))
    );
  }

  /**
   * Filtre les dossiers par urgence
   */
  getDossiersByUrgence(urgence: string): Observable<DossierApi[]> {
    return this.mesDossiers$.pipe(
      map(dossiers => dossiers.filter(d => d.urgence === urgence))
    );
  }

  /**
   * Filtre les dossiers par validation
   */
  getDossiersByValidation(valide: boolean): Observable<DossierApi[]> {
    return this.mesDossiers$.pipe(
      map(dossiers => dossiers.filter(d => d.valide === valide))
    );
  }

  /**
   * Recherche dans les dossiers de l'agent
   */
  searchMesDossiers(searchTerm: string): Observable<DossierApi[]> {
    return this.mesDossiers$.pipe(
      map(dossiers => dossiers.filter(d => 
        d.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        d.numeroDossier.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  }

  /**
   * Filtre les dossiers par critères multiples
   */
  filterMesDossiers(criteres: {
    statut?: string;
    urgence?: string;
    valide?: boolean;
    dateDebut?: string;
    dateFin?: string;
  }): Observable<DossierApi[]> {
    return this.mesDossiers$.pipe(
      map(dossiers => {
        return dossiers.filter(dossier => {
          if (criteres.statut && dossier.dossierStatus !== criteres.statut) {
            return false;
          }
          if (criteres.urgence && dossier.urgence !== criteres.urgence) {
            return false;
          }
          if (criteres.valide !== undefined && dossier.valide !== criteres.valide) {
            return false;
          }
          return true;
        });
      })
    );
  }

  // ==================== GESTION DES FICHIERS ====================

  /**
   * Vérifie l'existence d'un numéro de dossier
   */
  verifierNumeroDossier(numeroDossier: string): Observable<boolean> {
    return this.dossierApiService.existsByNumber(numeroDossier);
  }

  /**
   * Génère un numéro de dossier unique
   */
  genererNumeroDossier(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `DOS-${timestamp}-${random}`;
  }

  // ==================== UTILITAIRES ====================

  /**
   * Rafraîchit toutes les données
   */
  refreshData(): void {
    this.loadMesDossiers().subscribe();
    this.loadDossiersAssignes().subscribe();
    this.loadStatistiquesPersonnelles().subscribe();
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.mesDossiersSubject.next([]);
    this.dossiersAssignesSubject.next([]);
    this.statistiquesPersonnellesSubject.next({});
  }

  /**
   * Récupère un dossier par ID
   */
  getDossierById(id: number): Observable<DossierApi> {
    return this.dossierApiService.getDossierById(id);
  }
}
