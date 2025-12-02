import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { Subject, takeUntil, Observable } from 'rxjs';
import { Dossier, TypeDocumentJustificatif, UrgenceDossier, Creancier, Debiteur, User } from '../../../shared/models';
import { ValidationStatut } from '../../../shared/models/enums.model';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { AgentDossierService } from '../../../core/services/agent-dossier.service';
import { ChefDossierService } from '../../../core/services/chef-dossier.service';
import { CreancierApiService } from '../../../core/services/creancier-api.service';
import { DebiteurApiService } from '../../../core/services/debiteur-api.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { ValidationDossierService, ValidationDossier, CreateValidationRequest } from '../../../core/services/validation-dossier.service';
import { DossierApi, DossierRequest, Urgence, DossierStatus, TypeDocumentJustificatif as ApiTypeDocument, CreancierApi, DebiteurApi } from '../../../shared/models/dossier-api.model';
import { Role } from '../../../shared/models/enums.model';
import { Page } from '../../../shared/models/pagination.model';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

@Component({
  selector: 'app-dossier-gestion',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FormInputComponent],
  templateUrl: './dossier-gestion.component.html',
  styleUrls: ['./dossier-gestion.component.scss']
})
export class DossierGestionComponent implements OnInit, OnDestroy {
  dossiers: Dossier[] = [];
  filteredDossiers: Dossier[] = [];
  pagedDossiers: Dossier[] = [];
  searchTerm: string = '';
  showCreateForm: boolean = false;
  dossierForm!: FormGroup;
  isEditMode: boolean = false;
  editingDossier: Dossier | null = null;
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  // Propriétés pour la validation
  validations: ValidationDossier[] = [];
  showValidationModal: boolean = false;
  selectedDossierForValidation: Dossier | null = null;
  validationComment: string = '';

  // Fichiers sélectionnés
  selectedContratFile?: File;
  selectedPouvoirFile?: File;

  // Filtre pour les agents
  selectedStatus: string = 'all';

  // Suggestions pour autocomplétion
  creancierSuggestions: any[] = [];
  debiteurSuggestions: any[] = [];
  showCreancierSuggestions = false;
  showDebiteurSuggestions = false;

  // Filtres avancés (UI)
  filters: any = {
    minMontant: undefined,
    maxMontant: undefined,
    urgence: '',
    dateCreationDebut: '',
    dateCreationFin: ''
  };

  // Enums pour les options
  typeDocumentOptions = Object.values(TypeDocumentJustificatif);
  urgenceOptions = Object.values(UrgenceDossier);

  // Sorting & pagination
  sortKey: 'dateCreation' | 'montantCreance' | 'statut' = 'dateCreation';
  sortDir: 'asc' | 'desc' = 'desc';
  pageSize = 10;
  pageIndex = 0;
  totalPages = 1;
  totalElements = 0; // Total d'éléments depuis le backend

  // Getters pour les contrôles de formulaire
  get titreControl(): FormControl { return this.dossierForm.get('titre') as FormControl; }
  get descriptionControl(): FormControl { return this.dossierForm.get('description') as FormControl; }
  get numeroDossierControl(): FormControl { return this.dossierForm.get('numeroDossier') as FormControl; }
  get montantCreanceControl(): FormControl { return this.dossierForm.get('montantCreance') as FormControl; }
  get typeDocumentControl(): FormControl { return this.dossierForm.get('typeDocumentJustificatif') as FormControl; }
  get urgenceControl(): FormControl { return this.dossierForm.get('urgence') as FormControl; }
  get nomCreancierControl(): FormControl { return this.dossierForm.get('nomCreancier') as FormControl; }
  get prenomCreancierControl(): FormControl { return this.dossierForm.get('prenomCreancier') as FormControl; }
  get nomDebiteurControl(): FormControl { return this.dossierForm.get('nomDebiteur') as FormControl; }
  get prenomDebiteurControl(): FormControl { return this.dossierForm.get('prenomDebiteur') as FormControl; }
  get pouvoirControl(): FormControl { return this.dossierForm.get('pouvoir') as FormControl; }
  get contratSigneControl(): FormControl { return this.dossierForm.get('contratSigne') as FormControl; }

  // Types personne for select
  personTypes = [
    { value: 'PERSONNE_PHYSIQUE', label: 'Personne Physique' },
    { value: 'PERSONNE_MORALE', label: 'Personne Morale' }
  ];

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private jwtAuthService: JwtAuthService,
    public authService: AuthService,
    private agentDossierService: AgentDossierService,
    private chefDossierService: ChefDossierService,
    private creancierApiService: CreancierApiService,
    private debiteurApiService: DebiteurApiService,
    private dossierApiService: DossierApiService,
    private validationDossierService: ValidationDossierService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDossiers();
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Méthodes pour l'interface des agents
  getDossiersByStatus(status: string): Dossier[] {
    if (status === 'all') {
      // Retourner tous les dossiers créés par l'agent (même non validés)
      return this.dossiers;
    }
    return this.dossiers.filter(dossier => dossier.statut === status);
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    // Appliquer le filtre de statut
    if (status === 'all') {
      this.filteredDossiers = [...this.dossiers];
    } else {
      this.filteredDossiers = this.dossiers.filter(dossier => dossier.statut === status);
    }
    this.applySortingAndPaging();
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE_VALIDATION':
        return 'status-en-attente';
      case 'VALIDE':
        return 'status-valide';
      case 'REJETE':
        return 'status-rejete';
      case 'ENCOURSDETRAITEMENT':
        return 'status-en-cours';
      default:
        return 'status-default';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE_VALIDATION':
        return 'EN ATTENTE DE VALIDATION';
      case 'VALIDE':
        return 'VALIDÉ';
      case 'REJETE':
        return 'REJETÉ';
      case 'ENCOURSDETRAITEMENT':
        return 'EN COURS';
      default:
        return statut;
    }
  }

  getDossierStatusClass(dossierStatus: string | undefined): string {
    if (!dossierStatus) return 'status-default';
    switch (dossierStatus) {
      case 'ENCOURSDETRAITEMENT':
        return 'status-encours';
      case 'ENQUETE':
        return 'status-enquete';
      case 'CLOTURE':
        return 'status-cloture';
      default:
        return 'status-default';
    }
  }

  getDossierStatusLabel(dossierStatus: string | undefined): string {
    if (!dossierStatus) return 'Non défini';
    switch (dossierStatus) {
      case 'ENCOURSDETRAITEMENT':
        return 'EN COURS DE TRAITEMENT';
      case 'ENQUETE':
        return 'ENQUÊTE';
      case 'CLOTURE':
        return 'CLÔTURÉ';
      default:
        return dossierStatus;
    }
  }

  initializeForm(): void {
    this.dossierForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', Validators.required],
      numeroDossier: ['', Validators.required],
      montantCreance: [0, [Validators.required, Validators.min(0)]],
      typeDocumentJustificatif: [TypeDocumentJustificatif.FACTURE, Validators.required],
      urgence: [UrgenceDossier.FAIBLE, Validators.required],
      typeCreancier: ['PERSONNE_PHYSIQUE', Validators.required],
      nomCreancier: ['', Validators.required],
      prenomCreancier: ['', Validators.minLength(2)],
      typeDebiteur: ['PERSONNE_PHYSIQUE', Validators.required],
      nomDebiteur: ['', Validators.required],
      prenomDebiteur: ['', Validators.minLength(2)],
      pouvoir: [false],
      contratSigne: [false],
      isChef: [false]
      // agentCreateurId sera automatiquement récupéré par le backend depuis l'utilisateur connecté
    });

    // Update validators when types change
    this.dossierForm.get('typeCreancier')?.valueChanges.subscribe(t => this.onTypeCreancierChange(t));
    this.dossierForm.get('typeDebiteur')?.valueChanges.subscribe(t => this.onTypeDebiteurChange(t));

    // Logique pour isChef (statut de validation)
    this.dossierForm.get('isChef')?.valueChanges.subscribe(isChef => this.onIsChefChange(isChef));
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  loadDossiers(): void {
  // Essayer d'abord avec AuthService si disponible
  const currentUserFromAuth = this.authService.getCurrentUser();
  if (currentUserFromAuth && currentUserFromAuth.id) {
    console.log('✅ Utilisateur trouvé via AuthService:', currentUserFromAuth);
    this.currentUser = currentUserFromAuth;
    const userId = Number(currentUserFromAuth.id);
    if (!isNaN(userId) && userId > 0) {
      console.log('✅ ID utilisateur valide depuis AuthService:', userId);
      if (currentUserFromAuth.roleUtilisateur === Role.AGENT_DOSSIER) {
        this.loadDossiersByAgent(userId);
      } else if (currentUserFromAuth.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER) {
        this.loadAllDossiers();
      }
      return;
    }
  }

  // Sinon, utiliser JwtAuthService
  this.jwtAuthService.getCurrentUser()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (user: User) => {
        this.currentUser = user;
        console.log('🔄 Chargement des dossiers pour l\'utilisateur:', this.currentUser.roleUtilisateur);
        console.log('🔄 Utilisateur complet:', this.currentUser);
        console.log('🔄 ID utilisateur brut:', this.currentUser.id);
        console.log('🔄 Type de ID:', typeof this.currentUser.id);

        // Essayer plusieurs façons d'obtenir l'ID
        let userId: number | null = null;
        
        // Méthode 1: Directement depuis user.id
        if (this.currentUser.id) {
          userId = Number(this.currentUser.id);
          if (!isNaN(userId) && userId > 0) {
            console.log('✅ ID trouvé via user.id:', userId);
          }
        }
        
        // Méthode 2: Si pas d'ID, essayer depuis le token
        if (!userId || isNaN(userId) || userId <= 0) {
          const token = sessionStorage.getItem('auth-user');
          if (token) {
            try {
              const decoded = this.jwtAuthService.getDecodedAccessToken(token);
              if (decoded?.userId) {
                userId = Number(decoded.userId);
                console.log('✅ ID trouvé via token decoded.userId:', userId);
              } else if (decoded?.sub) {
                // Si sub contient l'email, on doit faire un appel API
                console.log('⚠️ Token contient sub (email), pas userId direct');
              }
            } catch (e) {
              console.error('❌ Erreur lors du décodage du token:', e);
            }
          }
        }

        console.log('ℹ️ ID utilisateur final:', userId);
        console.log('ℹ️ ID est valide?', !isNaN(userId || 0) && (userId || 0) > 0);
        
        if (!userId || isNaN(userId) || userId <= 0) {
          console.error('❌ ID utilisateur non disponible ou invalide:', {
            user: this.currentUser,
            userId: userId,
            token: sessionStorage.getItem('auth-user') ? 'présent' : 'absent'
          });
          this.toastService.showError('Erreur: Impossible de récupérer l\'ID utilisateur valide. Veuillez vous reconnecter.');
          return;
        }

        switch (this.currentUser.roleUtilisateur) {
          case Role.AGENT_DOSSIER:
            this.loadDossiersByAgent(userId);
            break;

          case Role.CHEF_DEPARTEMENT_DOSSIER:
            this.loadAllDossiers();
            break;

          default:
            console.warn('⚠️ Rôle non reconnu, utilisation des données mock');
        }
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement de l\'utilisateur:', err);
        this.toastService.showError('Impossible de récupérer l\'utilisateur actuel');
      }
    });
}

private loadDossiersByAgent(userId: number): void {
  // Utiliser getDossiersCreesByAgent avec pagination pour récupérer uniquement les dossiers créés par l'agent
  // Cela inclut même les dossiers non validés
  console.log('🔍 loadDossiersByAgent appelé avec userId:', userId);
  console.log('🔍 Type de userId:', typeof userId);
  console.log('🔍 pageIndex:', this.pageIndex, 'pageSize:', this.pageSize);
  
  if (!userId || isNaN(userId)) {
    console.error('❌ ID utilisateur invalide:', userId);
    this.toastService.showError('Erreur: ID utilisateur invalide');
    this.dossiers = [];
    this.pagedDossiers = [];
    return;
  }

  const sortParam = this.getSortParameter();
  const apiUrl = `http://localhost:8089/carthage-creance/api/dossiers/agent/${userId}/crees`;
  console.log('🔍 URL API appelée:', apiUrl);
  console.log('🔍 Paramètres:', { page: this.pageIndex, size: this.pageSize, sort: sortParam });
  
  // Essayer d'abord avec pagination
  this.dossierApiService.getDossiersCreesByAgent(userId, this.pageIndex, this.pageSize, sortParam)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (page: Page<DossierApi>) => {
        console.log('✅ Réponse API reçue (avec pagination):', page);
        // Gérer le cas où page.content est undefined ou null
        const content = page?.content || [];
        console.log('📋 Dossiers créés par l\'agent chargés:', content.length, 'sur', page?.totalElements || 0);
        console.log('📋 Contenu brut:', content);
        
        if (content.length > 0) {
          console.log('📋 Premier dossier:', content[0]);
          console.log('📋 Agent créateur du premier dossier:', content[0]?.agentCreateur);
        }
        
        // Si aucun dossier trouvé avec pagination, essayer sans pagination
        if (content.length === 0 && page?.totalElements === 0) {
          console.log('⚠️ Aucun dossier avec pagination, essai sans pagination...');
          this.dossierApiService.getDossiersCreesByAgentSimple(userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (dossiers: DossierApi[]) => {
                console.log('✅ Réponse API sans pagination:', dossiers);
                console.log('📋 Nombre de dossiers:', dossiers.length);
                if (dossiers.length > 0) {
                  console.log('📋 Premier dossier:', dossiers[0]);
                  console.log('📋 Agent créateur:', dossiers[0]?.agentCreateur);
                }
                this.dossiers = this.convertApiDossiersToLocal(dossiers);
                this.totalElements = dossiers.length;
                this.totalPages = Math.ceil(dossiers.length / this.pageSize);
                this.pagedDossiers = this.dossiers;
              },
              error: (err) => {
                console.error('❌ Erreur lors du chargement sans pagination:', err);
                this.dossiers = [];
                this.pagedDossiers = [];
              }
            });
        } else {
          this.dossiers = this.convertApiDossiersToLocal(content);
          console.log('📋 Dossiers convertis:', this.dossiers.length);
          this.totalElements = page?.totalElements || 0;
          this.totalPages = page?.totalPages || 0;
        // Pas besoin de filterDossiers car on utilise la pagination backend
        this.pagedDossiers = this.dossiers;
        }
        
        if (this.dossiers.length === 0) {
          console.warn('⚠️ Aucun dossier trouvé pour l\'agent ID:', userId);
          console.warn('⚠️ Vérifiez dans la base de données que les dossiers ont bien agent_createur_id =', userId);
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des dossiers créés par l\'agent:', error);
        console.error('❌ Détails de l\'erreur:', {
          status: error?.status,
          statusText: error?.statusText,
          message: error?.message,
          error: error?.error,
          url: error?.url
        });
        
        // Essayer sans pagination en cas d'erreur
        console.log('⚠️ Erreur avec pagination, essai sans pagination...');
        this.dossierApiService.getDossiersCreesByAgentSimple(userId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (dossiers: DossierApi[]) => {
              console.log('✅ Réponse API sans pagination:', dossiers);
              this.dossiers = this.convertApiDossiersToLocal(dossiers);
              this.totalElements = dossiers.length;
              this.totalPages = Math.ceil(dossiers.length / this.pageSize);
              this.pagedDossiers = this.dossiers;
            },
            error: (err) => {
              console.error('❌ Erreur lors du chargement sans pagination:', err);
              this.toastService.showError(`Erreur lors du chargement des dossiers: ${error?.status || 'Erreur inconnue'}`);
              this.dossiers = [];
              this.pagedDossiers = [];
            }
          });
      }
    });
}

private loadAllDossiers(): void {
  // Utiliser getAllDossiers avec pagination pour charger tous les dossiers
  const sortParam = this.getSortParameter();
  this.dossierApiService.getAllDossiers(this.pageIndex, this.pageSize, sortParam)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (page: Page<DossierApi>) => {
        // Gérer le cas où page.content est undefined ou null
        const content = page?.content || [];
        console.log('📋 Tous les dossiers chargés pour le chef:', content.length, 'sur', page?.totalElements || 0);
        this.dossiers = this.convertApiDossiersToLocal(content);
        this.totalElements = page?.totalElements || 0;
        this.totalPages = page?.totalPages || 0;
        // Pas besoin de filterDossiers car on utilise la pagination backend
        this.pagedDossiers = this.dossiers;
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des dossiers:', error);
        this.toastService.showError('Erreur lors du chargement des dossiers');
      }
    });
}

private getSortParameter(): string {
  // Convertir le sortKey et sortDir en paramètre de tri pour le backend
  // Format attendu: "dateCreation,desc" ou "montantCreance,asc"
  const sortField = this.sortKey === 'dateCreation' ? 'dateCreation' : 
                   this.sortKey === 'montantCreance' ? 'montantCreance' : 
                   'statut';
  return `${sortField},${this.sortDir}`;
}


  private loadAllDossiersFallback(): void {
    console.log('🔄 Tentative de chargement de tous les dossiers...');
    const sortParam = this.getSortParameter();
    this.dossierApiService.getAllDossiers(this.pageIndex, this.pageSize, sortParam)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossiersPage: Page<DossierApi>) => {
          console.log('📋 Tous les dossiers chargés (fallback):', dossiersPage.content.length, 'sur', dossiersPage.totalElements);
          this.dossiers = this.convertApiDossiersToLocal(dossiersPage.content);
          this.totalElements = dossiersPage.totalElements;
          this.totalPages = dossiersPage.totalPages;
          this.pagedDossiers = this.dossiers;
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du chargement des dossiers (fallback):', error);

          // Analyser le type d'erreur
          if (error.status === 500) {
            console.error('🔴 Erreur 500 : Problème avec les données de la base de données');
            this.toastService.showError('Erreur serveur (500) : Problème avec les données de la base de données. Les données mockées sont affichées temporairement.');
          } else if (error.status === 401) {
            console.error('🔴 Erreur 401 : Session expirée');
            this.toastService.showError('Session expirée. Veuillez vous reconnecter.');
          } else if (error.status === 403) {
            console.error('🔴 Erreur 403 : Accès refusé');
            this.toastService.showError('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
          } else if (error.status === 404) {
            console.error('🔴 Erreur 404 : Endpoint non trouvé');
            this.toastService.showError('Endpoint non trouvé. Vérifiez que le backend est démarré.');
          } else {
            console.error('🔴 Erreur inconnue:', error.status);
            this.toastService.showError(`Erreur lors du chargement des dossiers (${error.status})`);
          }

          console.log('🔄 Utilisation des données mockées en fallback');
        }
      });
  }

  private loadDossiersWithRetry(): void {
    console.log('🔄 Tentative de chargement avec retry...');

    // Attendre un peu avant de réessayer
    setTimeout(() => {
      if (this.currentUser?.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER) {
        // Pour les chefs, essayer de charger tous les dossiers
        const sortParam = this.getSortParameter();
        this.dossierApiService.getAllDossiers(this.pageIndex, this.pageSize, sortParam)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (page: Page<DossierApi>) => {
              console.log('✅ Dossiers chargés avec retry:', page.content.length, 'sur', page.totalElements);
              this.dossiers = this.convertApiDossiersToLocal(page.content);
              this.totalElements = page.totalElements;
              this.totalPages = page.totalPages;
              this.pagedDossiers = this.dossiers;
            },
            error: (error: any) => {
              console.error('❌ Erreur persistante lors du chargement:', error);
              this.toastService.showError('Impossible de charger les dossiers. Vérifiez le backend.');
              this.dossiers = []; // Afficher une liste vide au lieu de données mock
            }
          });
      } else if (this.currentUser?.roleUtilisateur === Role.AGENT_DOSSIER) {
        // Pour les agents, essayer de charger leurs dossiers créés
        const userId = this.currentUser?.id;
        if (userId) {
          const sortParam = this.getSortParameter();
          this.dossierApiService.getDossiersCreesByAgent(Number(userId), this.pageIndex, this.pageSize, sortParam)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (page: Page<DossierApi>) => {
                console.log('✅ Dossiers créés par l\'agent chargés avec retry:', page.content.length, 'sur', page.totalElements);
                this.dossiers = this.convertApiDossiersToLocal(page.content);
                this.totalElements = page.totalElements;
                this.totalPages = page.totalPages;
                this.pagedDossiers = this.dossiers;
              },
              error: (error: any) => {
                console.error('❌ Erreur persistante lors du chargement des dossiers créés par l\'agent:', error);
                this.toastService.showError('Impossible de charger les dossiers. Vérifiez le backend.');
                this.dossiers = []; // Afficher une liste vide au lieu de données mock
              }
            });
        } else {
          console.error('❌ ID utilisateur non trouvé pour l\'agent');
          this.dossiers = [];
        }
      }
    }, 1000);
  }


  filterDossiers(): void {
    // Avec la pagination backend, on applique les filtres côté backend
    // Réinitialiser à la première page quand on change de filtre
    this.pageIndex = 0;
    this.applySortingAndPaging();
  }

  /**
   * Convertit les dossiers API vers le format local
   */
  private convertApiDossiersToLocal(dossiersApi: DossierApi[]): Dossier[] {
    return dossiersApi.map(dossierApi => {
      // Créer les objets créancier et débiteur avec les données disponibles
      const creancier = new Creancier({
        id: (dossierApi.creancier as any)?.id || 0,
        nom: (dossierApi.creancier as any)?.nom || '',
        prenom: (dossierApi.creancier as any)?.prenom || '',
        type: (dossierApi.creancier as any)?.type || 'PERSONNE_PHYSIQUE',
        codeCreancier: (dossierApi.creancier as any)?.codeCreancier || '',
        codeCreance: (dossierApi.creancier as any)?.codeCreance || '',
        adresse: (dossierApi.creancier as any)?.adresse || '',
        ville: (dossierApi.creancier as any)?.ville || '',
        codePostal: (dossierApi.creancier as any)?.codePostal || '',
        telephone: (dossierApi.creancier as any)?.telephone || '',
        fax: (dossierApi.creancier as any)?.fax || '',
        email: (dossierApi.creancier as any)?.email || ''
      });

      const debiteur = new Debiteur({
        id: (dossierApi.debiteur as any)?.id || 0,
        nom: (dossierApi.debiteur as any)?.nom || '',
        prenom: (dossierApi.debiteur as any)?.prenom || '',
        type: (dossierApi.debiteur as any)?.type || 'PERSONNE_PHYSIQUE',
        codeCreance: (dossierApi.debiteur as any)?.codeCreance || '',
        adresse: (dossierApi.debiteur as any)?.adresse || '',
        ville: (dossierApi.debiteur as any)?.ville || '',
        codePostal: (dossierApi.debiteur as any)?.codePostal || '',
        telephone: (dossierApi.debiteur as any)?.telephone || '',
        fax: (dossierApi.debiteur as any)?.fax || '',
        email: (dossierApi.debiteur as any)?.email || ''
      });

      return new Dossier({
        id: dossierApi.id.toString(),
        titre: dossierApi.titre,
        description: dossierApi.description,
        numeroDossier: dossierApi.numeroDossier,
        montantCreance: dossierApi.montantCreance,
        dateCreation: new Date(dossierApi.dateCreation),
        dateCloture: dossierApi.dateCloture ? new Date(dossierApi.dateCloture) : undefined,
        statut: this.convertBackendStatutToLocal((dossierApi as any).statut),
        dossierStatus: dossierApi.dossierStatus as 'ENCOURSDETRAITEMENT' | 'CLOTURE' | undefined,
        urgence: this.convertApiUrgenceToLocal(dossierApi.urgence),
        agentResponsable: dossierApi.agentResponsable ? `${dossierApi.agentResponsable.prenom} ${dossierApi.agentResponsable.nom}` : '',
        agentCreateur: dossierApi.agentCreateur ? `${dossierApi.agentCreateur.prenom} ${dossierApi.agentCreateur.nom}` : '',
        typeDocumentJustificatif: this.convertApiTypeDocumentToLocal(dossierApi.typeDocumentJustificatif),
        pouvoir: !!dossierApi.pouvoir,
        contratSigne: !!dossierApi.contratSigne,
        valide: dossierApi.valide,
        dateValidation: dossierApi.dateValidation ? new Date(dossierApi.dateValidation) : undefined,
        creancier: creancier,
        debiteur: debiteur,
        // Ajouter les types pour l'affichage
        typeCreancier: (dossierApi.creancier as any)?.type || 'PERSONNE_PHYSIQUE',
        typeDebiteur: (dossierApi.debiteur as any)?.type || 'PERSONNE_PHYSIQUE'
      });
    });
  }

  private convertBackendStatutToLocal(statut: any): ValidationStatut {
    switch (statut) {
      case 'EN_ATTENTE_VALIDATION': return ValidationStatut.EN_ATTENTE_VALIDATION;
      case 'VALIDE': return ValidationStatut.VALIDE;
      case 'REJETE': return ValidationStatut.REJETE;
      case 'EN_COURS': return ValidationStatut.EN_COURS;
      case 'CLOTURE': return ValidationStatut.CLOTURE;
      default: return ValidationStatut.EN_COURS;
    }
  }

  private convertApiUrgenceToLocal(apiUrgence: Urgence): UrgenceDossier {
    switch (apiUrgence) {
      case Urgence.FAIBLE:
        return UrgenceDossier.FAIBLE;
      case Urgence.MOYENNE:
        return UrgenceDossier.MOYENNE;
      case Urgence.TRES_URGENT:
        return UrgenceDossier.TRES_URGENT;
      default:
        return UrgenceDossier.MOYENNE;
    }
  }

  private convertApiTypeDocumentToLocal(apiType: ApiTypeDocument): TypeDocumentJustificatif {
    switch (apiType) {
      case ApiTypeDocument.CONTRAT:
        return TypeDocumentJustificatif.CONTRAT;
      case ApiTypeDocument.FACTURE:
        return TypeDocumentJustificatif.FACTURE;
      case ApiTypeDocument.BON_COMMANDE:
        return TypeDocumentJustificatif.BON_DE_COMMANDE;
      case ApiTypeDocument.AUTRE:
        return TypeDocumentJustificatif.FACTURE; // Fallback
      default:
        return TypeDocumentJustificatif.FACTURE;
    }
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filterDossiers();
    } else {
      // Pour les agents, on charge déjà uniquement les dossiers créés par l'agent
      const baseDossiers = this.dossiers;

      this.filteredDossiers = baseDossiers.filter(dossier =>
        dossier.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.numeroDossier.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.creancier.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.debiteur.nom.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      
      // Appliquer le filtre de statut si sélectionné
      if (this.selectedStatus !== 'all') {
        this.filteredDossiers = this.filteredDossiers.filter(dossier => 
          dossier.statut === this.selectedStatus
        );
      }
      
      this.applySortingAndPaging();
    }
  }

  applyAdvancedFilters(): void {
    // Pour les agents, on charge déjà uniquement les dossiers créés par l'agent
    const baseDossiers = this.dossiers;

    this.filteredDossiers = baseDossiers.filter(dossier => {
      if (this.filters.minMontant !== undefined && this.filters.minMontant !== '' && dossier.montantCreance < Number(this.filters.minMontant)) {
        return false;
      }
      if (this.filters.maxMontant !== undefined && this.filters.maxMontant !== '' && dossier.montantCreance > Number(this.filters.maxMontant)) {
        return false;
      }
      if (this.filters.urgence && dossier.urgence !== this.filters.urgence) {
        return false;
      }
      if (this.filters.dateCreationDebut) {
        const d = new Date(dossier.dateCreation).getTime();
        const start = new Date(this.filters.dateCreationDebut).getTime();
        if (d < start) return false;
      }
      if (this.filters.dateCreationFin) {
        const d = new Date(dossier.dateCreation).getTime();
        const end = new Date(this.filters.dateCreationFin).getTime();
        if (d > end) return false;
      }
      return true;
    });
    
    // Appliquer le filtre de statut si sélectionné
    if (this.selectedStatus !== 'all') {
      this.filteredDossiers = this.filteredDossiers.filter(dossier => 
        dossier.statut === this.selectedStatus
      );
    }
    
    this.applySortingAndPaging();
  }

  applySortingAndPaging(): void {
    // Recharger les dossiers avec la nouvelle pagination/tri depuis le backend
    console.log('🔄 applySortingAndPaging - pageIndex:', this.pageIndex, 'pageSize:', this.pageSize, 'sort:', this.sortKey, this.sortDir);
    
    if (this.currentUser?.roleUtilisateur === Role.AGENT_DOSSIER) {
      const userId = Number(this.currentUser.id);
      this.loadDossiersByAgent(userId);
    } else if (this.currentUser?.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER) {
      this.loadAllDossiers();
    }
  }

  nextPage(): void {
    if (this.pageIndex + 1 < this.totalPages) {
      this.pageIndex++;
      this.applySortingAndPaging();
    }
  }

  prevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.applySortingAndPaging();
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.pageIndex = page;
      this.applySortingAndPaging();
    }
  }

  onPageSizeChange(): void {
    // Réinitialiser à la première page quand on change la taille de page
    this.pageIndex = 0;
    this.applySortingAndPaging();
  }

  showCreateDossierForm(): void {
    this.showCreateForm = true;
    this.isEditMode = false;
    this.editingDossier = null;
    this.initializeForm();
  }

  showEditDossierForm(dossier: Dossier): void {
    this.showCreateForm = true;
    this.isEditMode = true;
    this.editingDossier = dossier;
    this.dossierForm.patchValue({
      titre: dossier.titre,
      description: dossier.description,
      numeroDossier: dossier.numeroDossier,
      montantCreance: dossier.montantCreance,
      typeDocumentJustificatif: dossier.typeDocumentJustificatif,
      urgence: dossier.urgence,
      typeCreancier: 'PERSONNE_PHYSIQUE',
      nomCreancier: dossier.creancier ? dossier.creancier.nom : '',
      prenomCreancier: dossier.creancier ? (dossier.creancier as any).prenom || '' : '',
      typeDebiteur: 'PERSONNE_PHYSIQUE',
      nomDebiteur: dossier.debiteur ? dossier.debiteur.nom : '',
      prenomDebiteur: dossier.debiteur ? (dossier.debiteur as any).prenom || '' : '',
      pouvoir: dossier.pouvoir,
      contratSigne: dossier.contratSigne
    });
  }

  onSubmit(): void {
    if (this.dossierForm.invalid) {
      this.dossierForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }

    const formValue = this.dossierForm.value;

    if (this.isEditMode && this.editingDossier) {
      // Mise à jour via API
      this.updateDossierApi(parseInt(this.editingDossier.id), formValue);
    } else {
      // Création via API
      this.createDossierApi(formValue);
    }
  }

  private createDossierApi(formValue: any): void {
    // Le backend récupérera automatiquement l'agent_createur_id depuis l'utilisateur connecté
    console.log('📤 Création du dossier avec les données réelles de la base');
    this.proceedWithDossierCreation(formValue);
  }

  private proceedWithDossierCreation(formValue: any): void {
  // Rechercher les IDs des créanciers et débiteurs basés sur les noms
  const searchCreancier = formValue.typeCreancier === 'PERSONNE_PHYSIQUE' && formValue.prenomCreancier
    ? `${formValue.nomCreancier}`.trim()
    : `${formValue.nomCreancier}`.trim();
  const searchDebiteur = formValue.typeDebiteur === 'PERSONNE_PHYSIQUE' && formValue.prenomDebiteur
    ? `${formValue.nomDebiteur}`.trim()
    : `${formValue.nomDebiteur}`.trim();

  this.findCreancierAndDebiteurIds(searchCreancier, searchDebiteur)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ creancierId, debiteurId }: { creancierId: number, debiteurId: number }) => {

        const currentUserId = this.currentUser?.id;
        if (!currentUserId) {
          console.error('❌ ERREUR: ID utilisateur non disponible');
          this.toastService.error('Erreur: Impossible de récupérer l\'ID utilisateur. Veuillez vous reconnecter.');
          return;
        }

        const isChef: boolean = !!formValue.isChef || !!(this.currentUser && 
          (this.currentUser.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER || 
           this.currentUser.roleUtilisateur === Role.SUPER_ADMIN));

        // Construction du payload
        const dossierRequest: any = {
          titre: formValue.titre,
          description: formValue.description,
          numeroDossier: formValue.numeroDossier,
          montantCreance: formValue.montantCreance,
          typeDocumentJustificatif: this.convertLocalTypeDocumentToApi(formValue.typeDocumentJustificatif),
          urgence: this.convertLocalUrgenceToApi(formValue.urgence),
          dossierStatus: 'ENCOURSDETRAITEMENT',
          typeCreancier: formValue.typeCreancier,
          nomCreancier: formValue.nomCreancier,
          prenomCreancier: formValue.typeCreancier === 'PERSONNE_PHYSIQUE' ? (formValue.prenomCreancier || '') : '',
          typeDebiteur: formValue.typeDebiteur,
          nomDebiteur: formValue.nomDebiteur,
          prenomDebiteur: formValue.typeDebiteur === 'PERSONNE_PHYSIQUE' ? (formValue.prenomDebiteur || '') : '',
          contratSigne: formValue.contratSigne ? 'uploaded' : undefined,
          pouvoir: formValue.pouvoir ? 'uploaded' : undefined,
          agentCreateurId: currentUserId, // ✅ ID utilisateur injecté dans le payload
          statut: isChef ? 'VALIDE' : 'EN_ATTENTE_VALIDATION'
        };

        // ✅ NOUVEAU : Utiliser la méthode unifiée qui détecte automatiquement les fichiers
        // Le service choisit automatiquement entre multipart (si fichiers) ou JSON (si pas de fichiers)
        const create$ = this.dossierApiService.createDossier(
          dossierRequest,
          this.selectedContratFile || undefined,
          this.selectedPouvoirFile || undefined,
          isChef
        );

        // Appel au backend avec l'ID utilisateur dans le path
        create$
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (nouveauDossier) => {
              console.log('✅ Dossier créé avec succès:', nouveauDossier);
              const message = isChef
                ? `Dossier créé et validé avec succès ! ID: ${nouveauDossier.id}`
                : `Dossier créé avec succès ! ID: ${nouveauDossier.id} (en attente de validation)`;
              this.toastService.success(message);

              if (this.currentUser?.roleUtilisateur === Role.AGENT_DOSSIER) {
                this.createValidationForDossier(nouveauDossier);
              } else {
                this.cancelForm();
                setTimeout(() => this.loadDossiers(), 500);
              }
            },
            error: (error: any) => {
              console.error('❌ Erreur lors de la création du dossier:', error);
              this.toastService.error('Erreur lors de la création du dossier. Veuillez réessayer.');
            }
          });
      },
      error: (error: any) => {
        console.error('Erreur lors de la recherche des créanciers/débiteurs:', error);
        this.toastService.error('Erreur lors de la recherche des créanciers/débiteurs.');
      }
    });
}


  // Type logic for labels/placeholders
  isCreancierPersonneMorale(): boolean {
    return this.dossierForm.get('typeCreancier')?.value === 'PERSONNE_MORALE';
  }
  getCreancierNomLabel(): string {
    return this.isCreancierPersonneMorale() ? "Nom de l'entreprise" : 'Nom du Créancier';
  }
  getCreancierNomPlaceholder(): string {
    return this.isCreancierPersonneMorale() ? "Nom de l'entreprise" : 'Entrez le nom du créancier';
  }

  isDebiteurPersonneMorale(): boolean {
    return this.dossierForm.get('typeDebiteur')?.value === 'PERSONNE_MORALE';
  }
  getDebiteurNomLabel(): string {
    return this.isDebiteurPersonneMorale() ? "Nom de l'entreprise" : 'Nom du Débiteur';
  }
  getDebiteurNomPlaceholder(): string {
    return this.isDebiteurPersonneMorale() ? "Nom de l'entreprise" : 'Entrez le nom du débiteur';
  }

  private onTypeCreancierChange(type: string): void {
    // In this simplified UI, we only toggle labels; names are always required
  }

  private onTypeDebiteurChange(type: string): void {
    const prenomControl = this.dossierForm.get('prenomDebiteur');
    if (type === 'PERSONNE_PHYSIQUE') {
      prenomControl?.setValidators([Validators.required, Validators.minLength(2)]);
    } else {
      prenomControl?.clearValidators();
    }
    prenomControl?.updateValueAndValidity();
  }

  private onIsChefChange(isChef: boolean): void {
    console.log('🔄 Statut chef modifié:', isChef);
    // Le backend récupérera automatiquement l'ID utilisateur connecté
    // Pas besoin de gérer agentCreateurId côté frontend
  }



  // Méthodes pour l'autocomplétion des créanciers
  onCreancierInput(event: any): void {
    const value = event.target.value;
    if (value && value.length >= 2) {
      this.searchCreanciers(value);
    } else {
      this.creancierSuggestions = [];
      this.showCreancierSuggestions = false;
    }
  }

  searchCreanciers(term: string): void {
    this.creancierApiService.getCreanciersByName(term)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (creanciers) => {
          this.creancierSuggestions = creanciers.slice(0, 5); // Limiter à 5 suggestions
          this.showCreancierSuggestions = this.creancierSuggestions.length > 0;
        },
        error: (error: any) => {
          console.error('Erreur lors de la recherche de créanciers:', error);
          this.creancierSuggestions = [];
          this.showCreancierSuggestions = false;
        }
      });
  }

  selectCreancier(creancier: any): void {
    console.log('🎯 Sélection du créancier:', creancier);

    const nomControl = this.dossierForm.get('nomCreancier');
    const prenomControl = this.dossierForm.get('prenomCreancier');
    const typeControl = this.dossierForm.get('typeCreancier');

    if (nomControl && prenomControl && typeControl) {
      // Utiliser typeCreancier ou type selon ce qui est disponible
      const typeValue = creancier.typeCreancier || creancier.type || 'PERSONNE_PHYSIQUE';

      nomControl.setValue(creancier.nom);
      prenomControl.setValue(creancier.prenom || '');
      typeControl.setValue(typeValue);

      console.log('✅ Champs remplis:', {
        nom: creancier.nom,
        prenom: creancier.prenom || '',
        type: typeValue
      });
    } else {
      console.error('❌ Contrôles de formulaire non trouvés');
    }

    this.creancierSuggestions = [];
    this.showCreancierSuggestions = false;
  }

  // Méthodes pour l'autocomplétion des débiteurs
  onDebiteurInput(event: any): void {
    const value = event.target.value;
    if (value && value.length >= 2) {
      this.searchDebiteurs(value);
    } else {
      this.debiteurSuggestions = [];
      this.showDebiteurSuggestions = false;
    }
  }

  searchDebiteurs(term: string): void {
    this.debiteurApiService.searchDebiteurByName(term)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (debiteurs) => {
          this.debiteurSuggestions = debiteurs.slice(0, 5); // Limiter à 5 suggestions
          this.showDebiteurSuggestions = this.debiteurSuggestions.length > 0;
        },
        error: (error: any) => {
          console.error('Erreur lors de la recherche de débiteurs:', error);
          this.debiteurSuggestions = [];
          this.showDebiteurSuggestions = false;
        }
      });
  }

  selectDebiteur(debiteur: any): void {
    console.log('🎯 Sélection du débiteur:', debiteur);

    const nomControl = this.dossierForm.get('nomDebiteur');
    const prenomControl = this.dossierForm.get('prenomDebiteur');
    const typeControl = this.dossierForm.get('typeDebiteur');

    if (nomControl && prenomControl && typeControl) {
      // Utiliser typeDebiteur ou type selon ce qui est disponible
      const typeValue = debiteur.typeDebiteur || debiteur.type || 'PERSONNE_PHYSIQUE';

      nomControl.setValue(debiteur.nom);
      prenomControl.setValue(debiteur.prenom || '');
      typeControl.setValue(typeValue);

      console.log('✅ Champs remplis:', {
        nom: debiteur.nom,
        prenom: debiteur.prenom || '',
        type: typeValue
      });
    } else {
      console.error('❌ Contrôles de formulaire non trouvés');
    }

    this.debiteurSuggestions = [];
    this.showDebiteurSuggestions = false;
  }

  // Masquer les suggestions quand on clique ailleurs
  hideSuggestions(): void {
    setTimeout(() => {
      this.showCreancierSuggestions = false;
      this.showDebiteurSuggestions = false;
    }, 200);
  }

  private findCreancierAndDebiteurIds(nomCreancier: string, nomDebiteur: string): Observable<{ creancierId: number, debiteurId: number }> {
    return new Observable((observer: any) => {
      // Rechercher le créancier
      this.creancierApiService.getCreanciersByName(nomCreancier)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (creanciers) => {
            if (!nomCreancier || !nomCreancier.trim()) {
              observer.error('Nom du créancier est requis');
              return;
            }
            const normalized = nomCreancier.trim().toLowerCase();
            const matchCreancier = (creanciers || []).find((c: any) =>
              (c.nom + ' ' + (c.prenom || '')).trim().toLowerCase() === normalized ||
              c.nom?.trim().toLowerCase() === normalized
            );
            if (!matchCreancier) {
              observer.error('Créancier non trouvé: ' + nomCreancier);
              return;
            }

            const creancierId = matchCreancier.id;

            // Rechercher le débiteur
            this.debiteurApiService.searchDebiteurByName(nomDebiteur)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (debiteurs) => {
                  if (!nomDebiteur || !nomDebiteur.trim()) {
                    observer.error('Nom du débiteur est requis');
                    return;
                  }
                  const normDeb = nomDebiteur.trim().toLowerCase();
                  const matchDebiteur = (debiteurs || []).find((d: any) =>
                    (d.nom + ' ' + (d.prenom || '')).trim().toLowerCase() === normDeb ||
                    d.nom?.trim().toLowerCase() === normDeb
                  );
                  if (!matchDebiteur) {
                    observer.error('Débiteur non trouvé: ' + nomDebiteur);
                    return;
                  }

                  const debiteurId = matchDebiteur.id;
                  observer.next({ creancierId, debiteurId });
                  observer.complete();
                },
                error: (error: any) => {
                  console.error('Erreur lors de la recherche des débiteurs:', error);
                  observer.error('Erreur lors de la recherche du débiteur: ' + error);
                }
              });
          },
          error: (error: any) => {
            console.error('Erreur lors de la recherche des créanciers:', error);
            observer.error('Erreur lors de la recherche du créancier: ' + error);
          }
        });
    });
  }

  private updateDossierApi(dossierId: number, formValue: any): void {
    // Pour l'instant, on utilise la logique locale
    // TODO: Implémenter la mise à jour via API
    const index = this.dossiers.findIndex(d => d.id === this.editingDossier!.id);
    if (index !== -1) {
      this.dossiers[index] = { ...this.dossiers[index], ...formValue };
      this.toastService.success('Dossier mis à jour avec succès.');
    }
    this.cancelForm();
  }

  private convertLocalTypeDocumentToApi(localType: TypeDocumentJustificatif): ApiTypeDocument {
    switch (localType) {
      case TypeDocumentJustificatif.CONTRAT:
        return ApiTypeDocument.CONTRAT;
      case TypeDocumentJustificatif.FACTURE:
        return ApiTypeDocument.FACTURE;
      case TypeDocumentJustificatif.BON_DE_COMMANDE:
        return ApiTypeDocument.BON_COMMANDE;
      default:
        return ApiTypeDocument.FACTURE;
    }
  }

  private convertLocalUrgenceToApi(localUrgence: UrgenceDossier): Urgence {
    switch (localUrgence) {
      case UrgenceDossier.FAIBLE:
        return Urgence.FAIBLE;
      case UrgenceDossier.MOYENNE:
        return Urgence.MOYENNE;
      case UrgenceDossier.TRES_URGENT:
        return Urgence.TRES_URGENT;
      default:
        return Urgence.MOYENNE;
    }
  }

  deleteDossier(dossier: Dossier): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) {
      const index = this.dossiers.findIndex(d => d.id === dossier.id);
      if (index !== -1) {
        this.dossiers.splice(index, 1);
        this.filteredDossiers = [...this.dossiers];
        this.toastService.success('Dossier supprimé avec succès.');
      }
    }
  }

  viewDossierDetails(dossier: Dossier): void {
    this.router.navigate(['/dossier/detail', dossier.id]);
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.isEditMode = false;
    this.editingDossier = null;
    this.initializeForm();
    this.selectedContratFile = undefined;
    this.selectedPouvoirFile = undefined;
  }

  getUrgenceClass(urgence: UrgenceDossier): string {
    switch (urgence) {
      case UrgenceDossier.TRES_URGENT:
        return 'urgence-tres-urgent';
      case UrgenceDossier.MOYENNE:
        return 'urgence-moyenne';
      case UrgenceDossier.FAIBLE:
        return 'urgence-faible';
      default:
        return '';
    }
  }

  getUrgenceLabel(urgence: UrgenceDossier): string {
    switch (urgence) {
      case UrgenceDossier.TRES_URGENT:
        return 'Très Urgent';
      case UrgenceDossier.MOYENNE:
        return 'Moyenne';
      case UrgenceDossier.FAIBLE:
        return 'Faible';
      default:
        return urgence;
    }
  }

  getTypeClass(type: string | undefined): string {
    switch (type) {
      case 'PERSONNE_PHYSIQUE':
        return 'type-physique';
      case 'PERSONNE_MORALE':
        return 'type-morale';
      default:
        return 'type-default';
    }
  }

  getTypeLabel(type: string | undefined): string {
    switch (type) {
      case 'PERSONNE_PHYSIQUE':
        return 'Physique';
      case 'PERSONNE_MORALE':
        return 'Morale';
      default:
        return type || 'Physique';
    }
  }

  // Méthodes pour la validation des dossiers
  canValidateDossier(dossier: Dossier): boolean {
    // Seul le Chef de Dossier peut valider les dossiers créés par des agents
    return !!(this.currentUser &&
      this.currentUser.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER &&
      !dossier.valide &&
      dossier.agentCreateur !== this.currentUser.getFullName());
  }

  validateDossier(dossier: Dossier): void {
    if (confirm('Êtes-vous sûr de vouloir valider ce dossier ? Il sera envoyé en phase d\'enquête.')) {
      const index = this.dossiers.findIndex(d => d.id === dossier.id);
      if (index !== -1) {
        this.dossiers[index].valide = true;
        this.dossiers[index].dateValidation = new Date();
        this.dossiers[index].statut = ValidationStatut.VALIDE;
        this.dossiers[index].agentResponsable = this.currentUser?.getFullName() || '';

        this.filteredDossiers = [...this.dossiers];
        this.toastService.success('Dossier validé avec succès. Il a été envoyé en phase d\'enquête.');
      }
    }
  }

  isDossierValidated(dossier: Dossier): boolean {
    return dossier.valide;
  }

  private createValidationForDossier(dossier: any): void {
    const validationRequest: CreateValidationRequest = {
      dossier: { id: Number(dossier.id) },
      agentCreateur: { id: Number(this.currentUser?.id) },
      commentaires: 'Dossier créé par l\'agent et en attente de validation'
    };

    this.validationDossierService.createValidationDossier(validationRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validation) => {
          console.log('✅ Validation créée avec succès:', validation);
          this.toastService.success('Dossier créé avec succès et soumis à validation.');
          this.cancelForm();
          setTimeout(() => {
            this.loadDossiers();
          }, 500);
        },
        error: (error: any) => {
          console.error('❌ Erreur lors de la création de la validation:', error);
          this.toastService.error('Dossier créé mais erreur lors de la soumission à validation.');
          this.cancelForm();
          setTimeout(() => {
            this.loadDossiers();
          }, 500);
        }
      });
  }

  // ==================== MÉTHODES DE GESTION DES STATUTS ====================

  validerDossier(dossier: Dossier): void {
    console.log('🔄 Ouverture de la modal de validation pour le dossier:', dossier);
    this.selectedDossierForValidation = dossier;
    this.validationComment = ''; // Réinitialiser le commentaire
    this.showValidationModal = true;
    console.log('✅ Modal de validation ouverte:', this.showValidationModal);
  }

  confirmValidation(): void {
    if (!this.selectedDossierForValidation) {
      console.error('❌ Aucun dossier sélectionné pour validation');
      return;
    }

    const chefId = Number(this.currentUser?.id);
    const dossierId = Number(this.selectedDossierForValidation.id);
    const commentaire = this.validationComment.trim() || undefined;

    console.log('🔄 Validation du dossier:', { dossierId, chefId, commentaire });

    if (!chefId || isNaN(chefId)) {
      console.error('❌ ID utilisateur invalide:', this.currentUser?.id);
      this.toastService.showError('Erreur: ID utilisateur non disponible');
      return;
    }

    if (!dossierId || isNaN(dossierId)) {
      console.error('❌ ID dossier invalide:', this.selectedDossierForValidation.id);
      this.toastService.showError('Erreur: ID dossier invalide');
      return;
    }

    // Valider le dossier directement via l'API dossier
    this.dossierApiService.validerDossier(dossierId, chefId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossierUpdated) => {
          console.log('✅ Dossier validé avec succès:', dossierUpdated);
          
          // Note: Le commentaire n'est pas géré par l'API de validation via DossierController
          // Le dossier est validé directement, le commentaire peut être ajouté via l'API de validation si nécessaire
          
          this.toastService.showSuccess('Dossier validé avec succès et affecté à la phase d\'enquête.');
          this.closeValidationModal();
          // Attendre un peu avant de recharger pour laisser le backend mettre à jour
          setTimeout(() => {
            this.loadDossiers();
          }, 500);
        },
        error: (error: any) => {
          console.error('❌ Erreur lors de la validation du dossier:', error);
          console.error('Détails de l\'erreur:', {
            status: error?.status,
            message: error?.message,
            error: error?.error
          });
          
          let errorMessage = 'Erreur lors de la validation du dossier.';
          if (error?.status === 404) {
            errorMessage = 'Dossier non trouvé.';
          } else if (error?.status === 403) {
            errorMessage = 'Vous n\'avez pas les permissions nécessaires pour valider ce dossier.';
          } else if (error?.status === 400) {
            errorMessage = error?.error?.message || 'Données invalides.';
          }
          
          this.toastService.showError(errorMessage);
        }
      });
  }

  rejeterDossier(dossier: Dossier): void {
    console.log('🔄 Ouverture de la modal de rejet pour le dossier:', dossier);
    this.selectedDossierForValidation = dossier;
    this.validationComment = ''; // Réinitialiser le commentaire
    this.showValidationModal = true;
    console.log('✅ Modal de rejet ouverte:', this.showValidationModal);
  }

  confirmRejection(): void {
    if (!this.selectedDossierForValidation) {
      console.error('❌ Aucun dossier sélectionné pour rejet');
      return;
    }

    const chefId = Number(this.currentUser?.id);
    const dossierId = Number(this.selectedDossierForValidation.id);
    const commentaire = this.validationComment.trim() || 'Dossier rejeté par le chef';

    console.log('🔄 Rejet du dossier:', { dossierId, chefId, commentaire });

    if (!chefId || isNaN(chefId)) {
      console.error('❌ ID utilisateur invalide:', this.currentUser?.id);
      this.toastService.showError('Erreur: ID utilisateur non disponible');
      return;
    }

    if (!dossierId || isNaN(dossierId)) {
      console.error('❌ ID dossier invalide:', this.selectedDossierForValidation.id);
      this.toastService.showError('Erreur: ID dossier invalide');
      return;
    }

    // Rejeter le dossier via l'API de validation (qui met à jour le statut)
    // Note: rejeterDossier attend (dossierId, commentaire) - pas de chefId
    this.validationDossierService.rejeterDossier(dossierId, commentaire)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Dossier rejeté via validation service:', response);
          
          // Essayer aussi de mettre à jour via l'API dossier si disponible
          this.dossierApiService.rejeterDossier(dossierId, commentaire)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (dossierUpdated) => {
                console.log('✅ Dossier mis à jour via dossier API:', dossierUpdated);
              },
              error: (error: any) => {
                console.warn('⚠️ Erreur lors de la mise à jour du dossier (non bloquant):', error);
              }
            });
          
          this.toastService.showSuccess('Dossier rejeté avec succès.');
          this.closeValidationModal();
          // Attendre un peu avant de recharger pour laisser le backend mettre à jour
          setTimeout(() => {
            this.loadDossiers();
          }, 500);
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du rejet via validation service:', error);
          
          // Fallback: essayer directement via l'API dossier
          console.log('🔄 Tentative de rejet via API dossier...');
          this.dossierApiService.rejeterDossier(dossierId, commentaire)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (dossierUpdated) => {
                console.log('✅ Dossier rejeté via dossier API:', dossierUpdated);
                this.toastService.showSuccess('Dossier rejeté avec succès.');
                this.closeValidationModal();
                setTimeout(() => {
                  this.loadDossiers();
                }, 500);
              },
              error: (fallbackError: any) => {
                console.error('❌ Erreur lors du rejet du dossier:', fallbackError);
                console.error('Détails de l\'erreur:', {
                  status: fallbackError?.status,
                  message: fallbackError?.message,
                  error: fallbackError?.error
                });
                
                let errorMessage = 'Erreur lors du rejet du dossier.';
                if (fallbackError?.status === 404) {
                  errorMessage = 'Dossier non trouvé.';
                } else if (fallbackError?.status === 403) {
                  errorMessage = 'Vous n\'avez pas les permissions nécessaires pour rejeter ce dossier.';
                } else if (fallbackError?.status === 400) {
                  errorMessage = fallbackError?.error?.message || 'Données invalides.';
                }
                
                this.toastService.showError(errorMessage);
              }
            });
        }
      });
  }

  closeValidationModal(): void {
    this.showValidationModal = false;
    this.selectedDossierForValidation = null;
    this.validationComment = '';
  }

  cloturerDossier(dossier: Dossier): void {
    if (confirm('Êtes-vous sûr de vouloir clôturer ce dossier ?')) {
      this.dossierApiService.cloturerDossier(Number(dossier.id))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.toastService.showSuccess('Dossier clôturé avec succès.');
            this.loadDossiers();
          },
          error: (error: any) => {
            console.error('Erreur lors de la clôture:', error);
            this.toastService.showError('Erreur lors de la clôture du dossier.');
          }
        });
    }
  }

  // ==================== MÉTHODES D'AFFICHAGE ====================

  getValidationStatus(dossier: Dossier): string {
    if (dossier.dossierStatus === 'CLOTURE') {
      return 'CLÔTURÉ';
    }
    if (dossier.valide) {
      return 'VALIDÉ';
    }
    if (dossier.statut === 'REJETE') {
      return 'REJETÉ';
    }
    return 'EN ATTENTE';
  }

  getValidationClass(dossier: Dossier): string {
    if (dossier.dossierStatus === 'CLOTURE') {
      return 'status-cloture';
    }
    if (dossier.valide) {
      return 'status-valide';
    }
    if (dossier.statut === 'REJETE') {
      return 'status-rejete';
    }
    return 'status-en-attente';
  }

}
