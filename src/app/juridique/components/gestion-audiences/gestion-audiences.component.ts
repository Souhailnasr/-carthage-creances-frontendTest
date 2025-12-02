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

export enum EtatFinalDossierJuridique {
  RECOUVREMENT_TOTAL = 'RECOUVREMENT_TOTAL',
  RECOUVREMENT_PARTIEL = 'RECOUVREMENT_PARTIEL',
  NON_RECOUVRE = 'NON_RECOUVRE'
}

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
  
  private destroy$ = new Subject<void>();

  constructor(
    private dossierApiService: DossierApiService,
    private avocatService: AvocatService,
    private huissierService: HuissierService,
    private audienceService: AudienceService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private documentService: HuissierDocumentService,
    private actionService: HuissierActionService
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
      montantRecouvre: [0, [Validators.required, Validators.min(0)]]
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

  loadAudiences(): void {
    // Load audiences APRÈS les dossiers pour pouvoir les utiliser dans la normalisation
    this.audienceService.getAllAudiences()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (audiences) => {
          console.log('📥 Audiences brutes reçues du backend:', audiences);
          
          // Normaliser les audiences pour avoir dossierId
          this.audiences = audiences.map(a => {
            const audience: any = { ...a };
            
            // Log de l'audience brute AVANT normalisation
            console.log(`🔍 Audience brute ${audience.id}:`, {
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
            
            // PRIORITÉ 1: Si l'audience a déjà dossierId, l'utiliser
            if (audience.dossierId !== null && audience.dossierId !== undefined) {
              // Normaliser dossierId en number si c'est une string
              if (typeof audience.dossierId === 'string') {
                audience.dossierId = parseInt(audience.dossierId, 10);
                if (!isNaN(audience.dossierId)) {
                  console.log(`🔧 Audience ${audience.id}: dossierId converti de string "${a.dossierId}" en number ${audience.dossierId}`);
                }
              }
            }
            // PRIORITÉ 2: Si l'audience a un objet dossier mais pas dossierId, extraire l'ID
            else if (audience.dossier && audience.dossier.id !== null && audience.dossier.id !== undefined) {
              audience.dossierId = typeof audience.dossier.id === 'string' 
                ? parseInt(audience.dossier.id, 10) 
                : audience.dossier.id;
              console.log(`🔧 Audience ${audience.id}: dossierId extrait de dossier.id = ${audience.dossierId}`);
            }
            // PRIORITÉ 3: Vérifier si le backend utilise un autre nom de champ (dossier_id au lieu de dossierId)
            else if (audience.dossier_id !== null && audience.dossier_id !== undefined) {
              audience.dossierId = typeof audience.dossier_id === 'string' 
                ? parseInt(audience.dossier_id, 10) 
                : audience.dossier_id;
              console.log(`🔧 Audience ${audience.id}: dossierId extrait de dossier_id = ${audience.dossierId}`);
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
          
          console.log('✅ Audiences normalisées:', this.audiences.length);
          
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
      dossierId: +this.selectedDossier.id, // Le service va convertir en dossier: { id: ... }
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


    const request = this.isEditMode && this.selectedAudience?.id
      ? this.audienceService.updateAudience(this.selectedAudience.id, audienceData)
      : this.audienceService.createAudience(audienceData);

    request
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdAudience) => {
          console.log('✅ Audience créée/modifiée reçue du backend:', createdAudience);
          
          this.toastService.success(
            this.isEditMode ? 'Audience modifiée avec succès.' : 'Audience ajoutée avec succès.'
          );
          this.cancelAudienceForm();
          
          // Recharger les audiences avec la même logique de normalisation
          this.loadAudiences();
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
    if (!dossierId || !this.audiences || this.audiences.length === 0) {
      return [];
    }
    
    // Normaliser le dossierId en number pour la comparaison
    const dossierIdNum = typeof dossierId === 'string' ? parseInt(dossierId, 10) : dossierId;
    
    if (isNaN(dossierIdNum)) {
      return [];
    }
    
    // Trouver le dossier pour vérifier son avocat/huissier
    const dossier = this.dossiers.find(d => d.id === dossierIdNum);
    if (!dossier) {
      return [];
    }
    
    const dossierAvocatId = dossier.avocat?.id || dossier.avocatId;
    const dossierHuissierId = dossier.huissier?.id || dossier.huissierId;
    
    // Filtrer les audiences qui correspondent à ce dossier
    const filtered = this.audiences.filter(audience => {
      // Cas 1: audience.dossierId correspond directement
      if (audience.dossierId !== null && audience.dossierId !== undefined) {
        const audienceDossierId = typeof audience.dossierId === 'string' 
          ? parseInt(audience.dossierId, 10) 
          : audience.dossierId;
        if (!isNaN(audienceDossierId) && audienceDossierId === dossierIdNum) {
          return true;
        }
      }
      
      // Cas 2: audience.dossier est un objet avec id
      if ((audience as any).dossier && (audience as any).dossier.id) {
        const dossierObjId = typeof (audience as any).dossier.id === 'string'
          ? parseInt((audience as any).dossier.id, 10)
          : (audience as any).dossier.id;
        if (!isNaN(dossierObjId) && dossierObjId === dossierIdNum) {
          return true;
        }
      }
      
      // Cas 3: SOLUTION DE CONTOURNEMENT - Correspondance via avocat/huissier
      // Si l'audience a le même avocat que le dossier
      const audienceAvocatId = audience.avocatId || (audience as any).avocat?.id;
      if (dossierAvocatId && audienceAvocatId && dossierAvocatId === audienceAvocatId) {
        return true;
      }
      
      // Si l'audience a le même huissier que le dossier
      const audienceHuissierId = audience.huissierId || (audience as any).huissier?.id;
      if (dossierHuissierId && audienceHuissierId && dossierHuissierId === audienceHuissierId) {
        return true;
      }
      
      return false;
    });
    
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
    
    this.finalisationForm.patchValue({ etatFinal: etat });
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
    const montantRecouvre = formValue.montantRecouvre;

    // Validation du montant selon l'état
    const montantCreance = this.selectedDossierForFinalisation.montantCreance || 0;
    if (etatFinal === EtatFinalDossierJuridique.RECOUVREMENT_TOTAL && montantRecouvre !== montantCreance) {
      if (!confirm(`Le montant recouvré (${montantRecouvre} TND) ne correspond pas au montant de la créance (${montantCreance} TND).\n\nVoulez-vous continuer ?`)) {
        return;
      }
    }

    if (etatFinal === EtatFinalDossierJuridique.RECOUVREMENT_PARTIEL && montantRecouvre >= montantCreance) {
      this.toastService.error('Pour un recouvrement partiel, le montant recouvré doit être inférieur au montant de la créance');
      return;
    }

    if (etatFinal === EtatFinalDossierJuridique.NON_RECOUVRE && montantRecouvre > 0) {
      if (!confirm(`Vous avez indiqué "Non recouvré" mais un montant recouvré a été saisi (${montantRecouvre} TND).\n\nVoulez-vous continuer ?`)) {
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
}
