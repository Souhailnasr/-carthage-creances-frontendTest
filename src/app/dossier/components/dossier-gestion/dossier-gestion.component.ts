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
import { DossierApi, DossierRequest, Urgence, DossierStatus, TypeDocumentJustificatif as ApiTypeDocument, CreancierApi, DebiteurApi } from '../../../shared/models/dossier-api.model';
import { Role } from '../../../shared/models/enums.model';

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

  // Fichiers sélectionnés
  selectedContratFile?: File;
  selectedPouvoirFile?: File;

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
    private authService: AuthService,
    private agentDossierService: AgentDossierService,
    private chefDossierService: ChefDossierService,
    private creancierApiService: CreancierApiService,
    private debiteurApiService: DebiteurApiService,
    private dossierApiService: DossierApiService,
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
      isChef: [false],
      agentCreateurId: [null] // Nouveau champ pour l'ID de l'agent créateur
    });

    // Update validators when types change
    this.dossierForm.get('typeCreancier')?.valueChanges.subscribe(t => this.onTypeCreancierChange(t));
    this.dossierForm.get('typeDebiteur')?.valueChanges.subscribe(t => this.onTypeDebiteurChange(t));
    
    // Logique pour agentCreateurId basée sur isChef
    this.dossierForm.get('isChef')?.valueChanges.subscribe(isChef => this.onIsChefChange(isChef));
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  loadDossiers(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('🔄 Chargement des dossiers pour l\'utilisateur:', this.currentUser?.role);
    
    if (this.currentUser?.role === Role.AGENT_DOSSIER) {
      // Pour les agents : charger leurs dossiers créés
      this.agentDossierService.loadMesDossiers()
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
            // Fallback avec données mock
            this.loadMockDossiers();
          }
        });
    } else if (this.currentUser?.role === Role.CHEF_DEPARTEMENT_DOSSIER) {
      // Pour les chefs : charger TOUS les dossiers (pas seulement ceux en attente)
      this.dossierApiService.getAllDossiers()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (dossiersApi: DossierApi[]) => {
            console.log('📋 Tous les dossiers chargés pour le chef:', dossiersApi.length);
            this.dossiers = this.convertApiDossiersToLocal(dossiersApi);
            this.filterDossiers();
          },
          error: (error) => {
            console.error('❌ Erreur lors du chargement des dossiers:', error);
            this.toastService.showError('Erreur lors du chargement des dossiers');
            // Fallback avec données mock
            this.loadMockDossiers();
          }
        });
    } else {
      // Fallback pour les autres rôles
      console.log('⚠️ Rôle non reconnu, utilisation des données mock');
      this.loadMockDossiers();
    }
  }

  private loadMockDossiers(): void {
    // Données de fallback
    this.dossiers = [
      new Dossier({
        id: '1',
        titre: 'Dossier Client ABC',
        description: 'Recouvrement facture impayée',
        numeroDossier: 'DOS-2024-001',
        montantCreance: 15000,
        dateCreation: new Date('2024-01-15'),
        statut: ValidationStatut.EN_COURS,
        urgence: UrgenceDossier.MOYENNE,
        agentResponsable: 'John Doe',
        agentCreateur: 'John Doe',
        typeDocumentJustificatif: TypeDocumentJustificatif.FACTURE,
        pouvoir: true,
        contratSigne: true,
        valide: false,
        dateValidation: undefined
      }),
      new Dossier({
        id: '2',
        titre: 'Dossier Client XYZ',
        description: 'Recouvrement contrat non honoré',
        numeroDossier: 'DOS-2024-002',
        montantCreance: 25000,
        dateCreation: new Date('2024-01-20'),
        statut: ValidationStatut.EN_COURS,
        urgence: UrgenceDossier.TRES_URGENT,
        agentResponsable: 'Jane Smith',
        agentCreateur: 'Jane Smith',
        typeDocumentJustificatif: TypeDocumentJustificatif.CONTRAT,
        pouvoir: false,
        contratSigne: true,
        valide: false,
        dateValidation: undefined
      })
    ];
    this.filterDossiers();
  }

  filterDossiers(): void {
    if (this.currentUser?.role === 'AGENT_DOSSIER') {
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
      const baseDossiers = this.currentUser?.role === 'AGENT_DOSSIER' 
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
    const baseDossiers = this.currentUser?.role === 'AGENT_DOSSIER' 
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
    // Rechercher les IDs des créanciers et débiteurs basés sur les noms
    const searchCreancier = formValue.typeCreancier === 'PERSONNE_PHYSIQUE' && formValue.prenomCreancier
      ? `${formValue.nomCreancier}`.trim() // API search call below compares both
      : `${formValue.nomCreancier}`.trim();
    const searchDebiteur = formValue.typeDebiteur === 'PERSONNE_PHYSIQUE' && formValue.prenomDebiteur
      ? `${formValue.nomDebiteur}`.trim()
      : `${formValue.nomDebiteur}`.trim();

    this.findCreancierAndDebiteurIds(searchCreancier, searchDebiteur)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ creancierId, debiteurId }: { creancierId: number, debiteurId: number }) => {
          const current = this.authService.getCurrentUser();
          // Sans auth, on laisse la case isChef décider; sinon on autorise aussi par rôle
          const isChef: boolean = !!formValue.isChef || !!(current && (current.role === Role.CHEF_DEPARTEMENT_DOSSIER || current.role === Role.SUPER_ADMIN));
          
          // Adapter au contrat backend: creancier/debiteur en objets avec id uniquement
          const dossierRequest: any = {
            titre: formValue.titre,
            description: formValue.description,
            numeroDossier: formValue.numeroDossier,
            montantCreance: formValue.montantCreance,
            typeDocumentJustificatif: this.convertLocalTypeDocumentToApi(formValue.typeDocumentJustificatif),
            urgence: this.convertLocalUrgenceToApi(formValue.urgence),
            dossierStatus: 'ENCOURSDETRAITEMENT', // Statut par défaut pour un nouveau dossier (même pour les chefs)
            typeCreancier: formValue.typeCreancier,
            // Pour compat DTO backend (noms) et pour logs côté service si besoin
            nomCreancier: formValue.nomCreancier,
            prenomCreancier: formValue.typeCreancier === 'PERSONNE_PHYSIQUE' ? (formValue.prenomCreancier || '') : '',
            typeDebiteur: formValue.typeDebiteur,
            nomDebiteur: formValue.nomDebiteur,
            prenomDebiteur: formValue.typeDebiteur === 'PERSONNE_PHYSIQUE' ? (formValue.prenomDebiteur || '') : '',
            // Si le backend accepte aussi des IDs ou objets, ils sont disponibles côté service si nécessaire
            creancierId: creancierId,
            debiteurId: debiteurId,
            contratSigne: formValue.contratSigne ? 'uploaded' : undefined,
            pouvoir: formValue.pouvoir ? 'uploaded' : undefined,
            // Utiliser la valeur du formulaire agentCreateurId (définie automatiquement par onIsChefChange)
            agentCreateurId: formValue.agentCreateurId
          };
          
          // Log pour déboguer
          console.log('🔍 Données envoyées au backend:', JSON.stringify(dossierRequest, null, 2));

          const hasFiles = !!this.selectedContratFile || !!this.selectedPouvoirFile;
          const create$ = hasFiles
            ? this.agentDossierService.creerDossierAvecFichiers(
                dossierRequest,
                this.selectedContratFile,
                this.selectedPouvoirFile,
                isChef
              )
            : this.agentDossierService.creerDossier(dossierRequest, isChef as boolean);

          create$
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (nouveauDossier) => {
                console.log('✅ Dossier créé avec succès:', nouveauDossier);
                this.toastService.success('Dossier créé avec succès.');
                this.cancelForm();
                // Recharger les dossiers avec un délai pour s'assurer que la DB est à jour
                setTimeout(() => {
                  this.loadDossiers();
                }, 500);
              },
              error: (error) => {
                console.error('❌ Erreur lors de la création du dossier:', error);
                console.error('❌ Détails de l\'erreur:', JSON.stringify(error, null, 2));
                
                // Essayer de recharger quand même au cas où le dossier aurait été créé
                setTimeout(() => {
                  this.loadDossiers();
                }, 1000);
                
                const msg = typeof error === 'string' ? error : 'Erreur lors de la création du dossier.';
                this.toastService.error(msg);
              }
            });
        },
        error: (error: any) => {
          console.error('Erreur lors de la recherche des créanciers/débiteurs:', error);
          const msg = typeof error === 'string' ? error : 'Erreur lors de la recherche des créanciers/débiteurs.';
          this.toastService.error(msg);
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
    const agentCreateurIdControl = this.dossierForm.get('agentCreateurId');
    if (isChef) {
      // Quand la case est cochée, définir agentCreateurId à 11
      agentCreateurIdControl?.setValue(11);
      console.log('✅ Case "Créer en tant que Chef" cochée - agentCreateurId défini à 11');
    } else {
      // Quand la case est décochée, réinitialiser agentCreateurId à null
      agentCreateurIdControl?.setValue(null);
      console.log('❌ Case "Créer en tant que Chef" décochée - agentCreateurId réinitialisé à null');
    }
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
    this.creancierApiService.searchCreancierByName(term)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (creanciers) => {
          this.creancierSuggestions = creanciers.slice(0, 5); // Limiter à 5 suggestions
          this.showCreancierSuggestions = this.creancierSuggestions.length > 0;
        },
        error: (error) => {
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
        error: (error) => {
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
      this.creancierApiService.searchCreancierByName(nomCreancier)
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
                error: (error) => {
                  console.error('Erreur lors de la recherche des débiteurs:', error);
                  observer.error('Erreur lors de la recherche du débiteur: ' + error);
                }
              });
          },
          error: (error) => {
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
           this.currentUser.role === Role.CHEF_DEPARTEMENT_DOSSIER && 
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

  getValidationStatus(dossier: Dossier): string {
    if (dossier.valide) {
      return 'Validé';
    }
    return 'En attente';
  }

  getValidationClass(dossier: Dossier): string {
    if (dossier.valide) {
      return 'status-validated';
    }
    return 'status-pending';
  }
}
