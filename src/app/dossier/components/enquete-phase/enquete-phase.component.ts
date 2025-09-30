import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Dossier } from '../../../shared/models';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

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
    private authService: AuthService
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
    // Simulation de données - dans une vraie app, ceci viendrait d'une API
    this.dossiers = [
      new Dossier({
        id: '1',
        titre: 'Dossier Client ABC',
        numeroDossier: 'DOS-2024-001',
        montantCreance: 15000,
        dateCreation: new Date('2024-01-15'),
        statut: 'EN_PHASE_ENQUETE' as any,
        urgence: 'MOYENNE' as any,
        agentResponsable: 'John Doe',
        valide: true,
        dateValidation: new Date('2024-01-16')
      }),
      new Dossier({
        id: '2',
        titre: 'Dossier Client XYZ',
        numeroDossier: 'DOS-2024-002',
        montantCreance: 25000,
        dateCreation: new Date('2024-01-20'),
        statut: 'EN_PHASE_ENQUETE' as any,
        urgence: 'TRES_URGENT' as any,
        agentResponsable: 'Jane Smith',
        valide: true,
        dateValidation: new Date('2024-01-21')
      }),
      new Dossier({
        id: '3',
        titre: 'Dossier Client DEF',
        numeroDossier: 'DOS-2024-003',
        montantCreance: 18000,
        dateCreation: new Date('2024-01-22'),
        statut: 'EN_PHASE_ENQUETE' as any,
        urgence: 'FAIBLE' as any,
        agentResponsable: 'Current User',
        valide: true,
        dateValidation: new Date('2024-01-23')
      })
    ];
    this.filterDossiers();
  }

  filterDossiers(): void {
    if (this.currentUser?.role === 'AGENT_DOSSIER') {
      // Pour les agents, ne montrer que les dossiers validés qui leur sont assignés
      this.filteredDossiers = this.dossiers.filter(dossier => 
        dossier.valide && dossier.agentResponsable === this.currentUser.getFullName()
      );
    } else {
      // Pour les chefs, montrer tous les dossiers validés
      this.filteredDossiers = this.dossiers.filter(dossier => dossier.valide);
    }
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filterDossiers();
    } else {
      const baseDossiers = this.currentUser?.role === 'AGENT_DOSSIER' 
        ? this.dossiers.filter(dossier => dossier.valide && dossier.agentResponsable === this.currentUser.getFullName())
        : this.dossiers.filter(dossier => dossier.valide);
        
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
