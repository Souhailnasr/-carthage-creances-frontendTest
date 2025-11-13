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
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { Page } from '../../../shared/models/pagination.model';
import { User } from '../../../shared/models';
import { Role } from '../../../shared/models/enums.model';

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
        
        console.log('📋 Dossiers validés chargés pour affectation:', dossiersValides.length);
        this.dossiers = dossiersValides;
        this.totalElements = dossiersValides.length;
        this.totalPages = Math.ceil(this.totalElements / this.pageSize);
        this.applyFilteringAndPaging();
      });
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.applyFilteringAndPaging();
  }

  applyFilteringAndPaging(): void {
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

    if (confirm(`Êtes-vous sûr de vouloir affecter le dossier ${this.selectedDossier.numeroDossier} au recouvrement amiable ?`)) {
      this.loading = true;
      // TODO: Appeler l'API pour affecter le dossier au recouvrement amiable
      // this.dossierApiService.affecterAmiable(this.selectedDossier.id!)
      //   .pipe(...)
      //   .subscribe(...)
      
      setTimeout(() => {
        this.loading = false;
        this.toastService.success(`Dossier ${this.selectedDossier!.numeroDossier} affecté au recouvrement amiable avec succès.`);
        this.selectedDossier = null;
        this.dossierNumber = '';
        this.loadDossiers();
      }, 1000);
    }
  }

  affecterJuridique(): void {
    if (!this.selectedDossier) {
      this.snackBar.open('Veuillez sélectionner un dossier', 'Fermer', { duration: 3000 });
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir affecter le dossier ${this.selectedDossier.numeroDossier} au recouvrement juridique ?`)) {
      this.loading = true;
      // TODO: Appeler l'API pour affecter le dossier au recouvrement juridique
      // this.dossierApiService.affecterJuridique(this.selectedDossier.id!)
      //   .pipe(...)
      //   .subscribe(...)
      
      setTimeout(() => {
        this.loading = false;
        this.toastService.success(`Dossier ${this.selectedDossier!.numeroDossier} affecté au recouvrement juridique avec succès.`);
        this.selectedDossier = null;
        this.dossierNumber = '';
        this.loadDossiers();
      }, 1000);
    }
  }

  cloturer(): void {
    if (!this.selectedDossier) {
      this.snackBar.open('Veuillez sélectionner un dossier', 'Fermer', { duration: 3000 });
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir clôturer le dossier ${this.selectedDossier.numeroDossier} ?`)) {
      this.loading = true;
      // TODO: Appeler l'API pour clôturer le dossier
      // this.dossierApiService.cloturerDossier(this.selectedDossier.id!)
      //   .pipe(...)
      //   .subscribe(...)
      
      setTimeout(() => {
        this.loading = false;
        this.toastService.success(`Dossier ${this.selectedDossier!.numeroDossier} clôturé avec succès.`);
        this.selectedDossier = null;
        this.dossierNumber = '';
        this.loadDossiers();
      }, 1000);
    }
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
}

