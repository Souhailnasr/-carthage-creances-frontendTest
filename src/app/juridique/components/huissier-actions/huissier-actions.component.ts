import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
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

@Component({
  selector: 'app-huissier-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './huissier-actions.component.html',
  styleUrls: ['./huissier-actions.component.scss']
})
export class HuissierActionsComponent implements OnInit, OnDestroy {
  // Données
  dossiers: DossierApi[] = [];
  huissiers: Huissier[] = [];
  selectedDossierId: number | null = null;
  selectedHuissierId: number | null = null;
  selectedDossier: DossierApi | null = null;
  
  // Documents du dossier sélectionné
  documents: DocumentHuissier[] = [];
  
  // Audiences (pour vérifier si le dossier peut être affecté au finance)
  audiences: Audience[] = [];
  
  // Toutes les actions (pour vérifier si un dossier peut être affecté au finance)
  allActions: ActionHuissier[] = [];
  
  // Actions du dossier sélectionné
  actions: ActionHuissier[] = [];
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
  
  private destroy$ = new Subject<void>();

  constructor(
    private dossierApiService: DossierApiService,
    private huissierService: HuissierService,
    private actionService: HuissierActionService,
    private documentService: HuissierDocumentService,
    private audienceService: AudienceService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDossiers();
    this.loadHuissiers();
    this.loadAllAudiences();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge la liste de TOUS les dossiers juridiques pour la traçabilité complète
   * (même ceux passés aux audiences - pour voir l'historique des actions)
   */
  loadDossiers(): void {
    this.isLoadingDossiers = true;
    // Charger tous les dossiers juridiques pour avoir une vue complète avec traçabilité
    this.dossierApiService.getDossiersRecouvrementJuridique(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          if (page && Array.isArray(page.content)) {
            this.dossiers = page.content;
          } else if (Array.isArray(page)) {
            this.dossiers = page;
          } else {
            this.dossiers = [];
          }
          this.isLoadingDossiers = false;
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
   */
  loadAllAudiences(): void {
    this.audienceService.getAllAudiences()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (audiences) => {
          this.audiences = audiences || [];
          console.log('✅ Audiences chargées:', this.audiences.length);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des audiences:', error);
          this.audiences = [];
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
      // Charger les actions dans allActions pour référence future
      this.loadActionsForDossier(dossierId);
    } else {
      this.documents = [];
      this.actions = [];
    }
  }

  /**
   * Charge les actions d'un dossier et les ajoute à allActions pour référence
   */
  loadActionsForDossier(dossierId: number): void {
    this.actionService.getActionsByDossier(dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (actions) => {
          // Retirer les anciennes actions de ce dossier
          this.allActions = this.allActions.filter(a => {
            const actionDossierId = a.dossierId || (a as any).dossier?.id;
            return actionDossierId !== dossierId;
          });
          // Ajouter les nouvelles actions
          this.allActions.push(...actions);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des actions pour référence:', error);
        }
      });
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
          // Mettre à jour allActions pour référence future
          // Retirer les anciennes actions de ce dossier
          this.allActions = this.allActions.filter(a => {
            const actionDossierId = a.dossierId || (a as any).dossier?.id;
            return actionDossierId !== this.selectedDossierId;
          });
          // Ajouter les nouvelles actions
          this.allActions.push(...actions);
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
      this.actionForm = {
        dossierId: this.selectedDossierId,
        typeAction: TypeActionHuissier.ACLA_TA7AFOUDHIA,
        huissierName: this.getSelectedHuissierName(),
        montantRecouvre: undefined,
        montantRestant: undefined,
        etatDossier: undefined,
        pieceJointeUrl: undefined,
        updateMode: 'ADD'
      };
      this.selectedFile = null;
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
          this.isLoading = false;
          this.toastService.success(`Action ${isEdit ? 'modifiée' : 'créée'} avec succès`);
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
            this.isLoading = false;
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
          // Recharger les dossiers pour mettre à jour la liste
          this.loadDossiers();
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
  canPasserAuxAudiences(): boolean {
    return this.selectedDossierId !== null && this.actions.length > 0;
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
    // Si le backend renvoie etapeHuissier, l'utiliser
    if ((dossier as any).etapeHuissier) {
      const etape = (dossier as any).etapeHuissier;
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
   * Vérifie si le dossier est à l'étape actions (pour permettre la création)
   */
  canCreateAction(dossier: DossierApi): boolean {
    if (!dossier) return false;
    const etape = (dossier as any).etapeHuissier;
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
   * Récupère les actions d'un dossier spécifique
   */
  getActionsForDossier(dossierId: number | null): ActionHuissier[] {
    if (!dossierId || !this.allActions || this.allActions.length === 0) {
      // Si c'est le dossier sélectionné, utiliser this.actions
      if (this.selectedDossierId === dossierId) {
        return this.actions;
      }
      return [];
    }
    
    // Filtrer les actions qui correspondent à ce dossier
    return this.allActions.filter(action => {
      const actionDossierId = action.dossierId || (action as any).dossier?.id;
      return actionDossierId === dossierId;
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
      this.toastService.error('Ce dossier doit avoir au moins une audience pour être affecté au finance');
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
}

