import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { HuissierService } from '../../services/huissier.service';
import { HuissierActionService } from '../../services/huissier-action.service';
import { HuissierDocumentService } from '../../services/huissier-document.service';
import { AudienceService } from '../../services/audience.service';
import { Huissier } from '../../models/huissier.model';
import { ActionHuissier, ActionHuissierDTO, TypeActionHuissier, EtatDossier } from '../../models/huissier-action.model';
import { DocumentHuissier } from '../../models/huissier-document.model';
import { Audience } from '../../models/audience.model';
import { ToastService } from '../../../core/services/toast.service';
import { IaPredictionService } from '../../../core/services/ia-prediction.service';
import { IaPredictionResult } from '../../../shared/models/ia-prediction-result.model';
import { IaPredictionBadgeComponent } from '../../../shared/components/ia-prediction-badge/ia-prediction-badge.component';
import { Dossier } from '../../../shared/models/dossier.model';

@Component({
  selector: 'app-huissier-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, IaPredictionBadgeComponent],
  templateUrl: './huissier-actions.component.html',
  styleUrls: ['./huissier-actions.component.scss']
})
export class HuissierActionsComponent implements OnInit, OnDestroy {
  // Données
  dossiers: DossierApi[] = [];
  filteredDossiers: DossierApi[] = [];
  huissiers: Huissier[] = [];
  selectedDossierId: number | null = null;
  selectedHuissierId: number | null = null;
  selectedDossier: DossierApi | null = null;
  
  // Actions - Toutes les actions de tous les dossiers
  allActions: ActionHuissier[] = [];
  // Actions par dossier (pour affichage)
  actionsByDossier: { [dossierId: number]: ActionHuissier[] } = {};
  
  // Actions du dossier sélectionné (pour le formulaire)
  actions: ActionHuissier[] = [];
  
  // Documents du dossier sélectionné (pour affichage)
  documents: DocumentHuissier[] = [];
  
  // Audiences (pour vérifier si le dossier peut être affecté au finance)
  audiences: Audience[] = [];
  
  showActionForm = false;
  showActionView = false;
  selectedAction: ActionHuissier | null = null;
  isEditActionMode = false;
  actionForm: ActionHuissierDTO = {
    dossierId: 0,
    typeAction: TypeActionHuissier.ACLA_TA7AFOUDHIA,
    huissierName: '',
    montantRecouvre: undefined,
    montantRestant: undefined,
    etatDossier: undefined,
    pieceJointeUrl: undefined,
    updateMode: 'ADD'
  };
  selectedFile: File | null = null;
  
  // Enums pour les templates
  TypeActionHuissier = TypeActionHuissier;
  EtatDossier = EtatDossier;
  
  // États de chargement
  isLoading = false;
  isLoadingActions = false;
  isLoadingDossiers = false;
  isLoadingDocuments = false;
  isLoadingAffectationFinance = false;
  
  // Recherche et filtres
  searchTerm: string = '';
  filterType: 'all' | 'conservatoire' | 'executive' | 'blocage' | 'immobiliere' = 'all';
  
  // Statistiques
  stats = {
    totalDossiers: 0,
    totalActions: 0,
    conservatoireActions: 0,
    executiveActions: 0,
    blocageActions: 0,
    immobiliereActions: 0
  };
  
  // Prédiction IA
  predictions: { [dossierId: number]: IaPredictionResult } = {};
  loadingPrediction: boolean = false;
  prediction: IaPredictionResult | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private dossierApiService: DossierApiService,
    private huissierService: HuissierService,
    private actionService: HuissierActionService,
    private documentService: HuissierDocumentService,
    private audienceService: AudienceService,
    private toastService: ToastService,
    private iaPredictionService: IaPredictionService
  ) {}

  ngOnInit(): void {
    this.loadHuissiers();
    // Charger les dossiers d'abord, puis les actions une fois les dossiers chargés
    // Les audiences seront chargées à la demande si nécessaire
    this.loadDossiers();
    // Charger les audiences en arrière-plan (gestion d'erreur silencieuse)
    this.loadAllAudiences();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge la liste de TOUS les dossiers juridiques pour la traçabilité
   * (même ceux passés aux audiences - pour voir l'historique des actions)
   */
  loadDossiers(): void {
    this.isLoadingDossiers = true;
    this.dossierApiService.getDossiersRecouvrementJuridique(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          if (page && Array.isArray(page.content)) {
            this.dossiers = page.content;
            this.filteredDossiers = [...this.dossiers];
          } else if (Array.isArray(page)) {
            this.dossiers = page;
            this.filteredDossiers = [...this.dossiers];
          } else {
            this.dossiers = [];
            this.filteredDossiers = [];
          }
          this.calculateStats();
          this.isLoadingDossiers = false;
          // Charger les actions une fois les dossiers chargés
          this.loadAllActions();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des dossiers:', error);
          this.toastService.error('Erreur lors du chargement des dossiers');
          this.isLoadingDossiers = false;
        }
      });
  }

  /**
   * Charge la liste des huissiers
   */
  loadHuissiers(): void {
    this.huissierService.getAllHuissiers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (huissiers) => {
          this.huissiers = huissiers;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des huissiers:', error);
          this.toastService.error('Erreur lors du chargement des huissiers');
        }
      });
  }

  /**
   * Charge toutes les audiences pour vérifier si un dossier peut être affecté au finance
   * Note: Les erreurs de normalisation des audiences sont gérées silencieusement
   */
  loadAllAudiences(): void {
    this.audienceService.getAllAudiences()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          // Ignorer les erreurs de normalisation (audiences sans dossierId)
          // Ces erreurs sont gérées par le service et ne sont pas critiques
          console.warn('⚠️ Certaines audiences n\'ont pas de dossierId, elles seront ignorées');
          return of([]); // Retourner un tableau vide en cas d'erreur
        })
      )
      .subscribe({
        next: (audiences) => {
          // Filtrer les audiences valides (avec dossierId)
          this.audiences = (audiences || []).filter(audience => {
            const dossierId = audience.dossierId || (audience as any).dossier_id;
            return dossierId != null;
          });
        },
        error: (error) => {
          // Erreur déjà gérée par catchError, mais on s'assure que audiences est initialisé
          this.audiences = [];
        }
      });
  }

  /**
   * Charge toutes les actions de tous les dossiers
   * Note: Le backend n'a pas d'endpoint pour récupérer toutes les actions,
   * donc on charge les actions pour chaque dossier individuellement
   */
  loadAllActions(): void {
    this.isLoadingActions = true;
    
    // Si aucun dossier n'est chargé, on ne peut pas charger les actions
    if (this.dossiers.length === 0) {
      this.allActions = [];
      this.actionsByDossier = {};
      this.isLoadingActions = false;
      return;
    }

    // Créer un tableau d'observables pour charger les actions de chaque dossier
    const actionRequests = this.dossiers
      .filter(dossier => dossier.id != null)
      .map(dossier => 
        this.actionService.getActionsByDossier(dossier.id!)
          .pipe(
            catchError(error => {
              console.warn(`Erreur lors du chargement des actions pour le dossier ${dossier.id}:`, error);
              return of([]); // Retourner un tableau vide en cas d'erreur
            })
          )
      );

    // Si aucun dossier valide, initialiser les structures vides
    if (actionRequests.length === 0) {
      this.allActions = [];
      this.actionsByDossier = {};
      this.isLoadingActions = false;
      return;
    }

    // Charger toutes les actions en parallèle
    forkJoin(actionRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (actionsArrays) => {
          // Fusionner tous les tableaux d'actions
          this.allActions = actionsArrays.flat();
          
          // Grouper les actions par dossier
          this.actionsByDossier = {};
          this.allActions.forEach(action => {
            const dossierId = action.dossierId || (action as any).dossier?.id;
            if (dossierId) {
              if (!this.actionsByDossier[dossierId]) {
                this.actionsByDossier[dossierId] = [];
              }
              this.actionsByDossier[dossierId].push(action);
            }
          });
          
          this.applyFilters();
          this.calculateStats();
          this.isLoadingActions = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des actions:', error);
          this.allActions = [];
          this.actionsByDossier = {};
          this.isLoadingActions = false;
        }
      });
  }

  /**
   * Sélectionne un dossier et charge ses documents et actions
   */
  onDossierSelected(dossierId: number | null): void {
    this.selectedDossierId = dossierId;
    this.selectedDossier = this.dossiers.find(d => d.id === dossierId) || null;
    if (dossierId) {
      this.loadDocuments();
      this.loadActions();
    } else {
      this.documents = [];
      this.actions = [];
    }
  }

  /**
   * Charge les documents d'un dossier
   */
  loadDocuments(): void {
    if (!this.selectedDossierId) return;
    
    this.isLoadingDocuments = true;
    this.actionService.getDocumentsByDossier(this.selectedDossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents) => {
          this.documents = documents;
          this.isLoadingDocuments = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des documents:', error);
          this.toastService.error('Erreur lors du chargement des documents');
          this.isLoadingDocuments = false;
        }
      });
  }

  /**
   * Charge les actions d'un dossier
   */
  loadActions(): void {
    if (!this.selectedDossierId) {
      this.actions = [];
      return;
    }
    
    this.isLoadingActions = true;
    this.actionService.getActionsByDossier(this.selectedDossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (actions) => {
          this.actions = actions;
          // Mettre à jour aussi allActions et actionsByDossier
          this.allActions = this.allActions.filter(a => {
            const actionDossierId = a.dossierId || (a as any).dossier?.id;
            return actionDossierId !== this.selectedDossierId;
          });
          this.allActions.push(...actions);
          this.actionsByDossier[this.selectedDossierId!] = actions;
          this.calculateStats();
          this.isLoadingActions = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des actions:', error);
          this.toastService.error('Erreur lors du chargement des actions');
          this.isLoadingActions = false;
        }
      });
  }

  /**
   * Calcule les statistiques
   */
  calculateStats(): void {
    this.stats.totalDossiers = this.dossiers.length;
    this.stats.totalActions = this.allActions.length;
    this.stats.conservatoireActions = this.allActions.filter(a => a.typeAction === TypeActionHuissier.ACLA_TA7AFOUDHIA).length;
    this.stats.executiveActions = this.allActions.filter(a => a.typeAction === TypeActionHuissier.ACLA_TANFITHIA).length;
    this.stats.blocageActions = this.allActions.filter(a => a.typeAction === TypeActionHuissier.ACLA_TAW9IFIYA).length;
    this.stats.immobiliereActions = this.allActions.filter(a => a.typeAction === TypeActionHuissier.ACLA_A9ARYA).length;
  }

  /**
   * Applique les filtres de recherche
   */
  applyFilters(): void {
    let filtered = [...this.dossiers];

    // Filtre par recherche
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(dossier => {
        const numeroMatch = dossier.numeroDossier?.toLowerCase().includes(searchLower);
        const creancierMatch = this.getCreancierName(dossier).toLowerCase().includes(searchLower);
        const debiteurMatch = this.getDebiteurName(dossier).toLowerCase().includes(searchLower);
        const huissierMatch = this.getHuissierName(dossier).toLowerCase().includes(searchLower);
        return numeroMatch || creancierMatch || debiteurMatch || huissierMatch;
      });
    }

    // Filtre par type d'action
    if (this.filterType !== 'all') {
      filtered = filtered.filter(dossier => {
        const actions = this.getActionsForDossier(dossier.id);
        const etape = this.getEtapeHuissier(dossier);
        
        // Toujours afficher les dossiers passés aux audiences pour l'historique
        if (etape === 'EN_AUDIENCES') {
          return true;
        }
        
        // Pour les autres dossiers, appliquer le filtre normalement
        if (actions.length === 0) return false;
        
        switch (this.filterType) {
          case 'conservatoire':
            return actions.some(a => a.typeAction === TypeActionHuissier.ACLA_TA7AFOUDHIA);
          case 'executive':
            return actions.some(a => a.typeAction === TypeActionHuissier.ACLA_TANFITHIA);
          case 'blocage':
            return actions.some(a => a.typeAction === TypeActionHuissier.ACLA_TAW9IFIYA);
          case 'immobiliere':
            return actions.some(a => a.typeAction === TypeActionHuissier.ACLA_A9ARYA);
          default:
            return true;
        }
      });
    }

    this.filteredDossiers = filtered;
  }

  /**
   * Obtient les actions d'un dossier
   */
  getActionsForDossier(dossierId: number | null): ActionHuissier[] {
    if (!dossierId) return [];
    return this.actionsByDossier[dossierId] || [];
  }

  /**
   * Obtient les actions filtrées d'un dossier
   */
  getFilteredActionsForDossier(dossierId: number | null): ActionHuissier[] {
    const actions = this.getActionsForDossier(dossierId);
    if (this.filterType === 'all') return actions;
    
    return actions.filter(action => {
      switch (this.filterType) {
        case 'conservatoire':
          return action.typeAction === TypeActionHuissier.ACLA_TA7AFOUDHIA;
        case 'executive':
          return action.typeAction === TypeActionHuissier.ACLA_TANFITHIA;
        case 'blocage':
          return action.typeAction === TypeActionHuissier.ACLA_TAW9IFIYA;
        case 'immobiliere':
          return action.typeAction === TypeActionHuissier.ACLA_A9ARYA;
        default:
          return true;
      }
    });
  }

  /**
   * Obtient le nom du créancier
   */
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

  /**
   * Obtient le nom du débiteur
   */
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

  /**
   * Obtient le nom de l'huissier
   */
  getHuissierName(dossier: DossierApi): string {
    if (dossier.huissier) {
      return `${dossier.huissier.prenom || ''} ${dossier.huissier.nom || ''}`.trim() || 'N/A';
    }
    return 'Non affecté';
  }

  /**
   * Vérifie si le dossier a un huissier affecté
   */
  hasHuissier(dossier: DossierApi): boolean {
    return !!dossier.huissier;
  }

  /**
   * TrackBy pour améliorer les performances
   */
  trackByDossierId(index: number, dossier: DossierApi): any {
    return dossier.id || index;
  }

  /**
   * TrackBy pour les actions
   */
  trackByActionId(index: number, action: ActionHuissier): any {
    return action.id || index;
  }

  /**
   * Ouvre le formulaire de création d'action
   */
  openActionForm(action?: ActionHuissier): void {
    if (!this.selectedDossierId) {
      this.toastService.error('Veuillez sélectionner un dossier d\'abord');
      return;
    }
    
    if (action) {
      // Mode édition
      this.isEditActionMode = true;
      this.selectedAction = action;
      this.actionForm = {
        dossierId: action.dossierId,
        typeAction: action.typeAction,
        huissierName: action.huissierName,
        montantRecouvre: action.montantRecouvre,
        montantRestant: action.montantRestant,
        etatDossier: action.etatDossier,
        pieceJointeUrl: action.pieceJointeUrl,
        updateMode: 'ADD'
      };
      this.selectedFile = null;
    } else {
      // Mode création
      this.isEditActionMode = false;
      this.selectedAction = null;
      
      // S'assurer que selectedDossier est défini
      if (!this.selectedDossier && this.selectedDossierId) {
        this.selectedDossier = this.dossiers.find(d => d.id === this.selectedDossierId) || null;
      }
      
      // Récupérer le nom de l'huissier depuis le dossier sélectionné
      const huissierName = this.selectedDossier ? this.getHuissierName(this.selectedDossier) : '';
      
      if (!huissierName || huissierName === 'Non affecté' || huissierName === 'N/A') {
        this.toastService.warning('Aucun huissier affecté à ce dossier. Veuillez affecter un huissier d\'abord.');
        return;
      }
      
      this.actionForm = {
        dossierId: this.selectedDossierId,
        typeAction: TypeActionHuissier.ACLA_TA7AFOUDHIA,
        huissierName: huissierName,
        montantRecouvre: undefined,
        montantRestant: undefined,
        etatDossier: undefined,
        pieceJointeUrl: undefined,
        updateMode: 'ADD'
      };
      this.selectedFile = null;
      
      // Calculer le montant restant initial
      this.calculateMontantRestant();
    }
    this.showActionForm = true;
  }

  /**
   * Gère la sélection d'un fichier
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Valider la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.error('Le fichier est trop volumineux. Taille maximale : 10MB');
        return;
      }
      // Valider le type (PDF, images)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        this.toastService.error('Type de fichier non autorisé. Formats acceptés : PDF, JPEG, PNG');
        return;
      }
      this.selectedFile = file;
    }
  }

  /**
   * Calcule le montant restant automatiquement
   * Montant Restant = Montant Total du Dossier - Montant Recouvré (cumulé)
   */
  calculateMontantRestant(): void {
    if (!this.selectedDossier) {
      this.actionForm.montantRestant = undefined;
      return;
    }

    // Récupérer le montant total du dossier
    const montantTotal = this.selectedDossier.montantCreance || 0;
    
    // Récupérer le montant déjà recouvré (depuis le dossier ou les actions précédentes)
    const montantDejaRecouvre = this.getMontantRecouvreCumule();
    
    // Calculer le montant recouvré avec cette nouvelle action
    const montantRecouvreActuel = this.actionForm.montantRecouvre || 0;
    const montantRecouvreTotal = montantDejaRecouvre + montantRecouvreActuel;
    
    // Calculer le montant restant
    const montantRestant = montantTotal - montantRecouvreTotal;
    
    // S'assurer que le montant restant n'est pas négatif
    this.actionForm.montantRestant = Math.max(0, montantRestant);
    
    console.log('💰 Calcul montant restant:', {
      montantTotal,
      montantDejaRecouvre,
      montantRecouvreActuel,
      montantRecouvreTotal,
      montantRestant: this.actionForm.montantRestant
    });
  }

  /**
   * Récupère le montant déjà recouvré (cumulé) pour ce dossier
   */
  private getMontantRecouvreCumule(): number {
    if (!this.selectedDossier || !this.selectedDossier.id) {
      return 0;
    }

    // Récupérer toutes les actions existantes pour ce dossier
    const actions = this.getActionsForDossier(this.selectedDossier.id);
    
    // Si on est en mode édition, exclure l'action actuelle du calcul
    const actionsToCount = this.isEditActionMode && this.selectedAction
      ? actions.filter(a => a.id !== this.selectedAction!.id)
      : actions;
    
    // Calculer le montant recouvré cumulé
    const montantCumule = actionsToCount.reduce((total, action) => {
      return total + (action.montantRecouvre || 0);
    }, 0);
    
    // Vérifier aussi dans le dossier lui-même (si disponible)
    const dossierAny = this.selectedDossier as any;
    const montantRecouvreDossier = dossierAny.montantRecouvre || 
                                    dossierAny.finance?.montantRecouvre || 
                                    dossierAny.finance?.montantRecupere || 
                                    0;
    
    // Prendre le maximum entre les deux (pour éviter les doublons)
    return Math.max(montantCumule, montantRecouvreDossier);
  }

  /**
   * Gère le changement du montant recouvré
   */
  onMontantRecouvreChange(): void {
    this.calculateMontantRestant();
  }

  /**
   * Crée ou met à jour une action
   */
  createAction(): void {
    if (!this.actionForm.dossierId || !this.actionForm.typeAction || !this.actionForm.huissierName) {
      this.toastService.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading = true;
    
    const operation = this.isEditActionMode && this.selectedAction?.id
      ? this.actionService.updateActionWithFile(this.selectedAction.id, this.actionForm, this.selectedFile || undefined)
      : this.actionService.createActionWithFile(this.actionForm, this.selectedFile || undefined);

    const isEdit = this.isEditActionMode;
    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (action) => {
          console.log(`Action ${isEdit ? 'modifiée' : 'créée'} avec succès:`, action);
          this.showActionForm = false;
          this.isEditActionMode = false;
          this.selectedAction = null;
          this.selectedFile = null;
          this.loadActions();
          this.loadAllActions(); // Recharger toutes les actions pour mettre à jour la vue
          this.isLoading = false;
          this.toastService.success(`Action ${isEdit ? 'modifiée' : 'créée'} avec succès`);
          // Recalculer la prédiction IA après l'action
          if (this.selectedDossierId) {
            this.recalculatePredictionAfterAction(this.selectedDossierId);
          }
        },
        error: (error) => {
          console.error(`Erreur lors de la ${isEdit ? 'modification' : 'création'} de l'action:`, error);
          this.isLoading = false;
          this.toastService.error(`Erreur lors de la ${isEdit ? 'modification' : 'création'} de l'action: ` + (error.error?.message || error.message));
        }
      });
  }

  /**
   * Supprime une action
   */
  deleteAction(action: ActionHuissier): void {
    if (!action.id) {
      this.toastService.error('Action invalide');
      return;
    }

    const actionType = this.getActionTypeLabel(action.typeAction);
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'action "${actionType}" ?`)) {
      this.isLoading = true;
      this.actionService.deleteAction(action.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Action supprimée avec succès');
            this.loadActions();
            this.loadAllActions(); // Recharger toutes les actions pour mettre à jour la vue
            this.isLoading = false;
            // Recalculer la prédiction IA après la suppression
            if (action.dossierId) {
              this.recalculatePredictionAfterAction(action.dossierId);
            }
          },
          error: (error) => {
            console.error('Erreur lors de la suppression de l\'action:', error);
            this.toastService.error('Erreur lors de la suppression de l\'action: ' + (error.error?.message || error.message));
            this.isLoading = false;
          }
        });
    }
  }

  /**
   * Visualise une action
   */
  viewAction(action: ActionHuissier): void {
    this.selectedAction = action;
    this.showActionView = true;
  }

  /**
   * Ferme la vue d'une action
   */
  closeActionView(): void {
    this.selectedAction = null;
    this.showActionView = false;
  }

  /**
   * Passe aux audiences (transition de workflow)
   */
  passerAuxAudiences(): void {
    if (!this.selectedDossierId) {
      this.toastService.error('Veuillez sélectionner un dossier');
      return;
    }

    if (this.actions.length === 0) {
      this.toastService.error('Vous devez créer au moins une action avant de passer aux audiences');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir passer aux audiences ? Cette action ne peut pas être annulée.')) {
      return;
    }

    this.isLoading = true;
    this.actionService.passerAuxAudiences(this.selectedDossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossier) => {
          console.log('Dossier passé aux audiences:', dossier);
          this.toastService.success('Dossier passé aux audiences avec succès');
          this.isLoading = false;
          // Recharger les dossiers et actions pour mettre à jour la liste
          this.loadDossiers();
          this.loadAllActions();
          // Réinitialiser la sélection
          this.selectedDossierId = null;
          this.selectedDossier = null;
          this.actions = [];
          this.documents = [];
        },
        error: (error) => {
          console.error('Erreur lors du passage aux audiences:', error);
          this.isLoading = false;
          this.toastService.error('Erreur lors du passage aux audiences: ' + (error.error?.message || error.message));
        }
      });
  }

  /**
   * Vérifie si le bouton "Passer aux Audiences" peut être activé
   */
  canPasserAuxAudiences(dossier: DossierApi): boolean {
    if (!dossier || !dossier.id) return false;
    const actions = this.getActionsForDossier(dossier.id);
    return actions.length > 0 && this.canCreateAction(dossier);
  }

  /**
   * Récupère le nom complet de l'huissier sélectionné
   */
  getSelectedHuissierName(): string {
    if (!this.selectedHuissierId) return '';
    const huissier = this.huissiers.find(h => h.id === this.selectedHuissierId);
    return huissier ? `${huissier.prenom} ${huissier.nom}` : '';
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
   * Formate le type d'action pour l'affichage
   */
  getActionTypeLabel(type: TypeActionHuissier): string {
    const labels: { [key: string]: string } = {
      [TypeActionHuissier.ACLA_TA7AFOUDHIA]: 'Saisie Conservatoire (العقلة التحفظية)',
      [TypeActionHuissier.ACLA_TANFITHIA]: 'Saisie Exécutive (العقلة التنفيذية)',
      [TypeActionHuissier.ACLA_TAW9IFIYA]: 'Saisie de Blocage (العقلة التوقيفية)',
      [TypeActionHuissier.ACLA_A9ARYA]: 'Saisie Immobilière (العقلة العقارية)'
    };
    return labels[type] || type;
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
   * Formate l'état du dossier
   */
  getEtatDossierLabel(etat?: EtatDossier): string {
    const labels: { [key: string]: string } = {
      [EtatDossier.EN_COURS]: 'En Cours',
      [EtatDossier.CLOTURE]: 'Clôturé',
      [EtatDossier.SUSPENDU]: 'Suspendu'
    };
    return labels[etat || ''] || etat || 'N/A';
  }

  /**
   * Ouvre un document dans un nouvel onglet
   */
  openDocument(url: string): void {
    if (url) {
      window.open(url, '_blank');
    } else {
      this.toastService.warning('Aucune pièce jointe disponible');
    }
  }

  /**
   * Ferme le formulaire d'action
   */
  closeActionForm(): void {
    this.showActionForm = false;
    this.isEditActionMode = false;
    this.selectedAction = null;
    this.selectedFile = null;
    this.actionForm = {
      dossierId: 0,
      typeAction: TypeActionHuissier.ACLA_TA7AFOUDHIA,
      huissierName: '',
      montantRecouvre: undefined,
      montantRestant: undefined,
      etatDossier: undefined,
      pieceJointeUrl: undefined,
      updateMode: 'ADD'
    };
  }

  /**
   * Récupère l'étape actuelle du dossier pour l'affichage
   */
  getDossierEtape(dossier: DossierApi): string {
    // Si le backend renvoie etape_huissier, l'utiliser
    const etape = this.getEtapeHuissier(dossier);
    if (etape) {
      const labels: { [key: string]: string } = {
        'EN_ATTENTE_DOCUMENTS': 'En attente documents',
        'EN_DOCUMENTS': 'Documents',
        'EN_ACTIONS': 'Actions',
        'EN_AUDIENCES': 'Audiences'
      };
      return labels[etape] || etape;
    }
    return 'N/A';
  }

  /**
   * Extrait etape_huissier depuis le dossier (peut être dans différentes propriétés)
   */
  private getEtapeHuissier(dossier: DossierApi): string | undefined {
    const dossierAny = dossier as any;
    // Essayer différents noms possibles
    return dossierAny.etape_huissier || 
           dossierAny.etapeHuissier || 
           dossierAny['etape_huissier'] ||
           undefined;
  }

  /**
   * Vérifie si le dossier est à l'étape actions (pour permettre la création)
   */
  canCreateAction(dossier: DossierApi): boolean {
    if (!dossier) return false;
    const etape = this.getEtapeHuissier(dossier);
    // Permettre la création si à l'étape actions
    return etape === 'EN_ACTIONS';
  }

  /**
   * Récupère les audiences d'un dossier spécifique
   */
  getAudiencesForDossier(dossierId: number | null): Audience[] {
    if (!dossierId || !this.audiences || this.audiences.length === 0) {
      return [];
    }
    
    // Filtrer les audiences qui correspondent à ce dossier
    return this.audiences.filter(audience => {
      // Vérifier si l'audience a un dossierId qui correspond
      const audienceDossierId = audience.dossierId || (audience as any).dossier_id;
      return audienceDossierId === dossierId;
    });
  }

  /**
   * Vérifie si un dossier peut être affecté au finance
   * Conditions : le dossier doit avoir au moins une action OU une audience
   * INDÉPENDAMMENT de l'étape (documents, actions, audiences)
   */
  canAffecterAuFinance(dossier: DossierApi): boolean {
    if (!dossier || !dossier.id) return false;
    
    // Vérifier si le dossier a au moins une action
    const dossierActions = this.getActionsForDossier(dossier.id);
    const hasActions = dossierActions.length > 0;
    
    // Vérifier si le dossier a au moins une audience
    const dossierAudiences = this.getAudiencesForDossier(dossier.id);
    const hasAudiences = dossierAudiences.length > 0;
    
    // Le dossier peut être affecté s'il a au moins une action OU une audience
    return hasActions || hasAudiences;
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
                    `Créancier: ${this.selectedDossier.creancier?.nom || 'N/A'}\n` +
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
          }
          
          // Recharger les dossiers pour mettre à jour la liste
          this.loadDossiers();
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
    this.loadingPrediction = true;
    this.iaPredictionService.predictForDossier(dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prediction) => {
          this.predictions[dossierId] = prediction;
          this.loadingPrediction = false;
          
          // Mettre à jour le dossier dans la liste avec la nouvelle prédiction
          const dossier = this.dossiers.find(d => d.id === dossierId);
          if (dossier) {
            dossier.etatPrediction = prediction.etatFinal;
            dossier.riskScore = prediction.riskScore;
            dossier.riskLevel = prediction.riskLevel;
            dossier.datePrediction = prediction.datePrediction;
          }
          
          // Mettre à jour la prédiction pour le dossier sélectionné si c'est le même
          if (this.selectedDossierId === dossierId) {
            this.prediction = prediction;
          }
          
          this.toastService.success('Prédiction IA calculée avec succès');
        },
        error: (error) => {
          console.error('❌ Erreur lors de la prédiction IA:', error);
          this.loadingPrediction = false;
          this.toastService.error('Erreur lors du calcul de la prédiction IA');
        }
      });
  }

  /**
   * Recalcule automatiquement la prédiction IA après une action huissier
   */
  recalculatePredictionAfterAction(dossierId: number): void {
    // Attendre un peu pour que le backend mette à jour les données
    setTimeout(() => {
      this.triggerPrediction(dossierId);
    }, 1000);
  }
}
