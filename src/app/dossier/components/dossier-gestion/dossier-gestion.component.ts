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
      return this.dossiers;
    }
    return this.dossiers.filter(dossier => dossier.statut === status);
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.applyAdvancedFilters();
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
        return 'En Attente';
      case 'VALIDE':
        return 'Validé';
      case 'REJETE':
        return 'Rejeté';
      case 'ENCOURSDETRAITEMENT':
        return 'En Cours';
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
        return 'En Cours';
      case 'ENQUETE':
        return 'Enquête';
      case 'CLOTURE':
        return 'Clôturé';
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
  this.jwtAuthService.getCurrentUser()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (user: User) => {
        this.currentUser = user;
        console.log('🔄 Chargement des dossiers pour l\'utilisateur:', this.currentUser.roleUtilisateur);

        const userId = Number(this.currentUser.id);
        console.log('ℹ️ ID utilisateur:', userId);
        if (!userId) {
          console.error('❌ ID utilisateur non disponible');
          this.toastService.showError('Erreur: Impossible de récupérer l\'ID utilisateur');
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
  this.dossierApiService.getDossiersByAgent(userId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (dossiersApi: DossierApi[]) => {
        console.log('📋 Dossiers chargés pour l\'agent:', dossiersApi.length);
        this.dossiers = this.convertApiDossiersToLocal(dossiersApi);
        this.filterDossiers();
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des dossiers:', error);
        this.toastService.showError('Erreur lors du chargement des dossiers');
      }
    });
}

private loadAllDossiers(): void {
  this.dossierApiService.getAllDossiers()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: any) => {
        console.log('📋 Tous les dossiers chargés pour le chef:', response.content?.length || 0);
        this.dossiers = this.convertApiDossiersToLocal(response.content || []);
        this.filterDossiers();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des dossiers:', error);
        this.toastService.showError('Erreur lors du chargement des dossiers');
      }
    });
}


  private loadAllDossiersFallback(): void {
    console.log('🔄 Tentative de chargement de tous les dossiers...');
    this.dossierApiService.getAllDossiers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossiersPage: Page<DossierApi>) => {
          console.log('📋 Tous les dossiers chargés (fallback):', dossiersPage.content.length);
          this.dossiers = this.convertApiDossiersToLocal(dossiersPage.content);
          this.filterDossiers();
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
        this.dossierApiService.getAllDossiers()
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              console.log('✅ Dossiers chargés avec retry:', response.content?.length || 0);
              this.dossiers = this.convertApiDossiersToLocal(response.content || []);
              this.filterDossiers();
            },
            error: (error: any) => {
              console.error('❌ Erreur persistante lors du chargement:', error);
              this.toastService.showError('Impossible de charger les dossiers. Vérifiez le backend.');
              this.dossiers = []; // Afficher une liste vide au lieu de données mock
            }
          });
      } else if (this.currentUser?.roleUtilisateur === Role.AGENT_DOSSIER) {
        // Pour les agents, essayer de charger leurs dossiers
        const userId = this.currentUser?.id;
        if (userId) {
          this.dossierApiService.getDossiersByAgent(Number(userId))
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (dossiers) => {
                console.log('✅ Dossiers de l\'agent chargés avec retry:', dossiers.length);
                this.dossiers = this.convertApiDossiersToLocal(dossiers);
                this.filterDossiers();
              },
              error: (error: any) => {
                console.error('❌ Erreur persistante lors du chargement des dossiers de l\'agent:', error);
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
    if (this.currentUser?.roleUtilisateur === 'AGENT_DOSSIER') {
      // Pour les agents, ne montrer que les dossiers qui leur sont assignés
      this.filteredDossiers = this.dossiers.filter(dossier =>
        dossier.agentResponsable === this.currentUser?.getFullName()
      );
    } else {
      // Pour les chefs, montrer tous les dossiers
      this.filteredDossiers = [...this.dossiers];
    }
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
      const baseDossiers = this.currentUser?.roleUtilisateur === 'AGENT_DOSSIER'
        ? this.dossiers.filter(dossier => dossier.agentResponsable === this.currentUser?.getFullName())
        : this.dossiers;

      this.filteredDossiers = baseDossiers.filter(dossier =>
        dossier.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.numeroDossier.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.creancier.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.debiteur.nom.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      this.applySortingAndPaging();
    }
  }

  applyAdvancedFilters(): void {
    const baseDossiers = this.currentUser?.roleUtilisateur === 'AGENT_DOSSIER'
      ? this.dossiers.filter(dossier => dossier.agentResponsable === this.currentUser?.getFullName())
      : this.dossiers;

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
    this.applySortingAndPaging();
  }

  applySortingAndPaging(): void {
    console.log('🔄 applySortingAndPaging - filteredDossiers:', this.filteredDossiers.length);

    const sorted = [...this.filteredDossiers].sort((a, b) => {
      const dir = this.sortDir === 'asc' ? 1 : -1;
      if (this.sortKey === 'dateCreation') {
        return (new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime()) * dir;
      }
      if (this.sortKey === 'montantCreance') {
        return (a.montantCreance - b.montantCreance) * dir;
      }
      if (this.sortKey === 'statut') {
        return (a.statut > b.statut ? 1 : a.statut < b.statut ? -1 : 0) * dir;
      }
      return 0;
    });

    this.totalPages = Math.max(1, Math.ceil(sorted.length / this.pageSize));
    if (this.pageIndex >= this.totalPages) this.pageIndex = this.totalPages - 1;
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedDossiers = sorted.slice(start, end);

    console.log('📄 Pagination - totalPages:', this.totalPages, 'pageIndex:', this.pageIndex, 'pagedDossiers:', this.pagedDossiers.length);
    console.log('📄 pagedDossiers:', this.pagedDossiers);
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

        // Création du FormData si fichiers
        const hasFiles = !!this.selectedContratFile || !!this.selectedPouvoirFile;
        let create$: Observable<DossierApi>;

        if (hasFiles) {
          const formData = new FormData();
          const dossierBlob = new Blob([JSON.stringify(dossierRequest)], { type: 'application/json' });
          formData.append('dossier', dossierBlob);
          if (this.selectedContratFile) formData.append('contratSigne', this.selectedContratFile);
          if (this.selectedPouvoirFile) formData.append('pouvoir', this.selectedPouvoirFile);

          create$ = this.dossierApiService.createWithFiles(
            dossierRequest,
            this.selectedContratFile,
            this.selectedPouvoirFile,
            isChef
          );
        } else {
          create$ = this.dossierApiService.createWithFallback(dossierRequest, isChef);
        }

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
    this.selectedDossierForValidation = dossier;
    this.showValidationModal = true;
  }

  confirmValidation(): void {
    if (!this.selectedDossierForValidation) return;

    const chefId = Number(this.currentUser?.id);
    const commentaire = this.validationComment.trim() || undefined;

    this.validationDossierService.validerDossier(
      Number(this.selectedDossierForValidation.id),
      chefId,
      commentaire
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.toastService.showSuccess('Dossier validé avec succès.');
          this.closeValidationModal();
          this.loadDossiers();
        },
        error: (error: any) => {
          console.error('Erreur lors de la validation:', error);
          this.toastService.showError('Erreur lors de la validation du dossier.');
        }
      });
  }

  rejeterDossier(dossier: Dossier): void {
    this.selectedDossierForValidation = dossier;
    this.showValidationModal = true;
  }

  confirmRejection(): void {
    if (!this.selectedDossierForValidation) return;

    const chefId = Number(this.currentUser?.id);
    const commentaire = this.validationComment.trim() || undefined;

    this.validationDossierService.rejeterDossier(
      Number(this.selectedDossierForValidation.id),
      chefId,
      commentaire
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.toastService.showSuccess('Dossier rejeté avec succès.');
          this.closeValidationModal();
          this.loadDossiers();
        },
        error: (error: any) => {
          console.error('Erreur lors du rejet:', error);
          this.toastService.showError('Erreur lors du rejet du dossier.');
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
