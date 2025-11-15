import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { FinanceService, StatistiquesCouts, Finance, Page } from '../../../core/services/finance.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chef-finance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSnackBarModule
  ],
  templateUrl: './chef-finance-dashboard.component.html',
  styleUrls: ['./chef-finance-dashboard.component.scss']
})
export class ChefFinanceDashboardComponent implements OnInit, OnDestroy {
  statistiques: StatistiquesCouts = {
    totalFraisCreation: 0,
    totalFraisGestion: 0,
    totalActionsAmiable: 0,
    totalActionsJuridique: 0,
    totalAvocat: 0,
    totalHuissier: 0,
    grandTotal: 0
  };
  
  dossiersAvecCouts: Finance[] = [];
  facturesEnAttente: Finance[] = [];
  
  pageSize = 10;
  currentPage = 0;
  totalElements = 0;
  loading = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private financeService: FinanceService,
    private snackBar: MatSnackBar,
    private jwtAuthService: JwtAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Vérifier l'authentification
    if (!this.jwtAuthService.isUserLoggedIn()) {
      this.snackBar.open('Vous devez être connecté pour accéder à cette page', 'Fermer', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadStatistiques();
    this.loadDossiersAvecCouts();
    this.loadFacturesEnAttente();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatistiques(): void {
    this.financeService.getStatistiquesCouts().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.statistiques = stats;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des statistiques:', err);
        this.snackBar.open('Erreur lors du chargement des statistiques', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadDossiersAvecCouts(): void {
    this.loading = true;
    this.financeService.getDossiersAvecCouts(this.currentPage, this.pageSize).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (page: Page<Finance>) => {
        this.dossiersAvecCouts = page.content;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des dossiers:', err);
        this.snackBar.open('Erreur lors du chargement des dossiers', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadFacturesEnAttente(): void {
    this.financeService.getFacturesEnAttente().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (factures) => {
        this.facturesEnAttente = factures;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des factures en attente:', err);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDossiersAvecCouts();
  }

  voirDetail(dossierId: number): void {
    this.router.navigate(['/finance/dossier', dossierId, 'facture']);
  }

  finaliserFacture(dossierId: number): void {
    if (confirm('Êtes-vous sûr de vouloir finaliser cette facture ?')) {
      this.financeService.finaliserFacture(dossierId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.snackBar.open('Facture finalisée avec succès', 'Fermer', { duration: 3000 });
          this.loadFacturesEnAttente();
          this.loadDossiersAvecCouts();
        },
        error: (err) => {
          console.error('❌ Erreur lors de la finalisation:', err);
          const errorMessage = err.error?.message || err.message || 'Erreur lors de la finalisation';
          this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
        }
      });
    }
  }

  getTotalFacture(finance: Finance): number {
    return (finance.fraisCreationDossier || 0) +
           (finance.fraisGestionDossier || 0) * (finance.dureeGestionMois || 0) +
           (finance.coutActionsAmiable || 0) +
           (finance.coutActionsJuridique || 0) +
           (finance.fraisAvocat || 0) +
           (finance.fraisHuissier || 0);
  }
}

