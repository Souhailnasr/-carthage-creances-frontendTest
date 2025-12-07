import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DossierApi, DossierStatus } from '../../../shared/models/dossier-api.model';
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
  filteredDossiers: DossierApi[] = [];
  huissiers: Huissier[] = [];
  selectedDossierId: number | null = null;
  selectedHuissierId: number | null = null;
  selectedDossier: DossierApi | null = null;
  
  // Documents - Tous les documents de tous les dossiers
  allDocuments: DocumentHuissier[] = [];
  // Documents par dossier (pour affichage)
  documentsByDossier: { [dossierId: number]: DocumentHuissier[] } = {};
  
  // Documents du dossier sélectionné (pour le formulaire)
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
  
  // Recherche et filtres
  searchTerm: string = '';
  filterType: 'all' | 'pending' | 'completed' | 'expired' = 'all';
  
  // Statistiques
  stats = {
    totalDossiers: 0,
    totalDocuments: 0,
    pendingDocuments: 0,
    completedDocuments: 0,
    expiredDocuments: 0
  };
  
  private destroy$ = new Subject<void>();

  constructor(
    private dossierApiService: DossierApiService,
    private huissierService: HuissierService,
    private documentService: HuissierDocumentService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadHuissiers();
    // Charger les dossiers d'abord, puis les documents une fois les dossiers chargés
    this.loadDossiers();
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
            this.filteredDossiers = [...this.dossiers];
            
            // 🔍 DEBUG: Vérifier les données reçues du backend
            console.log('📥 Dossiers reçus du backend:', this.dossiers.length);
            if (this.dossiers.length > 0) {
              const firstDossier = this.dossiers[0] as any;
              console.log('📥 Premier dossier brut:', firstDossier);
              console.log('📥 etape_huissier du premier dossier:', firstDossier.etape_huissier);
              console.log('📥 Toutes les clés du premier dossier:', Object.keys(firstDossier));
              
              // Vérifier tous les dossiers
              this.dossiers.forEach((d, index) => {
                const dossierAny = d as any;
                console.log(`📥 Dossier ${d.id} (index ${index}):`, {
                  id: d.id,
                  numeroDossier: d.numeroDossier,
                  etape_huissier: dossierAny.etape_huissier,
                  etapeHuissier: dossierAny.etapeHuissier,
                  toutesLesCles: Object.keys(dossierAny).filter(k => k.toLowerCase().includes('etape') || k.toLowerCase().includes('huissier'))
                });
              });
            }
          } else if (Array.isArray(page)) {
            this.dossiers = page;
            this.filteredDossiers = [...this.dossiers];
          } else {
            this.dossiers = [];
            this.filteredDossiers = [];
          }
          this.calculateStats();
          this.isLoadingDossiers = false;
          // Charger les documents une fois les dossiers chargés
          this.loadAllDocuments();
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
   * Charge tous les documents de tous les dossiers
   * Note: Le backend exige dossierId, donc on charge les documents pour chaque dossier individuellement
   */
  loadAllDocuments(): void {
    this.isLoadingDocuments = true;
    
    // Si aucun dossier n'est chargé, on ne peut pas charger les documents
    if (this.dossiers.length === 0) {
      this.allDocuments = [];
      this.documentsByDossier = {};
      this.isLoadingDocuments = false;
      return;
    }

    // Créer un tableau d'observables pour charger les documents de chaque dossier
    const documentRequests = this.dossiers
      .filter(dossier => dossier.id != null)
      .map(dossier => 
        this.documentService.getDocumentsByDossier(dossier.id!)
          .pipe(
            catchError(error => {
              console.warn(`Erreur lors du chargement des documents pour le dossier ${dossier.id}:`, error);
              return of([]); // Retourner un tableau vide en cas d'erreur
            })
          )
      );

    // Si aucun dossier valide, initialiser les structures vides
    if (documentRequests.length === 0) {
      this.allDocuments = [];
      this.documentsByDossier = {};
      this.isLoadingDocuments = false;
      return;
    }

    // Charger tous les documents en parallèle
    forkJoin(documentRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documentsArrays) => {
          // Fusionner tous les tableaux de documents
          this.allDocuments = documentsArrays.flat();
          
          // Grouper les documents par dossier
          this.documentsByDossier = {};
          this.allDocuments.forEach(doc => {
            if (doc.dossierId) {
              if (!this.documentsByDossier[doc.dossierId]) {
                this.documentsByDossier[doc.dossierId] = [];
              }
              this.documentsByDossier[doc.dossierId].push(doc);
            }
          });
          
          this.calculateStats();
          this.isLoadingDocuments = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des documents:', error);
          this.allDocuments = [];
          this.documentsByDossier = {};
          this.isLoadingDocuments = false;
        }
      });
  }

  /**
   * Charge les documents d'un dossier (pour le formulaire)
   */
  loadDocuments(): void {
    if (!this.selectedDossierId) return;
    
    this.isLoadingDocuments = true;
    this.documentService.getDocumentsByDossier(this.selectedDossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents) => {
          this.documents = documents;
          // Mettre à jour aussi allDocuments et documentsByDossier
          this.allDocuments = this.allDocuments.filter(d => d.dossierId !== this.selectedDossierId);
          this.allDocuments.push(...documents);
          this.documentsByDossier[this.selectedDossierId!] = documents;
          this.calculateStats();
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
   * Calcule les statistiques
   */
  calculateStats(): void {
    this.stats.totalDossiers = this.dossiers.length;
    this.stats.totalDocuments = this.allDocuments.length;
    this.stats.pendingDocuments = this.allDocuments.filter(d => d.status === StatutDocumentHuissier.PENDING).length;
    this.stats.completedDocuments = this.allDocuments.filter(d => d.status === StatutDocumentHuissier.COMPLETED).length;
    this.stats.expiredDocuments = this.allDocuments.filter(d => d.status === StatutDocumentHuissier.EXPIRED).length;
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
        return numeroMatch || creancierMatch || debiteurMatch;
      });
    }

    // Filtre par type de statut des documents
    if (this.filterType !== 'all') {
      filtered = filtered.filter(dossier => {
        const documents = this.getDocumentsForDossier(dossier.id);
        const etape = this.getEtapeHuissier(dossier);
        
        // Toujours afficher les dossiers passés aux audiences pour l'historique
        if (etape === 'EN_AUDIENCES') {
          return true;
        }
        
        // Pour les autres dossiers, appliquer le filtre normalement
        if (documents.length === 0) return false;
        
        switch (this.filterType) {
          case 'pending':
            return documents.some(d => d.status === StatutDocumentHuissier.PENDING);
          case 'completed':
            return documents.some(d => d.status === StatutDocumentHuissier.COMPLETED);
          case 'expired':
            return documents.some(d => d.status === StatutDocumentHuissier.EXPIRED);
          default:
            return true;
        }
      });
    }

    this.filteredDossiers = filtered;
  }

  /**
   * Obtient les documents d'un dossier
   */
  getDocumentsForDossier(dossierId: number): DocumentHuissier[] {
    return this.documentsByDossier[dossierId] || [];
  }

  /**
   * Obtient les documents filtrés d'un dossier
   */
  getFilteredDocumentsForDossier(dossierId: number): DocumentHuissier[] {
    const documents = this.getDocumentsForDossier(dossierId);
    if (this.filterType === 'all') return documents;
    
    return documents.filter(doc => {
      switch (this.filterType) {
        case 'pending':
          return doc.status === StatutDocumentHuissier.PENDING;
        case 'completed':
          return doc.status === StatutDocumentHuissier.COMPLETED;
        case 'expired':
          return doc.status === StatutDocumentHuissier.EXPIRED;
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
   * TrackBy pour les documents
   */
  trackByDocumentId(index: number, document: DocumentHuissier): any {
    return document.id || index;
  }

  /**
   * Ouvre le formulaire de document pour un dossier spécifique par ID
   * Cette méthode évite les problèmes de closure dans *ngFor
   */
  openDocumentFormForDossierById(dossierId: number): void {
    console.log('🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯');
    console.log('🎯 CLIC SUR "CRÉER DOCUMENT" POUR LE DOSSIER ID:', dossierId);
    console.log('🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯');
    
    // Trouver le dossier dans la liste
    const dossier = this.dossiers.find(d => d.id === dossierId);
    
    if (!dossier) {
      console.error('❌ Dossier avec ID', dossierId, 'non trouvé dans la liste');
      this.toastService.error('Erreur : Dossier non trouvé');
      return;
    }
    
    console.log('🎯 Dossier trouvé:', dossier);
    console.log('🎯 Numéro du dossier:', dossier.numeroDossier);
    console.log('🎯 Titre du dossier:', dossier.titre);
    
    // Appeler la méthode principale avec le dossier trouvé
    this.openDocumentFormForDossier(dossier);
  }

  /**
   * Ouvre le formulaire de document pour un dossier spécifique
   */
  openDocumentFormForDossier(dossier: DossierApi): void {
    // 🎯 LOG TRÈS VISIBLE pour identifier le dossier cliqué
    console.log('🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯');
    console.log('🎯 CLIC SUR "CRÉER DOCUMENT" POUR LE DOSSIER ID:', dossier?.id);
    console.log('🎯 Numéro du dossier:', dossier?.numeroDossier);
    console.log('🎯 Titre du dossier:', dossier?.titre);
    console.log('🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯');
    
    console.log('🔵 ========== openDocumentFormForDossier appelé ==========');
    console.log('🔵 Dossier reçu:', dossier);
    console.log('🔵 Dossier.id:', dossier?.id);
    console.log('🔵 Dossier.numeroDossier:', dossier?.numeroDossier);
    console.log('🔵 canCreateDocument:', this.canCreateDocument(dossier));
    console.log('🔵 isLoading:', this.isLoading);
    console.log('🔵 selectedDossierId AVANT:', this.selectedDossierId);
    console.log('🔵 selectedDossier AVANT:', this.selectedDossier?.id);
    
    if (!dossier) {
      console.error('❌ Dossier est null ou undefined');
      this.toastService.error('Erreur : Dossier invalide');
      return;
    }
    
    if (!dossier.id) {
      console.error('❌ Dossier.id est null ou undefined');
      this.toastService.error('Erreur : ID du dossier manquant');
      return;
    }
    
    // Vérifier si on peut créer un document pour ce dossier
    if (!this.canCreateDocument(dossier)) {
      const etape = this.getEtapeHuissier(dossier);
      if (dossier.dateCloture || dossier.statut === 'CLOTURE' || dossier.dossierStatus === DossierStatus.CLOTURE) {
        console.warn('⚠️ Impossible de créer un document pour ce dossier (clôturé)');
        this.toastService.warning('Ce dossier est clôturé. Vous ne pouvez que consulter les documents existants.');
      } else if (etape && etape !== 'EN_ATTENTE_DOCUMENTS') {
        console.warn('⚠️ Impossible de créer un document pour ce dossier (étape avancée: ' + etape + ')');
        this.toastService.warning('Les documents ne peuvent être créés qu\'à l\'étape EN_ATTENTE_DOCUMENTS. Ce dossier est passé à l\'étape ' + etape + '.');
      } else {
        console.warn('⚠️ Impossible de créer un document pour ce dossier');
        this.toastService.warning('Impossible de créer un document pour ce dossier.');
      }
      return;
    }
    
    // 🔒 FORCER la sélection du bon dossier
    this.selectedDossier = dossier;
    this.selectedDossierId = dossier.id;
    
    console.log('🔵 ========== Sélection du dossier ==========');
    console.log('🔵 selectedDossierId défini à:', this.selectedDossierId);
    console.log('🔵 selectedDossier.id:', this.selectedDossier?.id);
    console.log('🔵 Vérification: dossier.id =', dossier.id, ', selectedDossierId =', this.selectedDossierId);
    console.log('🔵 Vérification: dossier.id === selectedDossierId ?', dossier.id === this.selectedDossierId);
    
    // Vérification finale avant d'ouvrir le formulaire
    if (this.selectedDossierId !== dossier.id) {
      console.error('❌ ERREUR CRITIQUE: selectedDossierId ne correspond pas au dossier.id!');
      console.error('❌   dossier.id =', dossier.id);
      console.error('❌   selectedDossierId =', this.selectedDossierId);
      this.toastService.error('Erreur : Problème de sélection du dossier. Veuillez réessayer.');
      return;
    }
    
    this.openDocumentForm();
  }

  /**
   * Ouvre le formulaire de création de document
   */
  openDocumentForm(document?: DocumentHuissier): void {
    console.log('🔵 openDocumentForm appelé, document:', document);
    console.log('🔵 selectedDossierId:', this.selectedDossierId);
    console.log('🔵 selectedDossier:', this.selectedDossier);
    console.log('🔵 selectedDossier?.id:', this.selectedDossier?.id);
    
    // 🔍 DEBUG: Vérifier la cohérence
    if (this.selectedDossier && this.selectedDossierId !== this.selectedDossier.id) {
      console.warn('⚠️ INCOHÉRENCE détectée dans openDocumentForm:');
      console.warn('⚠️   selectedDossierId =', this.selectedDossierId);
      console.warn('⚠️   selectedDossier.id =', this.selectedDossier.id);
      // Corriger l'incohérence en utilisant selectedDossier.id
      if (this.selectedDossier.id) {
        this.selectedDossierId = this.selectedDossier.id;
        console.log('✅ selectedDossierId corrigé à:', this.selectedDossierId);
      }
    }
    
    if (!this.selectedDossierId && !document) {
      console.error('❌ Aucun dossier sélectionné');
      this.toastService.error('Veuillez sélectionner un dossier d\'abord');
      return;
    }
    
    if (document) {
      // Mode édition
      console.log('🔵 Mode édition');
      this.isEditDocumentMode = true;
      this.selectedDocument = document;
      this.selectedDossierId = document.dossierId;
      // Trouver le dossier correspondant
      this.selectedDossier = this.dossiers.find(d => d.id === document.dossierId) || null;
      this.documentForm = {
        dossierId: document.dossierId,
        typeDocument: document.typeDocument,
        huissierName: document.huissierName,
        pieceJointeUrl: document.pieceJointeUrl
      };
      this.selectedFile = null;
    } else {
      // Mode création
      console.log('🔵 Mode création');
      this.isEditDocumentMode = false;
      this.selectedDocument = null;
      
      // Récupérer le nom de l'huissier
      const huissierName = this.getSelectedHuissierName();
      console.log('🔵 Nom huissier récupéré:', huissierName);
      
      // 🔍 DEBUG: Vérifier que selectedDossierId est correct
      console.log('🔵 Avant initialisation documentForm:');
      console.log('🔵   selectedDossierId =', this.selectedDossierId);
      console.log('🔵   selectedDossier?.id =', this.selectedDossier?.id);
      
      if (!this.selectedDossierId) {
        console.error('❌ selectedDossierId est null/undefined lors de l\'initialisation du formulaire!');
        this.toastService.error('Erreur : ID du dossier manquant. Veuillez réessayer.');
        return;
      }
      
      this.documentForm = {
        dossierId: this.selectedDossierId,
        typeDocument: TypeDocumentHuissier.PV_MISE_EN_DEMEURE,
        huissierName: huissierName || '',
        pieceJointeUrl: undefined
      };
      this.selectedFile = null;
      console.log('🔵 documentForm initialisé:', this.documentForm);
      console.log('🔵 documentForm.dossierId =', this.documentForm.dossierId);
    }
    
    this.showDocumentForm = true;
    console.log('🔵 showDocumentForm défini à true');
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
    // Validation des champs obligatoires
    if (!this.documentForm.dossierId) {
      this.toastService.error('Erreur : Aucun dossier sélectionné');
      console.error('❌ Erreur création document: dossierId manquant', this.documentForm);
      return;
    }
    
    if (!this.documentForm.typeDocument) {
      this.toastService.error('Veuillez sélectionner un type de document');
      return;
    }
    
    if (!this.documentForm.huissierName || this.documentForm.huissierName.trim() === '') {
      this.toastService.error('Veuillez saisir le nom de l\'huissier');
      return;
    }

    console.log('📝 Création document:', {
      dossierId: this.documentForm.dossierId,
      selectedDossierId: this.selectedDossierId,
      selectedDossier: this.selectedDossier?.id,
      typeDocument: this.documentForm.typeDocument,
      huissierName: this.documentForm.huissierName,
      hasFile: !!this.selectedFile
    });
    
    // 🔍 DEBUG: Vérifier la cohérence des IDs
    if (this.documentForm.dossierId !== this.selectedDossierId) {
      console.warn('⚠️ INCOHÉRENCE: documentForm.dossierId (' + this.documentForm.dossierId + ') !== selectedDossierId (' + this.selectedDossierId + ')');
    }
    if (this.selectedDossier && this.documentForm.dossierId !== this.selectedDossier.id) {
      console.warn('⚠️ INCOHÉRENCE: documentForm.dossierId (' + this.documentForm.dossierId + ') !== selectedDossier.id (' + this.selectedDossier.id + ')');
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
          this.loadAllDocuments(); // Recharger tous les documents pour mettre à jour la vue
          this.isLoading = false;
          this.toastService.success(`Document ${isEdit ? 'modifié' : 'créé'} avec succès`);
        },
        error: (error) => {
          console.error(`Erreur lors de la ${isEdit ? 'modification' : 'création'} du document:`, error);
          this.isLoading = false;
          
          // Gestion améliorée des messages d'erreur
          let errorMessage = `Erreur lors de la ${isEdit ? 'modification' : 'création'} du document`;
          
          if (error?.error?.message) {
            errorMessage += `: ${error.error.message}`;
          } else if (error?.message) {
            errorMessage += `: ${error.message}`;
          } else if (error?.error) {
            errorMessage += `: ${JSON.stringify(error.error)}`;
          } else if (error?.status) {
            errorMessage += ` (Code: ${error.status})`;
          } else {
            errorMessage += '. Veuillez réessayer ou contacter le support.';
          }
          
          this.toastService.error(errorMessage);
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
          this.loadAllDocuments(); // Recharger tous les documents pour mettre à jour la vue
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
          this.loadAllDocuments(); // Recharger tous les documents pour mettre à jour la vue
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
          // Recharger les dossiers et documents pour mettre à jour la liste
          this.loadDossiers();
          this.loadAllDocuments();
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
   * Récupère le nom complet de l'huissier sélectionné ou de l'huissier du dossier
   */
  getSelectedHuissierName(): string {
    // D'abord, essayer d'utiliser l'huissier du dossier sélectionné
    if (this.selectedDossier) {
      const huissierName = this.getHuissierName(this.selectedDossier);
      if (huissierName && huissierName !== 'N/A' && !huissierName.includes('Aucun')) {
        return huissierName;
      }
    }
    
    // Sinon, utiliser selectedHuissierId si défini
    if (this.selectedHuissierId) {
      const huissier = this.huissiers.find(h => h.id === this.selectedHuissierId);
      if (huissier) {
        return `${huissier.prenom} ${huissier.nom}`;
      }
    }
    
    return '';
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
   * Le backend peut renvoyer soit etape_huissier (snake_case) soit etapeHuissier (camelCase)
   */
  private getEtapeHuissier(dossier: DossierApi): string | undefined {
    const dossierAny = dossier as any;
    
    // Essayer différents noms possibles (priorité à snake_case comme dans la base de données)
    const etape = dossierAny.etape_huissier || 
                  dossierAny.etapeHuissier || 
                  dossierAny['etape_huissier'] ||
                  dossierAny['etapeHuissier'] ||
                  undefined;
    
    // 🔇 Réduire les logs - ne logger que si nécessaire pour le débogage
    // if (etape && !dossierAny.etape_huissier && dossierAny.etapeHuissier) {
    //   console.log(`🔍 getEtapeHuissier: trouvé sous 'etapeHuissier' (camelCase) pour dossier ${dossier.id}, valeur:`, etape);
    // }
    
    return etape;
  }

  /**
   * Vérifie si un document peut être créé pour ce dossier
   * Les documents ne peuvent être créés QUE si etape_huissier = EN_ATTENTE_DOCUMENTS
   * C'est l'étape par défaut lorsqu'un huissier est affecté à un dossier
   */
  canCreateDocument(dossier: DossierApi): boolean {
    if (!dossier) {
      console.warn('⚠️ canCreateDocument: dossier est null');
      return false;
    }
    
    // Ne pas permettre si le dossier est clôturé
    if (dossier.dateCloture) {
      console.log('❌ canCreateDocument: dossier clôturé, autorisation refusée');
      return false;
    }
    
    // Vérifier le statut du dossier
    if (dossier.dossierStatus === DossierStatus.CLOTURE || dossier.statut === 'CLOTURE') {
      console.log('❌ canCreateDocument: dossier clôturé (statut), autorisation refusée');
      return false;
    }
    
    const etape = this.getEtapeHuissier(dossier);
    // 🔇 Réduire les logs - ne logger que si nécessaire pour le débogage
    // console.log(`🔍 canCreateDocument pour dossier ${dossier.id}: etape_huissier =`, etape);
    
    // Autoriser UNIQUEMENT si à l'étape EN_ATTENTE_DOCUMENTS
    // C'est l'étape par défaut lorsqu'un huissier est affecté à un dossier
    if (etape === 'EN_ATTENTE_DOCUMENTS') {
      // 🔇 Log réduit - seulement pour les cas importants
      // console.log('✅ canCreateDocument: étape EN_ATTENTE_DOCUMENTS, autorisation accordée');
      return true;
    }
    
    // Si l'étape n'est pas définie, permettre la création (dossier nouveau avec huissier affecté)
    if (!etape) {
      // 🔇 Log réduit - seulement pour les cas importants
      // console.log('✅ canCreateDocument: étape non définie (nouveau dossier), autorisation accordée');
      return true;
    }
    
    // Refuser pour toutes les autres étapes (EN_ACTIONS, EN_AUDIENCES, etc.)
    // 🔇 Log réduit - seulement logger si vraiment nécessaire (décommenter pour débogage)
    // console.log('❌ canCreateDocument: étape avancée (' + etape + '), autorisation refusée. Seule l\'étape EN_ATTENTE_DOCUMENTS permet la création de documents.');
    return false;
  }
}

