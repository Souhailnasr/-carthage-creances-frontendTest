import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ChefAmiableService } from '../../services/chef-amiable.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { StatistiqueService } from '../../../core/services/statistique.service';
import { PerformanceService } from '../../../core/services/performance.service';
import { StatistiqueAmiable, PerformanceAgent, ChefAmiableNotification } from '../../../shared/models';
import { User, Role } from '../../../shared/models';
import { DossierApi, Urgence } from '../../../shared/models/dossier-api.model';

@Component({
  selector: 'app-chef-amiable-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
  
  private destroy$ = new Subject<void>();

  constructor(
    private chefAmiableService: ChefAmiableService,
    private jwtAuthService: JwtAuthService,
    private dossierApiService: DossierApiService,
    private utilisateurService: UtilisateurService,
    private statistiqueService: StatistiqueService,
    private performanceService: PerformanceService
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadStatistiques();
    this.loadPerformances();
    this.loadNotifications();
    this.loadAgents();
    this.loadDossiersStats();
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
}
