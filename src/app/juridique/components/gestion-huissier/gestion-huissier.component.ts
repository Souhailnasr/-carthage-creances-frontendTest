import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { HuissierService } from '../../services/huissier.service';
import { HuissierDocumentService } from '../../services/huissier-document.service';
import { HuissierActionService } from '../../services/huissier-action.service';
import { Huissier } from '../../models/huissier.model';
import { DocumentHuissier, DocumentHuissierDTO, TypeDocumentHuissier, StatutDocumentHuissier } from '../../models/huissier-document.model';
import { ActionHuissier, ActionHuissierDTO, TypeActionHuissier, EtatDossier } from '../../models/huissier-action.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-gestion-huissier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-huissier.component.html',
  styleUrls: ['./gestion-huissier.component.scss']
})
export class GestionHuissierComponent implements OnInit, OnDestroy {
  // Onglets
  activeTab: 'documents' | 'actions' = 'documents';
  
  // Données
  dossiers: DossierApi[] = [];
  huissiers: Huissier[] = [];
  selectedDossierId: number | null = null;
  selectedHuissierId: number | null = null;
  selectedDossier: DossierApi | null = null;
  
  // Documents
  documents: DocumentHuissier[] = [];
  showDocumentForm = false;
  showDocumentView = false;
  selectedDocument: DocumentHuissier | null = null;
  isEditDocumentMode = false;
  documentForm: DocumentHuissierDTO = {
    dossierId: 0,
    typeDocument: TypeDocumentHuissier.PV_MISE_EN_DEMEURE,
    huissierName: '',
    pieceJointeUrl: undefined
  };
  
  // Actions
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
  
  // Enums pour les templates
  TypeDocumentHuissier = TypeDocumentHuissier;
  TypeActionHuissier = TypeActionHuissier;
  StatutDocumentHuissier = StatutDocumentHuissier;
  EtatDossier = EtatDossier;
  
  // États de chargement
  isLoading = false;
  isLoadingDocuments = false;
  isLoadingActions = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private dossierApiService: DossierApiService,
    private huissierService: HuissierService,
    private documentService: HuissierDocumentService,
    private actionService: HuissierActionService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDossiers();
    this.loadHuissiers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge la liste des dossiers juridiques
   */
  loadDossiers(): void {
    this.isLoading = true;
    this.dossierApiService.getDossiersRecouvrementJuridique(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          if (page && Array.isArray(page.content)) {
            this.dossiers = page.content;
            this.isLoading = false;
          } else {
            this.dossiers = [];
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement des dossiers:', error);
          this.toastService.error('Erreur lors du chargement des dossiers');
          this.isLoading = false;
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
   * Change d'onglet
   */
  switchTab(tab: 'documents' | 'actions'): void {
    // Permettre le changement d'onglet même sans dossier sélectionné
    // (l'utilisateur pourra voir le message "Sélectionnez un dossier")
    this.activeTab = tab;
    
    // Charger les données seulement si un dossier est sélectionné
    if (this.selectedDossierId) {
      if (tab === 'documents') {
        this.loadDocuments();
      } else if (tab === 'actions') {
        this.loadActions();
      }
    } else {
      // Réinitialiser les listes si aucun dossier n'est sélectionné
      if (tab === 'documents') {
        this.documents = [];
        this.isLoadingDocuments = false;
      } else if (tab === 'actions') {
        this.actions = [];
        this.isLoadingActions = false;
      }
    }
  }

  /**
   * Sélectionne un dossier et charge ses documents/actions
   */
  onDossierSelected(dossierId: number | null): void {
    this.selectedDossierId = dossierId;
    this.selectedDossier = this.dossiers.find(d => d.id === dossierId) || null;
    
    if (dossierId) {
      if (this.activeTab === 'documents') {
        this.loadDocuments();
      } else {
        this.loadActions();
      }
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
    this.documentService.getDocumentsByDossier(this.selectedDossierId)
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
    if (!this.selectedDossierId) return;
    
    this.isLoadingActions = true;
    this.actionService.getActionsByDossier(this.selectedDossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (actions) => {
          this.actions = actions;
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
   * Ouvre le formulaire de création de document
   */
  openDocumentForm(document?: DocumentHuissier): void {
    if (!this.selectedDossierId) {
      this.toastService.error('Veuillez sélectionner un dossier d\'abord');
      return;
    }
    
    if (document) {
      // Mode édition
      this.isEditDocumentMode = true;
      this.selectedDocument = document;
      this.documentForm = {
        dossierId: document.dossierId,
        typeDocument: document.typeDocument,
        huissierName: document.huissierName,
        pieceJointeUrl: document.pieceJointeUrl
      };
    } else {
      // Mode création
      this.isEditDocumentMode = false;
      this.selectedDocument = null;
      this.documentForm = {
        dossierId: this.selectedDossierId,
        typeDocument: TypeDocumentHuissier.PV_MISE_EN_DEMEURE,
        huissierName: this.getSelectedHuissierName(),
        pieceJointeUrl: undefined
      };
    }
    this.showDocumentForm = true;
  }

  /**
   * Visualise un document
   */
  viewDocument(document: DocumentHuissier): void {
    this.selectedDocument = document;
    this.showDocumentView = true;
  }

  /**
   * Ferme la vue d'un document
   */
  closeDocumentView(): void {
    this.selectedDocument = null;
    this.showDocumentView = false;
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
    }
    this.showActionForm = true;
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
   * Récupère le nom complet de l'huissier sélectionné
   */
  getSelectedHuissierName(): string {
    if (!this.selectedHuissierId) return '';
    const huissier = this.huissiers.find(h => h.id === this.selectedHuissierId);
    return huissier ? `${huissier.prenom} ${huissier.nom}` : '';
  }

  /**
   * Crée ou met à jour un document
   */
  createDocument(): void {
    if (!this.documentForm.dossierId || !this.documentForm.typeDocument || !this.documentForm.huissierName) {
      this.toastService.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading = true;
    
    const operation = this.isEditDocumentMode && this.selectedDocument?.id
      ? this.documentService.updateDocument(this.selectedDocument.id, this.documentForm)
      : this.documentService.createDocument(this.documentForm);

    const isEdit = this.isEditDocumentMode;
    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (document) => {
          console.log(`Document ${isEdit ? 'modifié' : 'créé'} avec succès:`, document);
          this.showDocumentForm = false;
          this.isEditDocumentMode = false;
          this.selectedDocument = null;
          this.loadDocuments();
          this.isLoading = false;
          this.toastService.success(`Document ${isEdit ? 'modifié' : 'créé'} avec succès`);
        },
        error: (error) => {
          console.error(`Erreur lors de la ${isEdit ? 'modification' : 'création'} du document:`, error);
          this.isLoading = false;
          this.toastService.error(`Erreur lors de la ${isEdit ? 'modification' : 'création'} du document: ` + (error.error?.message || error.message));
        }
      });
  }

  /**
   * Supprime un document
   */
  deleteDocument(document: DocumentHuissier): void {
    if (!document.id) {
      this.toastService.error('Document invalide');
      return;
    }

    const documentType = this.getDocumentTypeLabel(document.typeDocument);
    if (confirm(`Êtes-vous sûr de vouloir supprimer le document "${documentType}" ?`)) {
      this.isLoading = true;
      this.documentService.deleteDocument(document.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Document supprimé avec succès');
            this.loadDocuments();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur lors de la suppression du document:', error);
            this.toastService.error('Erreur lors de la suppression du document: ' + (error.error?.message || error.message));
            this.isLoading = false;
          }
        });
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
      ? this.actionService.updateAction(this.selectedAction.id, this.actionForm)
      : this.actionService.createAction(this.actionForm);

    const isEdit = this.isEditActionMode;
    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (action) => {
          console.log(`Action ${isEdit ? 'modifiée' : 'créée'} avec succès:`, action);
          this.showActionForm = false;
          this.isEditActionMode = false;
          this.selectedAction = null;
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
   * Formate le type de document pour l'affichage
   */
  getDocumentTypeLabel(type: TypeDocumentHuissier): string {
    const labels: { [key: string]: string } = {
      [TypeDocumentHuissier.PV_MISE_EN_DEMEURE]: 'PV Mise en Demeure',
      [TypeDocumentHuissier.ORDONNANCE_PAIEMENT]: 'Ordonnance de Paiement',
      [TypeDocumentHuissier.PV_NOTIFICATION_ORDONNANCE]: 'PV Notification Ordonnance'
    };
    return labels[type] || type;
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
   * Calcule la date d'expiration d'un document
   */
  getExpirationDate(document: DocumentHuissier): string {
    if (!document.dateCreation || !document.delaiLegalDays) return '';
    const date = new Date(document.dateCreation);
    date.setDate(date.getDate() + document.delaiLegalDays);
    return this.formatDate(date.toISOString());
  }

  /**
   * Vérifie si un document est expiré
   */
  isDocumentExpired(document: DocumentHuissier): boolean {
    if (!document.dateCreation || !document.delaiLegalDays) return false;
    const expirationDate = new Date(document.dateCreation);
    expirationDate.setDate(expirationDate.getDate() + document.delaiLegalDays);
    return new Date() > expirationDate;
  }

  /**
   * Ouvre un document dans un nouvel onglet
   */
  openDocument(url: string): void {
    if (url) {
      window.open(url, '_blank');
    } else {
      this.toastService.warning('Aucune pièce jointe disponible pour ce document');
    }
  }

  /**
   * Ferme le formulaire de document
   */
  closeDocumentForm(): void {
    this.showDocumentForm = false;
    this.isEditDocumentMode = false;
    this.selectedDocument = null;
    this.documentForm = {
      dossierId: 0,
      typeDocument: TypeDocumentHuissier.PV_MISE_EN_DEMEURE,
      huissierName: '',
      pieceJointeUrl: undefined
    };
  }

  /**
   * Ferme le formulaire d'action
   */
  closeActionForm(): void {
    this.showActionForm = false;
    this.isEditActionMode = false;
    this.selectedAction = null;
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
   * Formate le statut du document
   */
  getStatusLabel(status?: StatutDocumentHuissier): string {
    const labels: { [key: string]: string } = {
      [StatutDocumentHuissier.PENDING]: 'En attente',
      [StatutDocumentHuissier.EXPIRED]: 'Expiré',
      [StatutDocumentHuissier.COMPLETED]: 'Complété'
    };
    return labels[status || ''] || status || 'N/A';
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
}

