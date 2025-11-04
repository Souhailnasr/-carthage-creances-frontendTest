import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DossierService, DossierStats } from '../../../core/services/dossier.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, Role, Dossier, StatutDossier, Urgence } from '../../models';
import { Subject, takeUntil } from 'rxjs';
import { NotificationComponent } from '../notification/notification.component';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotificationComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  // Statistiques
  stats: any = {
    totalDossiers: 0,
    dossiersEnCours: 0,
    dossiersValides: 0,
    dossiersCreesCeMois: 0,
    dossiersAssignes: 0,
    dossiersCreesParAgent: 0
  };

  // Performance par agent
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

  // Tâches urgentes pour l'agent
  urgentTasks: Array<{
    id: number;
    titre: string;
    description: string;
    urgence: 'TRES_URGENT' | 'MOYENNE' | 'FAIBLE';
    dateEcheance: Date;
    type: 'DOSSIER' | 'ENQUETE' | 'RELANCE';
    dossierId?: string;
  }> = [];
  
  filteredUrgentTasks: Array<{
    id: number;
    titre: string;
    description: string;
    urgence: 'TRES_URGENT' | 'MOYENNE' | 'FAIBLE';
    dateEcheance: Date;
    type: 'DOSSIER' | 'ENQUETE' | 'RELANCE';
    dossierId?: string;
  }> = [];
  
  searchTaskTerm: string = '';

  constructor(
    private dossierService: DossierService,
    private dossierApiService: DossierApiService,
    public roleService: RoleService, // Public to be accessible in template
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // 🔧 CORRECTION: S'abonner aux changements d'utilisateur au lieu de lire une seule fois
    this.jwtAuthService.getCurrentUser().subscribe(user => {
      console.log('🔍 Dashboard - Utilisateur mis à jour:', user);
      
      if (!user) {
        console.warn('⚠️ Dashboard - Aucun utilisateur connecté, redirection vers login');
        this.router.navigate(['/login']);
        return;
      }
      
      this.currentUser = user;
      
      // 🔍 Debug: Vérifier l'état de l'authentification
      console.log('🔍 Dashboard - Utilisateur actuel:', this.currentUser);
      console.log('🔍 Dashboard - AuthToken sessionStorage:', sessionStorage.getItem('authToken'));
      console.log('🔍 Dashboard - ID utilisateur:', this.currentUser?.id);
    
    console.log('🔍 DashboardComponent - Utilisateur actuel:', this.currentUser);
    console.log('🔍 DashboardComponent - Rôle:', this.currentUser?.roleUtilisateur);
    
      // Charger les données du dashboard seulement quand l'utilisateur est disponible
      this.loadDashboardData();
    });
  }

  /**
   * Charge toutes les données du dashboard quand l'utilisateur est disponible
   */
  private loadDashboardData(): void {
    console.log('🔍 Chargement des données du dashboard pour l\'utilisateur:', this.currentUser);
    
    // Charger les données selon le rôle
    this.loadRoleSpecificData();
    this.loadStatistics();
    this.loadAgentPerformance();
    this.loadUrgentTasks();
  }

  loadRoleSpecificData(): void {
    console.log('🔍 Chargement des données spécifiques au rôle:', this.currentUser?.roleUtilisateur);
    
    // Charger des données différentes selon le rôle
    switch (this.currentUser?.roleUtilisateur) {
      case 'SUPER_ADMIN':
        this.loadSuperAdminData();
        break;
      case 'CHEF_DEPARTEMENT_DOSSIER':
        this.loadChefDossierData();
        break;
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        this.loadChefJuridiqueData();
        break;
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
        this.loadChefAmiableData();
        break;
      case 'AGENT_DOSSIER':
        this.loadAgentDossierData();
        break;
      case 'AGENT_RECOUVREMENT_JURIDIQUE':
        this.loadAgentJuridiqueData();
        break;
      case 'AGENT_RECOUVREMENT_AMIABLE':
        this.loadAgentAmiableData();
        break;
      default:
        console.warn('⚠️ Rôle non reconnu pour le dashboard:', this.currentUser?.roleUtilisateur);
        this.loadDefaultData();
        break;
    }
  }

  loadSuperAdminData(): void {
    console.log('🔍 Chargement des données Super Admin');
    // Données spécifiques au Super Admin
  }

  loadChefDossierData(): void {
    console.log('🔍 Chargement des données Chef Dossier');
    // Données spécifiques au Chef Dossier
  }

  loadChefJuridiqueData(): void {
    console.log('🔍 Chargement des données Chef Juridique');
    // Données spécifiques au Chef Juridique
  }

  loadChefAmiableData(): void {
    console.log('🔍 Chargement des données Chef Amiable');
    // Données spécifiques au Chef Amiable
  }

  loadAgentDossierData(): void {
    console.log('🔍 Chargement des données Agent Dossier');
    // Données spécifiques à l'Agent Dossier
  }

  loadAgentJuridiqueData(): void {
    console.log('🔍 Chargement des données Agent Juridique');
    // Données spécifiques à l'Agent Juridique
  }

  loadAgentAmiableData(): void {
    console.log('🔍 Chargement des données Agent Amiable');
    // Données spécifiques à l'Agent Amiable
  }

  loadDefaultData(): void {
    console.log('🔍 Chargement des données par défaut');
    // Données par défaut
  }

  loadStatistics(): void {
    // Déterminer le rôle et l'ID agent pour les statistiques
    const role = this.currentUser?.roleUtilisateur === 'AGENT_DOSSIER' ? 'AGENT' : 'CHEF';
    const agentId = this.currentUser?.roleUtilisateur === 'AGENT_DOSSIER' ? Number(this.currentUser?.id) : undefined;
    
    // Charger les vraies statistiques depuis l'API
    this.dossierApiService.stats(role as 'CHEF' | 'AGENT', agentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: any) => {
          console.log('✅ Statistiques chargées:', stats);
          this.stats = {
            totalDossiers: stats.totalDossiers || 0,
            dossiersEnCours: stats.dossiersEnCours || 0,
            dossiersValides: stats.dossiersValides || 0,
            dossiersRejetes: stats.dossiersRejetes || 0,
            dossiersAmiables: stats.dossiersAmiables || 0,
            dossiersJuridiques: stats.dossiersJuridiques || 0,
            dossiersClotures: stats.dossiersClotures || 0,
            dossiersCrees: stats.dossiersCreesCeMois || 0,
            agentsActifs: stats.agentsActifs || 0,
            performanceAgents: stats.performanceAgents || 0,
            dossiersCreesParAgent: stats.dossiersCreesParAgent || 0,
            dossiersAssignes: stats.dossiersAssignes || 0
          };
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du chargement des statistiques:', error);
          // En cas d'erreur, utiliser le service de dossier
          this.dossierService.refreshStats()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (s: DossierStats) => {
                this.stats = s;
              },
              error: (err: any) => {
                console.error('❌ Erreur lors du chargement des statistiques (fallback):', err);
                // Garder les valeurs par défaut (0)
              }
            });
        }
      });
  }

  loadAgentPersonalStats(): void {
    // Désormais couvert par refreshStats, garder pour compat
    this.loadUrgentTasks();
  }

  loadUrgentTasks(): void {
    // Pour l'instant, on garde une liste vide car il n'y a pas encore d'API pour les tâches urgentes
    // TODO: Implémenter l'API pour récupérer les tâches urgentes
    this.urgentTasks = [];
    this.filteredUrgentTasks = [];
    
    // Si une API existe plus tard, l'utiliser ici :
    // this.tacheUrgenteService.getTachesUrgentes(this.currentUser?.id)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (taches: any[]) => {
    //       this.urgentTasks = taches.map(t => ({
    //         id: t.id,
    //         titre: t.titre,
    //         description: t.description,
    //         urgence: t.urgence,
    //         dateEcheance: new Date(t.dateEcheance),
    //         type: t.type,
    //         dossierId: t.dossierId?.toString()
    //       }));
    //       this.filteredUrgentTasks = [...this.urgentTasks];
    //     },
    //     error: (error: any) => {
    //       console.error('❌ Erreur lors du chargement des tâches urgentes:', error);
    //     }
    //   });
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
    //       if (this.currentUser?.roleUtilisateur === 'AGENT_DOSSIER') {
    //         // L'agent ne voit que ses propres performances
    //         this.agentPerformance = performance.filter(p => 
    //           Number(p.agentId) === Number(this.currentUser!.id)
    //         ).map(p => ({
    //           id: p.agentId,
    //           nom: p.nom,
    //           prenom: p.prenom,
    //           role: p.role,
    //           dossiersTraites: p.dossiersTraites,
    //           dossiersClotures: p.dossiersClotures,
    //           tauxReussite: p.tauxReussite,
    //           montantRecupere: p.montantRecupere,
    //           performance: this.calculatePerformance(p.tauxReussite)
    //         }));
    //       } else {
    //         // Les autres rôles (chef, super admin) voient toutes les performances
    //         this.agentPerformance = performance.map(p => ({
    //           id: p.agentId,
    //           nom: p.nom,
    //           prenom: p.prenom,
    //           role: p.role,
    //           dossiersTraites: p.dossiersTraites,
    //           dossiersClotures: p.dossiersClotures,
    //           tauxReussite: p.tauxReussite,
    //           montantRecupere: p.montantRecupere,
    //           performance: this.calculatePerformance(p.tauxReussite)
    //         }));
    //       }
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

  getPerformanceClass(performance: string): string {
    switch (performance) {
      case 'excellent': return 'performance-excellent';
      case 'bon': return 'performance-bon';
      case 'moyen': return 'performance-moyen';
      case 'faible': return 'performance-faible';
      default: return 'performance-moyen';
    }
  }

  getPerformanceLabel(performance: string): string {
    switch (performance) {
      case 'excellent': return 'Excellent';
      case 'bon': return 'Bon';
      case 'moyen': return 'Moyen';
      case 'faible': return 'Faible';
      default: return 'Moyen';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0
    }).format(amount);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentTime(): string {
    return new Date().toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    
    const roleNames: { [key: string]: string } = {
      'SUPER_ADMIN': 'Super Administrateur',
      'CHEF_DEPARTEMENT_DOSSIER': 'Chef Département Dossier',
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': 'Chef Département Recouvrement Juridique',
      'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE': 'Chef Département Recouvrement Amiable',
      'CHEF_DEPARTEMENT_FINANCE': 'Chef Département Finance',
      'AGENT_DOSSIER': 'Agent Dossier',
      'AGENT_RECOUVREMENT_JURIDIQUE': 'Agent Recouvrement Juridique',
      'AGENT_RECOUVREMENT_AMIABLE': 'Agent Recouvrement Amiable',
      'AGENT_FINANCE': 'Agent Finance'
    };

    return roleNames[this.currentUser.roleUtilisateur] || this.currentUser.roleUtilisateur;
  }

  getDashboardTitle(): string {
    if (!this.currentUser) return 'Tableau de Bord';
    
    const titles: { [key: string]: string } = {
      'SUPER_ADMIN': 'Tableau de Bord - Super Administrateur',
      'CHEF_DEPARTEMENT_DOSSIER': 'Interface Chef Dossier',
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': 'Interface Chef Juridique',
      'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE': 'Interface Chef Amiable',
      'CHEF_DEPARTEMENT_FINANCE': 'Interface Chef Finance',
      'AGENT_DOSSIER': 'Tableau de Bord Agent Dossier',
      'AGENT_RECOUVREMENT_JURIDIQUE': 'Tableau de Bord Agent Juridique',
      'AGENT_RECOUVREMENT_AMIABLE': 'Tableau de Bord Agent Amiable',
      'AGENT_FINANCE': 'Tableau de Bord Agent Finance'
    };

    return titles[this.currentUser.roleUtilisateur] || 'Tableau de Bord';
  }

  getWelcomeMessage(): string {
    if (!this.currentUser) return 'Bienvenue';
    
    const messages: { [key: string]: string } = {
      'SUPER_ADMIN': `Bienvenue, ${this.currentUser.prenom} ${this.currentUser.nom}`,
      'CHEF_DEPARTEMENT_DOSSIER': `Bienvenue, ${this.currentUser.prenom} ${this.currentUser.nom}`,
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': `Bienvenue, ${this.currentUser.prenom} ${this.currentUser.nom}`,
      'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE': `Bienvenue, ${this.currentUser.prenom} ${this.currentUser.nom}`,
      'CHEF_DEPARTEMENT_FINANCE': `Bienvenue, ${this.currentUser.prenom} ${this.currentUser.nom}`,
      'AGENT_DOSSIER': `Bienvenue, ${this.currentUser.prenom} ${this.currentUser.nom}`,
      'AGENT_RECOUVREMENT_JURIDIQUE': `Bienvenue, ${this.currentUser.prenom} ${this.currentUser.nom}`,
      'AGENT_RECOUVREMENT_AMIABLE': `Bienvenue, ${this.currentUser.prenom} ${this.currentUser.nom}`,
      'AGENT_FINANCE': `Bienvenue, ${this.currentUser.prenom} ${this.currentUser.nom}`
    };

    return messages[this.currentUser.roleUtilisateur] || `Bienvenue, ${this.currentUser.prenom} ${this.currentUser.nom}`;
  }

  isChefRole(): boolean {
    return this.currentUser?.roleUtilisateur?.includes('CHEF_DEPARTEMENT') || false;
  }

  isAgentRole(): boolean {
    return this.currentUser?.roleUtilisateur?.includes('AGENT') || false;
  }

  isSuperAdmin(): boolean {
    return this.currentUser?.roleUtilisateur === 'SUPER_ADMIN';
  }

  getRoleClass(): string {
    if (!this.currentUser?.roleUtilisateur) return 'user-role';
    const normalizedRole = this.currentUser.roleUtilisateur.toLowerCase().replace(/_/g, '-');
    return `user-role role-${normalizedRole}`;
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    const full = (this.currentUser as any).getFullName ? (this.currentUser as any).getFullName() : `${(this.currentUser as any).prenom || ''} ${(this.currentUser as any).nom || ''}`.trim();
    const basis = full || (this.currentUser as any).email || '';
    return basis.split(' ').map((n: string) => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  }

  // Méthodes pour les tâches urgentes
  getUrgentTasksClass(urgence: string): string {
    switch (urgence) {
      case 'TRES_URGENT':
        return 'urgence-tres-urgent';
      case 'MOYENNE':
        return 'urgence-moyenne';
      case 'FAIBLE':
        return 'urgence-faible';
      default:
        return '';
    }
  }

  getUrgentTasksLabel(urgence: string): string {
    switch (urgence) {
      case 'TRES_URGENT':
        return 'Très Urgent';
      case 'MOYENNE':
        return 'Moyenne';
      case 'FAIBLE':
        return 'Faible';
      default:
        return urgence;
    }
  }

  getTaskTypeIcon(type: string): string {
    switch (type) {
      case 'DOSSIER':
        return 'fas fa-folder';
      case 'ENQUETE':
        return 'fas fa-search';
      case 'RELANCE':
        return 'fas fa-phone';
      default:
        return 'fas fa-tasks';
    }
  }

  getTaskTypeLabel(type: string): string {
    switch (type) {
      case 'DOSSIER':
        return 'Dossier';
      case 'ENQUETE':
        return 'Enquête';
      case 'RELANCE':
        return 'Relance';
      default:
        return type;
    }
  }

  formatDateEcheance(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

  isTaskOverdue(dateEcheance: Date): boolean {
    return new Date(dateEcheance) < new Date();
  }

  navigateToTask(task: any): void {
    if (task.dossierId) {
      if (task.type === 'ENQUETE') {
        // Navigation vers l'enquête
        window.location.href = `/dossier/enquete-detail/${task.dossierId}`;
      } else {
        // Navigation vers le dossier
        window.location.href = `/dossier/detail/${task.dossierId}`;
      }
    }
  }

  // Méthodes pour la recherche des tâches
  onSearchTasks(): void {
    if (!this.searchTaskTerm.trim()) {
      this.filteredUrgentTasks = [...this.urgentTasks];
    } else {
      this.filteredUrgentTasks = this.urgentTasks.filter(task =>
        task.titre.toLowerCase().includes(this.searchTaskTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(this.searchTaskTerm.toLowerCase()) ||
        task.type.toLowerCase().includes(this.searchTaskTerm.toLowerCase())
      );
    }
  }

  clearSearch(): void {
    this.searchTaskTerm = '';
    this.filteredUrgentTasks = [...this.urgentTasks];
  }
}
