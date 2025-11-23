import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { ChefFinanceService, FinanceStats, FinanceAlert, AgentRoi } from '../../../core/services/chef-finance.service';
import { ChartComponent } from '../../../shared/components/chart/chart.component';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatSnackBarModule,
    ChartComponent
  ],
  templateUrl: './finance-dashboard.component.html',
  styleUrls: ['./finance-dashboard.component.scss']
})
export class FinanceDashboardComponent implements OnInit, OnDestroy {
  stats: FinanceStats | null = null;
  alerts: FinanceAlert[] = [];
  agentRoi: AgentRoi[] = [];
  loading = false;
  
  selectedAlertFilter: string | 'ALL' = 'ALL';
  selectedNiveauFilter: string | 'ALL' = 'ALL';
  
  // Graphiques
  pieChartData: any = null;
  lineChartData: any = null;
  pieChartOptions: any = null;
  lineChartOptions: any = null;
  
  // Pagination alertes
  alertsPageSize = 10;
  alertsPageIndex = 0;
  
  displayedColumnsRoi: string[] = ['agentNom', 'montantRecouvre', 'fraisEngages', 'roi', 'performance'];
  displayedColumnsAlerts: string[] = ['type', 'message', 'dossierId', 'niveau', 'date', 'actions'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private financeService: ChefFinanceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboard(): void {
    this.loading = true;
    
    forkJoin({
      stats: this.financeService.getDashboardStats(),
      alerts: this.financeService.getAlerts(),
      agents: this.financeService.getAgentRoiClassement()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ stats, alerts, agents }) => {
        this.stats = stats;
        this.alerts = alerts;
        this.agentRoi = agents;
        
        // Préparer données graphiques
        this.preparePieChartData(stats.repartitionFrais);
        this.prepareLineChartData(stats.evolutionMensuelle);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement:', err);
        this.snackBar.open('Erreur lors du chargement du dashboard', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  preparePieChartData(repartition: { categorie: string; montant: number; pourcentage?: number }[]): void {
    this.pieChartData = {
      labels: repartition.map(r => r.categorie),
      datasets: [{
        data: repartition.map(r => r.montant),
        backgroundColor: [
          '#f44336', '#2196f3', '#4caf50', '#ff9800', 
          '#9c27b0', '#00bcd4', '#ffeb3b', '#795548'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
    
    // Options pour le graphique en camembert
    this.pieChartOptions = {
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return label + ': ' + value.toFixed(2) + ' TND (' + percentage + '%)';
            }
          }
        }
      }
    };
  }

  prepareLineChartData(evolution: { mois: string; frais: number; recouvre: number }[]): void {
    this.lineChartData = {
      labels: evolution.map(e => e.mois),
      datasets: [
        {
          label: 'Frais',
          data: evolution.map(e => e.frais),
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Recouvré',
          data: evolution.map(e => e.recouvre),
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
    
    // Options pour le graphique linéaire
    this.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value: any) => {
              return value.toFixed(2) + ' TND';
            }
          }
        }
      }
    };
  }

  get filteredAlerts(): FinanceAlert[] {
    let filtered = this.alerts;
    
    if (this.selectedAlertFilter !== 'ALL') {
      filtered = filtered.filter(a => a.type === this.selectedAlertFilter);
    }
    
    if (this.selectedNiveauFilter !== 'ALL') {
      filtered = filtered.filter(a => a.niveau === this.selectedNiveauFilter);
    }
    
    return filtered;
  }

  get paginatedAlerts(): FinanceAlert[] {
    const start = this.alertsPageIndex * this.alertsPageSize;
    return this.filteredAlerts.slice(start, start + this.alertsPageSize);
  }

  onAlertsPageChange(event: PageEvent): void {
    this.alertsPageIndex = event.pageIndex;
    this.alertsPageSize = event.pageSize;
  }

  getAlertTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      FRAIS_ELEVES: 'Frais Élevés',
      DOSSIER_INACTIF: 'Dossier Inactif',
      BUDGET_DEPASSE: 'Budget Dépassé',
      ACTION_RISQUE: 'Action à Risque'
    };
    return labels[type] || type;
  }

  getAlertColor(niveau: string): string {
    const colors: Record<string, string> = {
      INFO: 'primary',
      WARNING: 'accent',
      DANGER: 'warn'
    };
    return colors[niveau] || 'primary';
  }

  getRoiColor(roi: number): string {
    if (roi > 50) return 'primary';
    if (roi > 20) return 'accent';
    return 'warn';
  }

  getRoiPerformance(roi: number): number {
    return Math.min(Math.max(roi, 0), 100);
  }

  voirDossier(dossierId: number): void {
    // Navigation vers le détail du dossier
    window.open(`/dossier/${dossierId}`, '_blank');
  }

  refreshAlerts(): void {
    this.financeService.getAlerts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (alerts) => {
        this.alerts = alerts;
        this.snackBar.open('Alertes actualisées', 'Fermer', { duration: 2000 });
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors de l\'actualisation', 'Fermer', { duration: 3000 });
      }
    });
  }
}
