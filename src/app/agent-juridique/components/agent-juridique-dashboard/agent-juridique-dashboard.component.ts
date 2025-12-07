import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';
import { AgentJuridiqueService, AgentJuridiqueStats } from '../../../core/services/agent-juridique.service';
import { StatistiqueCompleteService } from '../../../core/services/statistique-complete.service';
import { NotificationCompleteService } from '../../../core/services/notification-complete.service';
import { TacheCompleteService } from '../../../core/services/tache-complete.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { User } from '../../../shared/models';
import { ToastService } from '../../../core/services/toast.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatistiquesAgent } from '../../../shared/models/statistique-complete.model';

@Component({
  selector: 'app-agent-juridique-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    StatCardComponent
  ],
  templateUrl: './agent-juridique-dashboard.component.html',
  styleUrls: ['./agent-juridique-dashboard.component.scss']
})
export class AgentJuridiqueDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  stats: AgentJuridiqueStats | null = null;
  loading = false;
  
  // Statistiques complètes (nouveau système)
  statsCompletes: StatistiquesAgent | null = null;
  loadingStatsCompletes = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private agentJuridiqueService: AgentJuridiqueService, // Ancien - conservé
    private statistiqueCompleteService: StatistiqueCompleteService, // Nouveau
    private notificationCompleteService: NotificationCompleteService, // Nouveau
    private tacheCompleteService: TacheCompleteService, // Nouveau
    private jwtAuthService: JwtAuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (user) => {
        this.currentUser = user;
        if (user?.id) {
          this.loadStatistiques(parseInt(user.id));
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
      }
    });
  }

  loadStatistiques(agentId: number): void {
    this.loading = true;
    // Charger avec l'ancien système
    this.agentJuridiqueService.getStatistiquesPersonnelles(agentId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des statistiques:', error);
        this.toastService.error('Erreur lors du chargement des statistiques');
        this.loading = false;
      }
    });
    
    // Charger avec le nouveau système
    this.loadStatistiquesCompletes(agentId);
  }

  /**
   * Charge les statistiques avec le nouveau système complet
   */
  loadStatistiquesCompletes(agentId: number): void {
    this.loadingStatsCompletes = true;
    
    this.statistiqueCompleteService.getStatistiquesAgent(agentId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.statsCompletes = stats;
        this.loadingStatsCompletes = false;
        console.log('✅ Statistiques complètes de l\'agent juridique chargées:', stats);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des statistiques complètes:', error);
        this.loadingStatsCompletes = false;
        // En cas d'erreur, continuer avec l'ancien système
      }
    });
  }
}

