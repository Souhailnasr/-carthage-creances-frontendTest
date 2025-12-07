import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DossierService } from '../../../core/services/dossier.service';
import { AvocatService } from '../../services/avocat.service';
import { HuissierService } from '../../services/huissier.service';
import { AudienceService } from '../../services/audience.service';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { StatistiqueService } from '../../../core/services/statistique.service';
import { StatistiqueCompleteService } from '../../../core/services/statistique-complete.service';
import { NotificationCompleteService } from '../../../core/services/notification-complete.service';
import { TacheCompleteService } from '../../../core/services/tache-complete.service';
import { PerformanceService } from '../../../core/services/performance.service';
import { IaPredictionService } from '../../../core/services/ia-prediction.service';
import { Role, User } from '../../../shared/models';
import { DossierApi, Urgence } from '../../../shared/models/dossier-api.model';
import { Audience, DecisionResult } from '../../models/audience.model';
import { IaPredictionBadgeComponent } from '../../../shared/components/ia-prediction-badge/ia-prediction-badge.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { IaPredictionResult } from '../../../shared/models/ia-prediction-result.model';
import { StatistiquesChef, StatistiquesGlobales, StatistiquesAudiences } from '../../../shared/models/statistique-complete.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface Activity {
  type: string;
  title: string;
  description: string;
  date: Date;
}

@Component({
  selector: 'app-juridique-dashboard',
  standalone: true,
  imports: [CommonModule, IaPredictionBadgeComponent, StatCardComponent, MatSnackBarModule],
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
  
  // ✅ Statistiques standardisées
  statsGlobales: StatistiquesGlobales | null = null;
  statsAudiences: StatistiquesAudiences | null = null;
  
  // Cache pour les performances des agents (pour éviter ExpressionChangedAfterItHasBeenCheckedError)
  private agentPerformanceCache: Map<string | number, number> = new Map();
  
  // Prédictions IA
  recentDossiers: DossierApi[] = [];
  predictions: Map<number, IaPredictionResult> = new Map();
  loadingPredictions: Map<number, boolean> = new Map();
  
  // Statistiques complètes (nouveau système)
  statsDepartement: StatistiquesChef | null = null;
  statsRecouvrement: any = null; // ✅ NOUVEAU : Statistiques de recouvrement par phase
  loadingStatsCompletes = false;
  
  // Anciennes propriétés (conservées pour compatibilité, mais statsAudiences est déjà défini ci-dessus)
  statsDocumentsHuissier: any = null;
  statsActionsHuissier: any = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private dossierService: DossierService,
    private avocatService: AvocatService,
    private huissierService: HuissierService,
    private audienceService: AudienceService,
    private utilisateurService: UtilisateurService,
    private jwtAuthService: JwtAuthService,
    private dossierApiService: DossierApiService,
    private statistiqueService: StatistiqueService, // Ancien - conservé
    private statistiqueCompleteService: StatistiqueCompleteService, // Nouveau
    private notificationCompleteService: NotificationCompleteService, // Nouveau
    private tacheCompleteService: TacheCompleteService, // Nouveau
    private performanceService: PerformanceService,
    private iaPredictionService: IaPredictionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDashboardData();
    // loadDossiersStats() est appelé séparément car il utilise une API différente
    // et met à jour totalDossiers avec les données de recouvrement juridique
    this.loadDossiersStats();
    this.loadStatistiquesCompletes(); // Nouveau système
    this.loadRecentDossiersWithPredictions();
  }

  /**
   * Charge les statistiques avec le nouveau système complet
   * Prompt 4 : Ajouter audiences, documents huissier, actions huissier
   */
  loadStatistiquesCompletes(): void {
    this.loadingStatsCompletes = true;
    
    // ✅ NOUVEAU : Charger les statistiques du département + recouvrement par phase
    forkJoin({
      departement: this.statistiqueCompleteService.getStatistiquesDepartement().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques du département:', error);
          return of(null);
        })
      ),
      audiences: this.statistiqueCompleteService.getStatistiquesAudiences().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des audiences:', error);
          return of(null);
        })
      ),
      globales: this.statistiqueCompleteService.getStatistiquesGlobales().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques globales:', error);
          return of(null);
        })
      ),
      recouvrement: this.statistiqueCompleteService.getStatistiquesRecouvrementParPhaseDepartement().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques de recouvrement par phase:', error);
          return of(null);
        })
      )
    }).subscribe({
      next: (results) => {
        this.statsDepartement = results.departement;
        this.statsAudiences = results.audiences;
        this.statsRecouvrement = results.recouvrement; // ✅ NOUVEAU : Statistiques de recouvrement par phase
        
        // Extraire les statistiques documents et actions huissier depuis globales
        if (results.globales) {
          this.statsDocumentsHuissier = {
            completes: results.globales.documentsHuissierCompletes !== null && results.globales.documentsHuissierCompletes !== undefined ? results.globales.documentsHuissierCompletes : null,
            crees: results.globales.documentsHuissierCrees !== null && results.globales.documentsHuissierCrees !== undefined ? results.globales.documentsHuissierCrees : null
          };
          this.statsActionsHuissier = {
            completes: results.globales.actionsHuissierCompletes !== null && results.globales.actionsHuissierCompletes !== undefined ? results.globales.actionsHuissierCompletes : null,
            crees: results.globales.actionsHuissierCrees !== null && results.globales.actionsHuissierCrees !== undefined ? results.globales.actionsHuissierCrees : null
          };
        }
        
        // ✅ NOUVEAU : Mettre à jour le montant recouvré depuis les statistiques de recouvrement
        if (results.recouvrement && results.recouvrement.montantRecouvrePhaseJuridique !== undefined && results.recouvrement.montantRecouvrePhaseJuridique !== null) {
          if (this.statsDepartement && this.statsDepartement.chef) {
            this.statsDepartement.chef.montantRecouvre = results.recouvrement.montantRecouvrePhaseJuridique;
          }
        }
        
        this.loadingStatsCompletes = false;
        console.log('✅ Statistiques complètes du département juridique chargées:', results);
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des statistiques complètes:', error);
        this.loadingStatsCompletes = false;
      }
    });
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser().pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
    });
  }

  loadDossiersStats(): void {
    // Note: Backend limite la taille de page à 100 max
    this.dossierApiService.getDossiersRecouvrementJuridique(0, 100).pipe(
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

    // ✅ STANDARDISATION : Utiliser getStatistiquesGlobales() + getStatistiquesAudiences()
    forkJoin({
      globales: this.statistiqueCompleteService.getStatistiquesGlobales().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('❌ Erreur lors du chargement des statistiques globales:', error);
          return of(null);
        })
      ),
      audiences: this.statistiqueCompleteService.getStatistiquesAudiences().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques audiences:', error);
          return of(null);
        })
      )
    }).subscribe({
      next: (results) => {
        this.statsGlobales = results.globales;
        this.statsAudiences = results.audiences;
        
        // Mapper les statistiques globales
        if (results.globales) {
          this.totalDossiers = results.globales.totalDossiers || 0;
          this.totalAudiences = results.globales.audiencesTotales || 0;
          this.dossiersEnCours = results.globales.dossiersEnCours || 0;
          // Documents et actions huissier depuis globales
          if (results.globales.documentsHuissierCrees !== undefined) {
            // Peut être utilisé pour afficher les statistiques
          }
          if (results.globales.actionsHuissierCrees !== undefined) {
            // Peut être utilisé pour afficher les statistiques
          }
        }
        
        // Mapper les statistiques des audiences (endpoint spécialisé)
        if (results.audiences) {
          this.totalAudiences = results.audiences.total || results.globales?.audiencesTotales || 0;
          this.statsAudiences = results.audiences;
        } else if (results.globales) {
          // Fallback sur les statistiques globales
          this.totalAudiences = results.globales.audiencesTotales || 0;
          if (results.globales.audiencesProchaines !== undefined) {
            this.statsAudiences = {
              total: results.globales.audiencesTotales || 0,
              prochaines: results.globales.audiencesProchaines || 0,
              passees: (results.globales.audiencesTotales || 0) - (results.globales.audiencesProchaines || 0)
            };
          }
        }
        
        // Initialiser avec 0 si null pour éviter l'affichage vide
        this.totalAudiences = this.totalAudiences || 0;
        this.totalDossiers = this.totalDossiers || 0;
        this.dossiersEnCours = this.dossiersEnCours || 0;
        
        console.log('✅ Statistiques chargées (standardisées):', {
          globales: results.globales,
          audiences: results.audiences
        });
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des statistiques:', error);
        this.snackBar.open('Erreur lors du chargement des statistiques', 'Fermer', { duration: 3000 });
      }
    });

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

  loadRecentDossiersWithPredictions(): void {
    this.dossierApiService.getDossiersRecouvrementJuridique(0, 5).pipe(
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
}
