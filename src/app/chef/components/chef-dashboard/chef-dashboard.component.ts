import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MockDataService } from '../../../shared/mock/mock-data.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

@Component({
  selector: 'app-chef-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="chef-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="welcome-section">
          <h1>Tableau de Bord Chef - Performance des Agents</h1>
          <p class="welcome-message">
            Bienvenue, <strong>{{ currentUser?.prenom }} {{ currentUser?.nom }}</strong>
            <span class="role-badge">{{ getRoleDisplay(currentUser?.role) }}</span>
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline-primary" routerLink="/dossiers/validation">
            <i class="fas fa-check-circle"></i>
            Valider les Dossiers
          </button>
        </div>
      </div>

      <!-- Alertes -->
      <div class="alerts-section" *ngIf="dashboardData?.alerts?.length > 0">
        <h2>Alertes</h2>
        <div class="alerts-grid">
          <div class="alert-card" *ngFor="let alert of dashboardData?.alerts" [class]="'alert-' + alert.type.toLowerCase()">
            <div class="alert-icon">
              <i class="fas" [class.fa-exclamation-triangle]="alert.type === 'URGENT'" [class.fa-info-circle]="alert.type === 'WARNING'"></i>
            </div>
            <div class="alert-content">
              <h3>{{ alert.message }}</h3>
              <span class="alert-count">{{ alert.count }} élément(s)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques du département -->
      <div class="department-stats">
        <h2>Statistiques du Département</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <h3>{{ departmentStats?.totalAgents }}</h3>
              <p>Agents actifs</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-folder"></i>
            </div>
            <div class="stat-content">
              <h3>{{ departmentStats?.totalDossiers }}</h3>
              <p>Dossiers totaux</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
              <h3>{{ departmentStats?.dossiersValides }}</h3>
              <p>Dossiers validés</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-content">
              <h3>{{ departmentStats?.dossiersEnAttente }}</h3>
              <p>En attente</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="stat-content">
              <h3>{{ departmentStats?.montantRecupere | currency:'TND':'symbol':'1.0-0' }}</h3>
              <p>Montant récupéré</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-content">
              <h3>{{ departmentStats?.tauxRecuperation | number:'1.1-1' }}%</h3>
              <p>Taux de récupération</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance des agents -->
      <div class="agent-performance">
        <h2>Performance des Agents</h2>
        <div class="performance-grid">
          <div class="performance-card" *ngFor="let agent of agentPerformance">
            <div class="agent-header">
              <div class="agent-avatar">
                <i class="fas fa-user"></i>
              </div>
              <div class="agent-info">
                <h3>{{ agent.prenom }} {{ agent.nom }}</h3>
                <span class="performance-badge" [class]="'performance-' + agent.performance.toLowerCase()">
                  {{ agent.performance }}
                </span>
              </div>
            </div>

            <div class="agent-stats">
              <div class="stat-row">
                <span class="stat-label">Dossiers créés:</span>
                <span class="stat-value">{{ agent.dossiersCrees }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Dossiers validés:</span>
                <span class="stat-value">{{ agent.dossiersValides }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">En attente:</span>
                <span class="stat-value">{{ agent.dossiersEnAttente }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Montant récupéré:</span>
                <span class="stat-value">{{ agent.montantRecupere | currency:'TND':'symbol':'1.0-0' }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Taux de réussite:</span>
                <span class="stat-value">{{ agent.tauxReussite | number:'1.1-1' }}%</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Actions effectuées:</span>
                <span class="stat-value">{{ agent.actionsEffectuees }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Moyenne traitement:</span>
                <span class="stat-value">{{ agent.moyenneTraitement }} jours</span>
              </div>
            </div>

            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="agent.tauxReussite"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Activité récente -->
      <div class="recent-activity">
        <h2>Activité Récente</h2>
        <div class="activity-list">
          <div class="activity-item" *ngFor="let activity of recentActivity">
            <div class="activity-icon" [class]="'activity-' + activity.type.toLowerCase()">
              <i class="fas" [class.fa-check-circle]="activity.type === 'DOSSIER_VALIDE'" 
                         [class.fa-plus-circle]="activity.type === 'NOUVEAU_DOSSIER'"
                         [class.fa-tasks]="activity.type === 'ACTION_EFFECTUEE'"></i>
            </div>
            <div class="activity-content">
              <p class="activity-description">{{ activity.description }}</p>
              <div class="activity-meta">
                <span class="activity-agent">{{ activity.agent }}</span>
                <span class="activity-date">{{ activity.date | date:'short' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Objectif mensuel -->
      <div class="monthly-goal">
        <h2>Objectif Mensuel</h2>
        <div class="goal-card">
          <div class="goal-header">
            <h3>Progression: {{ departmentStats?.progressionObjectif | number:'1.1-1' }}%</h3>
            <span class="goal-amount">{{ departmentStats?.montantRecupere | currency:'TND':'symbol':'1.0-0' }} / {{ departmentStats?.objectifMensuel | currency:'TND':'symbol':'1.0-0' }}</span>
          </div>
          <div class="goal-progress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="departmentStats?.progressionObjectif"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chef-dashboard {
      padding: 30px;
      background-color: #f8f9fa;
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 15px;
      color: white;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .welcome-section h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 10px 0;
    }

    .welcome-message {
      font-size: 1.2rem;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .role-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .header-actions .btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .alerts-section, .department-stats, .agent-performance, .recent-activity, .monthly-goal {
      margin-bottom: 40px;
    }

    .alerts-section h2, .department-stats h2, .agent-performance h2, .recent-activity h2, .monthly-goal h2 {
      font-size: 1.8rem;
      font-weight: 600;
      margin-bottom: 25px;
      color: #2c3e50;
    }

    .alerts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .alert-card {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 3px 15px rgba(0, 0, 0, 0.08);
    }

    .alert-card.alert-urgent {
      background: #fdf2f2;
      border-left: 4px solid #e74c3c;
    }

    .alert-card.alert-warning {
      background: #fef9e7;
      border-left: 4px solid #f39c12;
    }

    .alert-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .alert-card.alert-urgent .alert-icon {
      background: #e74c3c;
      color: white;
    }

    .alert-card.alert-warning .alert-icon {
      background: #f39c12;
      color: white;
    }

    .alert-content h3 {
      margin: 0 0 5px 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .alert-count {
      font-size: 0.9rem;
      color: #7f8c8d;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 25px;
    }

    .stat-card {
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      gap: 20px;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .stat-content h3 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 5px 0;
      color: #333;
    }

    .stat-content p {
      margin: 0;
      color: #666;
      font-weight: 500;
    }

    .performance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 25px;
    }

    .performance-card {
      background: white;
      border-radius: 15px;
      padding: 25px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }

    .performance-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }

    .agent-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
    }

    .agent-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3498db, #2980b9);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.2rem;
    }

    .agent-info h3 {
      margin: 0 0 5px 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .performance-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .performance-badge.performance-excellente {
      background: #d4edda;
      color: #155724;
    }

    .performance-badge.performance-bonne {
      background: #d1ecf1;
      color: #0c5460;
    }

    .performance-badge.performance-moyenne {
      background: #fff3cd;
      color: #856404;
    }

    .agent-stats {
      margin-bottom: 20px;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f8f9fa;
    }

    .stat-row:last-child {
      border-bottom: none;
    }

    .stat-label {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .stat-value {
      font-weight: 600;
      color: #2c3e50;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #28a745, #20c997);
      transition: width 0.3s ease;
    }

    .activity-list {
      background: white;
      border-radius: 15px;
      padding: 25px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px 0;
      border-bottom: 1px solid #f8f9fa;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      color: white;
    }

    .activity-icon.activity-dossier_valide {
      background: #28a745;
    }

    .activity-icon.activity-nouveau_dossier {
      background: #007bff;
    }

    .activity-icon.activity-action_effectuee {
      background: #ffc107;
    }

    .activity-content {
      flex: 1;
    }

    .activity-description {
      margin: 0 0 5px 0;
      font-weight: 500;
      color: #2c3e50;
    }

    .activity-meta {
      display: flex;
      gap: 15px;
      font-size: 0.8rem;
      color: #7f8c8d;
    }

    .goal-card {
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
    }

    .goal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .goal-header h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #2c3e50;
    }

    .goal-amount {
      font-size: 1.1rem;
      font-weight: 600;
      color: #3498db;
    }

    .goal-progress {
      margin-top: 15px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .chef-dashboard {
        padding: 15px;
      }

      .dashboard-header {
        flex-direction: column;
        text-align: center;
        gap: 20px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .performance-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ChefDashboardComponent implements OnInit {
  currentUser: any = null;
  dashboardData: any = null;
  departmentStats: any = null;
  agentPerformance: any[] = [];
  recentActivity: any[] = [];

  constructor(
    private mockDataService: MockDataService,
    private jwtAuthService: JwtAuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDashboardData();
  }

  private loadCurrentUser(): void {
    this.currentUser = this.jwtAuthService.getCurrentUser();
  }

  private loadDashboardData(): void {
    this.dashboardData = this.mockDataService.getChefDashboardData();
    this.departmentStats = this.dashboardData.departmentStats;
    this.agentPerformance = this.dashboardData.agentPerformance;
    this.recentActivity = this.dashboardData.recentActivity;
  }

  getRoleDisplay(role: string): string {
    const roleMap: { [key: string]: string } = {
      'SUPER_ADMIN': 'Super Administrateur',
      'CHEF_DEPARTEMENT_DOSSIER': 'Chef de Département',
      'AGENT_DOSSIER': 'Agent de Dossier',
      'CHEF_DOSSIER': 'Chef de Dossier',
      'AGENT_JURIDIQUE': 'Agent Juridique',
      'CHEF_JURIDIQUE': 'Chef Juridique',
      'AGENT_FINANCE': 'Agent Finance',
      'CHEF_FINANCE': 'Chef Finance'
    };
    return roleMap[role] || role;
  }
}