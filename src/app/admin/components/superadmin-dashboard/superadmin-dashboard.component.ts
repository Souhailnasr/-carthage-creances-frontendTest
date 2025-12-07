import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { StatistiqueService } from '../../../core/services/statistique.service';
import { StatistiqueCompleteService } from '../../../core/services/statistique-complete.service';
import { NotificationCompleteService } from '../../../core/services/notification-complete.service';
import { TacheCompleteService } from '../../../core/services/tache-complete.service';
import { PerformanceService } from '../../../core/services/performance.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { IaPredictionService } from '../../../core/services/ia-prediction.service';
import { DashboardAnalyticsService, KPIsResponse, EvolutionMensuelleResponse, RepartitionStatutResponse, PerformanceDepartementsResponse, AlertesResponse, ActiviteRecenteResponse } from '../../../core/services/dashboard-analytics.service';
import { User } from '../../../shared/models';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { IaPredictionBadgeComponent } from '../../../shared/components/ia-prediction-badge/ia-prediction-badge.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { IaPredictionResult } from '../../../shared/models/ia-prediction-result.model';
import { StatistiquesGlobales, StatistiquesTousChefs } from '../../../shared/models/statistique-complete.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface GlobalStats {
  totalUsers: number;
  totalDossiers: number;
  totalCreanciers: number;
  totalDebiteurs: number;
  activeAgents: number;
  totalNotifications: number;
  performanceGlobale: number;
  dossiersEnCours: number;
  dossiersClotures: number;
  recouvrementAmiable: number;
  recouvrementJuridique: number;
}

interface ModuleStats {
  name: string;
  icon: string;
  value: number;
  color: string;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IaPredictionBadgeComponent,
    StatCardComponent,
    ChartComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './superadmin-dashboard.component.html',
  styleUrls: ['./superadmin-dashboard.component.scss']
})
export class SuperadminDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();
  
  // Exposer Math pour le template
  Math = Math;

  // Statistiques globales (ancien système - conservé pour compatibilité)
  globalStats: GlobalStats = {
    totalUsers: 0,
    totalDossiers: 0,
    totalCreanciers: 0,
    totalDebiteurs: 0,
    activeAgents: 0,
    totalNotifications: 0,
    performanceGlobale: 0,
    dossiersEnCours: 0,
    dossiersClotures: 0,
    recouvrementAmiable: 0,
    recouvrementJuridique: 0
  };

  // Statistiques complètes (nouveau système)
  statsCompletes: StatistiquesGlobales | null = null;
  statsChefs: StatistiquesTousChefs | null = null;
  loadingStatsCompletes = false;

  // Statistiques par module
  moduleStats: ModuleStats[] = [];

  // Données pour les graphiques
  chartData: any = {};
  
  // KPIs et données analytiques
  kpis: KPIsResponse | null = null;
  evolutionMensuelle: EvolutionMensuelleResponse | null = null;
  repartitionStatut: RepartitionStatutResponse | null = null;
  performanceDepartements: PerformanceDepartementsResponse | null = null;
  alertes: AlertesResponse | null = null;
  activiteRecente: ActiviteRecenteResponse | null = null;
  loadingAnalytics = false;
  
  // Graphiques Chart.js
  evolutionChartData: any = null;
  repartitionChartData: any = null;
  performanceChartData: any = null;

  // Prédictions IA
  recentDossiers: DossierApi[] = [];
  predictions: Map<number, IaPredictionResult> = new Map();
  loadingPredictions: Map<number, boolean> = new Map();

  constructor(
    private authService: AuthService,
    private statistiqueService: StatistiqueService, // Ancien - conservé
    private statistiqueCompleteService: StatistiqueCompleteService, // Nouveau
    private notificationCompleteService: NotificationCompleteService, // Nouveau
    private tacheCompleteService: TacheCompleteService, // Nouveau
    private performanceService: PerformanceService,
    private dossierApiService: DossierApiService,
    private iaPredictionService: IaPredictionService,
    private dashboardAnalyticsService: DashboardAnalyticsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // Charger les statistiques avec les deux systèmes (ancien + nouveau)
    this.loadGlobalStatistics(); // Ancien système
    this.loadGlobalStatisticsCompletes(); // Nouveau système
    this.loadModuleStatistics();
    this.loadChartData();
    this.loadRecentDossiersWithPredictions();
    this.loadAnalyticsData(); // Nouveau : données analytiques avec graphiques
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge les statistiques avec l'ancien système (conservé pour compatibilité)
   */
  loadGlobalStatistics(): void {
    // Super Admin charge toutes les statistiques globales
    this.statistiqueService.getStatistiquesGlobales().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.globalStats = {
          totalUsers: 0, // À charger depuis UtilisateurService
          totalDossiers: stats.totalDossiers || 0,
          totalCreanciers: 0, // À charger depuis CreancierService
          totalDebiteurs: 0, // À charger depuis DebiteurService
          activeAgents: 0, // À calculer depuis les utilisateurs actifs
          totalNotifications: 0, // À charger depuis NotificationService
          performanceGlobale: stats.tauxReussiteGlobal || 0,
          dossiersEnCours: stats.dossiersEnCours || 0,
          dossiersClotures: stats.dossiersClotures || 0,
          recouvrementAmiable: stats.totalActionsAmiables || 0,
          recouvrementJuridique: stats.totalAudiences || 0
        };
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques globales (ancien système):', error);
        // Garder les valeurs par défaut en cas d'erreur
        this.globalStats = {
          totalUsers: 0,
          totalDossiers: 0,
          totalCreanciers: 0,
          totalDebiteurs: 0,
          activeAgents: 0,
          totalNotifications: 0,
          performanceGlobale: 0,
          dossiersEnCours: 0,
          dossiersClotures: 0,
          recouvrementAmiable: 0,
          recouvrementJuridique: 0
        };
      }
    });

    // Charger les statistiques de tous les chefs
    this.statistiqueService.getStatistiquesChefs().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (chefsStats) => {
        // Mettre à jour les statistiques globales avec les données des chefs
        const totalAgents = chefsStats.reduce((sum, chef) => sum + (chef.nombreAgents || 0), 0);
        this.globalStats.activeAgents = totalAgents;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques des chefs (ancien système):', error);
      }
    });
  }

  /**
   * Charge les statistiques avec le nouveau système complet
   */
  loadGlobalStatisticsCompletes(): void {
    this.loadingStatsCompletes = true;
    
    // Charger les statistiques globales complètes
    this.statistiqueCompleteService.getStatistiquesGlobales().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.statsCompletes = stats;
        this.loadingStatsCompletes = false;
        console.log('✅ Statistiques complètes chargées:', stats);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des statistiques complètes:', error);
        this.loadingStatsCompletes = false;
        // En cas d'erreur, continuer avec l'ancien système
      }
    });

    // Charger les statistiques de tous les chefs
    this.statistiqueCompleteService.getStatistiquesTousChefs().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (chefsStats) => {
        this.statsChefs = chefsStats;
        console.log('✅ Statistiques des chefs chargées:', chefsStats);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des statistiques des chefs:', error);
      }
    });
  }

  /**
   * Recalcule les statistiques (nouveau système)
   */
  recalculerStatistiques(): void {
    this.statistiqueCompleteService.recalculerStatistiques().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (message) => {
        this.snackBar.open(message || 'Statistiques recalculées avec succès', 'Fermer', { duration: 3000 });
        // Recharger les statistiques après recalcul
        setTimeout(() => this.loadGlobalStatisticsCompletes(), 2000);
      },
      error: (error) => {
        console.error('❌ Erreur lors du recalcul:', error);
        this.snackBar.open('Erreur lors du recalcul des statistiques', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadModuleStatistics(): void {
    this.moduleStats = [
      {
        name: 'Gestion des Dossiers',
        icon: 'fas fa-folder-open',
        value: this.globalStats.totalDossiers,
        color: '#28a745',
        trend: 'up',
        percentage: 12.5
      },
      {
        name: 'Recouvrement Amiable',
        icon: 'fas fa-handshake',
        value: this.globalStats.recouvrementAmiable,
        color: '#17a2b8',
        trend: 'up',
        percentage: 8.3
      },
      {
        name: 'Recouvrement Juridique',
        icon: 'fas fa-gavel',
        value: this.globalStats.recouvrementJuridique,
        color: '#6f42c1',
        trend: 'stable',
        percentage: 2.1
      },
      {
        name: 'Gestion Financière',
        icon: 'fas fa-chart-line',
        value: 89,
        color: '#fd7e14',
        trend: 'up',
        percentage: 15.7
      },
      {
        name: 'Utilisateurs Actifs',
        icon: 'fas fa-users',
        value: this.globalStats.activeAgents,
        color: '#20c997',
        trend: 'up',
        percentage: 5.2
      },
      {
        name: 'Notifications',
        icon: 'fas fa-bell',
        value: this.globalStats.totalNotifications,
        color: '#dc3545',
        trend: 'down',
        percentage: -3.4
      }
    ];
  }

  loadChartData(): void {
    this.chartData = {
      dossiersParMois: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Dossiers créés',
          data: [45, 67, 89, 123, 98, 156],
          backgroundColor: 'rgba(40, 167, 69, 0.2)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 2
        }]
      },
      performanceAgents: {
        labels: ['Agent 1', 'Agent 2', 'Agent 3', 'Agent 4', 'Agent 5'],
        datasets: [{
          label: 'Performance (%)',
          data: [85, 92, 78, 96, 88],
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)'
          ]
        }]
      }
    };
  }

  /**
   * Charge toutes les données analytiques pour le dashboard amélioré
   */
  loadAnalyticsData(): void {
    this.loadingAnalytics = true;
    
    forkJoin({
      kpis: this.dashboardAnalyticsService.getKPIs(),
      evolution: this.dashboardAnalyticsService.getEvolutionMensuelle(),
      repartition: this.dashboardAnalyticsService.getRepartitionStatut(),
      performance: this.dashboardAnalyticsService.getPerformanceDepartements(),
      alertes: this.dashboardAnalyticsService.getAlertes(),
      activite: this.dashboardAnalyticsService.getActiviteRecente('24h', 0, 10)
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.kpis = data.kpis;
        this.evolutionMensuelle = data.evolution;
        this.repartitionStatut = data.repartition;
        this.performanceDepartements = data.performance;
        this.alertes = data.alertes;
        this.activiteRecente = data.activite;
        
        // Préparer les données pour les graphiques Chart.js
        this.prepareChartData();
        this.loadingAnalytics = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des données analytiques:', error);
        this.loadingAnalytics = false;
      }
    });
  }

  /**
   * Prépare les données pour les graphiques Chart.js
   */
  prepareChartData(): void {
    // Graphique évolution mensuelle
    if (this.evolutionMensuelle) {
      const labels = this.evolutionMensuelle.anneeCourante.map(d => {
        const [annee, mois] = d.mois.split('-');
        const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        return moisNoms[parseInt(mois) - 1];
      });
      
      this.evolutionChartData = {
        labels,
        datasets: [
          {
            label: 'Année en cours',
            data: this.evolutionMensuelle.anneeCourante.map(d => d.montantRecouvre),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
          },
          {
            label: 'Année précédente',
            data: this.evolutionMensuelle.anneePrecedente.map(d => d.montantRecouvre),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderDash: [5, 5],
            tension: 0.1
          }
        ]
      };
    }

    // Graphique répartition par statut (camembert)
    if (this.repartitionStatut) {
      this.repartitionChartData = {
        labels: ['Enquête', 'Amiable', 'Juridique', 'Clôturé', 'Archivé'],
        datasets: [{
          data: [
            this.repartitionStatut.enquete,
            this.repartitionStatut.amiable,
            this.repartitionStatut.juridique,
            this.repartitionStatut.cloture,
            this.repartitionStatut.archive
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

    // Graphique performance par département (barres)
    if (this.performanceDepartements) {
      this.performanceChartData = {
        labels: this.performanceDepartements.departements.map(d => d.nom),
        datasets: [
          {
            label: 'Taux de Recouvrement (%)',
            data: this.performanceDepartements.departements.map(d => d.tauxRecouvrement),
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Dossiers Traités',
            data: this.performanceDepartements.departements.map(d => d.dossiersTraites),
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ]
      };
    }
  }

  getCurrentTime(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return now.toLocaleDateString('fr-FR', options);
  }

  getInitials(): string {
    if (this.currentUser) {
      return `${this.currentUser.prenom.charAt(0)}${this.currentUser.nom.charAt(0)}`.toUpperCase();
    }
    return 'SA';
  }

  getRoleDisplayName(): string {
    return 'Super Administrateur';
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return 'fas fa-arrow-up';
      case 'down': return 'fas fa-arrow-down';
      default: return 'fas fa-minus';
    }
  }

  getTrendColor(trend: string): string {
    switch (trend) {
      case 'up': return '#28a745';
      case 'down': return '#dc3545';
      default: return '#6c757d';
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  loadRecentDossiersWithPredictions(): void {
    this.dossierApiService.getAllDossiers(0, 5).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (page) => {
        const dossiers = Array.isArray(page.content) ? page.content : (Array.isArray(page) ? page : []);
        this.recentDossiers = dossiers.slice(0, 5);
        // Charger les prédictions pour chaque dossier
        this.recentDossiers.forEach(dossier => {
          if (dossier.id) {
            this.loadPredictionForDossier(dossier.id);
          }
        });
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des dossiers récents:', error);
        this.recentDossiers = [];
      }
    });
  }

  loadPredictionForDossier(dossierId: number): void {
    // Vérifier si le dossier a déjà une prédiction dans les données chargées
    const dossier = this.recentDossiers.find(d => d.id === dossierId);
    if (dossier && dossier.etatPrediction && dossier.riskScore !== undefined) {
      this.predictions.set(dossierId, {
        etatFinal: dossier.etatPrediction,
        riskScore: dossier.riskScore,
        riskLevel: dossier.riskLevel || 'Moyen',
        datePrediction: dossier.datePrediction || ''
      });
    }
  }

  getPrediction(dossier: DossierApi): IaPredictionResult | null {
    if (!dossier.id) return null;
    
    // Vérifier d'abord dans le cache
    if (this.predictions.has(dossier.id)) {
      return this.predictions.get(dossier.id) || null;
    }
    
    // Sinon, vérifier si le dossier a déjà une prédiction
    if (dossier.etatPrediction && dossier.riskScore !== undefined) {
      const prediction: IaPredictionResult = {
        etatFinal: dossier.etatPrediction,
        riskScore: dossier.riskScore,
        riskLevel: dossier.riskLevel || 'Moyen',
        datePrediction: dossier.datePrediction || ''
      };
      this.predictions.set(dossier.id, prediction);
      return prediction;
    }
    
    return null;
  }

  isLoadingPrediction(dossier: DossierApi): boolean {
    return dossier.id ? this.loadingPredictions.get(dossier.id) || false : false;
  }

  triggerPrediction(dossierId: number): void {
    this.loadingPredictions.set(dossierId, true);
    this.iaPredictionService.predictForDossier(dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (prediction: IaPredictionResult) => {
        if (prediction) {
          this.predictions.set(dossierId, prediction);
          // Recharger les dossiers pour obtenir la prédiction mise à jour
          this.loadRecentDossiersWithPredictions();
        }
        this.loadingPredictions.set(dossierId, false);
      },
      error: (error: any) => {
        console.error(`❌ Erreur lors du calcul de la prédiction pour le dossier ${dossierId}:`, error);
        this.loadingPredictions.set(dossierId, false);
      }
    });
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
