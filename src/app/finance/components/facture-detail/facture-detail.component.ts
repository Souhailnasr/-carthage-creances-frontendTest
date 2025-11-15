import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { FinanceService, DetailFacture, Finance, ActionFinance } from '../../../core/services/finance.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

@Component({
  selector: 'app-facture-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule
  ],
  templateUrl: './facture-detail.component.html',
  styleUrls: ['./facture-detail.component.scss']
})
export class FactureDetailComponent implements OnInit, OnDestroy {
  dossierId!: number;
  detailFacture: DetailFacture | null = null;
  finance: Finance | null = null;
  actionsAmiable: ActionFinance[] = [];
  actionsJuridique: ActionFinance[] = [];
  loading = false;
  
  displayedColumnsAmiable: string[] = ['dateAction', 'type', 'nbOccurrences', 'coutUnitaire', 'total'];
  displayedColumnsJuridique: string[] = ['dateAction', 'type', 'nbOccurrences', 'coutUnitaire', 'total'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private financeService: FinanceService,
    private snackBar: MatSnackBar,
    private jwtAuthService: JwtAuthService
  ) {}

  ngOnInit(): void {
    // Vérifier l'authentification
    if (!this.jwtAuthService.isUserLoggedIn()) {
      this.snackBar.open('Vous devez être connecté pour accéder à cette page', 'Fermer', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }
    
    this.dossierId = +this.route.snapshot.paramMap.get('id')!;
    if (!this.dossierId) {
      this.snackBar.open('ID de dossier invalide', 'Fermer', { duration: 3000 });
      this.router.navigate(['/finance']);
      return;
    }
    
    this.loadDetailFacture();
    this.loadFinance();
    this.loadActions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDetailFacture(): void {
    this.loading = true;
    this.financeService.getDetailFacture(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (detail) => {
        this.detailFacture = detail;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement de la facture:', err);
        this.snackBar.open('Erreur lors du chargement de la facture', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadFinance(): void {
    this.financeService.getFinanceByDossier(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (finance) => {
        this.finance = finance;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement de Finance:', err);
      }
    });
  }

  loadActions(): void {
    this.financeService.getActionsAvecCouts(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (actions) => {
        // Filtrer par type de recouvrement (à adapter selon la structure backend)
        // Pour l'instant, on sépare par type d'action
        this.actionsAmiable = actions.filter(a => 
          ['APPEL', 'EMAIL', 'VISITE', 'LETTRE'].includes(a.type)
        );
        this.actionsJuridique = actions.filter(a => 
          !['APPEL', 'EMAIL', 'VISITE', 'LETTRE'].includes(a.type)
        );
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des actions:', err);
      }
    });
  }

  recalculerCouts(): void {
    this.loading = true;
    this.financeService.recalculerCouts(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (finance) => {
        this.finance = finance;
        this.loadDetailFacture();
        this.snackBar.open('Coûts recalculés avec succès', 'Fermer', { duration: 3000 });
      },
      error: (err) => {
        console.error('❌ Erreur lors du recalcul:', err);
        const errorMessage = err.error?.message || err.message || 'Erreur lors du recalcul';
        this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  finaliserFacture(): void {
    if (confirm('Êtes-vous sûr de vouloir finaliser cette facture ?')) {
      this.loading = true;
      this.financeService.finaliserFacture(this.dossierId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (finance) => {
          this.finance = finance;
          this.snackBar.open('Facture finalisée avec succès', 'Fermer', { duration: 3000 });
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Erreur lors de la finalisation:', err);
          const errorMessage = err.error?.message || err.message || 'Erreur lors de la finalisation';
          this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
          this.loading = false;
        }
      });
    }
  }

  imprimerFacture(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/finance']);
  }
}

