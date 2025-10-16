import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DossierService } from '../../../core/services/dossier.service';
import { AvocatService } from '../../services/avocat.service';
import { HuissierService } from '../../services/huissier.service';
import { AudienceService } from '../../services/audience.service';
import { UtilisateurService } from '../../../core/services/utilisateur.service';
import { Role } from '../../../shared/models';
import { Audience, DecisionResult } from '../../models/audience.model';

interface Activity {
  type: string;
  title: string;
  description: string;
  date: Date;
}

@Component({
  selector: 'app-juridique-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './juridique-dashboard.component.html',
  styleUrls: ['./juridique-dashboard.component.scss']
})
export class JuridiqueDashboardComponent implements OnInit, OnDestroy {
  totalDossiers: number = 0;
  totalAvocats: number = 0;
  totalHuissiers: number = 0;
  totalAudiences: number = 0;
  agentsJuridiques: any[] = [];
  decisionsPositives: number = 0;
  decisionsNegatives: number = 0;
  decisionsRapporter: number = 0;
  recentActivities: Activity[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private dossierService: DossierService,
    private avocatService: AvocatService,
    private huissierService: HuissierService,
    private audienceService: AudienceService,
    private utilisateurService: UtilisateurService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    // Load dossiers
    this.dossierService.loadAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossiers: any[]) => {
          this.totalDossiers = dossiers.filter((dossier: any) => 
            dossier.dossierStatus === 'ENCOURSDETRAITEMENT'
          ).length;
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du chargement des dossiers:', error);
        }
      });

    // Load avocats
    this.avocatService.getAllAvocats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avocats) => {
          this.totalAvocats = avocats.length;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des avocats:', error);
        }
      });

    // Load huissiers
    this.huissierService.getAllHuissiers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (huissiers) => {
          this.totalHuissiers = huissiers.length;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des huissiers:', error);
        }
      });

    // Load audiences
    this.audienceService.getAllAudiences()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (audiences) => {
          this.totalAudiences = audiences.length;
          this.calculateDecisionStats(audiences);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des audiences:', error);
        }
      });

    // Load agents juridiques
    this.utilisateurService.getUtilisateursByRole(Role.AGENT_RECOUVREMENT_JURIDIQUE)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (agents) => {
          this.agentsJuridiques = agents;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des agents juridiques:', error);
        }
      });

    // Load recent activities
    this.loadRecentActivities();
  }

  calculateDecisionStats(audiences: Audience[]): void {
    this.decisionsPositives = audiences.filter(a => a.decisionResult === DecisionResult.POSITIVE).length;
    this.decisionsNegatives = audiences.filter(a => a.decisionResult === DecisionResult.NEGATIVE).length;
    this.decisionsRapporter = audiences.filter(a => a.decisionResult === DecisionResult.RAPPORTER).length;
  }

  loadRecentActivities(): void {
    // Mock recent activities - in a real app, this would come from an API
    this.recentActivities = [
      {
        type: 'audience',
        title: 'Nouvelle audience programmée',
        description: 'Audience pour le dossier #DOS-2024-001 au Tribunal de Première Instance de Tunis',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        type: 'assignment',
        title: 'Dossier assigné',
        description: 'Le dossier #DOS-2024-002 a été assigné à Me. Ahmed Ben Ali',
        date: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        type: 'decision',
        title: 'Décision rendue',
        description: 'Décision positive rendue pour le dossier #DOS-2024-003',
        date: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      },
      {
        type: 'agent',
        title: 'Nouvel agent ajouté',
        description: 'Agent juridique Fatma Khelil a été ajouté au système',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];
  }

  getAgentPerformance(agentId: number): number {
    // Mock performance data - in a real app, this would come from an API
    return Math.floor(Math.random() * 20) + 5;
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'audience': 'fa-gavel',
      'assignment': 'fa-user-plus',
      'decision': 'fa-balance-scale',
      'agent': 'fa-user-tie'
    };
    return icons[type] || 'fa-info-circle';
  }
}