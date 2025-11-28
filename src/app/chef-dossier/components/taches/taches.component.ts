import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TacheUrgenteService, TacheUrgente } from '../../../core/services/tache-urgente.service';
import { NotificationService, TypeNotification } from '../../../core/services/notification.service';
import { interval, Subscription, Subject, takeUntil } from 'rxjs';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';
import { UtilisateurService, Utilisateur } from '../../../services/utilisateur.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { Role } from '../../../shared/models/enums.model';

@Component({
  selector: 'app-taches',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NotificationComponent],
  templateUrl: './taches.component.html',
  styleUrls: ['./taches.component.scss']
})
export class TachesComponent implements OnInit, OnDestroy {
  taches: TacheUrgente[] = [];
  tachesFiltrees: TacheUrgente[] = [];
  searchTerm = '';
  selectedStatut = 'TOUS';
  selectedPriorite = 'TOUS';
  currentUser: any;
  showCreateTache = false;
  availableAgents: Array<{ id?: number; nom: string; prenom: string; email?: string }> = [];
  loadingAgents = false;
  agentLoadError: string | null = null;
  newTache: Partial<TacheUrgente> = {
    titre: '',
    description: '',
    type: 'ENQUETE',
    priorite: 'MOYENNE',
    statut: 'EN_COURS',
    dateEcheance: new Date()
  };
  private subscription: Subscription = new Subscription();
  private destroy$ = new Subject<void>();

  // Performance par agent (KPIs)
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
    private tacheUrgenteService: TacheUrgenteService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private utilisateurService: UtilisateurService,
    private jwtAuthService: JwtAuthService
  ) {}

  ngOnInit(): void {
    // Charger l'utilisateur depuis JwtAuthService (plus fiable)
    this.jwtAuthService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadTaches();
        this.loadAvailableAgents();
        this.startPolling();
        this.loadAgentPerformance();
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
        // Fallback sur AuthService
        this.currentUser = this.authService.getCurrentUser();
        this.loadTaches();
        this.loadAvailableAgents();
        this.startPolling();
        this.loadAgentPerformance();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAgentPerformance(): void {
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
      { id: 1, nom: 'Ben Salah', prenom: 'Leila', role: 'Agent de Dossier', dossiersTraites: 35, dossiersClotures: 22, tauxReussite: 62.9, montantRecupere: 82000, performance: 'excellent' },
      { id: 2, nom: 'Mansouri', prenom: 'Omar', role: 'Agent de Dossier', dossiersTraites: 28, dossiersClotures: 17, tauxReussite: 60.7, montantRecupere: 61000, performance: 'bon' },
      { id: 3, nom: 'Hammami', prenom: 'Sonia', role: 'Agent de Dossier', dossiersTraites: 22, dossiersClotures: 12, tauxReussite: 54.5, montantRecupere: 38000, performance: 'moyen' },
      { id: 4, nom: 'Ben Ammar', prenom: 'Ali', role: 'Agent de Dossier', dossiersTraites: 18, dossiersClotures: 8, tauxReussite: 44.4, montantRecupere: 25000, performance: 'faible' }
    ];
    this.agentPerformance = allAgentPerformance;
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

  loadTaches(): void {
    // Pour le Chef Dossier, charger toutes les tâches
    if (this.currentUser?.id) {
      this.tacheUrgenteService.getTachesChef(parseInt(this.currentUser.id)).subscribe({
        next: (taches: any[]) => {
          this.taches = taches;
          this.applyFilters();
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des tâches:', error);
        }
      });
    }
  }

  loadAvailableAgents(): void {
    // Utiliser la même méthode que dossier-detail : utiliser directement this.currentUser.id
    if (!this.currentUser?.id) {
      this.agentLoadError = 'Chef non identifié';
      this.loadingAgents = false;
      return;
    }
    
    const chefId = Number(this.currentUser.id);
    if (Number.isNaN(chefId)) {
      this.agentLoadError = 'Identifiant chef invalide';
      this.loadingAgents = false;
      return;
    }
    
    this.loadingAgents = true;
    this.agentLoadError = null;

    console.log('🔍 Chargement des agents pour le chef ID:', chefId);

    // Essayer d'abord l'endpoint spécifique pour les agents du chef
    this.utilisateurService.getAgentsByChef(chefId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (agents) => {
          console.log('✅ Agents reçus du backend (COMPLET):', JSON.stringify(agents, null, 2));
          console.log('✅ Nombre d\'agents reçus:', agents?.length || 0);
          
          // Filtrer les agents créés par ce chef spécifique (chefCreateur)
          const currentChefId = Number(this.currentUser.id);
          console.log('🔍 Chef ID actuel:', currentChefId);
          
          const agentsDuChef = (agents || []).filter(agent => {
            // Vérifier toutes les possibilités de nommage du champ chefCreateur
            // Le backend peut retourner chef_createur_id (snake_case) directement
            const agentChefId = agent.chef_createur_id 
              || agent.chefId 
              || agent.chefCreateurId
              || agent.chefCreateur?.id 
              || (agent as any).chefCreateur?.id;
            
            // Convertir en nombre pour la comparaison
            const agentChefIdNum = agentChefId ? Number(agentChefId) : null;
            const isCreatedByChef = agentChefIdNum === currentChefId;
            
            console.log('🔍 Agent:', agent.prenom, agent.nom, {
              id: agent.id,
              chefId: agent.chefId,
              chef_createur_id: agent.chef_createur_id,
              chefCreateurId: agent.chefCreateurId,
              chefCreateur: agent.chefCreateur,
              agentChefId: agentChefId,
              agentChefIdNum: agentChefIdNum,
              currentChefId: currentChefId,
              match: isCreatedByChef
            });
            
            if (isCreatedByChef) {
              console.log('✅ Agent créé par ce chef:', agent.prenom, agent.nom, 'chefId:', agentChefIdNum);
            }
            
            return isCreatedByChef;
          });
          
          console.log('✅ Agents créés par ce chef:', agentsDuChef.length, 'sur', (agents || []).length);
          
          // Si aucun agent n'est trouvé avec le filtrage, afficher tous les agents pour debug
          if (agentsDuChef.length === 0 && (agents || []).length > 0) {
            console.warn('⚠️ Aucun agent ne correspond au chef ID', currentChefId);
            console.warn('⚠️ Tous les agents reçus:', agents.map(a => ({
              id: a.id,
              nom: a.nom,
              prenom: a.prenom,
              chefId: a.chefId,
              chefCreateur: a.chefCreateur,
              chef_createur_id: (a as any).chef_createur_id
            })));
          }
          
          this.availableAgents = agentsDuChef.map(agent => ({
            id: agent.id,
            nom: agent.nom || '',
            prenom: agent.prenom || '',
            email: agent.email || ''
          }));
          
          this.loadingAgents = false;
          console.log('✅ Agents disponibles:', this.availableAgents);
          console.log('✅ Nombre d\'agents disponibles:', this.availableAgents.length);
          
          if (!this.availableAgents.length) {
            if ((agents || []).length > 0) {
              this.agentLoadError = 'Aucun agent créé par vous trouvé. Les agents doivent être créés avec votre ID (' + currentChefId + ') comme chefCreateur. Vérifiez la console pour plus de détails.';
            } else {
              this.agentLoadError = 'Aucun agent trouvé pour votre département.';
            }
          } else {
            this.agentLoadError = null;
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des agents via endpoint /chef/:', error);
          console.error('❌ Détails:', {
            status: error?.status,
            statusText: error?.statusText,
            message: error?.message,
            url: error?.url
          });
          // Fallback: charger tous les utilisateurs et filtrer les agents
          console.log('🔄 Tentative de fallback: chargement de tous les utilisateurs et filtrage...');
          this.loadAgentsFallback(chefId);
        }
      });
  }
  
  /**
   * Filtre les agents selon le rôle du chef connecté (utilisé uniquement dans le fallback)
   */
  private filterAgentsByChefRole(agents: Utilisateur[]): Utilisateur[] {
    if (!agents || agents.length === 0) {
      return [];
    }
    
    const userRole = this.currentUser?.roleUtilisateur || '';
    const roleStr = typeof userRole === 'string' ? userRole : String(userRole);
    
    // Chef Dossier : voir uniquement les agents dossier
    if (roleStr === 'CHEF_DEPARTEMENT_DOSSIER' || roleStr === String(Role.CHEF_DEPARTEMENT_DOSSIER)) {
      return agents.filter(agent => {
        const agentRole = agent.roleUtilisateur || '';
        return agentRole === 'AGENT_DOSSIER' ||
               String(agentRole) === String(Role.AGENT_DOSSIER);
      });
    }
    
    // Chef Amiable : voir uniquement les agents amiable
    if (roleStr === 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE' || roleStr === String(Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE)) {
      return agents.filter(agent => {
        const agentRole = agent.roleUtilisateur || '';
        return agentRole === 'AGENT_RECOUVREMENT_AMIABLE' ||
               String(agentRole) === String(Role.AGENT_RECOUVREMENT_AMIABLE);
      });
    }
    
    // Chef Juridique : voir uniquement les agents juridique
    if (roleStr === 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE' || roleStr === String(Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE)) {
      return agents.filter(agent => {
        const agentRole = agent.roleUtilisateur || '';
        return agentRole === 'AGENT_RECOUVREMENT_JURIDIQUE' ||
               String(agentRole) === String(Role.AGENT_RECOUVREMENT_JURIDIQUE);
      });
    }
    
    // Chef Finance : voir uniquement les agents finance
    if (roleStr === 'CHEF_DEPARTEMENT_FINANCE' || roleStr === String(Role.CHEF_DEPARTEMENT_FINANCE)) {
      return agents.filter(agent => {
        const agentRole = agent.roleUtilisateur || '';
        return agentRole === 'AGENT_FINANCE' ||
               String(agentRole) === String(Role.AGENT_FINANCE);
      });
    }
    
    // Super Admin : voir tous les agents
    if (roleStr === 'SUPER_ADMIN' || roleStr === String(Role.SUPER_ADMIN)) {
      return agents.filter(agent => {
        const agentRole = agent.roleUtilisateur || '';
        return String(agentRole).startsWith('AGENT_');
      });
    }
    
    // Par défaut, retourner tous les agents (fallback)
    return agents;
  }

  retryLoadAgents(): void {
    this.loadAvailableAgents();
  }

  /**
   * Appelé quand l'utilisateur ouvre le formulaire de création de tâche
   */
  onOpenCreateForm(): void {
    this.showCreateTache = true;
    // S'assurer que les agents sont chargés quand on ouvre le formulaire
    if (!this.availableAgents.length && !this.loadingAgents && !this.agentLoadError) {
      console.log('🔄 Ouverture du formulaire - Chargement des agents...');
      this.loadAvailableAgents();
    }
  }

  private loadAgentsFallback(chefId: number | null): void {
    if (!chefId) {
      this.agentLoadError = 'Chef non identifié';
      this.loadingAgents = false;
      return;
    }
    
    // Pour le chef dossier, charger tous les utilisateurs et filtrer les agents dossier créés par ce chef
    this.utilisateurService.getAllUtilisateurs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (allUsers) => {
          console.log('✅ Tous les utilisateurs chargés (fallback):', allUsers?.length || 0);
          
          // Filtrer selon le rôle du chef ET le chefCreateur
          const filteredByRole = this.filterAgentsByChefRole(allUsers);
          console.log('✅ Agents filtrés par rôle:', filteredByRole.length);
          
          // Filtrer par chefCreateur
          const agentsDuChef = filteredByRole.filter(agent => {
            // Vérifier toutes les possibilités de nommage du champ chefCreateur
            const agentChefId = agent.chef_createur_id 
              || agent.chefId 
              || agent.chefCreateurId
              || agent.chefCreateur?.id;
            
            // Convertir en nombre pour la comparaison
            const agentChefIdNum = agentChefId ? Number(agentChefId) : null;
            const isCreatedByChef = agentChefIdNum === chefId;
            
            if (isCreatedByChef) {
              console.log('✅ Agent créé par ce chef (fallback):', agent.prenom, agent.nom, 'chefId:', agentChefIdNum);
            } else {
              console.log('⚠️ Agent non créé par ce chef (fallback):', agent.prenom, agent.nom, 'chefId:', agentChefIdNum, 'attendu:', chefId);
            }
            
            return isCreatedByChef;
          });
          
          console.log('✅ Agents créés par ce chef (fallback):', agentsDuChef.length);
          
          this.availableAgents = agentsDuChef.map(agent => ({
            id: agent.id,
            nom: agent.nom || '',
            prenom: agent.prenom || '',
            email: agent.email || ''
          }));
          
          this.loadingAgents = false;
          
          if (this.availableAgents.length === 0) {
            if (filteredByRole.length > 0) {
              this.agentLoadError = 'Aucun agent créé par vous trouvé. Les agents doivent être créés avec votre ID comme chefCreateur.';
            } else {
              this.agentLoadError = 'Aucun agent trouvé pour votre département.';
            }
          } else {
            this.agentLoadError = null;
            console.log('✅ Agents chargés via fallback:', this.availableAgents.length);
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des utilisateurs (fallback):', error);
          // Extraire un message d'erreur plus clair
          let errorMsg = 'Erreur lors du chargement des agents.';
          if (error?.message) {
            errorMsg = error.message;
          } else if (error?.error?.message) {
            errorMsg = error.error.message;
          } else if (error?.status === 500) {
            errorMsg = 'Erreur serveur interne. L\'endpoint backend /api/users/chef/{id} n\'est peut-être pas disponible.';
          } else if (error?.status === 0) {
            errorMsg = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
          }
          this.agentLoadError = errorMsg;
          this.loadingAgents = false;
        }
      });
  }

  startPolling(): void {
    this.subscription = interval(30000).subscribe(() => this.loadTaches());
  }

  applyFilters(): void {
    let filtered = this.taches;

    if (this.searchTerm) {
      filtered = filtered.filter(tache =>
        tache.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        tache.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        tache.agentNom.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.selectedStatut !== 'TOUS') {
      filtered = filtered.filter(tache => tache.statut === this.selectedStatut);
    }

    if (this.selectedPriorite !== 'TOUS') {
      filtered = filtered.filter(tache => tache.priorite === this.selectedPriorite);
    }

    this.tachesFiltrees = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatutChange(): void {
    this.applyFilters();
  }

  onPrioriteChange(): void {
    this.applyFilters();
  }

  createTache(): void {
    if (this.newTache.titre && this.newTache.description && this.newTache.agentId) {
      const selectedAgent = this.availableAgents.find(a => a.id === this.newTache.agentId);
      const tache: TacheUrgente = {
        id: Date.now(),
        titre: this.newTache.titre!,
        description: this.newTache.description!,
        type: this.newTache.type!,
        priorite: this.newTache.priorite!,
        statut: 'EN_COURS',
        dateCreation: new Date(),
        dateEcheance: new Date(this.newTache.dateEcheance!),
        agentId: this.newTache.agentId,
        agentNom: `${selectedAgent.prenom} ${selectedAgent.nom}`
      };

      this.taches.unshift(tache);
      this.applyFilters();
      this.showCreateTache = false;
      this.resetNewTache();

      // Créer une notification pour l'agent assigné
      this.createNotificationForAgent(selectedAgent, tache);
    }
  }

  private createNotificationForAgent(agent: any, tache: TacheUrgente): void {
    const notification = {
      destinataireId: agent.id,
      type: TypeNotification.TACHE_URGENTE,
      titre: 'Nouvelle tâche assignée',
      message: `Une nouvelle tâche "${tache.titre}" vous a été assignée par ${this.currentUser.getFullName()}`
    };

    this.notificationService.createNotification(notification).subscribe();
  }

  cancelCreateTache(): void {
    this.showCreateTache = false;
    this.resetNewTache();
  }

  private resetNewTache(): void {
    this.newTache = {
      titre: '',
      description: '',
      type: 'ENQUETE',
      priorite: 'MOYENNE',
      statut: 'EN_COURS',
      dateEcheance: new Date()
    };
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_COURS': return 'statut-en-cours';
      case 'TERMINEE': return 'statut-terminee';
      case 'EN_ATTENTE': return 'statut-en-attente';
      case 'ANNULEE': return 'statut-annulee';
      default: return '';
    }
  }

  getPrioriteClass(priorite: string): string {
    switch (priorite) {
      case 'TRES_URGENTE': return 'priorite-tres-urgente';
      case 'ELEVEE': return 'priorite-elevee';
      case 'MOYENNE': return 'priorite-moyenne';
      case 'FAIBLE': return 'priorite-faible';
      default: return '';
    }
  }

  getPrioriteLabel(priorite: string): string {
    switch (priorite) {
      case 'TRES_URGENTE': return 'Très Urgente';
      case 'ELEVEE': return 'Élevée';
      case 'MOYENNE': return 'Moyenne';
      case 'FAIBLE': return 'Faible';
      default: return '';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'ENQUETE': return 'fas fa-search';
      case 'RELANCE': return 'fas fa-phone-alt';
      case 'DOSSIER': return 'fas fa-folder';
      case 'AUDIENCE': return 'fas fa-gavel';
      case 'ACTION': return 'fas fa-fist-raised';
      default: return 'fas fa-tasks';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'ENQUETE': return 'Enquête';
      case 'RELANCE': return 'Relance';
      case 'DOSSIER': return 'Dossier';
      case 'AUDIENCE': return 'Audience';
      case 'ACTION': return 'Action';
      default: return 'Tâche';
    }
  }

  isEnRetard(tache: TacheUrgente): boolean {
    return new Date(tache.dateEcheance) < new Date() && tache.statut !== 'TERMINEE';
  }

  getDaysUntilEcheance(tache: TacheUrgente): number {
    const today = new Date();
    const echeance = new Date(tache.dateEcheance);
    const diffTime = echeance.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getTachesFiltrees(statut: string): TacheUrgente[] {
    return this.taches.filter(tache => tache.statut === statut);
  }

  getTachesEnRetard(): TacheUrgente[] {
    return this.taches.filter(tache => this.isEnRetard(tache));
  }
}
