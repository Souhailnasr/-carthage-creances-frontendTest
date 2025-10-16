import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { DossierService } from '../../../core/services/dossier.service';
import { AvocatService } from '../../services/avocat.service';
import { HuissierService } from '../../services/huissier.service';
import { AudienceService } from '../../services/audience.service';
import { Avocat } from '../../models/avocat.model';
import { Huissier } from '../../models/huissier.model';
import { Audience, TribunalType, DecisionResult } from '../../models/audience.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-gestion-audiences',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './gestion-audiences.component.html',
  styleUrls: ['./gestion-audiences.component.scss']
})
export class GestionAudiencesComponent implements OnInit, OnDestroy {
  dossiers: DossierApi[] = [];
  avocats: Avocat[] = [];
  huissiers: Huissier[] = [];
  audiences: Audience[] = [];
  filteredDossiers: DossierApi[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  showAudienceForm: boolean = false;
  selectedDossier: DossierApi | null = null;
  audienceForm!: FormGroup;
  tribunalTypes = TribunalType;
  decisionResults = DecisionResult;
  private destroy$ = new Subject<void>();

  constructor(
    private dossierService: DossierService,
    private avocatService: AvocatService,
    private huissierService: HuissierService,
    private audienceService: AudienceService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm(): void {
    this.audienceForm = this.fb.group({
      dateAudience: ['', Validators.required],
      dateProchaine: [''],
      tribunalType: ['', Validators.required],
      lieuTribunal: ['', Validators.required],
      commentaireDecision: [''],
      decisionResult: [''],
      avocatId: [''],
      huissierId: ['']
    });
  }

  loadData(): void {
    this.isLoading = true;
    
    // Load dossiers
    this.dossierService.loadAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossiers: any[]) => {
          this.dossiers = dossiers;
          this.filteredDossiers = [...dossiers];
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du chargement des dossiers:', error);
          this.toastService.error('Erreur lors du chargement des dossiers');
          this.isLoading = false;
        }
      });

    // Load avocats
    this.avocatService.getAllAvocats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avocats) => {
          this.avocats = avocats;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des avocats:', error);
        }
      });

    // Load huissiers
    this.huissierService.getAllHuissiers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (huissiers) => {
          this.huissiers = huissiers;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des huissiers:', error);
        }
      });

    // Load audiences
    this.audienceService.getAllAudiences()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (audiences) => {
          this.audiences = audiences;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des audiences:', error);
        }
      });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredDossiers = [...this.dossiers];
    } else {
      this.filteredDossiers = this.dossiers.filter(dossier =>
        dossier.numeroDossier?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.creancier.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.debiteur.nom?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  showAudienceModal(dossier: DossierApi): void {
    this.selectedDossier = dossier;
    this.showAudienceForm = true;
    this.audienceForm.reset();
    this.audienceForm.patchValue({
      dateAudience: new Date().toISOString().split('T')[0]
    });
  }

  onSubmitAudience(): void {
    if (this.audienceForm.invalid || !this.selectedDossier) {
      this.audienceForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }

    const formValue = this.audienceForm.value;
    const audience: Audience = {
      dossierId: +this.selectedDossier.id!,
      dateAudience: formValue.dateAudience,
      dateProchaine: formValue.dateProchaine || undefined,
      tribunalType: formValue.tribunalType,
      lieuTribunal: formValue.lieuTribunal,
      commentaireDecision: formValue.commentaireDecision || undefined,
      decisionResult: formValue.decisionResult || undefined,
      avocatId: formValue.avocatId || undefined,
      huissierId: formValue.huissierId || undefined,
      actif: true
    };

    this.audienceService.createAudience(audience)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Audience ajoutée avec succès.');
          this.cancelAudienceForm();
          this.loadData(); // Reload to get updated data
        },
        error: (error) => {
          console.error('❌ Erreur lors de la création de l\'audience:', error);
          this.toastService.error('Erreur lors de la création de l\'audience');
        }
      });
  }

  cancelAudienceForm(): void {
    this.showAudienceForm = false;
    this.selectedDossier = null;
    this.audienceForm.reset();
  }

  getAudiencesForDossier(dossierId: number): Audience[] {
    return this.audiences.filter(audience => audience.dossierId === dossierId);
  }

  getAssigneeName(audience: Audience): string {
    if (audience.avocatId) {
      const avocat = this.avocats.find(a => a.id === audience.avocatId);
      return avocat ? `${avocat.prenom} ${avocat.nom}` : 'Avocat non trouvé';
    } else if (audience.huissierId) {
      const huissier = this.huissiers.find(h => h.id === audience.huissierId);
      return huissier ? `${huissier.prenom} ${huissier.nom}` : 'Huissier non trouvé';
    }
    return 'Non assigné';
  }

  getAssigneeType(audience: Audience): string {
    if (audience.avocatId) return 'Avocat';
    if (audience.huissierId) return 'Huissier';
    return 'Non assigné';
  }

  getTribunalTypeDisplay(type: string): string {
    const types: { [key: string]: string } = {
      [TribunalType.TRIBUNAL_PREMIERE_INSTANCE]: 'Tribunal de Première Instance',
      [TribunalType.TRIBUNAL_APPEL]: 'Tribunal d\'Appel',
      [TribunalType.TRIBUNAL_CASSATION]: 'Tribunal de Cassation'
    };
    return types[type] || type;
  }

  getDecisionResultDisplay(result: string): string {
    const results: { [key: string]: string } = {
      [DecisionResult.POSITIVE]: 'Positive',
      [DecisionResult.NEGATIVE]: 'Négative',
      [DecisionResult.RAPPORTER]: 'Rapporter'
    };
    return results[result] || result;
  }

  getTribunalTypes(): string[] {
    return Object.values(TribunalType);
  }

  getDecisionResults(): string[] {
    return Object.values(DecisionResult);
  }
}