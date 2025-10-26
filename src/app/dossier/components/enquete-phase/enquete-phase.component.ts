import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Dossier, Creancier, Debiteur } from '../../../shared/models';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';

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
  searchTerm: string = '';
  showEnqueteForm: boolean = false;
  enqueteForm!: FormGroup;
  selectedDossier: Dossier | null = null;
  currentUser: any = null;
  private destroy$ = new Subject<void>();

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

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private router: Router,
    private authService: AuthService,
    private dossierApiService: DossierApiService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDossiers();
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
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
    // Utilisation de l'API réelle pour récupérer les dossiers
    this.dossierApiService.getAllDossiers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Convertir les données de l'API en objets Dossier
          this.dossiers = response.content?.map((dossierApi: any) => {
            return new Dossier({
              id: dossierApi.id?.toString() || '',
              titre: dossierApi.titre || '',
              numeroDossier: dossierApi.numeroDossier || '',
              montantCreance: dossierApi.montantCreance || 0,
              dateCreation: dossierApi.dateCreation ? new Date(dossierApi.dateCreation) : new Date(),
              statut: dossierApi.statut || 'EN_ATTENTE_VALIDATION',
              urgence: dossierApi.urgence || 'FAIBLE',
              agentResponsable: dossierApi.agentResponsable || '',
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
        },
        error: (error) => {
          console.error('Erreur lors du chargement des dossiers:', error);
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
  }

  filterDossiers(): void {
    if (this.currentUser?.role === 'AGENT_DOSSIER') {
      // Pour les agents, ne montrer que les dossiers avec statut VALIDE qui leur sont assignés
      this.filteredDossiers = this.dossiers.filter(dossier => 
        dossier.statut === 'VALIDE' && dossier.agentResponsable === this.currentUser.getFullName()
      );
    } else {
      // Pour les chefs, montrer tous les dossiers avec statut VALIDE
      this.filteredDossiers = this.dossiers.filter(dossier => dossier.statut === 'VALIDE');
    }
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filterDossiers();
    } else {
      const baseDossiers = this.currentUser?.role === 'AGENT_DOSSIER' 
        ? this.dossiers.filter(dossier => dossier.statut === 'VALIDE' && dossier.agentResponsable === this.currentUser.getFullName())
        : this.dossiers.filter(dossier => dossier.statut === 'VALIDE');
        
      this.filteredDossiers = baseDossiers.filter(dossier =>
        dossier.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.numeroDossier.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
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

    const formValue = this.enqueteForm.value;
    
    if (this.currentUser?.role === 'AGENT_DOSSIER') {
      // Pour les agents, l'enquête est envoyée pour validation
      this.toastService.success('Enquête envoyée pour validation au chef de dossier.');
    } else {
      // Pour les chefs, l'enquête est validée directement
      this.toastService.success('Enquête validée avec succès.');
    }
    
    this.cancelForm();
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
