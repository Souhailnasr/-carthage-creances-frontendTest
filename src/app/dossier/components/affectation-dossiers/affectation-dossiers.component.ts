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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, finalize, catchError, debounceTime, distinctUntilChanged } from 'rxjs';
import { of } from 'rxjs';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DossierApi, TypeRecouvrement } from '../../../shared/models/dossier-api.model';
import { Page } from '../../../shared/models/pagination.model';
import { User } from '../../../shared/models';
import { Role } from '../../../shared/models/enums.model';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-affectation-dossiers',
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
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './affectation-dossiers.component.html',
  styleUrls: ['./affectation-dossiers.component.scss']
})
export class AffectationDossiersComponent implements OnInit, OnDestroy {
  dossiers: DossierApi[] = [];
  filteredDossiers: DossierApi[] = [];
  pagedDossiers: DossierApi[] = [];
  selectedDossier: DossierApi | null = null;
  loading = false;
  loadingDossiers = false;
  currentUser: User | null = null;
  searchTerm = '';
  dossierNumber = '';
  
  // Pagination & sorting
  pageIndex = 0;
  pageSize = 10;
  totalPages = 1;
  totalElements = 0;
  sortKey: 'dateCreation' | 'montantCreance' | 'statut' = 'dateCreation';
  sortDir: 'asc' | 'desc' = 'desc';
  
  displayedColumns: string[] = ['numeroDossier', 'titre', 'montantCreance', 'creancier', 'debiteur', 'urgence', 'statut', 'dateCreation', 'actions'];
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private dossierApiService: DossierApiService,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private snackBar: MatSnackBar,
    private toastService: ToastService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    // Debounce pour la recherche
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.onSearch();
    });
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

  loadDossiers(): void {
    this.loadingDossiers = true;
    
    // Utiliser la nouvelle méthode getDossiersValidesDisponibles
    this.dossierApiService.getDossiersValidesDisponibles({
      page: this.pageIndex,
      size: this.pageSize,
      sort: this.sortKey,
      direction: this.sortDir.toUpperCase(),
      search: this.searchTerm || undefined
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingDossiers = false),
        catchError(error => {
          console.error('Erreur lors du chargement des dossiers:', error);
          const errorMessage = error.message || 'Erreur lors du chargement des dossiers';
          this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
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
        console.log('📋 Dossiers validés disponibles chargés:', content.length);
        
        // Filtrer selon le rôle de l'utilisateur connecté
        const dossiersDisponibles = this.filterDossiersByRole(content);
        
        console.log('✅ Dossiers disponibles pour affectation:', dossiersDisponibles.length, 'sur', content.length, 'dossiers validés');
        this.dossiers = dossiersDisponibles;
        
        // Ajuster les totaux après filtrage
        this.totalElements = dossiersDisponibles.length;
        this.totalPages = Math.ceil(dossiersDisponibles.length / this.pageSize) || 1;
        this.applyFilteringAndPaging();
      });
  }

  onSearch(): void {
    // La recherche est gérée par le debounce dans ngOnInit
    // Cette méthode est appelée depuis le subscribe du debounce
    this.pageIndex = 0;
    this.loadDossiers();
  }

  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  /**
   * Filtre les dossiers selon le rôle de l'utilisateur connecté
   * - Chef Dossier : affiche uniquement les dossiers NON_AFFECTE (pas encore affectés)
   * - Chef Amiable : affiche uniquement les dossiers AMIABLE (pour réaffectation au juridique)
   */
  filterDossiersByRole(dossiers: DossierApi[]): DossierApi[] {
    if (!this.currentUser) {
      console.warn('⚠️ Utilisateur non connecté, aucun filtre appliqué');
      return dossiers;
    }

    const userRole = this.currentUser.roleUtilisateur;
    const roleString = typeof userRole === 'string' ? userRole : String(userRole);

    // Chef Dossier : afficher uniquement les dossiers NON_AFFECTE
    if (userRole === Role.CHEF_DEPARTEMENT_DOSSIER || roleString === 'CHEF_DEPARTEMENT_DOSSIER') {
      console.log('🔍 Filtre Chef Dossier: affichage des dossiers NON_AFFECTE uniquement');
      return dossiers.filter((dossier: DossierApi) => {
        const typeRecouvrement = dossier.typeRecouvrement;
        // Vérifier si c'est NON_AFFECTE ou undefined/null
        if (!typeRecouvrement) {
          return true; // undefined/null = non affecté
        }
        // Comparer avec l'enum uniquement
        return typeRecouvrement === TypeRecouvrement.NON_AFFECTE;
      });
    }

    // Chef Amiable : afficher uniquement les dossiers AMIABLE (pour réaffectation au juridique)
    if (userRole === Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE || 
        roleString === 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE') {
      console.log('🔍 Filtre Chef Amiable: affichage des dossiers AMIABLE uniquement');
      return dossiers.filter((dossier: DossierApi) => {
        const typeRecouvrement = dossier.typeRecouvrement;
        // Comparer avec l'enum uniquement
        return typeRecouvrement === TypeRecouvrement.AMIABLE;
      });
    }

    // Super Admin : afficher tous les dossiers non affectés (comportement par défaut)
    if (userRole === Role.SUPER_ADMIN || roleString === 'SUPER_ADMIN') {
      console.log('🔍 Filtre Super Admin: affichage des dossiers NON_AFFECTE uniquement');
      return dossiers.filter((dossier: DossierApi) => {
        const typeRecouvrement = dossier.typeRecouvrement;
        // Vérifier si c'est NON_AFFECTE ou undefined/null
        if (!typeRecouvrement) {
          return true; // undefined/null = non affecté
        }
        // Comparer avec l'enum uniquement
        return typeRecouvrement === TypeRecouvrement.NON_AFFECTE;
      });
    }

    // Par défaut, ne pas filtrer (pour les autres rôles)
    console.warn('⚠️ Rôle non reconnu pour le filtrage:', userRole);
    return dossiers;
  }

  applyFilteringAndPaging(): void {
    // Les données sont déjà filtrées selon le rôle dans loadDossiers()
    // On applique simplement la pagination
    this.filteredDossiers = [...this.dossiers];
    
    // Appliquer la pagination côté client
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedDossiers = this.filteredDossiers.slice(start, end);
  }

  selectDossierByNumber(): void {
    if (!this.dossierNumber.trim()) {
      this.snackBar.open('Veuillez entrer un numéro de dossier', 'Fermer', { duration: 3000 });
      return;
    }

    const dossier = this.dossiers.find(d => 
      d.numeroDossier?.toLowerCase() === this.dossierNumber.trim().toLowerCase()
    );

    if (!dossier) {
      this.snackBar.open('Dossier non trouvé', 'Fermer', { duration: 3000 });
      return;
    }

    this.selectedDossier = dossier;
    this.snackBar.open(`Dossier ${dossier.numeroDossier} sélectionné`, 'Fermer', { duration: 2000 });
  }

  selectDossierFromTable(dossier: DossierApi): void {
    this.selectedDossier = dossier;
    this.dossierNumber = dossier.numeroDossier || '';
    this.snackBar.open(`Dossier ${dossier.numeroDossier} sélectionné`, 'Fermer', { duration: 2000 });
  }

  affecterAmiable(): void {
    if (!this.selectedDossier) {
      this.snackBar.open('Veuillez sélectionner un dossier', 'Fermer', { duration: 3000 });
      return;
    }

    const dialogData: ConfirmationDialogData = {
      title: 'Affecter au Recouvrement Amiable',
      message: `Êtes-vous sûr de vouloir affecter le dossier ${this.selectedDossier.numeroDossier} au recouvrement amiable ?`,
      confirmText: 'Affecter',
      cancelText: 'Annuler'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedDossier) {
        this.loading = true;
        this.dossierApiService.affecterAuRecouvrementAmiable(this.selectedDossier.id!)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading = false),
            catchError(error => {
              const errorMessage = error.message || 'Erreur lors de l\'affectation au recouvrement amiable';
              this.snackBar.open(errorMessage, 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              return of(null);
            })
          )
          .subscribe(dossier => {
            if (dossier) {
              this.snackBar.open('Dossier affecté au recouvrement amiable avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.selectedDossier = null;
              this.dossierNumber = '';
              this.loadDossiers();
            }
          });
      }
    });
  }

  affecterJuridique(): void {
    if (!this.selectedDossier) {
      this.snackBar.open('Veuillez sélectionner un dossier', 'Fermer', { duration: 3000 });
      return;
    }

    const dialogData: ConfirmationDialogData = {
      title: 'Affecter au Recouvrement Juridique',
      message: `Êtes-vous sûr de vouloir affecter le dossier ${this.selectedDossier.numeroDossier} au recouvrement juridique ?`,
      confirmText: 'Affecter',
      cancelText: 'Annuler'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedDossier) {
        this.loading = true;
        this.dossierApiService.affecterAuRecouvrementJuridique(this.selectedDossier.id!)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading = false),
            catchError(error => {
              const errorMessage = error.message || 'Erreur lors de l\'affectation au recouvrement juridique';
              this.snackBar.open(errorMessage, 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              return of(null);
            })
          )
          .subscribe(dossier => {
            if (dossier) {
              this.snackBar.open('Dossier affecté au recouvrement juridique avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.selectedDossier = null;
              this.dossierNumber = '';
              this.loadDossiers();
            }
          });
      }
    });
  }

  cloturer(): void {
    if (!this.selectedDossier) {
      this.snackBar.open('Veuillez sélectionner un dossier', 'Fermer', { duration: 3000 });
      return;
    }

    const dialogData: ConfirmationDialogData = {
      title: 'Clôturer le Dossier',
      message: `Êtes-vous sûr de vouloir clôturer le dossier ${this.selectedDossier.numeroDossier} ? Cette action est irréversible.`,
      confirmText: 'Clôturer',
      cancelText: 'Annuler',
      warning: true
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedDossier) {
        this.loading = true;
        this.dossierApiService.cloturerDossier(this.selectedDossier.id!)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading = false),
            catchError(error => {
              const errorMessage = error.message || 'Erreur lors de la clôture du dossier';
              this.snackBar.open(errorMessage, 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              return of(null);
            })
          )
          .subscribe(dossier => {
            if (dossier) {
              this.snackBar.open('Dossier clôturé avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.selectedDossier = null;
              this.dossierNumber = '';
              this.loadDossiers();
            }
          });
      }
    });
  }

  nextPage(): void {
    if (this.pageIndex + 1 < this.totalPages) {
      this.pageIndex++;
      this.loadDossiers();
    }
  }

  prevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.loadDossiers();
    }
  }

  onPageSizeChange(): void {
    this.pageIndex = 0;
    this.loadDossiers();
  }

  onSortChange(): void {
    this.pageIndex = 0;
    this.loadDossiers();
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

  /**
   * Vérifie si l'utilisateur connecté est un Chef Dossier
   */
  isChefDossier(): boolean {
    if (!this.currentUser) return false;
    const userRole = this.currentUser.roleUtilisateur;
    const roleString = typeof userRole === 'string' ? userRole : String(userRole);
    return userRole === Role.CHEF_DEPARTEMENT_DOSSIER || roleString === 'CHEF_DEPARTEMENT_DOSSIER';
  }

  /**
   * Vérifie si l'utilisateur connecté est un Chef Amiable
   */
  isChefAmiable(): boolean {
    if (!this.currentUser) return false;
    const userRole = this.currentUser.roleUtilisateur;
    const roleString = typeof userRole === 'string' ? userRole : String(userRole);
    return userRole === Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE || 
           roleString === 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE';
  }

  /**
   * Vérifie si l'utilisateur connecté est un Super Admin
   */
  isSuperAdmin(): boolean {
    if (!this.currentUser) return false;
    const userRole = this.currentUser.roleUtilisateur;
    return userRole === Role.SUPER_ADMIN;
  }
}

