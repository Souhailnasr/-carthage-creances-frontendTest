import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StatistiqueCompleteService } from '../../../../core/services/statistique-complete.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-supervision-finance',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StatCardComponent
  ],
  templateUrl: './supervision-finance.component.html',
  styleUrls: ['./supervision-finance.component.scss']
})
export class SupervisionFinanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  statsFinancieres: any = null;
  loading = false;

  constructor(
    private statistiqueService: StatistiqueCompleteService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;

    // ✅ STANDARDISATION : Utiliser getStatistiquesGlobales() + getStatistiquesFinancieres()
    forkJoin({
      globales: this.statistiqueService.getStatistiquesGlobales().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques globales:', error);
          return of(null);
        })
      ),
      financieres: this.statistiqueService.getStatistiquesFinancieres().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques financières:', error);
          return of(null);
        })
      )
    }).subscribe({
      next: (results) => {
        // Prioriser les statistiques financières (endpoint spécialisé)
        this.statsFinancieres = results.financieres || results.globales;
        this.loading = false;
        console.log('✅ Statistiques financières chargées (standardisées):', {
          globales: results.globales,
          financieres: results.financieres
        });
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des statistiques financières:', error);
        this.loading = false;
      }
    });
  }

  formatAmount(amount: number | null | undefined): string {
    const value = amount !== null && amount !== undefined ? amount : 0;
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(value);
  }

  getFinancierStats(): { [key: string]: string | number } {
    if (!this.statsFinancieres) return {};
    // ✅ CORRECTION: Remplacer 'N/A' par 0
    const montantRecouvre = this.statsFinancieres.montantRecouvre !== null && this.statsFinancieres.montantRecouvre !== undefined 
      ? this.formatAmount(this.statsFinancieres.montantRecouvre) 
      : this.formatAmount(0);
    const montantEnCours = this.statsFinancieres.montantEnCours !== null && this.statsFinancieres.montantEnCours !== undefined 
      ? this.formatAmount(this.statsFinancieres.montantEnCours) 
      : this.formatAmount(0);
    const tauxReussite = this.statsFinancieres.tauxReussiteGlobal !== null && this.statsFinancieres.tauxReussiteGlobal !== undefined 
      ? this.statsFinancieres.tauxReussiteGlobal.toFixed(2) + '%' 
      : '0%';
    return {
      'Montant recouvré': montantRecouvre,
      'Montant en cours': montantEnCours,
      'Taux de réussite': tauxReussite
    };
  }
}

