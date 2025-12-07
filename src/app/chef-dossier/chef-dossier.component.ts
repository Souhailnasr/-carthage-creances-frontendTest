import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { JwtAuthService } from '../core/services/jwt-auth.service';
import { TacheUrgenteService } from '../core/services/tache-urgente.service';
import { TacheCompleteService } from '../core/services/tache-complete.service';
import { NotificationService } from '../core/services/notification.service';
import { NotificationCompleteService } from '../core/services/notification-complete.service';
import { StatistiqueCompleteService } from '../core/services/statistique-complete.service';
import { DossierApiService } from '../core/services/dossier-api.service';
import { DossierService } from '../core/services/dossier.service';
import { IaPredictionService } from '../core/services/ia-prediction.service';
import { User } from '../shared/models';
import { DossierApi } from '../shared/models/dossier-api.model';
import { IaPredictionBadgeComponent } from '../shared/components/ia-prediction-badge/ia-prediction-badge.component';
import { StatCardComponent } from '../shared/components/stat-card/stat-card.component';
import { IaPredictionResult } from '../shared/models/ia-prediction-result.model';
import { StatistiquesChef, StatistiquesGlobales } from '../shared/models/statistique-complete.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-chef-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IaPredictionBadgeComponent, StatCardComponent, MatSnackBarModule],
  templateUrl: './chef-dossier.component.html',
  styleUrls: ['./chef-dossier.component.scss']
})
export class ChefDossierComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();
  
  statistiques: any = {
    totalDossiers: 0,
    dossiersEnCours: 0,
    dossiersValides: 0,
    dossiersRejetes: 0,
    agentsActifs: 0,
    tachesUrgentes: 0,
    notificationsNonLues: 0,
    // Statistiques d'enquêtes (Prompt 2)
    totalEnquetes: 0,
    enquetesCompletees: 0,
    enquetesEnCours: 0,
    // Statistiques par phase
    dossiersParPhaseEnquete: 0,
    dossiersParPhaseAmiable: 0,
    dossiersParPhaseJuridique: 0,
    dossiersCreesCeMois: 0
  };
  
  tachesUrgentes: any[] = [];
  notifications: any[] = [];
  
  // Prédictions IA
  recentDossiers: DossierApi[] = [];
  predictions: Map<number, IaPredictionResult> = new Map();
  loadingPredictions: Map<number, boolean> = new Map();
  
  // Statistiques complètes (nouveau système)
  statsGlobales: StatistiquesGlobales | null = null;
  statsDepartement: StatistiquesChef | null = null;
  loadingStatsCompletes = false;
  
  agentPerformance: Array<{
    id: number;
    nom: string;
    prenom: string;
    role: string;
    dossiersTraites: number;
    dossiersClotures: number;
    tauxReussite: number;
    montantRecupere: number;
    performance: 'excellent' | 'bon' | 'moyen' | 'faible';
  }> = [];

  constructor(
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private tacheUrgenteService: TacheUrgenteService, // Ancien - conservé
    private tacheCompleteService: TacheCompleteService, // Nouveau
    private notificationService: NotificationService, // Ancien - conservé
    private notificationCompleteService: NotificationCompleteService, // Nouveau
    private statistiqueCompleteService: StatistiqueCompleteService, // Nouveau
    private dossierApiService: DossierApiService,
    private dossierService: DossierService,
    private iaPredictionService: IaPredictionService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    // ✅ CORRECTION : Utiliser uniquement loadStatistiques() qui charge tout
    this.loadStatistiques(); // Charge getStatistiquesGlobales() + getStatistiquesMesAgents()
    this.loadStatistiquesCompletes(); // Charge les performances des agents
    this.loadTachesUrgentes();
    this.loadNotifications();
    this.loadAgentPerformance();
    this.loadRecentDossiersWithPredictions();
  }

  /**
   * Charge l'utilisateur actuel avec JwtAuthService
   */
  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        // Fallback vers AuthService
        this.currentUser = this.authService.getCurrentUser();
      }
    });
  }

  /**
   * ✅ CORRECTION : Charge uniquement les performances des agents depuis getStatistiquesMesAgents()
   * Les statistiques principales sont chargées par loadStatistiques() qui utilise getStatistiquesGlobales()
   */
  loadStatistiquesCompletes(): void {
    this.loadingStatsCompletes = true;
    
    // ✅ Charger uniquement les statistiques des agents pour les performances
    this.statistiqueCompleteService.getStatistiquesMesAgents().pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        console.warn('⚠️ Erreur lors du chargement des statistiques des agents:', error);
        return of(null);
      })
    ).subscribe({
      next: (stats) => {
        this.statsDepartement = stats;
        
        // ✅ Mapper les performances des agents
        if (stats && stats.agents && Array.isArray(stats.agents)) {
          this.agentPerformance = stats.agents.map((agent: any) => ({
            id: agent.agentId || agent.id,
            nom: agent.agentNom || agent.nom || '',
            prenom: agent.agentPrenom || agent.prenom || '',
            role: 'AGENT_DOSSIER',
            dossiersTraites: agent.dossiersTraites ?? 0,
            dossiersClotures: agent.dossiersClotures ?? 0,
            tauxReussite: agent.tauxReussite ?? 0,
            montantRecupere: agent.montantRecouvre || agent.montantRecupere || 0,
            performance: agent.tauxReussite !== null && agent.tauxReussite !== undefined 
              ? this.calculatePerformance(agent.tauxReussite) 
              : 'moyen' as 'excellent' | 'bon' | 'moyen' | 'faible'
          }));
        } else {
          this.agentPerformance = [];
        }
        
        if (stats && stats.nombreAgents !== undefined && stats.nombreAgents !== null) {
          this.statistiques.agentsActifs = stats.nombreAgents;
        }
        
        this.loadingStatsCompletes = false;
        console.log('✅ Statistiques des agents chargées:', stats);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des statistiques des agents:', error);
        this.loadingStatsCompletes = false;
        this.agentPerformance = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatistiques(): void {
    console.log('🔍 [ChefDossier] Début du chargement des statistiques');
    
    // ✅ RECONSTRUCTION COMPLÈTE : Utiliser getStatistiquesGlobales() comme source principale
    // Exactement comme le SuperAdmin Dashboard qui fonctionne correctement
    this.statistiqueCompleteService.getStatistiquesGlobales().pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        console.error('❌ [ChefDossier] Erreur lors du chargement des statistiques globales:', error);
        this.snackBar.open('Erreur lors du chargement des statistiques. Vérifiez la console.', 'Fermer', { duration: 5000 });
        return of(null);
      })
    ).subscribe({
      next: (globales) => {
        if (globales) {
          console.log('✅ [ChefDossier] Statistiques globales chargées:', globales);
          
          // ✅ Mapper TOUTES les statistiques depuis globales (comme SuperAdmin)
          // Utiliser ?? au lieu de || pour éviter de remplacer 0 par une valeur par défaut
          this.statistiques.totalDossiers = globales.totalDossiers ?? 0;
          this.statistiques.dossiersEnCours = globales.dossiersEnCours ?? 0;
          this.statistiques.dossiersClotures = globales.dossiersClotures ?? 0;
          this.statistiques.dossiersCreesCeMois = globales.dossiersCreesCeMois ?? 0;
          this.statistiques.dossiersParPhaseEnquete = globales.dossiersPhaseEnquete ?? 0;
          this.statistiques.dossiersParPhaseAmiable = globales.dossiersPhaseAmiable ?? 0;
          this.statistiques.dossiersParPhaseJuridique = globales.dossiersPhaseJuridique ?? 0;
          this.statistiques.totalEnquetes = globales.dossiersPhaseEnquete ?? 0;
          this.statistiques.enquetesCompletees = globales.enquetesCompletees ?? 0;
          // ✅ CORRECTION : Utiliser directement enquetesEnCours du backend au lieu de le recalculer
          this.statistiques.enquetesEnCours = globales.enquetesEnCours ?? 0;
          
          this.statsGlobales = globales;
          
          // ✅ LOG DE VÉRIFICATION
          console.log('✅ [ChefDossier] Statistiques mappées:', {
            totalDossiers: this.statistiques.totalDossiers,
            dossiersEnCours: this.statistiques.dossiersEnCours,
            dossiersClotures: this.statistiques.dossiersClotures,
            dossiersCreesCeMois: this.statistiques.dossiersCreesCeMois,
            dossiersParPhaseEnquete: this.statistiques.dossiersParPhaseEnquete,
            dossiersParPhaseAmiable: this.statistiques.dossiersParPhaseAmiable,
            dossiersParPhaseJuridique: this.statistiques.dossiersParPhaseJuridique,
            totalEnquetes: this.statistiques.totalEnquetes,
            enquetesCompletees: this.statistiques.enquetesCompletees,
            enquetesEnCours: this.statistiques.enquetesEnCours
          });
          
          // ✅ Forcer la détection de changement
          this.cdr.detectChanges();
        } else {
          console.warn('⚠️ [ChefDossier] Aucune statistique globale disponible');
        }
        
        // ✅ Charger les statistiques des agents en parallèle
        this.statistiqueCompleteService.getStatistiquesMesAgents().pipe(
          takeUntil(this.destroy$),
          catchError((error) => {
            console.warn('⚠️ [ChefDossier] Erreur lors du chargement des statistiques des agents:', error);
            return of(null);
          })
        ).subscribe({
          next: (mesAgents) => {
            if (mesAgents) {
              console.log('✅ [ChefDossier] Statistiques des agents chargées:', mesAgents);
              
              // ✅ Utiliser les données des agents pour compléter
              if (mesAgents.nombreAgents !== undefined && mesAgents.nombreAgents !== null) {
                this.statistiques.agentsActifs = mesAgents.nombreAgents;
              }
              
              // Si globales n'a pas de données, utiliser les données du chef
              if (!globales && mesAgents.chef) {
                const chef = mesAgents.chef;
                this.statistiques.totalDossiers = chef.dossiersTraites ?? 0;
                this.statistiques.dossiersClotures = chef.dossiersClotures ?? 0;
                this.statistiques.dossiersEnCours = (chef.dossiersTraites ?? 0) - (chef.dossiersClotures ?? 0);
              }
              
              this.statsDepartement = mesAgents;
            }
            
            // ✅ Mettre à jour les tâches et notifications
            this.statistiques.tachesUrgentes = this.tachesUrgentes.length;
            this.statistiques.notificationsNonLues = this.notifications.filter(n => !n.lu).length;
            
            console.log('✅ [ChefDossier] Statistiques finales après chargement complet:', {
              totalDossiers: this.statistiques.totalDossiers,
              dossiersEnCours: this.statistiques.dossiersEnCours,
              dossiersClotures: this.statistiques.dossiersClotures,
              dossiersCreesCeMois: this.statistiques.dossiersCreesCeMois,
              agentsActifs: this.statistiques.agentsActifs,
              totalEnquetes: this.statistiques.totalEnquetes,
              enquetesCompletees: this.statistiques.enquetesCompletees,
              enquetesEnCours: this.statistiques.enquetesEnCours
            });
            
            // ✅ Forcer la détection de changement après chargement complet
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  loadAgentPerformance(): void {
    // Pour l'instant, on garde une liste vide car il n'y a pas encore d'API pour les performances
    // TODO: Implémenter l'API pour récupérer les performances des agents
    this.agentPerformance = [];
    
    // Si une API existe plus tard, l'utiliser ici :
    // this.dossierApiService.getAgentPerformance()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (performance: any[]) => {
    //       this.agentPerformance = performance.map(p => ({
    //         id: p.agentId,
    //         nom: p.nom,
    //         prenom: p.prenom,
    //         role: p.role,
    //         dossiersTraites: p.dossiersTraites,
    //         dossiersClotures: p.dossiersClotures,
    //         tauxReussite: p.tauxReussite,
    //         montantRecupere: p.montantRecupere,
    //         performance: this.calculatePerformance(p.tauxReussite)
    //       }));
    //     },
    //     error: (error: any) => {
    //       console.error('❌ Erreur lors du chargement des performances:', error);
    //     }
    //   });
  }

  private calculatePerformance(tauxReussite: number): 'excellent' | 'bon' | 'moyen' | 'faible' {
    if (tauxReussite >= 80) return 'excellent';
    if (tauxReussite >= 60) return 'bon';
    if (tauxReussite >= 40) return 'moyen';
    return 'faible';
  }

  getPerformanceClass(perf: 'excellent' | 'bon' | 'moyen' | 'faible'): string {
    switch (perf) {
      case 'excellent': return 'perf-excellent';
      case 'bon': return 'perf-bon';
      case 'moyen': return 'perf-moyen';
      case 'faible': return 'perf-faible';
      default: return '';
    }
  }

  loadTachesUrgentes(): void {
    this.tacheUrgenteService.getAllTaches().subscribe({
      next: (taches: any[]) => {
        this.tachesUrgentes = taches.slice(0, 5); // Afficher les 5 plus récentes
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des tâches:', error);
      }
    });
  }

  loadNotifications(): void {
    // Mock notifications pour le moment
    this.notifications = [];
  }

  getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'SUPER_ADMIN': 'Super Administrateur',
      'CHEF_DEPARTEMENT_DOSSIER': 'Chef Département Dossier',
      'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE': 'Chef Département Recouvrement Amiable',
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': 'Chef Département Recouvrement Juridique',
      'CHEF_DEPARTEMENT_FINANCE': 'Chef Département Finance',
      'AGENT_DOSSIER': 'Agent Dossier',
      'AGENT_RECOUVREMENT_AMIABLE': 'Agent Recouvrement Amiable',
      'AGENT_RECOUVREMENT_JURIDIQUE': 'Agent Recouvrement Juridique',
      'AGENT_FINANCE': 'Agent Finance'
    };
    return roleNames[role] || role;
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
