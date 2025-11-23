import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { ChefFinanceService, InsightFinance } from '../../../core/services/chef-finance.service';
import { FinanceInsight, FinanceInsightCategory } from '../../models/finance-feature.interfaces';

@Component({
  selector: 'app-finance-insights',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './finance-insights.component.html',
  styleUrls: ['./finance-insights.component.scss']
})
export class FinanceInsightsComponent implements OnInit, OnDestroy {
  insights: InsightFinance[] = [];
  filteredInsights: InsightFinance[] = [];
  selectedCategory: string | 'ALL' = 'ALL';
  loading = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private financeService: ChefFinanceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadInsights();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInsights(): void {
    this.loading = true;
    this.financeService.getInsights().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (insights: InsightFinance[]) => {
        this.insights = insights.filter((i: InsightFinance) => !i.traite);
        this.applyFilters();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Erreur lors du chargement:', err);
        this.snackBar.open('Erreur lors du chargement des suggestions', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  marquerTraite(insightId: number): void {
    this.financeService.marquerInsightTraite(insightId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Suggestion marquée comme traitée', 'Fermer', { duration: 3000 });
        this.loadInsights();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors du marquage', 'Fermer', { duration: 3000 });
      }
    });
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      OPTIMISATION_COUTS: 'Optimisation Coûts',
      RISQUES_DOSSIER: 'Risques Dossier',
      PERFORMANCE_AGENT: 'Performance Agent'
    };
    return labels[category] || category;
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      OPTIMISATION_COUTS: 'primary',
      RISQUES_DOSSIER: 'warn',
      PERFORMANCE_AGENT: 'accent'
    };
    return colors[category] || 'primary';
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      OPTIMISATION_COUTS: 'trending_down',
      RISQUES_DOSSIER: 'warning',
      PERFORMANCE_AGENT: 'trending_up'
    };
    return icons[category] || 'info';
  }

  applyFilters(): void {
    if (this.selectedCategory === 'ALL') {
      this.filteredInsights = this.insights;
    } else {
      this.filteredInsights = this.insights.filter(i => i.categorie === this.selectedCategory);
    }
  }

  onCategoryFilterChange(): void {
    this.applyFilters();
  }
}



