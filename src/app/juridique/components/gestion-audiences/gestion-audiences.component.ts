import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { AvocatService } from '../../services/avocat.service';
import { HuissierService } from '../../services/huissier.service';
import { AudienceService } from '../../services/audience.service';
import { Avocat } from '../../models/avocat.model';
import { Huissier } from '../../models/huissier.model';
import { Audience, TribunalType, DecisionResult } from '../../models/audience.model';
import { ToastService } from '../../../core/services/toast.service';
import { HuissierDocumentService } from '../../services/huissier-document.service';
import { HuissierActionService } from '../../services/huissier-action.service';
import { DocumentHuissier } from '../../models/huissier-document.model';
import { ActionHuissier } from '../../models/huissier-action.model';
import { IaPredictionService } from '../../../core/services/ia-prediction.service';
import { IaPredictionResult } from '../../../shared/models/ia-prediction-result.model';
import { IaPredictionBadgeComponent } from '../../../shared/components/ia-prediction-badge/ia-prediction-badge.component';
import { Dossier } from '../../../shared/models/dossier.model';

export enum EtatFinalDossierJuridique {
  RECOUVREMENT_TOTAL = 'RECOUVREMENT_TOTAL',
  RECOUVREMENT_PARTIEL = 'RECOUVREMENT_PARTIEL',
  NON_RECOUVRE = 'NON_RECOUVRE'
}

@Component({
  selector: 'app-gestion-audiences',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, IaPredictionBadgeComponent],
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
  selectedAudience: Audience | null = null;
  isEditMode: boolean = false;
  isViewMode: boolean = false;
  audienceForm!: FormGroup;
  
  // Documents et actions du dossier sélectionné
  dossierDocuments: DocumentHuissier[] = [];
  dossierActions: ActionHuissier[] = [];
  isLoadingDocuments: boolean = false;
  isLoadingActions: boolean = false;
  isLoadingAffectationFinance: boolean = false;
  isLoadingFinalisation: boolean = false;
  tribunalTypes = TribunalType;
  decisionResults = DecisionResult;
  etatFinalDossier = EtatFinalDossierJuridique;
  
  // Formulaire de finalisation
  showFinalisationForm: boolean = false;
  finalisationForm!: FormGroup;
  selectedDossierForFinalisation: DossierApi | null = null;
  
  // Filtres
  filterType: 'all' | 'upcoming' | 'past' | 'reported' = 'all';
  filterTribunal: string = '';
  filterResult: string = '';
  
  // Statistiques
  stats = {
    totalDossiers: 0,
    totalAudiences: 0,
    upcomingAudiences: 0,
    pastAudiences: 0,
    reportedAudiences: 0
  };
  
  // Prédiction IA
  predictions: { [dossierId: number]: IaPredictionResult } = {};
  loadingPredictions: { [dossierId: number]: boolean } = {};
  
  // Indicateur de recalcul du score IA
  recalculatingScore: { [dossierId: number]: boolean } = {};
  scoreUpdated: { [dossierId: number]: boolean } = {};
  
  private destroy$ = new Subject<void>();

  constructor(
    private dossierApiService: DossierApiService,
    private avocatService: AvocatService,
    private huissierService: HuissierService,
    private audienceService: AudienceService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private documentService: HuissierDocumentService,
    private actionService: HuissierActionService,
    private iaPredictionService: IaPredictionService
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
    
    this.finalisationForm = this.fb.group({
      etatFinal: ['', Validators.required],
      montantRecouvre: [0, [Validators.min(0)]]
    });
    
    // Mettre à jour les validators dynamiquement selon l'état final
    this.finalisationForm.get('etatFinal')?.valueChanges.subscribe(etat => {
      const montantControl = this.finalisationForm.get('montantRecouvre');
      if (etat === EtatFinalDossierJuridique.NON_RECOUVRE) {
        montantControl?.clearValidators();
        montantControl?.setValue(0);
      } else {
        montantControl?.setValidators([Validators.required, Validators.min(0)]);
      }
      montantControl?.updateValueAndValidity();
    });
  }

  loadData(): void {
    this.isLoading = true;
    
    // IMPORTANT: Charger les dossiers EN PREMIER pour pouvoir les utiliser lors de la normalisation des audiences
    // Note: Backend limite la taille de page à 100 max
    this.dossierApiService.getDossiersRecouvrementJuridique(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          if (page && Array.isArray(page.content)) {
            this.dossiers = page.content;
            this.filteredDossiers = [...this.dossiers];
            console.log('✅ Dossiers de recouvrement juridique chargés:', this.dossiers.length);
            
            // Une fois les dossiers chargés, charger les audiences
            this.loadAudiences();
          } else {
            console.warn('⚠️ Format de réponse inattendu:', page);
            this.dossiers = [];
            this.filteredDossiers = [];
            this.isLoading = false;
          }
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du chargement des dossiers:', error);
          this.dossiers = [];
          this.filteredDossiers = [];
          const errorMsg = error.error?.message || error.message || 'Erreur lors du chargement des dossiers';
          this.toastService.error(errorMsg);
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
  }

  /**
   * Normalise les audiences pour avoir dossierId
   * Extrait la logique de normalisation pour la réutiliser
   */
  private normalizeAudiences(audiences: any[]): Audience[] {
    if (!audiences || audiences.length === 0) {
      console.warn('⚠️ normalizeAudiences() - Tableau d\'audiences vide ou null');
      return [];
    }
    
    return audiences.map(a => {
            const audience: any = { ...a };
            
            // Log de l'audience brute AVANT normalisation (seulement pour les 3 premières pour éviter le spam)
            if (audiences.indexOf(a) < 3) {
              console.log(`🔍 normalizeAudiences() - Audience brute ${audience.id}:`, {
                id: audience.id,
                dossierId: audience.dossierId,
                dossier_id: audience.dossier_id,
                dossierIdType: typeof audience.dossierId,
                dossierIdValue: audience.dossierId,
                hasDossier: !!audience.dossier,
                dossier: audience.dossier,
                dossierIdFromDossier: audience.dossier?.id,
                avocatId: audience.avocat?.id,
                huissierId: audience.huissier?.id,
                allKeys: Object.keys(audience)
              });
            }
            
            // PRIORITÉ 1: Vérifier dossier_id (snake_case) - format base de données (LE PLUS IMPORTANT)
            // Même si le service a déjà normalisé, on vérifie à nouveau car le backend peut retourner dossier_id
            if (audience.dossier_id !== null && audience.dossier_id !== undefined && audience.dossier_id !== '') {
              const dossierIdFromSnake = typeof audience.dossier_id === 'string' 
                ? parseInt(audience.dossier_id, 10) 
                : audience.dossier_id;
              if (!isNaN(dossierIdFromSnake) && dossierIdFromSnake > 0) {
                audience.dossierId = dossierIdFromSnake;
                if (audiences.indexOf(a) < 3) {
                  console.log(`🔧 normalizeAudiences() - Audience ${audience.id}: dossierId extrait de dossier_id = ${audience.dossierId}`);
                }
              } else {
                if (audiences.indexOf(a) < 3) {
                  console.warn(`⚠️ normalizeAudiences() - Audience ${audience.id}: dossier_id invalide: ${audience.dossier_id}`);
                }
              }
            }
            // PRIORITÉ 2: Si l'audience a déjà dossierId, l'utiliser
            else if (audience.dossierId !== null && audience.dossierId !== undefined) {
              // Normaliser dossierId en number si c'est une string
              if (typeof audience.dossierId === 'string') {
                audience.dossierId = parseInt(audience.dossierId, 10);
                if (!isNaN(audience.dossierId)) {
                  console.log(`🔧 Audience ${audience.id}: dossierId converti de string "${a.dossierId}" en number ${audience.dossierId}`);
                }
              }
            }
            // PRIORITÉ 3: Si l'audience a un objet dossier mais pas dossierId, extraire l'ID
            else if (audience.dossier && audience.dossier.id !== null && audience.dossier.id !== undefined) {
              audience.dossierId = typeof audience.dossier.id === 'string' 
                ? parseInt(audience.dossier.id, 10) 
                : audience.dossier.id;
              console.log(`🔧 Audience ${audience.id}: dossierId extrait de dossier.id = ${audience.dossierId}`);
            }
            // PRIORITÉ 4: SOLUTION DE CONTOURNEMENT - Trouver le dossier via l'avocat ou l'huissier
            // Cette solution fonctionne car chaque audience est associée à un dossier via son avocat/huissier
            else {
              console.warn(`⚠️ Audience ${audience.id} n'a pas de dossierId! Tentative de trouver via avocat/huissier...`);
              
              let dossierTrouve: DossierApi | null = null;
              
              // Essayer de trouver le dossier via l'avocat
              const avocatId = audience.avocat?.id || audience.avocatId;
              if (avocatId) {
                // Chercher tous les dossiers avec cet avocat
                const dossiersAvecAvocat = this.dossiers.filter(d => {
                  const dossierAvocatId = d.avocat?.id || d.avocatId;
                  return dossierAvocatId === avocatId;
                });
                
                if (dossiersAvecAvocat.length === 1) {
                  // Si un seul dossier a cet avocat, c'est celui-ci
                  dossierTrouve = dossiersAvecAvocat[0];
                  console.log(`✅ Audience ${audience.id}: dossierId trouvé via avocat ${avocatId} -> dossier unique ${dossierTrouve.id}`);
                } else if (dossiersAvecAvocat.length > 1) {
                  // Si plusieurs dossiers ont le même avocat, prendre le premier
                  // Note: Dans un cas réel, on pourrait utiliser d'autres critères (date de création, etc.)
                  dossierTrouve = dossiersAvecAvocat[0];
                  console.warn(`⚠️ Audience ${audience.id}: Plusieurs dossiers ont l'avocat ${avocatId}, utilisation du premier: ${dossierTrouve.id}`);
                }
              }
              
              // Si pas trouvé via avocat, essayer via huissier
              if (!dossierTrouve) {
                const huissierId = audience.huissier?.id || audience.huissierId;
                if (huissierId) {
                  // Chercher tous les dossiers avec cet huissier
                  const dossiersAvecHuissier = this.dossiers.filter(d => {
                    const dossierHuissierId = d.huissier?.id || d.huissierId;
                    return dossierHuissierId === huissierId;
                  });
                  
                  if (dossiersAvecHuissier.length === 1) {
                    // Si un seul dossier a cet huissier, c'est celui-ci
                    dossierTrouve = dossiersAvecHuissier[0];
                    console.log(`✅ Audience ${audience.id}: dossierId trouvé via huissier ${huissierId} -> dossier unique ${dossierTrouve.id}`);
                  } else if (dossiersAvecHuissier.length > 1) {
                    // Si plusieurs dossiers ont le même huissier, prendre le premier
                    dossierTrouve = dossiersAvecHuissier[0];
                    console.warn(`⚠️ Audience ${audience.id}: Plusieurs dossiers ont l'huissier ${huissierId}, utilisation du premier: ${dossierTrouve.id}`);
                  }
                }
              }
              
              // Si trouvé, assigner le dossierId
              if (dossierTrouve) {
                audience.dossierId = dossierTrouve.id;
                console.log(`✅ Audience ${audience.id} associée au dossier ${dossierTrouve.id} (${dossierTrouve.numeroDossier})`);
              } else {
                console.error(`❌ Audience ${audience.id} n'a toujours pas de dossierId après recherche via avocat/huissier!`, {
                  avocatId: audience.avocat?.id || audience.avocatId,
                  huissierId: audience.huissier?.id || audience.huissierId,
                  dossiersDisponibles: this.dossiers.map(d => ({ 
                    id: d.id, 
                    numeroDossier: d.numeroDossier,
                    avocatId: d.avocat?.id || d.avocatId, 
                    huissierId: d.huissier?.id || d.huissierId 
                  }))
                });
              }
            }
            
            // Si l'audience a resultat mais pas decisionResult, mapper
            if (!audience.decisionResult && audience.resultat) {
              audience.decisionResult = audience.resultat;
            }
            
            // Extraire avocatId et huissierId depuis les objets si nécessaire
            if (!audience.avocatId && audience.avocat?.id) {
              audience.avocatId = audience.avocat.id;
            }
            if (!audience.huissierId && audience.huissier?.id) {
              audience.huissierId = audience.huissier.id;
            }
            
            // Log de l'audience APRÈS normalisation
            console.log(`✅ Audience normalisée ${audience.id}:`, {
              id: audience.id,
              dossierId: audience.dossierId,
              dossierIdType: typeof audience.dossierId,
              avocatId: audience.avocatId,
              huissierId: audience.huissierId
            });
            
            return audience as Audience;
          });
  }

  loadAudiences(): void {
    // Load audiences APRÈS les dossiers pour pouvoir les utiliser dans la normalisation
    console.log('🔄 loadAudiences() - Début du chargement');
    console.log('🔄 loadAudiences() - Nombre de dossiers disponibles:', this.dossiers.length);
    
    // Récupérer les audiences brutes directement depuis l'API pour avoir accès à dossier_id
    this.audienceService.getAllAudiencesRaw()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rawAudiences) => {
          console.log('📥 loadAudiences() - Audiences brutes reçues:', rawAudiences?.length || 0);
          
          if (!rawAudiences || rawAudiences.length === 0) {
            console.warn('⚠️ loadAudiences() - Aucune audience brute reçue');
            this.audiences = [];
            this.calculateStats();
            this.isLoading = false;
            return;
          }
          
          // Log des premières audiences brutes pour debug
          if (rawAudiences.length > 0) {
            console.log('📥 loadAudiences() - PREMIÈRE AUDIENCE BRUTE:', {
              id: rawAudiences[0].id,
              dossierId: rawAudiences[0].dossierId,
              dossier_id: rawAudiences[0].dossier_id,
              dossier: rawAudiences[0].dossier,
              allKeys: Object.keys(rawAudiences[0])
            });
          }
          
          // Normaliser les audiences brutes pour extraire dossier_id
          this.audiences = this.normalizeAudiences(rawAudiences);
          
          console.log('✅ loadAudiences() - Audiences normalisées:', this.audiences.length);
          
          // Vérifier que les audiences ont bien un dossierId
          const audiencesAvecDossierId = this.audiences.filter(a => a.dossierId !== null && a.dossierId !== undefined && a.dossierId > 0);
          console.log('✅ loadAudiences() - Audiences avec dossierId valide:', audiencesAvecDossierId.length);
          
          if (audiencesAvecDossierId.length < this.audiences.length) {
            console.warn(`⚠️ loadAudiences() - ${this.audiences.length - audiencesAvecDossierId.length} audience(s) sans dossierId valide`);
          }
          
          // Log détaillé des audiences normalisées (premières 5)
          this.audiences.slice(0, 5).forEach((a, index) => {
            console.log(`📋 Audience normalisée ${index + 1}:`, {
              id: a.id,
              dossierId: a.dossierId,
              dossierIdType: typeof a.dossierId,
              dateAudience: a.dateAudience
            });
          });
          
          // Log détaillé de chaque audience normalisée
          this.audiences.forEach((a, index) => {
            console.log(`📋 Audience normalisée ${index + 1}:`, {
              id: a.id,
              dossierId: a.dossierId,
              dossierIdType: typeof a.dossierId,
              dossierIdValue: a.dossierId,
              dossier: (a as any).dossier ? { 
                id: (a as any).dossier.id, 
                idType: typeof (a as any).dossier.id,
                idValue: (a as any).dossier.id
              } : null,
              dateAudience: a.dateAudience,
              avocatId: a.avocatId,
              huissierId: a.huissierId,
              rawAudience: a
            });
          });
          
          // Log des dossiers pour vérifier les IDs
          if (this.dossiers && this.dossiers.length > 0) {
            console.log('📁 Dossiers disponibles:', this.dossiers.map(d => ({ 
              id: d.id, 
              idType: typeof d.id,
              numeroDossier: d.numeroDossier,
              avocatId: d.avocat?.id,
              huissierId: d.huissier?.id
            })));
          }
          
          this.calculateStats();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des audiences:', error);
          this.audiences = [];
          this.isLoading = false;
        }
      });
  }

  calculateStats(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.stats.totalDossiers = this.dossiers.length;
    this.stats.totalAudiences = this.audiences.length;
    this.stats.upcomingAudiences = this.audiences.filter(a => {
      const date = new Date(a.dateAudience);
      date.setHours(0, 0, 0, 0);
      return date >= today && !a.decisionResult;
    }).length;
    this.stats.pastAudiences = this.audiences.filter(a => {
      const date = new Date(a.dateAudience);
      date.setHours(0, 0, 0, 0);
      return date < today;
    }).length;
    this.stats.reportedAudiences = this.audiences.filter(a => !!a.dateProchaine).length;
  }

  onSearch(): void {
    this.applyFilters();
  }

  showAudienceModal(dossier: DossierApi, audience?: Audience, viewOnly: boolean = false): void {
    this.selectedDossier = dossier;
    this.selectedAudience = audience || null;
    this.isEditMode = !!audience && !viewOnly;
    this.isViewMode = viewOnly;
    this.showAudienceForm = true;
    this.audienceForm.reset();
    
    // Charger les documents et actions du dossier
    if (dossier.id) {
      this.loadDossierDocuments(dossier.id);
      this.loadDossierActions(dossier.id);
    }
    
    // Pré-remplir avec l'avocat/huissier du dossier si disponible
    const avocatId = dossier.avocat?.id ? dossier.avocat.id : null;
    const huissierId = dossier.huissier?.id ? dossier.huissier.id : null;
    
    if (audience) {
      // Mode édition ou visualisation
      this.audienceForm.patchValue({
        dateAudience: audience.dateAudience,
        dateProchaine: audience.dateProchaine || '',
        tribunalType: audience.tribunalType,
        lieuTribunal: audience.lieuTribunal,
        commentaireDecision: audience.commentaireDecision || '',
        decisionResult: audience.decisionResult || '',
        avocatId: audience.avocatId || avocatId || '',
        huissierId: audience.huissierId || huissierId || ''
      });
      
      // Désactiver le formulaire en mode visualisation
      if (viewOnly) {
        this.audienceForm.disable();
      }
    } else {
      // Mode création
      this.audienceForm.patchValue({
        dateAudience: new Date().toISOString().split('T')[0],
        avocatId: avocatId || '',
        huissierId: huissierId || ''
      });
    }
  }

  onSubmitAudience(): void {
    if (this.audienceForm.invalid || !this.selectedDossier) {
      this.audienceForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }

    const formValue = this.audienceForm.value;
    
    // Valider que le dossier a un ID valide
    if (!this.selectedDossier?.id) {
      this.toastService.error('Erreur: Aucun dossier valide sélectionné.');
      return;
    }
    
    // Construire le payload - le service va convertir en format backend
    const audienceData: any = {
      dateAudience: formValue.dateAudience,
      dateProchaine: formValue.dateProchaine || null,
      tribunalType: formValue.tribunalType,
      lieuTribunal: formValue.lieuTribunal,
      commentaireDecision: formValue.commentaireDecision || null,
      decisionResult: formValue.decisionResult || null, // Le service va convertir en "resultat"
      dossierId: this.selectedDossier?.id ? +this.selectedDossier.id : 0, // Le service va convertir en dossier: { id: ... }
      avocatId: formValue.avocatId ? +formValue.avocatId : null, // Le service va convertir en avocat: { id: ... }
      huissierId: formValue.huissierId ? +formValue.huissierId : null // Le service va convertir en huissier: { id: ... }
    };
    
    // Nettoyer les valeurs undefined
    Object.keys(audienceData).forEach(key => {
      if (audienceData[key] === undefined) {
        delete audienceData[key];
      }
    });
    
    console.log('📋 Données du formulaire avant envoi:', audienceData);


    const dossierId = this.selectedDossier?.id;
    
    // Afficher un message indiquant que le recalcul est en cours
    if (dossierId) {
      this.recalculatingScore[dossierId] = true;
      this.toastService.info(
        this.isEditMode 
          ? 'Audience modifiée. Recalcul du score IA en cours...' 
          : 'Audience créée. Recalcul du score IA en cours...',
        3000
      );
    }

    const request = this.isEditMode && this.selectedAudience?.id
      ? this.audienceService.updateAudienceWithDossier(this.selectedAudience.id, audienceData)
      : this.audienceService.createAudienceWithDossier(audienceData);

    request
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const { audience: createdAudience, dossier } = response;
          console.log('✅ Audience créée/modifiée reçue du backend:', createdAudience);
          console.log('✅ Dossier mis à jour reçu:', dossier);
          
          this.toastService.success(
            this.isEditMode ? 'Audience modifiée avec succès.' : 'Audience ajoutée avec succès.'
          );
          this.cancelAudienceForm();
          
          // Si le dossier mis à jour est retourné, mettre à jour le score IA
          if (dossier && dossierId) {
            // Mettre à jour le dossier dans la liste
            const index = this.dossiers.findIndex(d => d.id === dossier.id);
            if (index !== -1) {
              this.dossiers[index] = dossier;
              this.filteredDossiers = [...this.dossiers];
              if (this.selectedDossier?.id === dossier.id) {
                this.selectedDossier = dossier;
              }
            }
            
            // Afficher un indicateur de mise à jour du score
            this.scoreUpdated[dossierId] = true;
            this.recalculatingScore[dossierId] = false;
            
            // Masquer l'indicateur après 5 secondes
            setTimeout(() => {
              this.scoreUpdated[dossierId] = false;
            }, 5000);
            
            // Afficher un message de succès avec le nouveau score
            const riskScore = dossier.riskScore || dossier.scorePrediction;
            const riskLevel = dossier.riskLevel || dossier.niveauRisque;
            if (riskScore !== undefined && riskScore !== null) {
              this.toastService.success(
                `Score IA mis à jour : ${riskScore.toFixed(1)}% (${riskLevel || 'N/A'})`,
                5000
              );
            }
          } else if (dossierId) {
            // Si le dossier n'est pas retourné, recharger manuellement
            this.recalculatingScore[dossierId] = false;
          }
          
          // Recharger les audiences avec la même logique de normalisation
          if (dossierId) {
            // Recharger les audiences
            this.audienceService.getAllAudiences()
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (audiences) => {
                  console.log('📥 Audiences rechargées après création:', audiences.length);
                  
                  // Normaliser les audiences (même logique que loadAudiences)
                  this.audiences = this.normalizeAudiences(audiences);
                  
                  console.log('✅ Audiences normalisées après création:', this.audiences.length);
                  console.log('✅ Audiences pour le dossier', dossierId, ':', 
                    this.getAudiencesForDossier(dossierId).length);
                  
                  // Recalculer les stats
                  this.calculateStats();
                  
                  // Si le dossier n'a pas été retourné, le recharger
                  if (!dossier) {
                    this.dossierApiService.getDossierById(dossierId)
                      .pipe(takeUntil(this.destroy$))
                      .subscribe({
                        next: (dossierUpdated) => {
                          const index = this.dossiers.findIndex(d => d.id === dossierUpdated.id);
                          if (index !== -1) {
                            this.dossiers[index] = dossierUpdated;
                            this.filteredDossiers = [...this.dossiers];
                            if (this.selectedDossier?.id === dossierUpdated.id) {
                              this.selectedDossier = dossierUpdated;
                            }
                          }
                        },
                        error: (err) => console.error('Erreur lors du rechargement du dossier:', err)
                      });
                  }
                },
                error: (error) => {
                  console.error('❌ Erreur lors du rechargement des audiences:', error);
                }
              });
          } else {
            // Si pas de dossier sélectionné, juste recharger les audiences
            this.loadAudiences();
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors de la sauvegarde de l\'audience:', error);
          const errorMsg = error.error?.message || error.message || 'Erreur lors de la sauvegarde';
          this.toastService.error(errorMsg);
        }
      });
  }

  cancelAudienceForm(): void {
    this.showAudienceForm = false;
    this.selectedDossier = null;
    this.selectedAudience = null;
    this.isEditMode = false;
    this.isViewMode = false;
    this.audienceForm.reset();
    this.audienceForm.enable(); // Réactiver le formulaire
    this.dossierDocuments = [];
    this.dossierActions = [];
  }

  deleteAudience(audience: Audience): void {
    if (!audience.id) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'audience du ${new Date(audience.dateAudience).toLocaleDateString('fr-FR')} ?`)) {
      this.audienceService.deleteAudience(audience.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
        next: () => {
          this.toastService.success('Audience supprimée avec succès.');
          // Recharger les audiences avec la même logique de normalisation
          this.loadAudiences();
          
          // Recalculer la prédiction IA après suppression d'audience
          if (audience.dossierId) {
            this.recalculatePredictionAfterAudience(audience.dossierId);
          }
        },
          error: (error) => {
            console.error('❌ Erreur lors de la suppression:', error);
            this.toastService.error('Erreur lors de la suppression de l\'audience');
          }
        });
    }
  }

  applyFilters(): void {
    let filtered = [...this.dossiers];
    
    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(dossier => {
        // Recherche par numéro de dossier
        const numeroMatch = dossier.numeroDossier?.toLowerCase().includes(searchLower) || false;
        
        // Recherche par créancier
        let creancierMatch = false;
        if (dossier.creancier) {
          const creancierNom = (dossier.creancier.nom || '').toLowerCase();
          const creancierPrenom = (dossier.creancier.prenom || '').toLowerCase();
          const creancierFullName = `${creancierPrenom} ${creancierNom}`.trim().toLowerCase();
          creancierMatch = creancierNom.includes(searchLower) || 
                          creancierPrenom.includes(searchLower) ||
                          creancierFullName.includes(searchLower);
        }
        
        // Recherche par débiteur
        let debiteurMatch = false;
        if (dossier.debiteur) {
          const debiteurNom = (dossier.debiteur.nom || '').toLowerCase();
          const debiteurPrenom = (dossier.debiteur.prenom || '').toLowerCase();
          const debiteurFullName = `${debiteurPrenom} ${debiteurNom}`.trim().toLowerCase();
          debiteurMatch = debiteurNom.includes(searchLower) || 
                         debiteurPrenom.includes(searchLower) ||
                         debiteurFullName.includes(searchLower);
        }
        
        // Recherche par avocat/huissier du dossier
        let assigneeMatch = false;
        if (dossier.avocat) {
          const avocatNom = (dossier.avocat.nom || '').toLowerCase();
          const avocatPrenom = (dossier.avocat.prenom || '').toLowerCase();
          assigneeMatch = avocatNom.includes(searchLower) || avocatPrenom.includes(searchLower) ||
                         `${avocatPrenom} ${avocatNom}`.trim().toLowerCase().includes(searchLower);
        }
        if (!assigneeMatch && dossier.huissier) {
          const huissierNom = (dossier.huissier.nom || '').toLowerCase();
          const huissierPrenom = (dossier.huissier.prenom || '').toLowerCase();
          assigneeMatch = huissierNom.includes(searchLower) || huissierPrenom.includes(searchLower) ||
                         `${huissierPrenom} ${huissierNom}`.trim().toLowerCase().includes(searchLower);
        }
        
        return numeroMatch || creancierMatch || debiteurMatch || assigneeMatch;
      });
    }
    
    this.filteredDossiers = filtered;
    console.log('🔍 Filtrage appliqué:', this.searchTerm, '->', filtered.length, 'dossiers');
  }

  getFilteredAudiences(dossierId: number): Audience[] {
    // Utiliser la même logique que getAudiencesForDossier
    let filtered = this.getAudiencesForDossier(dossierId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (this.filterType === 'upcoming') {
      filtered = filtered.filter(a => {
        const date = new Date(a.dateAudience);
        date.setHours(0, 0, 0, 0);
        return date >= today && !a.decisionResult;
      });
    } else if (this.filterType === 'past') {
      filtered = filtered.filter(a => {
        const date = new Date(a.dateAudience);
        date.setHours(0, 0, 0, 0);
        return date < today;
      });
    } else if (this.filterType === 'reported') {
      filtered = filtered.filter(a => !!a.dateProchaine);
    }
    
    if (this.filterTribunal) {
      filtered = filtered.filter(a => a.tribunalType === this.filterTribunal);
    }
    
    if (this.filterResult) {
      filtered = filtered.filter(a => a.decisionResult === this.filterResult);
    }
    
    // Trier par date (plus récentes en premier)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.dateAudience).getTime();
      const dateB = new Date(b.dateAudience).getTime();
      return dateB - dateA;
    });
  }

  isUpcomingAudience(audience: Audience): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(audience.dateAudience);
    date.setHours(0, 0, 0, 0);
    return date >= today && !audience.decisionResult;
  }

  isPastAudience(audience: Audience): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(audience.dateAudience);
    date.setHours(0, 0, 0, 0);
    return date < today;
  }

  getDecisionBadgeClass(result: string): string {
    const classes: { [key: string]: string } = {
      [DecisionResult.POSITIVE]: 'badge-success',
      [DecisionResult.NEGATIVE]: 'badge-danger',
      [DecisionResult.RAPPORTER]: 'badge-warning'
    };
    return classes[result] || 'badge-secondary';
  }

  getAudiencesForDossier(dossierId: number | string): Audience[] {
    if (!dossierId) {
      console.log(`🔍 getAudiencesForDossier(${dossierId}): dossierId invalide`);
      return [];
    }
    
    if (!this.audiences || this.audiences.length === 0) {
      console.log(`🔍 getAudiencesForDossier(${dossierId}): Aucune audience disponible (total: ${this.audiences?.length || 0})`);
      return [];
    }
    
    // Normaliser le dossierId en number pour la comparaison
    const dossierIdNum = typeof dossierId === 'string' ? parseInt(dossierId, 10) : dossierId;
    
    if (isNaN(dossierIdNum)) {
      console.log(`🔍 getAudiencesForDossier(${dossierId}): dossierId invalide (NaN)`);
      return [];
    }
    
    // Trouver le dossier pour vérifier son avocat/huissier
    const dossier = this.dossiers.find(d => d.id === dossierIdNum);
    if (!dossier) {
      console.log(`🔍 getAudiencesForDossier(${dossierIdNum}): Dossier non trouvé dans la liste`);
      return [];
    }
    
    const dossierAvocatId = dossier.avocat?.id || dossier.avocatId;
    const dossierHuissierId = dossier.huissier?.id || dossier.huissierId;
    
    console.log(`🔍 getAudiencesForDossier(${dossierIdNum}): Recherche d'audiences`, {
      dossierId: dossierIdNum,
      dossierNumero: dossier.numeroDossier,
      avocatId: dossierAvocatId,
      huissierId: dossierHuissierId,
      totalAudiences: this.audiences.length,
      audiencesDisponibles: this.audiences.slice(0, 5).map(a => ({ 
        id: a.id, 
        dossierId: a.dossierId, 
        dossierIdType: typeof a.dossierId,
        dateAudience: a.dateAudience 
      }))
    });
    
    // Filtrer les audiences qui correspondent à ce dossier
    const filtered = this.audiences.filter(audience => {
      // Cas 1: audience.dossierId correspond directement (PRIORITÉ ABSOLUE)
      if (audience.dossierId !== null && audience.dossierId !== undefined) {
        const audienceDossierId = typeof audience.dossierId === 'string' 
          ? parseInt(audience.dossierId, 10) 
          : audience.dossierId;
        if (!isNaN(audienceDossierId) && audienceDossierId === dossierIdNum) {
          console.log(`✅ Audience ${audience.id} correspond au dossier ${dossierIdNum} via dossierId`);
          return true;
        }
      }
      
      // Cas 2: audience.dossier est un objet avec id
      if ((audience as any).dossier && (audience as any).dossier.id) {
        const dossierObjId = typeof (audience as any).dossier.id === 'string'
          ? parseInt((audience as any).dossier.id, 10)
          : (audience as any).dossier.id;
        if (!isNaN(dossierObjId) && dossierObjId === dossierIdNum) {
          console.log(`✅ Audience ${audience.id} correspond au dossier ${dossierIdNum} via dossier.id`);
          return true;
        }
      }
      
      // Cas 3: Vérifier aussi dossier_id (snake_case) directement dans l'objet brut
      if ((audience as any).dossier_id !== null && (audience as any).dossier_id !== undefined) {
        const dossierIdSnake = typeof (audience as any).dossier_id === 'string'
          ? parseInt((audience as any).dossier_id, 10)
          : (audience as any).dossier_id;
        if (!isNaN(dossierIdSnake) && dossierIdSnake === dossierIdNum) {
          console.log(`✅ Audience ${audience.id} correspond au dossier ${dossierIdNum} via dossier_id`);
          return true;
        }
      }
      
      // Cas 4: SOLUTION DE CONTOURNEMENT - Correspondance via avocat/huissier
      // Si l'audience a le même avocat que le dossier
      const audienceAvocatId = audience.avocatId || (audience as any).avocat?.id;
      if (dossierAvocatId && audienceAvocatId && dossierAvocatId === audienceAvocatId) {
        console.log(`✅ Audience ${audience.id} correspond au dossier ${dossierIdNum} via avocat ${audienceAvocatId}`);
        return true;
      }
      
      // Si l'audience a le même huissier que le dossier
      const audienceHuissierId = audience.huissierId || (audience as any).huissier?.id;
      if (dossierHuissierId && audienceHuissierId && dossierHuissierId === audienceHuissierId) {
        console.log(`✅ Audience ${audience.id} correspond au dossier ${dossierIdNum} via huissier ${audienceHuissierId}`);
        return true;
      }
      
      return false;
    });
    
    console.log(`✅ getAudiencesForDossier(${dossierIdNum}): ${filtered.length} audience(s) trouvée(s)`, 
      filtered.map(a => ({ 
        id: a.id, 
        dossierId: a.dossierId, 
        dossierIdType: typeof a.dossierId,
        dateAudience: a.dateAudience,
        resultat: a.decisionResult
      }))
    );
    
    return filtered;
  }

  getAssigneeName(audience: Audience): string {
    // Vérifier d'abord avocatId, puis l'objet avocat
    const avocatId = audience.avocatId || (audience as any).avocat?.id;
    if (avocatId) {
      const avocat = this.avocats.find(a => a.id === avocatId);
      if (avocat) {
        return `${avocat.prenom} ${avocat.nom}`;
      }
      // Si pas trouvé dans la liste, utiliser les données de l'objet avocat
      if ((audience as any).avocat) {
        return `${(audience as any).avocat.prenom || ''} ${(audience as any).avocat.nom || ''}`.trim() || 'Avocat';
      }
      return 'Avocat non trouvé';
    }
    
    // Vérifier d'abord huissierId, puis l'objet huissier
    const huissierId = audience.huissierId || (audience as any).huissier?.id;
    if (huissierId) {
      const huissier = this.huissiers.find(h => h.id === huissierId);
      if (huissier) {
        return `${huissier.prenom} ${huissier.nom}`;
      }
      // Si pas trouvé dans la liste, utiliser les données de l'objet huissier
      if ((audience as any).huissier) {
        return `${(audience as any).huissier.prenom || ''} ${(audience as any).huissier.nom || ''}`.trim() || 'Huissier';
      }
      return 'Huissier non trouvé';
    }
    return 'Non assigné';
  }

  hasAssignee(audience: Audience): boolean {
    return !!(audience.avocatId || audience.huissierId || (audience as any).avocat?.id || (audience as any).huissier?.id);
  }

  getAssigneeType(audience: Audience): string {
    if (audience.avocatId || (audience as any).avocat?.id) return 'Avocat';
    if (audience.huissierId || (audience as any).huissier?.id) return 'Huissier';
    return 'Non assigné';
  }

  // Obtenir les coordonnées de l'avocat
  getAvocatContact(avocatId?: number): { email?: string; telephone?: string; specialite?: string } | null {
    if (!avocatId) return null;
    const avocat = this.avocats.find(a => a.id === avocatId);
    if (!avocat) return null;
    return {
      email: avocat.email || undefined,
      telephone: avocat.telephone || undefined,
      specialite: avocat.specialite || undefined
    };
  }

  // Obtenir les coordonnées de l'huissier
  getHuissierContact(huissierId?: number): { email?: string; telephone?: string; adresse?: string } | null {
    if (!huissierId) return null;
    const huissier = this.huissiers.find(h => h.id === huissierId);
    if (!huissier) return null;
    return {
      email: huissier.email || undefined,
      telephone: huissier.telephone || undefined,
      adresse: huissier.adresse || undefined
    };
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

  getCreancierName(dossier: DossierApi): string {
    if (!dossier.creancier) return 'N/A';
    const typeCreancier = (dossier.creancier as any).typeCreancier;
    if (typeCreancier === 'PERSONNE_MORALE') {
      return dossier.creancier.nom || 'N/A';
    } else if (dossier.creancier.prenom && dossier.creancier.nom) {
      return `${dossier.creancier.prenom} ${dossier.creancier.nom}`;
    } else if (dossier.creancier.nom) {
      return dossier.creancier.nom;
    }
    return 'N/A';
  }

  getDebiteurName(dossier: DossierApi): string {
    if (!dossier.debiteur) return 'N/A';
    const typeDebiteur = (dossier.debiteur as any).typeDebiteur;
    if (typeDebiteur === 'PERSONNE_MORALE') {
      return dossier.debiteur.nom || 'N/A';
    } else if (dossier.debiteur.prenom && dossier.debiteur.nom) {
      return `${dossier.debiteur.prenom} ${dossier.debiteur.nom}`;
    } else if (dossier.debiteur.nom) {
      return dossier.debiteur.nom;
    }
    return 'N/A';
  }

  getAvocatName(dossier: DossierApi): string {
    if (dossier.avocat) {
      return `${dossier.avocat.prenom || ''} ${dossier.avocat.nom || ''}`.trim() || 'N/A';
    }
    return 'Non affecté';
  }

  getHuissierName(dossier: DossierApi): string {
    if (dossier.huissier) {
      return `${dossier.huissier.prenom || ''} ${dossier.huissier.nom || ''}`.trim() || 'N/A';
    }
    return 'Non affecté';
  }

  hasAvocatOrHuissier(dossier: DossierApi): boolean {
    return !!(dossier.avocat || dossier.huissier);
  }

  // TrackBy pour améliorer les performances de rendu
  trackByAudienceId(index: number, audience: Audience): any {
    return audience.id || index;
  }

  trackByDossierId(index: number, dossier: DossierApi): any {
    return dossier.id || index;
  }

  // Voir les détails d'une audience
  viewAudienceDetails(audience: Audience): void {
    // Trouver le dossier associé
    const dossier = this.dossiers.find(d => {
      if (audience.dossierId && typeof audience.dossierId === 'number') {
        return d.id === audience.dossierId;
      }
      if ((audience as any).dossier && (audience as any).dossier.id) {
        return d.id === (audience as any).dossier.id;
      }
      return false;
    });

    if (dossier) {
      // Ouvrir le modal en mode visualisation (lecture seule)
      this.showAudienceModal(dossier, audience, true);
    } else {
      this.toastService.warning('Dossier associé non trouvé pour cette audience');
    }
  }

  /**
   * Charge les documents huissier d'un dossier
   */
  loadDossierDocuments(dossierId: number): void {
    this.isLoadingDocuments = true;
    this.documentService.getDocumentsByDossier(dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents) => {
          this.dossierDocuments = documents;
          this.isLoadingDocuments = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des documents:', error);
          this.isLoadingDocuments = false;
        }
      });
  }

  /**
   * Charge les actions huissier d'un dossier
   */
  loadDossierActions(dossierId: number): void {
    this.isLoadingActions = true;
    this.actionService.getActionsByDossier(dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (actions) => {
          this.dossierActions = actions;
          this.isLoadingActions = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des actions:', error);
          this.isLoadingActions = false;
        }
      });
  }

  /**
   * Formate le type de document pour l'affichage
   */
  getDocumentTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'PV_MISE_EN_DEMEURE': 'PV Mise en Demeure',
      'ORDONNANCE_PAIEMENT': 'Ordonnance de Paiement',
      'PV_NOTIFICATION_ORDONNANCE': 'PV Notification Ordonnance'
    };
    return labels[type] || type;
  }

  /**
   * Formate le type d'action pour l'affichage
   */
  getActionTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'ACLA_TA7AFOUDHIA': 'Saisie Conservatoire',
      'ACLA_TANFITHIA': 'Saisie Exécutive',
      'ACLA_TAW9IFIYA': 'Saisie de Blocage',
      'ACLA_A9ARYA': 'Saisie Immobilière'
    };
    return labels[type] || type;
  }

  /**
   * Formate une date pour l'affichage
   */
  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Vérifie si un dossier peut être affecté au finance
   * Conditions : le dossier doit avoir au moins une action OU une audience
   * INDÉPENDAMMENT de l'étape (documents, actions, audiences)
   * 
   * "Indépendamment de l'étape" signifie que peu importe où se trouve le dossier
   * dans le workflow huissier (EN_ATTENTE_DOCUMENTS, EN_DOCUMENTS, EN_ACTIONS, EN_AUDIENCES),
   * tant qu'il a au moins une action OU une audience, il peut être affecté au finance.
   */
  canAffecterAuFinance(dossier: DossierApi): boolean {
    if (!dossier || !dossier.id) return false;
    
    // Vérifier si le dossier a au moins une action (si c'est le dossier sélectionné)
    const hasActions = this.selectedDossier?.id === dossier.id 
      ? this.dossierActions.length > 0 
      : false; // Pour les autres dossiers, on ne charge pas les actions (optimisation)
    
    // Vérifier si le dossier a au moins une audience
    const dossierAudiences = this.getAudiencesForDossier(dossier.id);
    const hasAudiences = dossierAudiences.length > 0;
    
    // Le dossier peut être affecté s'il a au moins une action OU une audience
    return hasActions || hasAudiences;
  }

  /**
   * Ouvre le formulaire de finalisation du dossier juridique
   */
  openFinalisationForm(dossier: DossierApi): void {
    if (!dossier || !dossier.id) {
      this.toastService.error('Dossier invalide');
      return;
    }
    
    // Vérifier que le dossier a au moins une audience
    const dossierAudiences = this.getAudiencesForDossier(dossier.id);
    if (dossierAudiences.length === 0) {
      this.toastService.error('Ce dossier doit avoir au moins une audience pour être finalisé');
      return;
    }
    
    this.selectedDossierForFinalisation = dossier;
    this.finalisationForm.reset({
      etatFinal: '',
      montantRecouvre: 0
    });
    this.showFinalisationForm = true;
  }

  /**
   * Ferme le formulaire de finalisation
   */
  closeFinalisationForm(): void {
    this.showFinalisationForm = false;
    this.selectedDossierForFinalisation = null;
    this.finalisationForm.reset();
  }

  /**
   * Définit l'état final du dossier via un bouton
   */
  setEtatFinal(etat: EtatFinalDossierJuridique): void {
    if (!this.selectedDossierForFinalisation) {
      this.toastService.error('Aucun dossier sélectionné');
      return;
    }
    
    const montantRestantActuel = this.getMontantRestantActuel();
    
    // Si Recouvrement Total : montant recouvré dans cette étape = montant restant actuel
    // Cela signifie qu'on recouvre tout ce qui reste, donc le montant restant final sera 0
    if (etat === EtatFinalDossierJuridique.RECOUVREMENT_TOTAL) {
      this.finalisationForm.patchValue({ 
        etatFinal: etat,
        montantRecouvre: montantRestantActuel
      });
    } 
    // Si Non Recouvré : montant recouvré dans cette étape = 0 (rien n'est recouvré)
    else if (etat === EtatFinalDossierJuridique.NON_RECOUVRE) {
      this.finalisationForm.patchValue({ 
        etatFinal: etat,
        montantRecouvre: 0
      });
    }
    // Si Recouvrement Partiel : laisser l'utilisateur saisir
    else {
      this.finalisationForm.patchValue({ 
        etatFinal: etat,
        montantRecouvre: 0
      });
    }
  }

  /**
   * Récupère le montant déjà recouvré avant cette finalisation
   * ✅ NOUVEAU : Utilise montantRecouvrePhaseAmiable + montantRecouvrePhaseJuridique
   */
  getMontantRecouvreActuel(): number {
    if (!this.selectedDossierForFinalisation) return 0;
    
    const dossier = this.selectedDossierForFinalisation;
    
    // ✅ NOUVEAU : Utiliser les montants par phase
    const montantAmiable = (dossier as any).montantRecouvrePhaseAmiable || 0;
    const montantJuridique = (dossier as any).montantRecouvrePhaseJuridique || 0;
    const montantTotal = montantAmiable + montantJuridique;
    
    // Fallback vers l'ancien système si les nouveaux champs ne sont pas disponibles
    if (montantTotal === 0) {
      return (dossier as any).montantRecouvre || 
             (dossier.finance as any)?.montantRecouvre ||
             dossier.finance?.montantRecupere || 
             0;
    }
    
    return montantTotal;
  }

  /**
   * Calcule le montant restant AVANT cette finalisation (montant créance - montant déjà recouvré)
   */
  getMontantRestantActuel(): number {
    if (!this.selectedDossierForFinalisation) return 0;
    
    const montantCreance = this.selectedDossierForFinalisation.montantCreance || 0;
    const montantRecouvreActuel = this.getMontantRecouvreActuel();
    
    return Math.max(0, montantCreance - montantRecouvreActuel);
  }

  /**
   * Calcule le montant restant APRÈS cette finalisation (en fonction du montant recouvré saisi)
   */
  getMontantRestant(): number {
    if (!this.selectedDossierForFinalisation) return 0;
    
    const montantCreance = this.selectedDossierForFinalisation.montantCreance || 0;
    const montantRecouvreActuel = this.getMontantRecouvreActuel();
    const montantRecouvreDansCetteEtape = this.finalisationForm.get('montantRecouvre')?.value || 0;
    const montantRecouvreTotal = montantRecouvreActuel + montantRecouvreDansCetteEtape;
    
    return Math.max(0, montantCreance - montantRecouvreTotal);
  }

  /**
   * Vérifie si le champ montant recouvré doit être affiché
   */
  shouldShowMontantRecouvre(): boolean {
    const etatFinal = this.finalisationForm.get('etatFinal')?.value;
    return etatFinal !== EtatFinalDossierJuridique.NON_RECOUVRE;
  }

  /**
   * Vérifie si le montant recouvré doit être en lecture seule (Recouvrement Total)
   */
  isMontantRecouvreReadOnly(): boolean {
    const etatFinal = this.finalisationForm.get('etatFinal')?.value;
    return etatFinal === EtatFinalDossierJuridique.RECOUVREMENT_TOTAL;
  }

  /**
   * Finalise le dossier juridique avec l'état final et le montant recouvré
   */
  finaliserDossierJuridique(): void {
    if (!this.selectedDossierForFinalisation || !this.selectedDossierForFinalisation.id) {
      this.toastService.error('Aucun dossier sélectionné');
      return;
    }

    if (this.finalisationForm.invalid) {
      this.toastService.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formValue = this.finalisationForm.value;
    const etatFinal = formValue.etatFinal;
    let montantRecouvre = formValue.montantRecouvre;

    // Validation du montant selon l'état
    const montantCreance = this.selectedDossierForFinalisation.montantCreance || 0;
    const montantRecouvreActuel = this.getMontantRecouvreActuel();
    const montantRestantActuel = this.getMontantRestantActuel();
    const montantRecouvreTotal = montantRecouvreActuel + montantRecouvre;
    
    // Pour NON_RECOUVRE, le montant doit être 0 (déjà géré dans setEtatFinal)
    if (etatFinal === EtatFinalDossierJuridique.NON_RECOUVRE) {
      // Le montant est déjà à 0, pas besoin de validation supplémentaire
      montantRecouvre = 0;
    }
    // Pour RECOUVREMENT_TOTAL, le montant recouvré dans cette étape doit être égal au montant restant actuel
    // et le montant total recouvré doit être égal au montant créance
    else if (etatFinal === EtatFinalDossierJuridique.RECOUVREMENT_TOTAL) {
      // Vérifier que le montant recouvré dans cette étape = montant restant actuel
      if (Math.abs(montantRecouvre - montantRestantActuel) > 0.01) {
        // Corriger automatiquement si différent
        this.finalisationForm.patchValue({ montantRecouvre: montantRestantActuel });
        montantRecouvre = montantRestantActuel;
      }
      // Vérifier que le montant total recouvré = montant créance (avec une tolérance de 0.01 pour les arrondis)
      if (Math.abs(montantRecouvreTotal - montantCreance) > 0.01) {
        this.toastService.error(`Le montant total recouvré (${montantRecouvreTotal.toFixed(2)} TND) doit être égal au montant de la créance (${montantCreance.toFixed(2)} TND) pour un recouvrement total`);
        return;
      }
    }
    // Pour RECOUVREMENT_PARTIEL, le montant doit être > 0 et < montant restant actuel
    else if (etatFinal === EtatFinalDossierJuridique.RECOUVREMENT_PARTIEL) {
      if (montantRecouvre <= 0) {
        this.toastService.error('Pour un recouvrement partiel, le montant recouvré doit être supérieur à 0');
        return;
      }
      if (montantRecouvre >= montantRestantActuel) {
        this.toastService.error(`Pour un recouvrement partiel, le montant recouvré (${montantRecouvre.toFixed(2)} TND) doit être inférieur au montant restant (${montantRestantActuel.toFixed(2)} TND)`);
        return;
      }
      // Vérifier que le montant total recouvré ne dépasse pas le montant créance
      if (montantRecouvreTotal > montantCreance) {
        this.toastService.error(`Le montant total recouvré (${montantRecouvreTotal.toFixed(2)} TND) ne peut pas dépasser le montant de la créance (${montantCreance.toFixed(2)} TND)`);
        return;
      }
    }

    const message = `Êtes-vous sûr de vouloir finaliser ce dossier juridique ?\n\n` +
                    `Dossier: ${this.selectedDossierForFinalisation.numeroDossier || 'N/A'}\n` +
                    `État final: ${this.getEtatFinalLabel(etatFinal)}\n` +
                    `Montant recouvré: ${montantRecouvre} TND\n\n` +
                    `Cette action marquera la fin du processus de recouvrement juridique.`;

    if (!confirm(message)) {
      return;
    }

    this.isLoadingFinalisation = true;
    this.dossierApiService.finaliserDossierJuridique(
      this.selectedDossierForFinalisation.id,
      etatFinal,
      montantRecouvre
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossierUpdated) => {
          console.log('✅ Dossier juridique finalisé:', dossierUpdated);
          this.toastService.success('Dossier juridique finalisé avec succès');
          this.isLoadingFinalisation = false;
          
          // Mettre à jour le dossier dans la liste
          const index = this.dossiers.findIndex(d => d.id === dossierUpdated.id);
          if (index !== -1) {
            this.dossiers[index] = dossierUpdated;
            this.filteredDossiers = [...this.dossiers];
          }
          
          this.closeFinalisationForm();
        },
        error: (error) => {
          console.error('❌ Erreur lors de la finalisation du dossier:', error);
          this.isLoadingFinalisation = false;
          const errorMessage = error.error?.message || error.error?.error || 'Erreur lors de la finalisation du dossier';
          this.toastService.error(errorMessage);
        }
      });
  }

  /**
   * Obtient le label d'affichage pour l'état final
   */
  getEtatFinalLabel(etat: EtatFinalDossierJuridique | string): string {
    const labels: { [key: string]: string } = {
      'RECOUVREMENT_TOTAL': 'Recouvrement Total',
      'RECOUVREMENT_PARTIEL': 'Recouvrement Partiel',
      'NON_RECOUVRE': 'Non Recouvré'
    };
    return labels[etat] || etat;
  }

  /**
   * Vérifie si un dossier peut être finalisé (doit avoir au moins une audience)
   */
  canFinaliserDossier(dossier: DossierApi): boolean {
    if (!dossier || !dossier.id) return false;
    const dossierAudiences = this.getAudiencesForDossier(dossier.id);
    return dossierAudiences.length > 0;
  }

  /**
   * Affecte un dossier au département finance
   */
  affecterAuFinance(): void {
    if (!this.selectedDossier || !this.selectedDossier.id) {
      this.toastService.error('Aucun dossier sélectionné');
      return;
    }

    if (!this.canAffecterAuFinance(this.selectedDossier)) {
      this.toastService.error('Ce dossier doit avoir au moins une action ou une audience pour être affecté au finance');
      return;
    }

    const message = `Êtes-vous sûr de vouloir affecter ce dossier au département finance ?\n\n` +
                    `Dossier: ${this.selectedDossier.numeroDossier || 'N/A'}\n` +
                    `Créancier: ${this.getCreancierName(this.selectedDossier)}\n` +
                    `Montant: ${this.selectedDossier.montantCreance || 0} TND\n\n` +
                    `Cette action transférera le dossier au chef financier avec toutes les informations (documents, actions, audiences).`;

    if (!confirm(message)) {
      return;
    }

    this.isLoadingAffectationFinance = true;
    this.dossierApiService.affecterAuFinance(this.selectedDossier.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossierUpdated) => {
          console.log('✅ Dossier affecté au finance:', dossierUpdated);
          this.toastService.success('Dossier affecté au département finance avec succès');
          this.isLoadingAffectationFinance = false;
          
          // Mettre à jour le dossier dans la liste
          const index = this.dossiers.findIndex(d => d.id === dossierUpdated.id);
          if (index !== -1) {
            this.dossiers[index] = dossierUpdated;
            this.filteredDossiers = [...this.dossiers];
          }
          
          // Fermer le modal si ouvert
          if (this.showAudienceForm) {
            this.cancelAudienceForm();
          }
          
          // Recharger les dossiers pour mettre à jour la liste
          this.loadData();
        },
        error: (error) => {
          console.error('❌ Erreur lors de l\'affectation au finance:', error);
          this.isLoadingAffectationFinance = false;
          const errorMessage = error.message || 'Erreur lors de l\'affectation au finance';
          this.toastService.error(errorMessage);
        }
      });
  }

  /**
   * Obtient la prédiction IA pour un dossier
   */
  getPredictionForDossier(dossier: DossierApi): IaPredictionResult | null {
    if (!dossier.id) return null;
    
    // Si on a déjà une prédiction en cache, l'utiliser
    if (this.predictions[dossier.id]) {
      return this.predictions[dossier.id];
    }
    
    // Sinon, créer une prédiction depuis les données du dossier
    if (!dossier.etatPrediction && dossier.riskScore === undefined) {
      return null;
    }
    
    const dossierModel = new Dossier({
      id: String(dossier.id),
      etatPrediction: dossier.etatPrediction,
      riskScore: dossier.riskScore,
      riskLevel: dossier.riskLevel,
      datePrediction: dossier.datePrediction
    });
    
    const prediction = this.iaPredictionService.getPredictionFromDossier(dossierModel);
    // Ne stocker que si la prédiction n'est pas null
    if (prediction) {
      this.predictions[dossier.id] = prediction;
    }
    return prediction;
  }

  /**
   * Déclenche le calcul de la prédiction IA pour un dossier
   */
  triggerPrediction(dossierId: number): void {
    this.loadingPredictions[dossierId] = true;
    this.iaPredictionService.predictForDossier(dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prediction) => {
          this.predictions[dossierId] = prediction;
          this.loadingPredictions[dossierId] = false;
          
          // Mettre à jour le dossier dans la liste avec la nouvelle prédiction
          const dossier = this.dossiers.find(d => d.id === dossierId);
          if (dossier) {
            dossier.etatPrediction = prediction.etatFinal;
            dossier.riskScore = prediction.riskScore;
            dossier.riskLevel = prediction.riskLevel;
            dossier.datePrediction = prediction.datePrediction;
          }
          
          this.toastService.success('Prédiction IA calculée avec succès');
        },
        error: (error) => {
          console.error('❌ Erreur lors de la prédiction IA:', error);
          this.loadingPredictions[dossierId] = false;
          this.toastService.error('Erreur lors du calcul de la prédiction IA');
        }
      });
  }

  /**
   * Recalcule automatiquement la prédiction IA après une audience
   */
  recalculatePredictionAfterAudience(dossierId: number): void {
    console.log('🔄 Recalcul de la prédiction IA pour le dossier', dossierId);
    // Attendre un peu pour que le backend mette à jour les données
    setTimeout(() => {
      console.log('🔄 Déclenchement du recalcul de la prédiction IA...');
      this.triggerPrediction(dossierId);
    }, 1500); // Augmenter le délai à 1.5s pour laisser le temps au backend
  }
}
