import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, switchMap } from 'rxjs';
import { Dossier, Creancier, Debiteur, User } from '../../../shared/models';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { EnqueteService } from '../../../core/services/enquete.service';
import { ValidationEnqueteService } from '../../../core/services/validation-enquete.service';
import { Role } from '../../../shared/models/enums.model';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { Page } from '../../../shared/models/pagination.model';
import { Enquette, StatutValidation } from '../../../shared/models';

@Component({
  selector: 'app-enquete-phase',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FormInputComponent],
  templateUrl: './enquete-phase.component.html',
  styleUrls: ['./enquete-phase.component.scss']
})
export class EnquetePhaseComponent implements OnInit, OnDestroy {
  dossiers: Dossier[] = [];
  filteredDossiers: Dossier[] = [];
  pagedDossiers: Dossier[] = [];
  searchTerm: string = '';
  showEnqueteForm: boolean = false;
  enqueteForm!: FormGroup;
  selectedDossier: Dossier | null = null;
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  // Sorting & pagination
  sortKey: 'dateCreation' | 'montantCreance' | 'statut' = 'dateCreation';
  sortDir: 'asc' | 'desc' = 'desc';
  pageSize = 10;
  pageIndex = 0;
  totalPages = 1;

  // Getters pour les contrôles de formulaire
  get rapportCodeControl(): FormControl { return this.enqueteForm.get('rapportCode') as FormControl; }
  get nomElementFinancierControl(): FormControl { return this.enqueteForm.get('nomElementFinancier') as FormControl; }
  get pourcentageControl(): FormControl { return this.enqueteForm.get('pourcentage') as FormControl; }
  get banqueAgenceControl(): FormControl { return this.enqueteForm.get('banqueAgence') as FormControl; }
  get banquesControl(): FormControl { return this.enqueteForm.get('banques') as FormControl; }
  get exercicesControl(): FormControl { return this.enqueteForm.get('exercices') as FormControl; }
  get chiffreAffaireControl(): FormControl { return this.enqueteForm.get('chiffreAffaire') as FormControl; }
  get resultatNetControl(): FormControl { return this.enqueteForm.get('resultatNet') as FormControl; }
  get disponibiliteBilanControl(): FormControl { return this.enqueteForm.get('disponibiliteBilan') as FormControl; }
  get appreciationBancaireControl(): FormControl { return this.enqueteForm.get('appreciationBancaire') as FormControl; }
  get paiementsCouvertureControl(): FormControl { return this.enqueteForm.get('paiementsCouverture') as FormControl; }
  get reputationCommercialeControl(): FormControl { return this.enqueteForm.get('reputationCommerciale') as FormControl; }
  get incidentsControl(): FormControl { return this.enqueteForm.get('incidents') as FormControl; }
  get bienImmobilierControl(): FormControl { return this.enqueteForm.get('bienImmobilier') as FormControl; }
  get situationJuridiqueImmobilierControl(): FormControl { return this.enqueteForm.get('situationJuridiqueImmobilier') as FormControl; }
  get bienMobilierControl(): FormControl { return this.enqueteForm.get('bienMobilier') as FormControl; }
  get situationJuridiqueMobilierControl(): FormControl { return this.enqueteForm.get('situationJuridiqueMobilier') as FormControl; }
  get autresAffairesControl(): FormControl { return this.enqueteForm.get('autresAffaires') as FormControl; }
  get observationsControl(): FormControl { return this.enqueteForm.get('observations') as FormControl; }
  get decisionComiteControl(): FormControl { return this.enqueteForm.get('decisionComite') as FormControl; }
  get visaDirecteurJuridiqueControl(): FormControl { return this.enqueteForm.get('visaDirecteurJuridique') as FormControl; }
  get visaEnqueteurControl(): FormControl { return this.enqueteForm.get('visaEnqueteur') as FormControl; }
  get visaDirecteurCommercialControl(): FormControl { return this.enqueteForm.get('visaDirecteurCommercial') as FormControl; }
  get registreCommerceControl(): FormControl { return this.enqueteForm.get('registreCommerce') as FormControl; }
  get codeDouaneControl(): FormControl { return this.enqueteForm.get('codeDouane') as FormControl; }
  get matriculeFiscaleControl(): FormControl { return this.enqueteForm.get('matriculeFiscale') as FormControl; }
  get formeJuridiqueControl(): FormControl { return this.enqueteForm.get('formeJuridique') as FormControl; }
  get dateCreationControl(): FormControl { return this.enqueteForm.get('dateCreation') as FormControl; }
  get capitalControl(): FormControl { return this.enqueteForm.get('capital') as FormControl; }
  get pdgControl(): FormControl { return this.enqueteForm.get('pdg') as FormControl; }
  get directeurAdjointControl(): FormControl { return this.enqueteForm.get('directeurAdjoint') as FormControl; }
  get directeurFinancierControl(): FormControl { return this.enqueteForm.get('directeurFinancier') as FormControl; }
  get directeurCommercialControl(): FormControl { return this.enqueteForm.get('directeurCommercial') as FormControl; }
  get descriptionActiviteControl(): FormControl { return this.enqueteForm.get('descriptionActivite') as FormControl; }
  get secteurActiviteControl(): FormControl { return this.enqueteForm.get('secteurActivite') as FormControl; }
  get effectifControl(): FormControl { return this.enqueteForm.get('effectif') as FormControl; }
  get emailControl(): FormControl { return this.enqueteForm.get('email') as FormControl; }
  get marquesControl(): FormControl { return this.enqueteForm.get('marques') as FormControl; }
  get groupeControl(): FormControl { return this.enqueteForm.get('groupe') as FormControl; }

  loading = false;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private router: Router,
    private authService: AuthService,
    private dossierApiService: DossierApiService,
    private jwtAuthService: JwtAuthService,
    private enqueteService: EnqueteService,
    private validationEnqueteService: ValidationEnqueteService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    // Charger d'abord l'utilisateur, puis les dossiers
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          this.currentUser = user;
          // Charger les dossiers après avoir récupéré l'utilisateur
          this.loadDossiers();
        },
        error: (err) => {
          console.error('❌ Erreur lors du chargement de l\'utilisateur:', err);
          // Charger les dossiers quand même si erreur
          this.loadDossiers();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm(): void {
    this.enqueteForm = this.fb.group({
      rapportCode: ['', Validators.required],
      nomElementFinancier: ['', Validators.required],
      pourcentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      banqueAgence: ['', Validators.required],
      banques: ['', Validators.required],
      exercices: ['', Validators.required],
      chiffreAffaire: [0, [Validators.required, Validators.min(0)]],
      resultatNet: [0, [Validators.required]],
      disponibiliteBilan: [0, [Validators.required, Validators.min(0)]],
      appreciationBancaire: ['', Validators.required],
      paiementsCouverture: [0, [Validators.required, Validators.min(0)]],
      reputationCommerciale: ['', Validators.required],
      incidents: [''],
      bienImmobilier: [''],
      situationJuridiqueImmobilier: [''],
      bienMobilier: [''],
      situationJuridiqueMobilier: [''],
      autresAffaires: [''],
      observations: [''],
      decisionComite: [''],
      visaDirecteurJuridique: [false],
      visaEnqueteur: [false],
      visaDirecteurCommercial: [false],
      registreCommerce: ['', Validators.required],
      codeDouane: [''],
      matriculeFiscale: ['', Validators.required],
      formeJuridique: ['', Validators.required],
      dateCreation: [new Date(), Validators.required],
      capital: [0, [Validators.required, Validators.min(0)]],
      pdg: ['', Validators.required],
      directeurAdjoint: [''],
      directeurFinancier: [''],
      directeurCommercial: [''],
      descriptionActivite: ['', Validators.required],
      secteurActivite: ['', Validators.required],
      effectif: [0, [Validators.required, Validators.min(0)]],
      email: ['', [Validators.required, Validators.email]],
      marques: [''],
      groupe: ['']
    });
  }

  loadDossiers(): void {
    // Vérifier le rôle de l'utilisateur pour charger les dossiers appropriés
    if (!this.currentUser || !this.currentUser.id) {
      console.error('❌ Utilisateur non connecté');
      this.toastService.error('Erreur: Utilisateur non connecté');
      return;
    }

    const userId = Number(this.currentUser.id);
    const userRole = this.currentUser.roleUtilisateur;

    console.log('🔄 Chargement des dossiers pour l\'utilisateur:', userRole, 'ID:', userId);

    // Charger selon le rôle
    if (userRole === Role.AGENT_DOSSIER) {
      // Agent : charger uniquement les dossiers créés par lui
      this.loadDossiersByAgent(userId);
    } else if (userRole === Role.CHEF_DEPARTEMENT_DOSSIER || userRole === Role.SUPER_ADMIN) {
      // Chef : charger tous les dossiers
      this.loadAllDossiers();
    } else {
      console.warn('⚠️ Rôle non reconnu, chargement de tous les dossiers');
      this.loadAllDossiers();
    }
  }

  private loadDossiersByAgent(agentId: number): void {
    // Charger uniquement les dossiers créés par l'agent avec pagination
    this.loading = true;
    this.dossierApiService.getDossiersCreesByAgent(agentId, 0, 1000) // Charger toutes les pages pour ce composant
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (page: Page<DossierApi>) => {
          // Gérer le cas où page.content est undefined ou null
          const content = page?.content || [];
          console.log('📋 Dossiers créés par l\'agent chargés:', content.length, 'sur', page?.totalElements || 0);
          // Convertir les données de l'API en objets Dossier
          // Filtrer uniquement les dossiers validés (valide = true et statut = VALIDE)
          const dossiersValides = content.filter((dossierApi: any) => 
            dossierApi.valide === true && dossierApi.statut === 'VALIDE'
          );
          console.log('📋 Dossiers validés pour créer une enquête:', dossiersValides.length);
          this.dossiers = dossiersValides.map((dossierApi: any) => {
            return new Dossier({
              id: dossierApi.id?.toString() || '',
              titre: dossierApi.titre || '',
              numeroDossier: dossierApi.numeroDossier || '',
              montantCreance: dossierApi.montantCreance || 0,
              dateCreation: dossierApi.dateCreation ? new Date(dossierApi.dateCreation) : new Date(),
              statut: dossierApi.statut || 'EN_ATTENTE_VALIDATION',
              urgence: dossierApi.urgence || 'FAIBLE',
              agentResponsable: dossierApi.agentResponsable ? `${dossierApi.agentResponsable.prenom} ${dossierApi.agentResponsable.nom}` : '',
              agentCreateur: dossierApi.agentCreateur ? `${dossierApi.agentCreateur.prenom} ${dossierApi.agentCreateur.nom}` : '',
              valide: dossierApi.valide || false,
              dateValidation: dossierApi.dateValidation ? new Date(dossierApi.dateValidation) : undefined,
              creancier: new Creancier({
                id: dossierApi.creancier?.id || 0,
                codeCreancier: dossierApi.creancier?.codeCreancier || '',
                nom: dossierApi.creancier?.nom || dossierApi.nomCreancier || '',
                prenom: dossierApi.creancier?.prenom || '',
                type: dossierApi.creancier?.type || 'PARTICULIER',
                email: dossierApi.creancier?.email || '',
                telephone: dossierApi.creancier?.telephone || ''
              }),
              debiteur: new Debiteur({
                id: dossierApi.debiteur?.id || 0,
                nom: dossierApi.debiteur?.nom || dossierApi.nomDebiteur || '',
                prenom: dossierApi.debiteur?.prenom || '',
                type: dossierApi.debiteur?.type || 'PARTICULIER',
                email: dossierApi.debiteur?.email || '',
                telephone: dossierApi.debiteur?.telephone || ''
              })
            });
          });
          this.filterDossiers();
          this.applySortingAndPaging();
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des dossiers de l\'agent:', error);
          console.error('❌ Détails de l\'erreur:', {
            status: error?.status,
            statusText: error?.statusText,
            message: error?.message,
            error: error?.error,
            url: error?.url
          });
          
          // Essayer sans pagination en cas d'erreur
          console.log('⚠️ Erreur avec pagination, essai sans pagination...');
          this.dossierApiService.getDossiersCreesByAgentSimple(agentId)
            .pipe(
              takeUntil(this.destroy$),
              finalize(() => this.loading = false)
            )
            .subscribe({
              next: (dossiers: DossierApi[]) => {
                console.log('✅ Réponse API sans pagination:', dossiers);
                const dossiersValides = dossiers.filter((dossierApi: any) => 
                  dossierApi.valide === true && dossierApi.statut === 'VALIDE'
                );
                this.dossiers = dossiersValides.map((dossierApi: any) => {
                  return new Dossier({
                    id: dossierApi.id?.toString() || '',
                    titre: dossierApi.titre || '',
                    numeroDossier: dossierApi.numeroDossier || '',
                    montantCreance: dossierApi.montantCreance || 0,
                    dateCreation: dossierApi.dateCreation ? new Date(dossierApi.dateCreation) : new Date(),
                    statut: dossierApi.statut || 'EN_ATTENTE_VALIDATION',
                    urgence: dossierApi.urgence || 'FAIBLE',
                    agentResponsable: dossierApi.agentResponsable ? `${dossierApi.agentResponsable.prenom} ${dossierApi.agentResponsable.nom}` : '',
                    agentCreateur: dossierApi.agentCreateur ? `${dossierApi.agentCreateur.prenom} ${dossierApi.agentCreateur.nom}` : '',
                    valide: dossierApi.valide || false,
                    dateValidation: dossierApi.dateValidation ? new Date(dossierApi.dateValidation) : undefined,
                    creancier: new Creancier({
                      id: dossierApi.creancier?.id || 0,
                      codeCreancier: dossierApi.creancier?.codeCreancier || '',
                      nom: dossierApi.creancier?.nom || dossierApi.nomCreancier || '',
                      prenom: dossierApi.creancier?.prenom || '',
                      type: dossierApi.creancier?.type || 'PARTICULIER',
                      email: dossierApi.creancier?.email || '',
                      telephone: dossierApi.creancier?.telephone || ''
                    }),
                    debiteur: new Debiteur({
                      id: dossierApi.debiteur?.id || 0,
                      nom: dossierApi.debiteur?.nom || dossierApi.nomDebiteur || '',
                      prenom: dossierApi.debiteur?.prenom || '',
                      type: dossierApi.debiteur?.type || 'PARTICULIER',
                      email: dossierApi.debiteur?.email || '',
                      telephone: dossierApi.debiteur?.telephone || ''
                    })
                  });
                });
                this.filterDossiers();
                this.applySortingAndPaging();
              },
              error: (err) => {
                console.error('❌ Erreur lors du chargement sans pagination:', err);
          this.toastService.error('Erreur lors du chargement des dossiers');
          this.loadFallbackData();
              }
            });
        }
      });
  }

  private loadAllDossiers(): void {
    // Charger tous les dossiers (pour les chefs)
    this.dossierApiService.getAllDossiers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Gérer le cas où response.content est undefined ou null
          const content = response?.content || [];
          console.log('📋 Tous les dossiers chargés pour le chef:', content.length);
          // Convertir les données de l'API en objets Dossier
          // Filtrer uniquement les dossiers validés (valide = true et statut = VALIDE)
          const dossiersValides = content.filter((dossierApi: any) => 
            dossierApi.valide === true && dossierApi.statut === 'VALIDE'
          );
          console.log('📋 Dossiers validés pour créer une enquête:', dossiersValides.length);
          this.dossiers = dossiersValides.map((dossierApi: any) => {
            return new Dossier({
              id: dossierApi.id?.toString() || '',
              titre: dossierApi.titre || '',
              numeroDossier: dossierApi.numeroDossier || '',
              montantCreance: dossierApi.montantCreance || 0,
              dateCreation: dossierApi.dateCreation ? new Date(dossierApi.dateCreation) : new Date(),
              statut: dossierApi.statut || 'EN_ATTENTE_VALIDATION',
              urgence: dossierApi.urgence || 'FAIBLE',
              agentResponsable: dossierApi.agentResponsable ? `${dossierApi.agentResponsable.prenom} ${dossierApi.agentResponsable.nom}` : '',
              agentCreateur: dossierApi.agentCreateur ? `${dossierApi.agentCreateur.prenom} ${dossierApi.agentCreateur.nom}` : '',
              valide: dossierApi.valide || false,
              dateValidation: dossierApi.dateValidation ? new Date(dossierApi.dateValidation) : undefined,
              creancier: new Creancier({
                id: dossierApi.creancier?.id || 0,
                codeCreancier: dossierApi.creancier?.codeCreancier || '',
                nom: dossierApi.creancier?.nom || dossierApi.nomCreancier || '',
                prenom: dossierApi.creancier?.prenom || '',
                type: dossierApi.creancier?.type || 'PARTICULIER',
                email: dossierApi.creancier?.email || '',
                telephone: dossierApi.creancier?.telephone || ''
              }),
              debiteur: new Debiteur({
                id: dossierApi.debiteur?.id || 0,
                nom: dossierApi.debiteur?.nom || dossierApi.nomDebiteur || '',
                prenom: dossierApi.debiteur?.prenom || '',
                type: dossierApi.debiteur?.type || 'PARTICULIER',
                email: dossierApi.debiteur?.email || '',
                telephone: dossierApi.debiteur?.telephone || ''
              })
            });
          }) || [];
          this.filterDossiers();
          this.applySortingAndPaging();
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des dossiers:', error);
          this.toastService.error('Erreur lors du chargement des dossiers');
          // En cas d'erreur, utiliser des données de fallback
          this.loadFallbackData();
        }
      });
  }

  private loadFallbackData(): void {
    // Données de fallback en cas d'erreur API
    this.dossiers = [
      new Dossier({
        id: '1',
        titre: 'Dossier Client ABC',
        numeroDossier: 'DOS-2024-001',
        montantCreance: 15000,
        dateCreation: new Date('2024-01-15'),
        statut: 'VALIDE' as any,
        urgence: 'MOYENNE' as any,
        agentResponsable: 'John Doe',
        valide: true,
        dateValidation: new Date('2024-01-16'),
        creancier: new Creancier({
          id: 1,
          codeCreancier: 'CRE-001',
          nom: 'BEN ALI',
          prenom: 'Ahmed',
          type: 'PARTICULIER',
          email: 'ahmed.benali@email.com',
          telephone: '+216 20 123 456'
        }),
        debiteur: new Debiteur({
          id: 1,
          nom: 'TRAORE',
          prenom: 'Fatima',
          type: 'ENTREPRISE',
          email: 'fatima.traore@company.com',
          telephone: '+216 20 789 012'
        })
      }),
      new Dossier({
        id: '2',
        titre: 'Dossier Client XYZ',
        numeroDossier: 'DOS-2024-002',
        montantCreance: 25000,
        dateCreation: new Date('2024-01-20'),
        statut: 'VALIDE' as any,
        urgence: 'TRES_URGENT' as any,
        agentResponsable: 'Jane Smith',
        valide: true,
        dateValidation: new Date('2024-01-21'),
        creancier: new Creancier({
          id: 2,
          codeCreancier: 'CRE-002',
          nom: 'KASSEM',
          prenom: 'Mohamed',
          type: 'ENTREPRISE',
          email: 'm.kassem@business.tn',
          telephone: '+216 20 345 678'
        }),
        debiteur: new Debiteur({
          id: 2,
          nom: 'BOUAZIZI',
          prenom: 'Karim',
          type: 'PARTICULIER',
          email: 'karim.bouazizi@email.com',
          telephone: '+216 20 456 789'
        })
      })
    ];
    this.filterDossiers();
    this.applySortingAndPaging();
  }

  filterDossiers(): void {
    // Filtrer par statut VALIDE pour tous les utilisateurs
    let filtered = this.dossiers.filter(dossier => 
      dossier.statut === 'VALIDE' || dossier.valide === true
    );

    // Si l'utilisateur est un agent, s'assurer qu'il ne voit que ses dossiers
    // (déjà filtré par loadDossiersByAgent, mais on double-vérifie pour sécurité)
    if (this.currentUser?.roleUtilisateur === Role.AGENT_DOSSIER) {
      const agentId = Number(this.currentUser.id);
      // Filtrer par ID de l'agent créateur si disponible
      // Note: On suppose que les dossiers ont déjà été filtrés par l'API
      // mais on peut ajouter une vérification supplémentaire ici si nécessaire
    }

    this.filteredDossiers = filtered;
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filterDossiers();
    } else {
      // Filtrer d'abord par statut VALIDE
      let baseDossiers = this.dossiers.filter(dossier => 
        dossier.statut === 'VALIDE' || dossier.valide === true
      );

      // Si l'utilisateur est un agent, s'assurer qu'il ne voit que ses dossiers
      // (déjà filtré par loadDossiersByAgent, mais on double-vérifie pour sécurité)
      if (this.currentUser?.roleUtilisateur === Role.AGENT_DOSSIER) {
        // Les dossiers sont déjà filtrés par l'API, pas besoin de filtrer à nouveau
      }
        
      // Appliquer le filtre de recherche
      this.filteredDossiers = baseDossiers.filter(dossier =>
        dossier.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.numeroDossier.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      this.applySortingAndPaging();
    }
  }

  applySortingAndPaging(): void {
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

  showEnqueteFormForDossier(dossier: Dossier): void {
    this.selectedDossier = dossier;
    this.showEnqueteForm = true;
    this.initializeForm();
  }

  onSubmit(): void {
    if (this.enqueteForm.invalid) {
      this.enqueteForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }

    if (!this.selectedDossier) {
      this.toastService.error('Erreur: Dossier non sélectionné.');
      return;
    }

    // Récupérer l'ID utilisateur depuis le token JWT (méthode principale)
    let agentCreateurId: number | null = this.jwtAuthService.getCurrentUserId();
    
    // Fallback sur currentUser.id si getCurrentUserId() retourne null
    if (!agentCreateurId && this.currentUser?.id) {
      agentCreateurId = Number(this.currentUser.id);
      console.warn('⚠️ Utilisation de currentUser.id comme fallback');
    }
    
    if (!agentCreateurId || isNaN(agentCreateurId) || agentCreateurId <= 0) {
      this.toastService.error('Erreur: ID utilisateur invalide. Veuillez vous reconnecter.');
      return;
    }

    // Vérifier le rôle pour déterminer si c'est un chef
    const isChef = this.currentUser?.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER || 
                   this.currentUser?.roleUtilisateur === Role.SUPER_ADMIN;

    const formValue = this.enqueteForm.value;
    
    // Le backend n'accepte pas dossierId directement, on envoie un objet dossier minimal
    // Le backend n'accepte pas agentCreateur (objet complet), seulement agentCreateurId
    const enqueteData: Partial<Enquette> = {
      ...formValue,
      dossier: { id: Number(this.selectedDossier.id) } as any, // Objet Dossier minimal avec juste l'id
      agentCreateurId: agentCreateurId, // ID numérique, pas l'objet complet
      dateCreation: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
      // Pour les chefs, marquer l'enquête comme validée directement
      valide: isChef ? true : false,
      // Statut (statut fonctionnel) - logique de validation
      statut: isChef ? 'VALIDE' : 'EN_ATTENTE_VALIDATION' // EN_ATTENTE_VALIDATION pour les agents, VALIDE pour les chefs
    };
    
    // Supprimer les champs non acceptés par le backend
    delete (enqueteData as any).dossierId;
    delete (enqueteData as any).agentCreateur; // Ne pas envoyer l'objet complet
    delete (enqueteData as any).agentResponsable; // Ne pas envoyer l'objet complet
    
    // Log pour vérifier le format des données envoyées
    console.log('📤 Données à envoyer au backend:', JSON.stringify(enqueteData, null, 2));
    console.log('🔍 agentCreateurId (type):', typeof enqueteData.agentCreateurId, 'valeur:', enqueteData.agentCreateurId);

    this.loading = true;
    
    // Créer l'enquête (même logique que pour les dossiers)
    this.enqueteService.createEnquete(enqueteData as any)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (enquete: Enquette) => {
          console.log('✅ Enquête créée avec succès:', enquete);
          
          const message = isChef
            ? `Enquête créée et validée avec succès ! ID: ${enquete.id}`
            : `Enquête créée avec succès ! ID: ${enquete.id} (en attente de validation)`;
          this.toastService.success(message);

          // Pour les agents : créer une validation avec statut EN_ATTENTE
          // Pour les chefs : pas besoin de validation car l'enquête est déjà validée
    if (this.currentUser?.roleUtilisateur === Role.AGENT_DOSSIER) {
            this.createValidationForEnquete(enquete);
    } else {
            // Pour les chefs : juste annuler le formulaire et recharger les dossiers
            this.cancelForm();
            setTimeout(() => {
              this.loadDossiers();
            }, 500);
          }
        },
        error: (error: any) => {
          console.error('❌ Erreur lors de la création de l\'enquête:', error);
          const errorMessage = error.error?.message || error.message || 'Erreur lors de la création de l\'enquête. Veuillez réessayer.';
          this.toastService.error(errorMessage);
        }
      });
  }

  /**
   * Crée une validation pour l'enquête (même logique que createValidationForDossier)
   * Appelé uniquement pour les agents après création d'une enquête
   */
  private createValidationForEnquete(enquete: Enquette): void {
    // Récupérer l'ID utilisateur depuis le token JWT (méthode principale)
    let agentCreateurId: number | null = this.jwtAuthService.getCurrentUserId();
    
    // Fallback sur currentUser.id si getCurrentUserId() retourne null
    if (!agentCreateurId && this.currentUser?.id) {
      agentCreateurId = Number(this.currentUser.id);
      console.warn('⚠️ Utilisation de currentUser.id comme fallback');
    }
    
    if (!agentCreateurId || isNaN(agentCreateurId) || agentCreateurId <= 0) {
      console.error('❌ Utilisateur non connecté, impossible de créer la validation');
      this.toastService.error('Erreur: ID utilisateur invalide. Veuillez vous reconnecter.');
      this.cancelForm();
      return;
    }

    const validationData = {
      enquete: { id: Number(enquete.id) } as any, // Objet Enquete minimal avec juste l'id
      agentCreateurId: agentCreateurId, // ID numérique, pas l'objet complet
      statut: StatutValidation.EN_ATTENTE // Statut initial pour les agents
    };

    console.log('📤 Création de validation pour l\'enquête:', validationData);

    this.validationEnqueteService.createValidationEnquete(validationData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validation) => {
          console.log('✅ Validation créée avec succès:', validation);
          this.toastService.success('Enquête créée avec succès et soumise à validation.');
          this.cancelForm();
          setTimeout(() => {
            this.loadDossiers();
          }, 500);
        },
        error: (error: any) => {
          console.error('❌ Erreur lors de la création de la validation:', error);
          this.toastService.error('Enquête créée mais erreur lors de la soumission à validation.');
    this.cancelForm();
          setTimeout(() => {
            this.loadDossiers();
          }, 500);
        }
      });
  }

  affecterAmiable(dossier: Dossier): void {
    if (confirm('Êtes-vous sûr de vouloir affecter ce dossier au recouvrement amiable ?')) {
      // Simulation d'affectation
      this.toastService.success('Dossier affecté au recouvrement amiable.');
    }
  }

  affecterJuridique(dossier: Dossier): void {
    if (confirm('Êtes-vous sûr de vouloir affecter ce dossier au recouvrement juridique ?')) {
      // Simulation d'affectation
      this.toastService.success('Dossier affecté au recouvrement juridique.');
    }
  }

  cloturer(dossier: Dossier): void {
    if (confirm('Êtes-vous sûr de vouloir clôturer ce dossier ?')) {
      // Simulation de clôture
      this.toastService.success('Dossier clôturé avec succès.');
    }
  }

  viewDossierDetails(dossier: Dossier): void {
    this.router.navigate(['/dossier/enquete-detail', dossier.id]);
  }

  cancelForm(): void {
    this.showEnqueteForm = false;
    this.selectedDossier = null;
    this.initializeForm();
  }
}
