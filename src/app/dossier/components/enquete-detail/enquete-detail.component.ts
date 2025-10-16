import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Dossier, UrgenceDossier, TypeDocumentJustificatif, Creancier, Debiteur } from '../../../shared/models';
import { ValidationStatut } from '../../../shared/models/enums.model';
import { ToastService } from '../../../core/services/toast.service';

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
    private toastService: ToastService
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
    // Simulation de données - dans une vraie app, ceci viendrait d'une API
    const mockDossiers: Dossier[] = [
      new Dossier({
        id: '1',
        titre: 'Dossier Client ABC',
        description: 'Recouvrement facture impayée pour services de télécommunications',
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
        valide: true,
        dateValidation: new Date('2024-01-16'),
        creancier: new Creancier({
          id: 1,
          codeCreancier: 'CRE001',
          codeCreance: 'CREA001',
          nom: 'Entreprise Tunisie Telecom',
          prenom: '',
          adresse: 'Avenue Habib Bourguiba',
          ville: 'Tunis',
          codePostal: '1000',
          telephone: '71234567',
          fax: '71234568',
          email: 'contact@tunisietelecom.tn'
        }),
        debiteur: new Debiteur({
          id: 1,
          codeCreance: 'CREA001',
          nom: 'Ben Ammar',
          prenom: 'Ali',
          adresse: '123 Rue de la Paix',
          ville: 'Sfax',
          codePostal: '3000',
          telephone: '98111222',
          fax: '98111223',
          email: 'ali.benammar@email.com'
        })
      })
    ];

    this.dossier = mockDossiers.find(d => d.id === id) || null;
    
    if (!this.dossier) {
      this.toastService.error('Dossier non trouvé.');
      this.router.navigate(['/dossier/enquete']);
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
