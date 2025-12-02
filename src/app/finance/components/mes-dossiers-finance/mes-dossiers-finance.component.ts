import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FinanceService } from '../../../core/services/finance.service';
import { Finance, Page } from '../../../shared/models/finance.models';

@Component({
  selector: 'app-mes-dossiers-finance',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTooltipModule
  ],
  templateUrl: './mes-dossiers-finance.component.html',
  styleUrls: ['./mes-dossiers-finance.component.scss']
})
export class MesDossiersFinanceComponent implements OnInit, OnDestroy {
  dossiersAvecCouts: Finance[] = [];
  pageSize = 10;
  currentPage = 0;
  totalElements = 0;
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private financeService: FinanceService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDossiersAvecCouts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDossiersAvecCouts();
  }

  /**
   * Naviguer vers la page de validation des tarifs
   */
  validerTarifs(dossierId: number | null | undefined): void {
    if (!dossierId) {
      this.snackBar.open('Dossier ID manquant - Impossible d\'accéder à la validation des tarifs', 'Fermer', { duration: 3000 });
      return;
    }
    this.router.navigate(['/finance/validation-tarifs', dossierId]);
  }

  /**
   * Voir le détail de la facture
   */
  voirDetail(dossierId: number | null | undefined): void {
    if (!dossierId) {
      this.snackBar.open('Dossier ID manquant - Impossible d\'afficher les détails', 'Fermer', { duration: 3000 });
      return;
    }
    this.router.navigate(['/finance/dossier', dossierId, 'facture']);
  }

  /**
   * Finaliser la facture
   */
  finaliserFacture(dossierId: number | null | undefined): void {
    if (!dossierId) {
      this.snackBar.open('Dossier ID manquant - Impossible de finaliser', 'Fermer', { duration: 3000 });
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir finaliser cette facture ?')) {
      this.financeService.finaliserFacture(dossierId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.snackBar.open('Facture finalisée avec succès', 'Fermer', { duration: 3000 });
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

  /**
   * Calculer le total de la facture
   */
  getTotalFacture(finance: Finance): number {
    return (finance.fraisCreationDossier || 0) +
           (finance.fraisGestionDossier || 0) * (finance.dureeGestionMois || 0) +
           (finance.coutActionsAmiable || 0) +
           (finance.coutActionsJuridique || 0) +
           (finance.fraisAvocat || 0) +
           (finance.fraisHuissier || 0);
  }

  /**
   * Obtenir le numéro de dossier
   */
  getDossierNumero(finance: Finance): string {
    if (finance.numeroDossier) {
      return finance.numeroDossier;
    }
    
    const dossierId = finance.dossierId;
    if (dossierId) {
      return `#${dossierId}`;
    }
    
    return 'N/A';
  }
}

