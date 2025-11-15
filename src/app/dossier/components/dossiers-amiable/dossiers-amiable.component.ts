import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { DossierApi, TypeRecouvrement, Urgence } from '../../../shared/models/dossier-api.model';
import { Page } from '../../../shared/models/pagination.model';
import { User } from '../../../shared/models';
import { Role } from '../../../shared/models/enums.model';

@Component({
  selector: 'app-dossiers-amiable',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule,
    MatMenuModule,
    MatExpansionModule
  ],
  templateUrl: './dossiers-amiable.component.html',
  styleUrls: ['./dossiers-amiable.component.scss']
})
export class DossiersAmiableComponent implements OnInit, OnDestroy {
  dossiers: DossierApi[] = [];
  filteredDossiers: DossierApi[] = [];
  loading = false;
  loadingStats = false;
  currentUser: User | null = null;
  searchTerm = '';
  
  // Statistiques
  totalDossiers = 0;
  totalMontant = 0;
  dossiersEnCours = 0;
  dossiersUrgents = 0;
  dossiersParStatut: { [key: string]: number } = {};
  
  // Filtres
  filterStatut: string = 'all';
  filterUrgence: string = 'all';
  showFilters = false;
  statutOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'EN_ATTENTE_VALIDATION', label: 'En attente' },
    { value: 'VALIDE', label: 'Validé' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'CLOTURE', label: 'Clôturé' }
  ];
  urgenceOptions = [
    { value: 'all', label: 'Toutes les urgences' },
    { value: 'FAIBLE', label: 'Faible' },
    { value: 'MOYENNE', label: 'Moyenne' },
    { value: 'ELEVE', label: 'Élevée' }
  ];
  
  // Pagination & sorting
  pageIndex = 0;
  pageSize = 10;
  totalElements = 0;
  sortKey: 'dateCreation' | 'montantCreance' | 'statut' = 'dateCreation';
  sortDir: 'asc' | 'desc' = 'desc';
  
  displayedColumns: string[] = ['numeroDossier', 'titre', 'montantCreance', 'creancier', 'debiteur', 'urgence', 'statut', 'dateCreation', 'actions'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private dossierApiService: DossierApiService,
    private jwtAuthService: JwtAuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDossiers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser().pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
    });
  }

  loadDossiers(): void {
    this.loading = true;
    const sort = `${this.sortKey},${this.sortDir}`;
    
    this.dossierApiService.getDossiersRecouvrementAmiable(this.pageIndex, this.pageSize, sort).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (page: Page<DossierApi>) => {
        this.dossiers = page.content;
        this.totalElements = page.totalElements;
        this.calculateStatistics();
        this.applyFilters();
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des dossiers:', error);
        const errorMessage = error?.error?.message || error?.message || 'Erreur lors du chargement des dossiers';
        this.snackBar.open(
          errorMessage,
          'Fermer',
          { duration: 5000 }
        );
      }
    });
  }

  calculateStatistics(): void {
    this.totalDossiers = this.dossiers.length;
    this.totalMontant = this.dossiers.reduce((sum, d) => sum + (d.montantCreance || 0), 0);
    this.dossiersEnCours = this.dossiers.filter(d => d.statut === 'EN_COURS').length;
    this.dossiersUrgents = this.dossiers.filter(d => d.urgence === Urgence.TRES_URGENT).length;
    
    // Compter par statut
    this.dossiersParStatut = {};
    this.dossiers.forEach(d => {
      const statut = d.statut || 'NON_DEFINI';
      this.dossiersParStatut[statut] = (this.dossiersParStatut[statut] || 0) + 1;
    });
  }

  applyFilters(): void {
    let filtered = [...this.dossiers];
    
    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.numeroDossier.toLowerCase().includes(term) ||
        d.titre.toLowerCase().includes(term) ||
        d.creancier?.nom?.toLowerCase().includes(term) ||
        d.debiteur?.nom?.toLowerCase().includes(term)
      );
    }
    
    // Filtre par statut
    if (this.filterStatut !== 'all') {
      filtered = filtered.filter(d => d.statut === this.filterStatut);
    }
    
    // Filtre par urgence
    if (this.filterUrgence !== 'all') {
      filtered = filtered.filter(d => d.urgence === this.filterUrgence);
    }
    
    this.filteredDossiers = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterStatut = 'all';
    this.filterUrgence = 'all';
    this.applyFilters();
  }

  exportToCSV(): void {
    const headers = ['Numéro', 'Titre', 'Montant', 'Créancier', 'Débiteur', 'Urgence', 'Statut', 'Date Création'];
    const rows = this.filteredDossiers.map(d => [
      d.numeroDossier,
      d.titre,
      d.montantCreance || 0,
      d.creancier?.nom || 'N/A',
      d.debiteur?.nom || 'N/A',
      d.urgence,
      d.statut || 'N/A',
      this.formatDate(d.dateCreation)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dossiers-amiable-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.snackBar.open('Export CSV réussi', 'Fermer', { duration: 3000 });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDossiers();
  }

  onSortChange(sort: Sort): void {
    if (sort.direction) {
      this.sortKey = sort.active as 'dateCreation' | 'montantCreance' | 'statut';
      this.sortDir = sort.direction === 'asc' ? 'asc' : 'desc';
      this.loadDossiers();
    }
  }

  refreshData(): void {
    this.loadDossiers();
    this.calculateStatistics();
  }

  getStatutCount(statut: string): number {
    return this.dossiersParStatut[statut] || 0;
  }

  viewDossier(dossier: DossierApi): void {
    this.router.navigate(['/dossier', dossier.id]);
  }

  formatAmount(amount?: number): string {
    if (!amount) return '0,00 TND';
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getStatutClass(statut?: string): string {
    if (!statut) return '';
    const statutLower = statut.toLowerCase();
    if (statutLower.includes('valide')) return 'statut-valide';
    if (statutLower.includes('attente')) return 'statut-attente';
    if (statutLower.includes('rejete')) return 'statut-rejete';
    if (statutLower.includes('cours')) return 'statut-en-cours';
    if (statutLower.includes('cloture')) return 'statut-cloture';
    return '';
  }

  getUrgenceClass(urgence: Urgence | string): string {
    const urgenceStr = typeof urgence === 'string' ? urgence : String(urgence);
    const urgenceLower = urgenceStr.toLowerCase();
    if (urgenceLower === 'tres_urgent' || urgenceLower === 'très_urgent') return 'urgence-eleve';
    if (urgenceLower === 'moyenne') return 'urgence-moyenne';
    return 'urgence-faible';
  }

  getUrgenceIcon(urgence: Urgence | string): string {
    const urgenceStr = typeof urgence === 'string' ? urgence : String(urgence);
    const urgenceLower = urgenceStr.toLowerCase();
    if (urgenceLower === 'tres_urgent' || urgenceLower === 'très_urgent') return 'warning';
    if (urgenceLower === 'moyenne') return 'info';
    return 'check_circle';
  }
}

