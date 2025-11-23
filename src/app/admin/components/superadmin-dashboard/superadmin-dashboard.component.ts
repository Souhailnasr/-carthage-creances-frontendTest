import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { StatistiqueService } from '../../../core/services/statistique.service';
import { PerformanceService } from '../../../core/services/performance.service';
import { User } from '../../../shared/models';

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
  imports: [CommonModule, RouterModule],
  templateUrl: './superadmin-dashboard.component.html',
  styleUrls: ['./superadmin-dashboard.component.scss']
})
export class SuperadminDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();
  
  // Exposer Math pour le template
  Math = Math;

  // Statistiques globales
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

  // Statistiques par module
  moduleStats: ModuleStats[] = [];

  // Données pour les graphiques
  chartData: any = {};

  constructor(
    private authService: AuthService,
    private statistiqueService: StatistiqueService,
    private performanceService: PerformanceService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadGlobalStatistics();
    this.loadModuleStatistics();
    this.loadChartData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
        console.error('Erreur lors du chargement des statistiques globales:', error);
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
        console.error('Erreur lors du chargement des statistiques des chefs:', error);
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
}
