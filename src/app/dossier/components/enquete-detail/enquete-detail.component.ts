import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Dossier, UrgenceDossier, TypeDocumentJustificatif, Creancier, Debiteur } from '../../../shared/models';
import { ValidationStatut } from '../../../shared/models/enums.model';
import { ToastService } from '../../../core/services/toast.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';

@Component({
  selector: 'app-enquete-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './enquete-detail.component.html',
  styleUrls: ['./enquete-detail.component.scss']
})
export class EnqueteDetailComponent implements OnInit, OnDestroy {
  dossier: Dossier | null = null;
  enqueteForm!: FormGroup;
  isLoading: boolean = false;
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
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private toastService: ToastService,
    private dossierApiService: DossierApiService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const dossierId = params['id'];
        if (dossierId) {
          this.loadDossier(dossierId);
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
      resultatNet: [0, [Validators.required, Validators.min(0)]],
      disponibiliteBilan: [false],
      appreciationBancaire: ['', Validators.required],
      paiementsCouverture: [0, [Validators.required, Validators.min(0)]],
      reputationCommerciale: ['', Validators.required],
      incidents: [''],
      bienImmobilier: [false],
      situationJuridiqueImmobilier: [''],
      bienMobilier: [false],
      situationJuridiqueMobilier: [''],
      autresAffaires: [''],
      observations: ['', Validators.required],
      decisionComite: ['', Validators.required],
      visaDirecteurJuridique: [false],
      visaEnqueteur: [false],
      visaDirecteurCommercial: [false],
      registreCommerce: ['', Validators.required],
      codeDouane: ['', Validators.required],
      matriculeFiscale: ['', Validators.required],
      formeJuridique: ['', Validators.required],
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

  loadDossier(id: string): void {
    this.isLoading = true;
    // Utilisation de l'API réelle pour récupérer le dossier
    this.dossierApiService.getDossierById(parseInt(id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossierApi: any) => {
          this.isLoading = false;
          // Convertir les données de l'API en objet Dossier
          this.dossier = new Dossier({
            id: dossierApi.id?.toString() || '',
            titre: dossierApi.titre || '',
            description: dossierApi.description || '',
            numeroDossier: dossierApi.numeroDossier || '',
            montantCreance: dossierApi.montantCreance || 0,
            dateCreation: dossierApi.dateCreation ? new Date(dossierApi.dateCreation) : new Date(),
            statut: dossierApi.statut || ValidationStatut.EN_ATTENTE_VALIDATION,
            urgence: dossierApi.urgence || UrgenceDossier.FAIBLE,
            agentResponsable: dossierApi.agentResponsable || '',
            agentCreateur: dossierApi.agentCreateur || '',
            typeDocumentJustificatif: dossierApi.typeDocumentJustificatif || TypeDocumentJustificatif.FACTURE,
            pouvoir: dossierApi.pouvoir || false,
            contratSigne: dossierApi.contratSigne || false,
            valide: dossierApi.valide || false,
            dateValidation: dossierApi.dateValidation ? new Date(dossierApi.dateValidation) : undefined,
            creancier: new Creancier({
              id: dossierApi.creancier?.id || 0,
              codeCreancier: dossierApi.creancier?.codeCreancier || '',
              codeCreance: dossierApi.creancier?.codeCreance || '',
              nom: dossierApi.creancier?.nom || dossierApi.nomCreancier || '',
              prenom: dossierApi.creancier?.prenom || '',
              adresse: dossierApi.creancier?.adresse || '',
              ville: dossierApi.creancier?.ville || '',
              codePostal: dossierApi.creancier?.codePostal || '',
              telephone: dossierApi.creancier?.telephone || '',
              fax: dossierApi.creancier?.fax || '',
              email: dossierApi.creancier?.email || '',
              type: dossierApi.creancier?.type || 'PARTICULIER'
            }),
            debiteur: new Debiteur({
              id: dossierApi.debiteur?.id || 0,
              codeCreance: dossierApi.debiteur?.codeCreance || '',
              nom: dossierApi.debiteur?.nom || dossierApi.nomDebiteur || '',
              prenom: dossierApi.debiteur?.prenom || '',
              adresse: dossierApi.debiteur?.adresse || '',
              ville: dossierApi.debiteur?.ville || '',
              codePostal: dossierApi.debiteur?.codePostal || '',
              telephone: dossierApi.debiteur?.telephone || '',
              fax: dossierApi.debiteur?.fax || '',
              email: dossierApi.debiteur?.email || '',
              type: dossierApi.debiteur?.type || 'PARTICULIER'
            })
          });
          
          // Pré-remplir le formulaire avec les données du dossier
          this.populateForm();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erreur lors du chargement du dossier:', error);
          this.toastService.error('Dossier non trouvé.');
          this.router.navigate(['/dossier/enquete']);
        }
      });
  }

  private populateForm(): void {
    if (this.dossier) {
      this.enqueteForm.patchValue({
        rapportCode: this.dossier.creancier?.codeCreancier || '',
        nomElementFinancier: this.dossier.creancier?.nom || '',
        pourcentage: 0,
        banqueAgence: '',
        banques: '',
        exercices: '',
        chiffreAffaire: 0,
        resultatNet: 0,
        disponibiliteBilan: false,
        appreciationBancaire: '',
        paiementsCouverture: 0,
        reputationCommerciale: '',
        incidents: '',
        bienImmobilier: false,
        situationJuridiqueImmobilier: '',
        bienMobilier: false,
        situationJuridiqueMobilier: '',
        autresAffaires: '',
        observations: '',
        decisionComite: '',
        visaDirecteurJuridique: false,
        visaEnqueteur: false,
        visaDirecteurCommercial: false,
        registreCommerce: '',
        codeDouane: '',
        matriculeFiscale: '',
        formeJuridique: '',
        dateCreation: this.dossier.dateCreation,
        capital: 0,
        pdg: '',
        directeurAdjoint: '',
        directeurFinancier: '',
        directeurCommercial: '',
        descriptionActivite: '',
        secteurActivite: '',
        effectif: 0,
        email: this.dossier.debiteur?.email || '',
        marques: '',
        groupe: ''
      });
    }
  }

  onSubmit(): void {
    if (this.enqueteForm.invalid) {
      this.enqueteForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }

    // Simulation de sauvegarde
    this.toastService.success('Rapport d\'enquête sauvegardé avec succès.');
    console.log('Données d\'enquête:', this.enqueteForm.value);
  }

  goBack(): void {
    this.router.navigate(['/dossier/enquete']);
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
}
