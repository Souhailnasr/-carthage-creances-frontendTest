import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ValidationStats, StatutValidation } from '../../../shared/models/validation-dossier.model';
import { ValidationDossierService } from '../../../core/services/validation-dossier.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-validation-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './validation-stats.component.html',
  styleUrls: ['./validation-stats.component.scss']
})
export class ValidationStatsComponent implements OnInit, OnDestroy {
  stats: ValidationStats | null = null;
  loading = false;
  error: string | null = null;
  
  // Exposer l'enum pour le template
  StatutValidation = StatutValidation;

  // Données pour les graphiques
  chartData: any = null;
  agentStats: { [key: string]: number } = {};
  chefStats: { [key: string]: number } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private validationService: ValidationDossierService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.validationService.getValidationStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.prepareChartData();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des statistiques:', error);
          this.error = 'Erreur lors du chargement des statistiques';
          this.loading = false;
        }
      });
  }

  private prepareChartData(): void {
    if (!this.stats) return;

    // Données pour le graphique en barres des statuts
    this.chartData = {
      labels: ['En Attente', 'Validés', 'Rejetés'],
      datasets: [{
        label: 'Nombre de validations',
        data: [
          this.stats.enAttente,
          this.stats.valides,
          this.stats.rejetes
        ],
        backgroundColor: [
          '#ffc107',
          '#28a745',
          '#dc3545'
        ],
        borderColor: [
          '#e0a800',
          '#1e7e34',
          '#bd2130'
        ],
        borderWidth: 1
      }]
    };

    // Statistiques par agent
    this.agentStats = this.stats.parAgent;
    
    // Statistiques par chef
    this.chefStats = this.stats.parChef;
  }

  getStatutPercentage(statut: StatutValidation): number {
    if (!this.stats || this.stats.total === 0) return 0;
    
    switch (statut) {
      case StatutValidation.EN_ATTENTE:
        return (this.stats.enAttente / this.stats.total) * 100;
      case StatutValidation.VALIDE:
        return (this.stats.valides / this.stats.total) * 100;
      case StatutValidation.REJETE:
        return (this.stats.rejetes / this.stats.total) * 100;
      default:
        return 0;
    }
  }

  getTopAgents(): Array<{id: string, count: number}> {
    return Object.entries(this.agentStats)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  getTopChefs(): Array<{id: string, count: number}> {
    return Object.entries(this.chefStats)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  canViewStats(): boolean {
    return this.authService.canValidateDossiers();
  }
}
