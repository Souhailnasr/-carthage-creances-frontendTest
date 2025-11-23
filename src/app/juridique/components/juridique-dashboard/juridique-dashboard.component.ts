import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DossierService } from '../../../core/services/dossier.service';
import { AvocatService } from '../../services/avocat.service';
import { HuissierService } from '../../services/huissier.service';
import { AudienceService } from '../../services/audience.service';
import { UtilisateurService } from '../../../core/services/utilisateur.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { StatistiqueService } from '../../../core/services/statistique.service';
import { PerformanceService } from '../../../core/services/performance.service';
import { Role, User } from '../../../shared/models';
import { DossierApi, Urgence } from '../../../shared/models/dossier-api.model';
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
  currentUser: User | null = null;
  totalDossiers: number = 0;
  totalAvocats: number = 0;
  totalHuissiers: number = 0;
  totalAudiences: number = 0;
  agentsJuridiques: User[] = [];
  decisionsPositives: number = 0;
  decisionsNegatives: number = 0;
  decisionsRapporter: number = 0;
  recentActivities: Activity[] = [];
  
  // Statistiques dynamiques
  totalMontant = 0;
  dossiersEnCours = 0;
  dossiersAvecAvocat = 0;
  dossiersAvecHuissier = 0;
  dossiersUrgents = 0;
  
  // Cache pour les performances des agents (pour éviter ExpressionChangedAfterItHasBeenCheckedError)
  private agentPerformanceCache: Map<string | number, number> = new Map();
  
  private destroy$ = new Subject<void>();

  constructor(
    private dossierService: DossierService,
    private avocatService: AvocatService,
    private huissierService: HuissierService,
    private audienceService: AudienceService,
    private utilisateurService: UtilisateurService,
    private jwtAuthService: JwtAuthService,
    private dossierApiService: DossierApiService,
    private statistiqueService: StatistiqueService,
    private performanceService: PerformanceService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDashboardData();
    // loadDossiersStats() est appelé séparément car il utilise une API différente
    // et met à jour totalDossiers avec les données de recouvrement juridique
    this.loadDossiersStats();
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser().pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
    });
  }

  loadDossiersStats(): void {
    this.dossierApiService.getDossiersRecouvrementJuridique(0, 1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (page) => {
        // Vérifier que page et page.content existent et sont valides
        if (page && Array.isArray(page.content)) {
          this.totalDossiers = page.totalElements || page.content.length;
          this.totalMontant = page.content.reduce((sum, d) => sum + (d.montantCreance || 0), 0);
          this.dossiersEnCours = page.content.filter(d => d.statut === 'EN_COURS').length;
          this.dossiersAvecAvocat = page.content.filter(d => d.avocat).length;
          this.dossiersAvecHuissier = page.content.filter(d => d.huissier).length;
          this.dossiersUrgents = page.content.filter(d => d.urgence === Urgence.TRES_URGENT).length;
        } else {
          console.warn('⚠️ Format de réponse inattendu pour getDossiersRecouvrementJuridique:', page);
          // Utiliser setTimeout pour éviter ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.totalDossiers = 0;
            this.totalMontant = 0;
            this.dossiersEnCours = 0;
            this.dossiersAvecAvocat = 0;
            this.dossiersAvecHuissier = 0;
            this.dossiersUrgents = 0;
          }, 0);
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des statistiques de dossiers:', error);
        // Utiliser setTimeout pour éviter ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.totalDossiers = 0;
          this.totalMontant = 0;
          this.dossiersEnCours = 0;
          this.dossiersAvecAvocat = 0;
          this.dossiersAvecHuissier = 0;
          this.dossiersUrgents = 0;
        }, 0);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    if (!this.currentUser?.id) {
      return;
    }

    const userRole = this.currentUser.roleUtilisateur;
    const chefId = parseInt(this.currentUser.id);

    // Charger les statistiques selon le rôle
    if (userRole === 'SUPER_ADMIN') {
      // Super Admin voit toutes les statistiques
      this.statistiqueService.getStatistiquesGlobales().pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (stats) => {
          this.totalAudiences = stats.totalAudiences || 0;
          // Les autres statistiques sont chargées par loadDossiersStats()
        },
        error: (error) => {
          console.error('Erreur lors du chargement des statistiques globales:', error);
        }
      });
    } else if (userRole?.startsWith('CHEF_')) {
      // Les chefs voient uniquement leurs statistiques
      this.statistiqueService.getStatistiquesChef(chefId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (stats) => {
          // Les statistiques du chef incluent les données de ses agents
          this.totalAudiences = stats.totalTachesAgents || 0; // Approximation
        },
        error: (error) => {
          console.error('Erreur lors du chargement des statistiques du chef:', error);
        }
      });
    }

    // Load dossiers
    this.dossierService.loadAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossiers: any) => {
          // Vérifier que dossiers est un tableau avant d'utiliser filter
          if (Array.isArray(dossiers)) {
            this.totalDossiers = dossiers.filter((dossier: any) => 
              dossier.dossierStatus === 'ENCOURSDETRAITEMENT'
            ).length;
          } else {
            console.warn('⚠️ dossiers n\'est pas un tableau:', dossiers);
            this.totalDossiers = 0;
          }
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du chargement des dossiers:', error);
          this.totalDossiers = 0;
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
          this.agentsJuridiques = agents
            .filter(a => a.actif)
            .map(a => {
              const agentId = a.id?.toString() || '';
              // Calculer et mettre en cache la performance une seule fois
              if (!this.agentPerformanceCache.has(agentId)) {
                this.agentPerformanceCache.set(agentId, Math.floor(Math.random() * 20) + 5);
              }
              return {
                id: agentId,
                nom: a.nom,
                prenom: a.prenom,
                email: a.email,
                roleUtilisateur: Role.AGENT_RECOUVREMENT_JURIDIQUE,
                actif: a.actif
              } as User;
            });
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

  getAgentPerformance(agentId: number | string): number {
    // Utiliser le cache pour éviter ExpressionChangedAfterItHasBeenCheckedError
    if (this.agentPerformanceCache.has(agentId)) {
      return this.agentPerformanceCache.get(agentId)!;
    }
    // Si pas dans le cache, générer une valeur et la mettre en cache
    const performance = Math.floor(Math.random() * 20) + 5;
    this.agentPerformanceCache.set(agentId, performance);
    return performance;
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

  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    const roleNames: { [key: string]: string } = {
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': 'Chef Département Recouvrement Juridique',
      'AGENT_RECOUVREMENT_JURIDIQUE': 'Agent Recouvrement Juridique'
    };
    return roleNames[this.currentUser.roleUtilisateur || ''] || this.currentUser.roleUtilisateur || '';
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