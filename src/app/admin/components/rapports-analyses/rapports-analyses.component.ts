import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DashboardAnalyticsService, KPIsResponse, EvolutionMensuelleResponse, RepartitionStatutResponse, PerformanceDepartementsResponse } from '../../../core/services/dashboard-analytics.service';
import { StatistiqueCompleteService } from '../../../core/services/statistique-complete.service';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-rapports-analyses',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ChartComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './rapports-analyses.component.html',
  styleUrls: ['./rapports-analyses.component.scss']
})
export class RapportsAnalysesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  kpis: KPIsResponse | null = null;
  evolution: EvolutionMensuelleResponse | null = null;
  repartition: RepartitionStatutResponse | null = null;
  performance: PerformanceDepartementsResponse | null = null;
  
  evolutionChartData: any = null;
  repartitionChartData: any = null;
  performanceChartData: any = null;
  
  loading = false;

  allStats: any = {};

  constructor(
    private analyticsService: DashboardAnalyticsService,
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

    // Prompt 10 : Charger toutes les statistiques en parallèle
    forkJoin({
      kpis: this.analyticsService.getKPIs().pipe(catchError(err => { console.warn('Erreur KPIs:', err); return of(null); })),
      evolution: this.analyticsService.getEvolutionMensuelle().pipe(catchError(err => { console.warn('Erreur Evolution:', err); return of(null); })),
      repartition: this.analyticsService.getRepartitionStatut().pipe(catchError(err => { console.warn('Erreur Repartition:', err); return of(null); })),
      performance: this.analyticsService.getPerformanceDepartements().pipe(catchError(err => { console.warn('Erreur Performance:', err); return of(null); })),
      globales: this.statistiqueService.getStatistiquesGlobales().pipe(catchError(err => { console.warn('Erreur Globales:', err); return of(null); })),
      dossiers: this.statistiqueService.getStatistiquesDossiers().pipe(catchError(err => { console.warn('Erreur Dossiers:', err); return of(null); })),
      actionsAmiables: this.statistiqueService.getStatistiquesActionsAmiables().pipe(catchError(err => { console.warn('Erreur Actions Amiables:', err); return of(null); })),
      financieres: this.statistiqueService.getStatistiquesFinancieres().pipe(catchError(err => { console.warn('Erreur Financieres:', err); return of(null); })),
      chefs: this.statistiqueService.getStatistiquesTousChefs().pipe(catchError(err => { console.warn('Erreur Chefs:', err); return of(null); })),
      audiences: this.statistiqueService.getStatistiquesAudiences().pipe(catchError(err => { console.warn('Erreur Audiences:', err); return of(null); })),
      taches: this.statistiqueService.getStatistiquesTaches().pipe(catchError(err => { console.warn('Erreur Taches:', err); return of(null); }))
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.kpis = data.kpis;
        this.evolution = data.evolution;
        this.repartition = data.repartition;
        this.performance = data.performance;
        // Stocker toutes les statistiques
        this.allStats = {
          globales: data.globales,
          dossiers: data.dossiers,
          actionsAmiables: data.actionsAmiables,
          financieres: data.financieres,
          chefs: data.chefs,
          audiences: data.audiences,
          taches: data.taches
        };
        this.prepareChartData();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rapports:', error);
        this.loading = false;
      }
    });
  }

  prepareChartData(): void {
    // Graphique évolution mensuelle
    if (this.evolution) {
      const labels = this.evolution.anneeCourante.map(d => {
        const [annee, mois] = d.mois.split('-');
        const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        return moisNoms[parseInt(mois) - 1];
      });
      
      this.evolutionChartData = {
        labels,
        datasets: [
          {
            label: 'Année en cours',
            data: this.evolution.anneeCourante.map(d => d.montantRecouvre),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
          },
          {
            label: 'Année précédente',
            data: this.evolution.anneePrecedente.map(d => d.montantRecouvre),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderDash: [5, 5],
            tension: 0.1
          }
        ]
      };
    }

    // Graphique répartition par statut
    if (this.repartition) {
      this.repartitionChartData = {
        labels: ['Enquête', 'Amiable', 'Juridique', 'Clôturé', 'Archivé'],
        datasets: [{
          data: [
            this.repartition.enquete,
            this.repartition.amiable,
            this.repartition.juridique,
            this.repartition.cloture,
            this.repartition.archive
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(201, 203, 207, 0.8)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(201, 203, 207, 1)'
          ],
          borderWidth: 2
        }]
      };
    }

    // Graphique performance par département
    if (this.performance) {
      this.performanceChartData = {
        labels: this.performance.departements.map(d => d.nom),
        datasets: [
          {
            label: 'Taux de Recouvrement (%)',
            data: this.performance.departements.map(d => d.tauxRecouvrement),
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Dossiers Traités',
            data: this.performance.departements.map(d => d.dossiersTraites),
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ]
      };
    }
  }

  formatAmount(amount: number): string {
    if (!amount) return '0,00 TND';
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(amount);
  }
}

