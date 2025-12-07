import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChefAmiableService } from '../../services/chef-amiable.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { StatistiqueService } from '../../../core/services/statistique.service';
import { StatistiqueCompleteService } from '../../../core/services/statistique-complete.service';
import { NotificationCompleteService } from '../../../core/services/notification-complete.service';
import { TacheCompleteService } from '../../../core/services/tache-complete.service';
import { PerformanceService } from '../../../core/services/performance.service';
import { IaPredictionService } from '../../../core/services/ia-prediction.service';
import { StatistiqueAmiable, PerformanceAgent, ChefAmiableNotification } from '../../../shared/models';
import { User, Role } from '../../../shared/models';
import { DossierApi, Urgence } from '../../../shared/models/dossier-api.model';
import { IaPredictionBadgeComponent } from '../../../shared/components/ia-prediction-badge/ia-prediction-badge.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { IaPredictionResult } from '../../../shared/models/ia-prediction-result.model';
import { StatistiquesChef, StatistiquesGlobales, StatistiquesActionsAmiables } from '../../../shared/models/statistique-complete.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-chef-amiable-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IaPredictionBadgeComponent, StatCardComponent, MatSnackBarModule],
  templateUrl: './chef-amiable-dashboard.component.html',
  styleUrls: ['./chef-amiable-dashboard.component.scss']
})
export class ChefAmiableDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  statistiques: StatistiqueAmiable = new StatistiqueAmiable();
  performances: PerformanceAgent[] = [];
  notifications: ChefAmiableNotification[] = [];
  notificationsNonLues: number = 0;
  
  // Statistiques dynamiques
  totalDossiers = 0;
  totalMontant = 0;
  dossiersEnCours = 0;
  dossiersUrgents = 0;
  agentsActifs: User[] = [];
  
  // Prédictions IA
  recentDossiers: DossierApi[] = [];
  predictions: Map<number, IaPredictionResult> = new Map();
  loadingPredictions: Map<number, boolean> = new Map();
  
  // Statistiques complètes (nouveau système)
  statsGlobales: StatistiquesGlobales | null = null;
  statsActionsAmiables: StatistiquesActionsAmiables | null = null;
  statsDepartement: StatistiquesChef | null = null;
  statsRecouvrement: any = null; // ✅ NOUVEAU : Statistiques de recouvrement par phase
  loadingStatsCompletes = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private chefAmiableService: ChefAmiableService,
    private jwtAuthService: JwtAuthService,
    private dossierApiService: DossierApiService,
    private utilisateurService: UtilisateurService,
    private statistiqueService: StatistiqueService, // Ancien - conservé
    private statistiqueCompleteService: StatistiqueCompleteService, // Nouveau
    private notificationCompleteService: NotificationCompleteService, // Nouveau
    private tacheCompleteService: TacheCompleteService, // Nouveau
    private performanceService: PerformanceService,
    private iaPredictionService: IaPredictionService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadStatistiques(); // Ancien système
    this.loadStatistiquesCompletes(); // Nouveau système
    this.loadPerformances();
    this.loadNotifications();
    this.loadAgents();
    this.loadDossiersStats();
    this.loadRecentDossiersWithPredictions();
  }

  /**
   * ✅ STANDARDISATION : Charge les statistiques avec getStatistiquesGlobales() + getStatistiquesActionsAmiables()
   */
  loadStatistiquesCompletes(): void {
    this.loadingStatsCompletes = true;
    
    // ✅ Utiliser getStatistiquesGlobales() + getStatistiquesActionsAmiables() + getStatistiquesRecouvrementParPhaseDepartement()
    forkJoin({
      globales: this.statistiqueCompleteService.getStatistiquesGlobales().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('❌ Erreur lors du chargement des statistiques globales:', error);
          return of(null);
        })
      ),
      actionsAmiables: this.statistiqueCompleteService.getStatistiquesActionsAmiables().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques actions amiables:', error);
          return of(null);
        })
      ),
      departement: this.statistiqueCompleteService.getStatistiquesDepartement().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques du département:', error);
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
        this.statsGlobales = results.globales;
        this.statsActionsAmiables = results.actionsAmiables;
        
        // Mapper les statistiques globales (comme SuperAdmin Dashboard)
        if (results.globales) {
          if (results.globales.totalDossiers !== undefined && results.globales.totalDossiers !== null) {
            this.statistiques.totalDossiers = results.globales.totalDossiers;
            this.totalDossiers = results.globales.totalDossiers;
          }
          if (results.globales.dossiersEnCours !== undefined && results.globales.dossiersEnCours !== null) {
            this.dossiersEnCours = results.globales.dossiersEnCours;
            this.statistiques.dossiersEnCours = results.globales.dossiersEnCours;
          }
          if (results.globales.dossiersClotures !== undefined && results.globales.dossiersClotures !== null) {
            this.statistiques.dossiersClotures = results.globales.dossiersClotures;
          }
          if (results.globales.montantRecouvre !== undefined && results.globales.montantRecouvre !== null) {
            this.statistiques.montantRecouvre = results.globales.montantRecouvre;
            this.statistiques.montantRecupere = results.globales.montantRecouvre;
          }
          if (results.globales.montantEnCours !== undefined && results.globales.montantEnCours !== null) {
            this.statistiques.montantEnCours = results.globales.montantEnCours;
          }
          // Calculer le montant total
          const montantRecouvre = results.globales.montantRecouvre ?? 0;
          const montantEnCours = results.globales.montantEnCours ?? 0;
          this.totalMontant = montantRecouvre + montantEnCours;
        }
        
        // Mapper les statistiques des actions amiables (endpoint spécialisé)
        if (results.actionsAmiables) {
          if (results.actionsAmiables.total !== undefined && results.actionsAmiables.total !== null) {
            this.statistiques.actionsAmiables = results.actionsAmiables.total;
            this.statistiques.actionsEffectuees = results.actionsAmiables.total;
          }
          if (results.actionsAmiables.completees !== undefined && results.actionsAmiables.completees !== null) {
            this.statistiques.actionsAmiablesCompletees = results.actionsAmiables.completees;
            this.statistiques.actionsReussies = results.actionsAmiables.completees;
          }
          if (results.actionsAmiables.tauxReussite !== undefined && results.actionsAmiables.tauxReussite !== null) {
            this.statistiques.tauxReussite = results.actionsAmiables.tauxReussite;
          }
        } else if (results.globales) {
          // Fallback sur les statistiques globales si actionsAmiables n'est pas disponible
          if (results.globales.actionsAmiables !== undefined && results.globales.actionsAmiables !== null) {
            this.statistiques.actionsAmiables = results.globales.actionsAmiables;
            this.statistiques.actionsEffectuees = results.globales.actionsAmiables;
          }
          if (results.globales.actionsAmiablesCompletees !== undefined && results.globales.actionsAmiablesCompletees !== null) {
            this.statistiques.actionsAmiablesCompletees = results.globales.actionsAmiablesCompletees;
            this.statistiques.actionsReussies = results.globales.actionsAmiablesCompletees;
          }
        }
        
        // ✅ NOUVEAU : Mapper les statistiques de recouvrement par phase
        if (results.recouvrement) {
          this.statsRecouvrement = results.recouvrement;
          // Mettre à jour le montant recouvré depuis les statistiques de recouvrement
          if (results.recouvrement.montantRecouvrePhaseAmiable !== undefined && results.recouvrement.montantRecouvrePhaseAmiable !== null) {
            this.statistiques.montantRecouvre = results.recouvrement.montantRecouvrePhaseAmiable;
            this.statistiques.montantRecupere = results.recouvrement.montantRecouvrePhaseAmiable;
          }
        }
        
        // Mapper les statistiques du département (pour les agents)
        if (results.departement) {
          this.statsDepartement = results.departement;
          // Statistiques des agents (si disponibles)
          if (results.departement.agents && Array.isArray(results.departement.agents)) {
            this.performances = results.departement.agents.map((agent: any) => ({
              agentId: agent.agentId || agent.id,
              nom: agent.nom || agent.agentNom || '',
              prenom: agent.prenom || agent.agentPrenom || '',
              totalDossiers: agent.totalDossiers || 0,
              actionsAmiables: agent.actionsAmiables || 0,
              tauxReussite: agent.tauxReussite || 0,
              montantRecouvre: agent.montantRecouvre || 0
            }));
          }
        }
        
        this.loadingStatsCompletes = false;
        console.log('✅ Statistiques complètes chargées (standardisées):', {
          globales: results.globales,
          actionsAmiables: results.actionsAmiables,
          departement: results.departement
        });
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des statistiques complètes:', error);
        this.snackBar.open('Erreur lors du chargement des statistiques', 'Fermer', { duration: 3000 });
        this.loadingStatsCompletes = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser().pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
    });
  }

  loadAgents(): void {
    this.chefAmiableService.getAgentsAmiable().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (agents) => {
        this.agentsActifs = agents.filter(a => a.actif);
        this.statistiques.totalDossiers = this.totalDossiers;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des agents:', error);
      }
    });
  }

  loadDossiersStats(): void {
    // Utiliser une taille raisonnable pour éviter les erreurs backend
    this.dossierApiService.getDossiersRecouvrementAmiable(0, 100).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (page) => {
        const dossiers = page.content;
        
        // Calculer les statistiques depuis les données réelles
        this.totalDossiers = page.totalElements;
        this.totalMontant = dossiers.reduce((sum, d) => sum + (d.montantCreance || 0), 0);
        
        // Dossiers en cours (non clôturés)
        this.dossiersEnCours = dossiers.filter(d => 
          !d.dateCloture && 
          (d.statut === 'EN_COURS' || d.dossierStatus === 'ENCOURSDETRAITEMENT')
        ).length;
        
        // Dossiers urgents
        this.dossiersUrgents = dossiers.filter(d => {
          const urgenceStr = String(d.urgence || '').toUpperCase();
          return urgenceStr === 'TRES_URGENT' || urgenceStr === 'TRÈS_URGENT' || d.urgence === Urgence.TRES_URGENT;
        }).length;
        
        // Dossiers clôturés
        const dossiersClotures = dossiers.filter(d => d.dateCloture != null).length;
        
        // Montant récupéré (dossiers clôturés)
        const montantRecupere = dossiers
          .filter(d => d.dateCloture != null)
          .reduce((sum, d) => sum + (d.montantCreance || 0), 0);
        
        // Taux de réussite (pourcentage de dossiers clôturés)
        const tauxReussite = this.totalDossiers > 0 
          ? (dossiersClotures / this.totalDossiers) * 100 
          : 0;
        
        // Mettre à jour les statistiques
        this.statistiques.totalDossiers = this.totalDossiers;
        this.statistiques.dossiersEnCours = this.dossiersEnCours;
        this.statistiques.dossiersClotures = dossiersClotures;
        this.statistiques.montantEnCours = this.totalMontant;
        this.statistiques.montantRecupere = montantRecupere;
        this.statistiques.tauxReussite = Math.round(tauxReussite * 10) / 10; // Arrondir à 1 décimale
        
        console.log('✅ Statistiques chargées:', {
          totalDossiers: this.totalDossiers,
          dossiersEnCours: this.dossiersEnCours,
          dossiersClotures,
          dossiersUrgents: this.dossiersUrgents,
          totalMontant: this.totalMontant,
          montantRecupere,
          tauxReussite: this.statistiques.tauxReussite
        });
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des statistiques de dossiers:', error);
        // En cas d'erreur, garder les valeurs par défaut (0)
        this.totalDossiers = 0;
        this.totalMontant = 0;
        this.dossiersEnCours = 0;
        this.dossiersUrgents = 0;
      }
    });
  }

  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    const roleNames: { [key: string]: string } = {
      'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE': 'Chef Département Recouvrement Amiable',
      'AGENT_RECOUVREMENT_AMIABLE': 'Agent Recouvrement Amiable'
    };
    return roleNames[this.currentUser.roleUtilisateur || ''] || this.currentUser.roleUtilisateur || '';
  }

  loadStatistiques(): void {
    // Ne plus utiliser les données mockées, les statistiques seront mises à jour par loadDossiersStats()
    // Garder cette méthode pour compatibilité mais ne charger que les valeurs par défaut
    this.statistiques = new StatistiqueAmiable({
      totalDossiers: 0,
      dossiersEnCours: 0,
      dossiersClotures: 0,
      tauxReussite: 0,
      montantRecupere: 0,
      montantEnCours: 0,
      actionsEffectuees: 0,
      actionsReussies: 0,
      coutTotalActions: 0
    });
  }

  loadPerformances(): void {
    if (!this.currentUser?.id) {
      return;
    }

    const userRole = this.currentUser.roleUtilisateur;
    const chefId = parseInt(this.currentUser.id);

    // Vérifier si c'est un Super Admin
    if (userRole === 'SUPER_ADMIN') {
      // Super Admin voit toutes les performances
      this.performanceService.getToutesPerformances().pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (performances) => {
          this.performances = performances.map(perf => {
            const perfAgent = new PerformanceAgent();
            perfAgent.agentId = String(perf.agent?.id || perf.id || '');
            perfAgent.nomAgent = `${perf.agent?.prenom || ''} ${perf.agent?.nom || ''}`;
            perfAgent.dossiersAssignes = perf.dossiersTraites || 0;
            perfAgent.dossiersClotures = perf.dossiersValides || 0;
            perfAgent.tauxReussite = perf.tauxReussite || 0;
            perfAgent.montantRecupere = 0; // À calculer depuis les dossiers
            perfAgent.actionsEffectuees = perf.enquetesCompletees || 0;
            perfAgent.moyenneTempsTraitement = 0; // À calculer
            return perfAgent;
          });
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement de toutes les performances:', error);
          this.performances = [];
        }
      });
    } else {
      // Les chefs voient uniquement les performances de leurs agents
      this.performanceService.getPerformancesChef(chefId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (performances) => {
          this.performances = performances.map(perf => {
            const perfAgent = new PerformanceAgent();
            perfAgent.agentId = String(perf.agent?.id || perf.id || '');
            perfAgent.nomAgent = `${perf.agent?.prenom || ''} ${perf.agent?.nom || ''}`;
            perfAgent.dossiersAssignes = perf.dossiersTraites || 0;
            perfAgent.dossiersClotures = perf.dossiersValides || 0;
            perfAgent.tauxReussite = perf.tauxReussite || 0;
            perfAgent.montantRecupere = 0; // À calculer depuis les dossiers
            perfAgent.actionsEffectuees = perf.enquetesCompletees || 0;
            perfAgent.moyenneTempsTraitement = 0; // À calculer
            return perfAgent;
          });
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des performances:', error);
          this.performances = [];
        }
      });
    }
  }

  loadNotifications(): void {
    // Pour l'instant, utiliser les données mockées
    // TODO: Implémenter le chargement réel des notifications depuis le backend
    this.chefAmiableService.getNotifications().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.notificationsNonLues = notifications.filter(n => !n.lu).length;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des notifications:', error);
        // Garder un tableau vide en cas d'erreur
        this.notifications = [];
        this.notificationsNonLues = 0;
      }
    });
  }

  marquerCommeLu(notification: ChefAmiableNotification): void {
    notification.lu = true;
    this.notificationsNonLues = this.notifications.filter(n => !n.lu).length;
  }

  getTauxReussiteActions(): number {
    if (this.statistiques.actionsEffectuees === 0) return 0;
    return (this.statistiques.actionsReussies / this.statistiques.actionsEffectuees) * 100;
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
    this.dossierApiService.getDossiersRecouvrementAmiable(0, 5).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (page) => {
        this.recentDossiers = page.content || [];
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
