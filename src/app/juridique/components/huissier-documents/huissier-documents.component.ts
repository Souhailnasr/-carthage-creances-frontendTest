import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { HuissierService } from '../../services/huissier.service';
import { HuissierDocumentService } from '../../services/huissier-document.service';
import { Huissier } from '../../models/huissier.model';
import { DocumentHuissier, DocumentHuissierDTO, TypeDocumentHuissier, StatutDocumentHuissier } from '../../models/huissier-document.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-huissier-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './huissier-documents.component.html',
  styleUrls: ['./huissier-documents.component.scss']
})
export class HuissierDocumentsComponent implements OnInit, OnDestroy {
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
  selectedFile: File | null = null;
  
  // Enums pour les templates
  TypeDocumentHuissier = TypeDocumentHuissier;
  StatutDocumentHuissier = StatutDocumentHuissier;
  
  // États de chargement
  isLoading = false;
  isLoadingDocuments = false;
  isLoadingDossiers = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private dossierApiService: DossierApiService,
    private huissierService: HuissierService,
    private documentService: HuissierDocumentService,
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
   * Charge la liste de TOUS les dossiers juridiques pour la traçabilité
   * (même ceux passés aux actions ou audiences)
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
   * Sélectionne un dossier et charge ses documents
   */
  onDossierSelected(dossierId: number | null): void {
    this.selectedDossierId = dossierId;
    this.selectedDossier = this.dossiers.find(d => d.id === dossierId) || null;
    if (dossierId) {
      this.loadDocuments();
    } else {
      this.documents = [];
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
      this.selectedFile = null;
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
      this.selectedFile = null;
    }
    this.showDocumentForm = true;
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
   * Crée ou met à jour un document
   */
  createDocument(): void {
    if (!this.documentForm.dossierId || !this.documentForm.typeDocument || !this.documentForm.huissierName) {
      this.toastService.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading = true;
    
    const operation = this.isEditDocumentMode && this.selectedDocument?.id
      ? this.documentService.updateDocumentWithFile(this.selectedDocument.id, this.documentForm, this.selectedFile || undefined)
      : this.documentService.createDocumentWithFile(this.documentForm, this.selectedFile || undefined);

    const isEdit = this.isEditDocumentMode;
    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (document) => {
          console.log(`Document ${isEdit ? 'modifié' : 'créé'} avec succès:`, document);
          this.showDocumentForm = false;
          this.isEditDocumentMode = false;
          this.selectedDocument = null;
          this.selectedFile = null;
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
   * Marque un document comme complété
   */
  markDocumentAsCompleted(document: DocumentHuissier): void {
    if (document.status === StatutDocumentHuissier.EXPIRED) {
      this.toastService.error('Impossible de marquer un document expiré comme complété. Le délai légal est dépassé.');
      return;
    }
    
    if (document.status === StatutDocumentHuissier.COMPLETED) {
      this.toastService.warning('Ce document est déjà marqué comme complété.');
      return;
    }

    if (!document.id) {
      this.toastService.error('Document invalide');
      return;
    }

    const message = `Êtes-vous sûr de vouloir marquer ce document comme complété ?\n\n` +
                    `Type: ${this.getDocumentTypeLabel(document.typeDocument)}\n` +
                    `Date de création: ${this.formatDate(document.dateCreation)}\n` +
                    `Huissier: ${document.huissierName}`;

    if (!confirm(message)) {
      return;
    }

    this.isLoading = true;
    this.documentService.markDocumentAsCompleted(document.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedDocument) => {
          console.log('Document marqué comme complété:', updatedDocument);
          this.loadDocuments();
          this.isLoading = false;
          this.toastService.success('Document marqué comme complété avec succès');
        },
        error: (error) => {
          console.error('Erreur lors du marquage du document:', error);
          this.isLoading = false;
          
          if (error.status === 400) {
            const errorMessage = error.error?.error || error.error?.message || 'Erreur lors du marquage du document';
            this.toastService.error(errorMessage);
          } else if (error.status === 404) {
            this.toastService.error('Document non trouvé');
          } else {
            this.toastService.error('Erreur lors du marquage du document. Veuillez réessayer.');
          }
        }
      });
  }

  /**
   * Vérifie si un document peut être marqué comme complété
   */
  canMarkAsCompleted(document: DocumentHuissier): boolean {
    return document.status === StatutDocumentHuissier.PENDING;
  }

  /**
   * Passe aux actions (transition de workflow)
   */
  passerAuxActions(): void {
    if (!this.selectedDossierId) {
      this.toastService.error('Veuillez sélectionner un dossier');
      return;
    }

    if (this.documents.length === 0) {
      this.toastService.error('Vous devez créer au moins un document avant de passer aux actions');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir passer aux actions ? Cette action ne peut pas être annulée.')) {
      return;
    }

    this.isLoading = true;
    this.documentService.passerAuxActions(this.selectedDossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossier) => {
          console.log('Dossier passé aux actions:', dossier);
          this.toastService.success('Dossier passé aux actions avec succès');
          this.isLoading = false;
          // Recharger les dossiers pour mettre à jour la liste
          this.loadDossiers();
          // Réinitialiser la sélection
          this.selectedDossierId = null;
          this.selectedDossier = null;
          this.documents = [];
        },
        error: (error) => {
          console.error('Erreur lors du passage aux actions:', error);
          this.isLoading = false;
          this.toastService.error('Erreur lors du passage aux actions: ' + (error.error?.message || error.message));
        }
      });
  }

  /**
   * Vérifie si le bouton "Passer aux Actions" peut être activé
   */
  canPasserAuxActions(): boolean {
    return this.selectedDossierId !== null && this.documents.length > 0;
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
    this.selectedFile = null;
    this.documentForm = {
      dossierId: 0,
      typeDocument: TypeDocumentHuissier.PV_MISE_EN_DEMEURE,
      huissierName: '',
      pieceJointeUrl: undefined
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
   * Vérifie si le dossier est à l'étape documents (pour permettre la création)
   */
  canCreateDocument(dossier: DossierApi): boolean {
    if (!dossier) return false;
    const etape = (dossier as any).etapeHuissier;
    // Permettre la création si à l'étape documents ou en attente
    return !etape || etape === 'EN_ATTENTE_DOCUMENTS' || etape === 'EN_DOCUMENTS';
  }
}

