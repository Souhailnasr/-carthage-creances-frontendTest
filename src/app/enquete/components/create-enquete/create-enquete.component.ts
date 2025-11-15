import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, switchMap, finalize, catchError, debounceTime, distinctUntilChanged } from 'rxjs';
import { throwError, of } from 'rxjs';
import { EnqueteService } from '../../../core/services/enquete.service';
import { ValidationEnqueteService } from '../../../core/services/validation-enquete.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { Enquette, User, Role, StatutValidation } from '../../../shared/models';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { Page } from '../../../shared/models/pagination.model';
import { Role as RoleEnum } from '../../../shared/models/enums.model';

@Component({
  selector: 'app-create-enquete',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatAutocompleteModule,
    MatTableModule,
    MatExpansionModule,
    MatTabsModule,
    MatTooltipModule
  ],
  templateUrl: './create-enquete.component.html',
  styleUrls: ['./create-enquete.component.scss']
})
export class CreateEnqueteComponent implements OnInit, OnDestroy {
  enqueteForm: FormGroup;
  dossiers: DossierApi[] = [];
  filteredDossiers: DossierApi[] = [];
  pagedDossiers: DossierApi[] = [];
  selectedDossier: DossierApi | null = null;
  loading = false;
  loadingDossiers = false;
  showForm = false;
  currentUser: User | null = null;
  searchTerm = '';
  
  // Pagination & sorting
  pageIndex = 0;
  pageSize = 10;
  totalPages = 1;
  totalElements = 0;
  sortKey: 'dateCreation' | 'montantCreance' | 'statut' = 'dateCreation';
  sortDir: 'asc' | 'desc' = 'desc';
  
  displayedColumns: string[] = ['numeroDossier', 'titre', 'montantCreance', 'creancier', 'debiteur', 'urgence', 'statut', 'dateCreation', 'actions'];
  
  // Exposer Role pour l'utiliser dans le template
  Role = Role;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private enqueteService: EnqueteService,
    private validationEnqueteService: ValidationEnqueteService,
    private dossierApiService: DossierApiService,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.enqueteForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.setupSearchFilter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          this.currentUser = user;
          this.loadDossiers();
        },
        error: (err) => {
          console.error('❌ Erreur lors du chargement de l\'utilisateur:', err);
          this.loadDossiers();
        }
      });
  }

  createForm(): FormGroup {
    return this.fb.group({
      dossierId: ['', Validators.required],
      rapportCode: [''],
      // Éléments financiers
      nomElementFinancier: [''],
      pourcentage: [null],
      banqueAgence: [''],
      banques: [''],
      exercices: [''],
      chiffreAffaire: [null],
      resultatNet: [null],
      disponibiliteBilan: [''],
      // Solvabilité
      appreciationBancaire: [''],
      paiementsCouverture: [''],
      reputationCommerciale: [''],
      incidents: [''],
      // Patrimoine débiteur
      bienImmobilier: [''],
      situationJuridiqueImmobilier: [''],
      bienMobilier: [''],
      situationJuridiqueMobilier: [''],
      // Autres affaires & observations
      autresAffaires: [''],
      observations: [''],
      // Décision comité recouvrement
      decisionComite: [''],
      visaDirecteurJuridique: [''],
      visaEnqueteur: [''],
      visaDirecteurCommercial: [''],
      registreCommerce: [''],
      codeDouane: [''],
      matriculeFiscale: [''],
      formeJuridique: [''],
      capital: [null],
      // Dirigeants
      pdg: [''],
      directeurAdjoint: [''],
      directeurFinancier: [''],
      directeurCommercial: [''],
      // Activité
      descriptionActivite: [''],
      secteurActivite: [''],
      effectif: [null],
      // Informations diverses
      email: [''],
      marques: [''],
      groupe: ['']
    });
  }

  loadDossiers(): void {
    this.loadingDossiers = true;
    
    if (!this.currentUser || !this.currentUser.id) {
      this.snackBar.open('Erreur: Utilisateur non connecté', 'Fermer', { duration: 3000 });
      this.loadingDossiers = false;
      return;
    }

    const userId = Number(this.currentUser.id);
    const isAgent = this.currentUser.roleUtilisateur === Role.AGENT_DOSSIER;
    
    const loadObservable = isAgent 
      ? this.dossierApiService.getDossiersCreesByAgent(userId, this.pageIndex, this.pageSize)
      : this.dossierApiService.getAllDossiers(this.pageIndex, this.pageSize);

    loadObservable
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingDossiers = false),
        catchError(error => {
          console.error('Erreur lors du chargement des dossiers:', error);
          this.snackBar.open('Erreur lors du chargement des dossiers', 'Fermer', { duration: 3000 });
          return of({
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: this.pageSize,
            number: this.pageIndex,
            first: true,
            last: true,
            empty: true
          } as Page<DossierApi>);
        })
      )
      .subscribe(page => {
        const content = page?.content || [];
        // Filtrer uniquement les dossiers validés (valide = true et statut = VALIDE)
        const dossiersValides = content.filter((dossier: DossierApi) => 
          dossier.valide === true && dossier.statut === 'VALIDE'
        );
        
        console.log('📋 Dossiers validés chargés:', dossiersValides.length);
        
        // Vérifier pour chaque dossier s'il a déjà une enquête
        this.checkDossiersWithEnquetes(dossiersValides);
      });
  }

  checkDossiersWithEnquetes(dossiers: DossierApi[]): void {
    if (dossiers.length === 0) {
      this.dossiers = [];
      this.filteredDossiers = [];
      this.applyFilteringAndPaging();
      return;
    }

    const checkPromises = dossiers.map(dossier => 
      this.enqueteService.getEnqueteByDossier(dossier.id!)
        .pipe(
          catchError(() => of(null)),
          takeUntil(this.destroy$)
        )
        .toPromise()
        .then(enquete => ({ dossier, hasEnquete: !!enquete }))
    );

    Promise.all(checkPromises).then(results => {
      // Garder uniquement les dossiers sans enquête
      this.dossiers = results
        .filter(result => !result.hasEnquete)
        .map(result => result.dossier);
      
      this.totalElements = this.dossiers.length;
      this.totalPages = Math.ceil(this.totalElements / this.pageSize);
      this.applyFilteringAndPaging();
    });
  }

  setupSearchFilter(): void {
    // Débounce pour la recherche
    // Note: On utilisera (input) dans le template pour déclencher la recherche
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.applyFilteringAndPaging();
  }

  applyFilteringAndPaging(): void {
    // Filtrer par terme de recherche
    let filtered = [...this.dossiers];
    
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(dossier =>
        dossier.numeroDossier?.toLowerCase().includes(term) ||
        dossier.titre?.toLowerCase().includes(term) ||
        dossier.creancier?.nom?.toLowerCase().includes(term) ||
        dossier.debiteur?.nom?.toLowerCase().includes(term)
      );
    }
    
    // Trier
    filtered.sort((a, b) => {
      const dir = this.sortDir === 'asc' ? 1 : -1;
      if (this.sortKey === 'dateCreation') {
        const dateA = new Date(a.dateCreation).getTime();
        const dateB = new Date(b.dateCreation).getTime();
        return (dateA - dateB) * dir;
      }
      if (this.sortKey === 'montantCreance') {
        return ((a.montantCreance || 0) - (b.montantCreance || 0)) * dir;
      }
      if (this.sortKey === 'statut') {
        return ((a.statut || '') > (b.statut || '') ? 1 : -1) * dir;
      }
      return 0;
    });
    
    this.filteredDossiers = filtered;
    this.totalElements = filtered.length;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
    
    // Pagination
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedDossiers = filtered.slice(start, end);
  }

  selectDossier(dossier: DossierApi): void {
    this.selectedDossier = dossier;
    
    // Pré-remplir automatiquement les champs avec les données du dossier
    this.enqueteForm.patchValue({
      dossierId: dossier.id,
      rapportCode: dossier.numeroDossier || '',
      // Informations du débiteur (si disponible)
      pdg: dossier.debiteur?.nom || '',
      email: dossier.debiteur?.email || '',
      // Montant et informations financières
      chiffreAffaire: dossier.montantCreance || null,
      // Observations initiales basées sur le dossier
      observations: this.buildInitialObservations(dossier)
    });
    
    // Si le dossier a des informations supplémentaires, les pré-remplir
    // Note: DebiteurApi n'a pas de propriétés type, secteurActivite, descriptionActivite
    // Ces champs resteront vides et pourront être remplis manuellement par l'utilisateur
    
    this.showForm = true;
    // Scroll vers le formulaire
    setTimeout(() => {
      const formElement = document.querySelector('.enquete-form-section');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  /**
   * Construit les observations initiales basées sur les informations du dossier
   */
  private buildInitialObservations(dossier: DossierApi): string {
    const observations: string[] = [];
    
    if (dossier.numeroDossier) {
      observations.push(`Dossier: ${dossier.numeroDossier}`);
    }
    if (dossier.titre) {
      observations.push(`Titre: ${dossier.titre}`);
    }
    if (dossier.montantCreance) {
      observations.push(`Montant créance: ${this.formatAmount(dossier.montantCreance)}`);
    }
    if (dossier.creancier?.nom) {
      observations.push(`Créancier: ${dossier.creancier.nom}`);
    }
    if (dossier.debiteur?.nom) {
      observations.push(`Débiteur: ${dossier.debiteur.nom}`);
    }
    if (dossier.urgence) {
      observations.push(`Urgence: ${dossier.urgence}`);
    }
    
    return observations.join('\n');
  }

  nextPage(): void {
    if (this.pageIndex + 1 < this.totalPages) {
      this.pageIndex++;
      this.applyFilteringAndPaging();
    }
  }

  prevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.applyFilteringAndPaging();
    }
  }

  onPageSizeChange(): void {
    this.pageIndex = 0;
    this.applyFilteringAndPaging();
  }

  onSortChange(): void {
    this.pageIndex = 0;
    this.applyFilteringAndPaging();
  }

  getUrgenceClass(urgence: string): string {
    return `urgence-${urgence?.toLowerCase() || 'faible'}`;
  }

  getStatutClass(statut: string): string {
    return `statut-${statut?.toLowerCase() || 'en-attente'}`;
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return date;
    }
  }

  formatAmount(amount: number | undefined): string {
    if (!amount) return '0,00 DT';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(amount);
  }

  onSubmit(): void {
    if (this.enqueteForm.invalid) {
      this.enqueteForm.markAllAsTouched();
      this.snackBar.open('Veuillez remplir tous les champs requis.', 'Fermer', { duration: 3000 });
      return;
    }

    if (!this.selectedDossier) {
      this.snackBar.open('Erreur: Dossier non sélectionné.', 'Fermer', { duration: 3000 });
      return;
    }

    // Récupérer l'ID utilisateur depuis le token JWT (méthode principale)
    let agentCreateurId: number | null = this.jwtAuthService.getCurrentUserId();
    
    // Fallback sur currentUser.id si getCurrentUserId() retourne null
    if (!agentCreateurId && this.currentUser?.id) {
      agentCreateurId = Number(this.currentUser.id);
      console.warn('⚠️ Utilisation de currentUser.id comme fallback');
    }
    
    if (!agentCreateurId || isNaN(agentCreateurId) || agentCreateurId <= 0) {
      this.snackBar.open('Erreur: ID utilisateur invalide. Veuillez vous reconnecter.', 'Fermer', { duration: 3000 });
      return;
    }

    // Vérifier le rôle pour déterminer si c'est un chef
    const isChef = this.currentUser?.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER || 
                   this.currentUser?.roleUtilisateur === Role.SUPER_ADMIN;

    const formValue = this.enqueteForm.value;
    
    // Préparer les données pour l'enquête
    // Le backend attend dossierId directement (pas un objet dossier)
    const enqueteData: Partial<Enquette> = {
      ...formValue,
      dossierId: Number(this.selectedDossier.id), // ID du dossier directement
      agentCreateurId: agentCreateurId, // ID numérique, pas l'objet complet
      dateCreation: new Date().toISOString().split('T')[0],
      valide: isChef ? true : false,
      // Statut (statut fonctionnel) - logique de validation
      statut: isChef ? 'VALIDE' : 'EN_ATTENTE_VALIDATION' // EN_ATTENTE_VALIDATION pour les agents, VALIDE pour les chefs
    };
    
    // Supprimer les champs non acceptés par le backend
    delete (enqueteData as any).dossier; // Ne pas envoyer l'objet complet
    delete (enqueteData as any).agentCreateur; // Ne pas envoyer l'objet complet
    delete (enqueteData as any).agentResponsable; // Ne pas envoyer l'objet complet
    
    // Log pour vérifier le format des données envoyées
    console.log('📤 Données à envoyer au backend:', JSON.stringify(enqueteData, null, 2));
    console.log('🔍 agentCreateurId (type):', typeof enqueteData.agentCreateurId, 'valeur:', enqueteData.agentCreateurId);

    this.loading = true;
    
    // Créer l'enquête (même logique que pour les dossiers)
    this.enqueteService.createEnquete(enqueteData as any)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (enquete: Enquette) => {
          console.log('✅ Enquête créée avec succès:', enquete);
          
          // Afficher un message selon le statut
          if (enquete.statut === 'VALIDE' || enquete.valide) {
            this.snackBar.open(
              `Enquête créée et validée automatiquement ! ID: ${enquete.id}`, 
              'Fermer', 
              { duration: 5000 }
            );
          } else {
            this.snackBar.open(
              `Enquête créée avec succès ! ID: ${enquete.id} (statut: ${enquete.statut || 'EN_ATTENTE_VALIDATION'})`, 
              'Fermer', 
              { duration: 5000 }
            );
          }

          // Pour les agents : créer une validation avec statut EN_ATTENTE
          // Pour les chefs : pas besoin de validation car l'enquête est déjà validée
          if (this.currentUser?.roleUtilisateur === Role.AGENT_DOSSIER) {
            this.createValidationForEnquete(enquete);
          } else {
            // Pour les chefs : juste réinitialiser le formulaire et recharger les dossiers
            this.resetForm();
            setTimeout(() => {
              this.loadDossiers();
            }, 500);
          }
        },
        error: (error: any) => {
          console.error('❌ Erreur lors de la création de l\'enquête:', error);
          console.error('❌ Détails complets de l\'erreur:', {
            status: error.status,
            statusText: error.statusText,
            message: error.error?.message,
            error: error.error?.error,
            errors: error.error?.errors,
            url: error.url
          });
          
          // Construire un message d'erreur détaillé
          let errorMessage = 'Erreur lors de la création de l\'enquête.';
          
          if (error.status === 400) {
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.error?.error) {
              errorMessage = error.error.error;
            } else if (error.error?.errors && Array.isArray(error.error.errors)) {
              errorMessage = 'Erreurs de validation: ' + error.error.errors.join(', ');
            } else {
              errorMessage = 'Données invalides. Veuillez vérifier les champs du formulaire.';
            }
          } else if (error.status === 404) {
            errorMessage = 'Dossier non trouvé. Veuillez sélectionner un dossier valide.';
          } else if (error.status === 409) {
            errorMessage = 'Ce dossier a déjà une enquête associée.';
          } else if (error.status === 500) {
            errorMessage = error.error?.message || 'Erreur serveur. Veuillez réessayer plus tard.';
          } else {
            errorMessage = error.error?.message || error.message || errorMessage;
          }
          
          this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
        }
      });
  }

  /**
   * Crée une validation pour l'enquête (même logique que createValidationForDossier)
   * Appelé uniquement pour les agents après création d'une enquête
   */
  private createValidationForEnquete(enquete: Enquette): void {
    if (!this.currentUser?.id) {
      console.error('❌ Utilisateur non connecté, impossible de créer la validation');
      this.snackBar.open('Erreur: Utilisateur non connecté.', 'Fermer', { duration: 3000 });
      this.resetForm();
      return;
    }

    // Récupérer l'ID utilisateur depuis le token JWT (méthode principale)
    let agentCreateurId: number | null = this.jwtAuthService.getCurrentUserId();
    
    // Fallback sur currentUser.id si getCurrentUserId() retourne null
    if (!agentCreateurId && this.currentUser?.id) {
      agentCreateurId = Number(this.currentUser.id);
      console.warn('⚠️ Utilisation de currentUser.id comme fallback');
    }
    
    if (!agentCreateurId || isNaN(agentCreateurId) || agentCreateurId <= 0) {
      console.error('❌ Utilisateur non connecté, impossible de créer la validation');
      this.snackBar.open('Erreur: ID utilisateur invalide. Veuillez vous reconnecter.', 'Fermer', { duration: 3000 });
      this.resetForm();
      return;
    }

    const validationData = {
      enquete: { id: Number(enquete.id) } as any, // Objet Enquete minimal avec juste l'id
      agentCreateurId: agentCreateurId, // ID numérique, pas l'objet complet
      statut: StatutValidation.EN_ATTENTE // Statut initial pour les agents
    };

    console.log('📤 Création de validation pour l\'enquête:', validationData);

    this.validationEnqueteService.createValidationEnquete(validationData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validation) => {
          console.log('✅ Validation créée avec succès:', validation);
          this.snackBar.open('Enquête créée avec succès et soumise à validation.', 'Fermer', { duration: 3000 });
          this.resetForm();
          setTimeout(() => {
            this.loadDossiers();
          }, 500);
        },
        error: (error: any) => {
          console.error('❌ Erreur lors de la création de la validation:', error);
          this.snackBar.open('Enquête créée mais erreur lors de la soumission à validation.', 'Fermer', { duration: 5000 });
          this.resetForm();
          setTimeout(() => {
            this.loadDossiers();
          }, 500);
        }
      });
  }

  resetForm(): void {
    this.showForm = false;
    this.selectedDossier = null;
    this.enqueteForm.reset();
    this.enqueteForm.patchValue({
      dossierId: '',
      rapportCode: ''
    });
  }

  onCancel(): void {
    this.resetForm();
  }
}

