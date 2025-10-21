import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DossierService, DossierStats } from '../../../core/services/dossier.service';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, Role, Dossier, StatutDossier, Urgence } from '../../models';
import { Subject, takeUntil } from 'rxjs';
import { NotificationComponent } from '../notification/notification.component';

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
    public roleService: RoleService, // Public to be accessible in template
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Récupérer l'utilisateur actuel depuis le service d'authentification
    this.currentUser = this.authService.getCurrentUser();
    
    console.log('🔍 DashboardComponent - Utilisateur actuel:', this.currentUser);
    console.log('🔍 DashboardComponent - Rôle:', this.currentUser?.role);
    console.log('🔍 DashboardComponent - Token:', this.authService.getToken());
    console.log('🔍 DashboardComponent - Authentifié:', this.authService.isAuthenticated());
    
    if (!this.currentUser) {
      console.error('❌ Aucun utilisateur connecté trouvé - redirection vers login');
      // Rediriger vers login si pas d'utilisateur
      this.router.navigate(['/login']);
      return;
    }
    
    // Charger les données selon le rôle
    this.loadRoleSpecificData();
    this.loadStatistics();
    this.loadAgentPerformance();
    this.loadUrgentTasks();
  }

  loadRoleSpecificData(): void {
    console.log('🔍 Chargement des données spécifiques au rôle:', this.currentUser?.role);
    
    // Charger des données différentes selon le rôle
    switch (this.currentUser?.role) {
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
        console.warn('⚠️ Rôle non reconnu pour le dashboard:', this.currentUser?.role);
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
    this.dossierService.refreshStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe((s: DossierStats) => {
        this.stats = s;
      });
  }

  loadAgentPersonalStats(): void {
    // Désormais couvert par refreshStats, garder pour compat
    this.loadUrgentTasks();
  }

  loadUrgentTasks(): void {
    // Simulation des tâches urgentes pour l'agent connecté
    if (this.currentUser?.role === 'AGENT_DOSSIER') {
      // Tâches spécifiques à l'agent connecté
      this.urgentTasks = [
        {
          id: 1,
          titre: 'Dossier Client ABC - Enquête urgente',
          description: 'Compléter l\'enquête financière pour le dossier ABC avant le 25/01/2024',
          urgence: 'TRES_URGENT',
          dateEcheance: new Date('2024-01-25'),
          type: 'ENQUETE',
          dossierId: '1'
        },
        {
          id: 2,
          titre: 'Relance Client XYZ',
          description: 'Effectuer une relance téléphonique pour le dossier XYZ',
          urgence: 'MOYENNE',
          dateEcheance: new Date('2024-01-30'),
          type: 'RELANCE',
          dossierId: '2'
        },
        {
          id: 3,
          titre: 'Nouveau dossier à traiter',
          description: 'Analyser et traiter le nouveau dossier DEF assigné par le chef',
          urgence: 'FAIBLE',
          dateEcheance: new Date('2024-02-05'),
          type: 'DOSSIER',
          dossierId: '3'
        }
      ];
    } else {
      // Pour les autres rôles, pas de tâches urgentes spécifiques
      this.urgentTasks = [];
    }
    this.filteredUrgentTasks = [...this.urgentTasks];
  }

  loadAgentPerformance(): void {
    // Simulation des données de performance - dans une vraie app, ceci viendrait d'une API
    const allAgentPerformance: Array<{
      id: number;
      nom: string;
      prenom: string;
      role: string;
      dossiersTraites: number;
      dossiersClotures: number;
      tauxReussite: number;
      montantRecupere: number;
      performance: 'excellent' | 'bon' | 'moyen' | 'faible';
    }> = [
      {
        id: 1,
        nom: 'Ben Ali',
        prenom: 'Ahmed',
        role: 'Agent de Dossier',
        dossiersTraites: 45,
        dossiersClotures: 38,
        tauxReussite: 84.4,
        montantRecupere: 125000,
        performance: 'excellent' as const
      },
      {
        id: 2,
        nom: 'Trabelsi',
        prenom: 'Fatma',
        role: 'Agent de Dossier',
        dossiersTraites: 38,
        dossiersClotures: 32,
        tauxReussite: 84.2,
        montantRecupere: 98000,
        performance: 'excellent' as const
      },
      {
        id: 3,
        nom: 'Khelil',
        prenom: 'Mohamed',
        role: 'Agent de Dossier',
        dossiersTraites: 32,
        dossiersClotures: 25,
        tauxReussite: 78.1,
        montantRecupere: 87000,
        performance: 'bon' as const
      },
      {
        id: 4,
        nom: 'Ben Salah',
        prenom: 'Leila',
        role: 'Agent de Dossier',
        dossiersTraites: 28,
        dossiersClotures: 20,
        tauxReussite: 71.4,
        montantRecupere: 65000,
        performance: 'bon' as const
      },
      {
        id: 5,
        nom: 'Mansouri',
        prenom: 'Omar',
        role: 'Agent de Dossier',
        dossiersTraites: 25,
        dossiersClotures: 16,
        tauxReussite: 64.0,
        montantRecupere: 52000,
        performance: 'moyen' as const
      },
      {
        id: 6,
        nom: 'Hammami',
        prenom: 'Sonia',
        role: 'Agent de Dossier',
        dossiersTraites: 22,
        dossiersClotures: 12,
        tauxReussite: 54.5,
        montantRecupere: 38000,
        performance: 'moyen' as const
      },
      {
        id: 7,
        nom: 'Ben Ammar',
        prenom: 'Ali',
        role: 'Agent de Dossier',
        dossiersTraites: 18,
        dossiersClotures: 8,
        tauxReussite: 44.4,
        montantRecupere: 25000,
        performance: 'faible' as const
      },
      {
        id: 8,
        nom: 'Khelil',
        prenom: 'Nadia',
        role: 'Agent de Dossier',
        dossiersTraites: 15,
        dossiersClotures: 6,
        tauxReussite: 40.0,
        montantRecupere: 18000,
        performance: 'faible' as const
      }
    ];

    // Filtrer selon le rôle de l'utilisateur
    if (this.currentUser?.role === 'AGENT_DOSSIER') {
      // L'agent ne voit que ses propres performances
      this.agentPerformance = allAgentPerformance.filter(agent => 
        Number(agent.id) === Number(this.currentUser!.id)
      );
    } else {
      // Les autres rôles (chef, super admin) voient toutes les performances
      this.agentPerformance = allAgentPerformance;
    }
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

    return roleNames[this.currentUser.role] || this.currentUser.role;
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

    return titles[this.currentUser.role] || 'Tableau de Bord';
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

    return messages[this.currentUser.role] || `Bienvenue, ${this.currentUser.prenom} ${this.currentUser.nom}`;
  }

  isChefRole(): boolean {
    return this.currentUser?.role?.includes('CHEF_DEPARTEMENT') || false;
  }

  isAgentRole(): boolean {
    return this.currentUser?.role?.includes('AGENT') || false;
  }

  isSuperAdmin(): boolean {
    return this.currentUser?.role === 'SUPER_ADMIN';
  }

  getRoleClass(): string {
    if (!this.currentUser?.role) return 'user-role';
    const normalizedRole = this.currentUser.role.toLowerCase().replace(/_/g, '-');
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
