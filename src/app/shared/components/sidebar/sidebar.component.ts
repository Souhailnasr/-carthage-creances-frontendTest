import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { User, Role } from '../../models';
import { Subject, takeUntil, filter } from 'rxjs';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles: Role[];
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  currentRoute: string = '';
  isCollapsed: boolean = false;
  expandedMenus: Set<string> = new Set();
  private destroy$ = new Subject<void>();

  menuItems: MenuItem[] = [
    // Super Admin dashboard points to admin dashboard
    {
      label: 'Tableau de bord',
      icon: 'fas fa-tachometer-alt',
      route: '/admin/dashboard',
      roles: [Role.SUPER_ADMIN]
    },
    // Chef Dossier dashboard
    {
      label: 'Tableau de bord',
      icon: 'fas fa-tachometer-alt',
      route: '/dossier/dashboard',
      roles: [Role.CHEF_DEPARTEMENT_DOSSIER]
    },
    // Agent Dossier dashboard
    {
      label: 'Tableau de bord',
      icon: 'fas fa-tachometer-alt',
      route: '/dossier/dashboard',
      roles: [Role.AGENT_DOSSIER]
    },
    // Chef Juridique dashboard
    {
      label: 'Tableau de bord',
      icon: 'fas fa-tachometer-alt',
      route: '/juridique/dashboard',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
    },
    // Agent Juridique dashboard
    {
      label: 'Tableau de bord',
      icon: 'fas fa-tachometer-alt',
      route: '/agent-juridique/dashboard',
      roles: [Role.AGENT_RECOUVREMENT_JURIDIQUE]
    },
    // Chef Amiable dashboard
    {
      label: 'Tableau de bord',
      icon: 'fas fa-tachometer-alt',
      route: '/chef-amiable/dashboard',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]
    },
    // Chef Finance dashboard - au niveau principal
    {
      label: 'Tableau de bord',
      icon: 'fas fa-tachometer-alt',
      route: '/finance/dashboard',
      roles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE]
    },
    // Gestion Finance - juste après Tableau de bord
    {
      label: 'Gestion Finance',
      icon: 'fas fa-chart-line',
      route: '/finance',
      roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE],
      children: [
        {
          label: 'Validation Frais',
          icon: 'fas fa-check-circle',
          route: '/finance/validation-frais',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_FINANCE]
        },
        {
          label: 'Catalogue Tarifs',
          icon: 'fas fa-tags',
          route: '/finance/tarifs',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_FINANCE]
        },
        {
          label: 'Import Frais',
          icon: 'fas fa-file-upload',
          route: '/finance/import-frais',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE]
        },
        {
          label: 'Rapports',
          icon: 'fas fa-file-alt',
          route: '/finance/rapports',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE]
        },
        {
          label: 'Reporting',
          icon: 'fas fa-chart-bar',
          route: '/finance/reporting',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE]
        },
        {
          label: 'Insights',
          icon: 'fas fa-lightbulb',
          route: '/finance/insights',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE]
        }
      ]
    },
    // Gestion Utilisateurs pour Chef Finance - après Gestion Finance
    {
      label: 'Gestion Utilisateurs',
      icon: 'fas fa-users-cog',
      route: '/finance/utilisateurs',
      roles: [Role.CHEF_DEPARTEMENT_FINANCE]
    },
    // Tâches pour Chef Finance - après Gestion Utilisateurs
    {
      label: 'Tâches',
      icon: 'fas fa-tasks',
      route: '/finance/taches',
      roles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE]
    },
    {
      label: 'Mes dossiers finance',
      icon: 'fas fa-briefcase',
      route: '/finance/mes-dossiers',
      roles: [Role.AGENT_FINANCE, Role.CHEF_DEPARTEMENT_FINANCE]
    },
    // Notifications pour Chef Finance - après Tâches
    {
      label: 'Notifications',
      icon: 'fas fa-bell',
      route: '/notifications',
      roles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE],
      children: [
        {
          label: 'Mes Notifications',
          icon: 'fas fa-bell',
          route: '/notifications',
          roles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE]
        },
        {
          label: 'Envoyer Notification',
          icon: 'fas fa-paper-plane',
          route: '/send-notification',
          roles: [Role.CHEF_DEPARTEMENT_FINANCE]
        }
      ]
    },
    {
      label: 'Créanciers',
      icon: 'fas fa-user-tie',
      route: '/creanciers',
      roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER]
    },
    {
      label: 'Débiteurs',
      icon: 'fas fa-user-friends',
      route: '/debiteurs',
      roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER]
    },
    {
      label: 'Dossiers',
      icon: 'fas fa-folder-open',
      route: '/dossier',
      roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER],
      children: [
        {
          label: 'Gestion des Dossiers',
          icon: 'fas fa-folder-open',
          route: '/dossier/gestion',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER]
        },
        {
          label: 'Dossiers en Attente',
          icon: 'fas fa-clock',
          route: '/dossier/en-attente',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER]
        },
        {
          label: 'Mes Validations',
          icon: 'fas fa-history',
          route: '/dossier/mes-validations',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER]
        },
        {
          label: 'Mes dossiers affectés',
          icon: 'fas fa-user-check',
          route: '/dossier/mes-dossiers',
          roles: [Role.AGENT_DOSSIER]
        }
      ]
    },
    {
      label: 'Utilisateurs',
      icon: 'fas fa-users',
      route: '/admin/utilisateurs',
      roles: [Role.SUPER_ADMIN]
    },
    {
      label: 'Tous les Utilisateurs',
      icon: 'fas fa-circle-user',
      route: '/utilisateurs',
      roles: [Role.SUPER_ADMIN]
    },
    {
      label: 'Mes Agents',
      icon: 'fas fa-user-friends',
      route: '/mes-agents',
      roles: [
        Role.SUPER_ADMIN,
        Role.CHEF_DEPARTEMENT_DOSSIER,
        Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE,
        Role.CHEF_DEPARTEMENT_FINANCE
      ]
    },
    {
      label: 'Enquêtes',
      icon: 'fas fa-clipboard-list',
      route: '/enquetes',
      roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER],
      children: [
        {
          label: 'Gestion des Enquêtes',
          icon: 'fas fa-list-alt',
          route: '/enquetes/gestion',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER]
        },
        {
          label: 'Créer une Enquête',
          icon: 'fas fa-plus-circle',
          route: '/enquetes/nouvelle',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER]
        },
        {
          label: 'Enquêtes en Attente',
          icon: 'fas fa-clock',
          route: '/enquetes/en-attente',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER]
        },
        {
          label: 'Mes Validations',
          icon: 'fas fa-history',
          route: '/enquetes/mes-validations',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER]
        }
      ]
    },
    {
      label: 'Affectation des Dossiers',
      icon: 'fas fa-assignment',
      route: '/dossier/affectation',
      roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER]
    },
    {
      label: 'Gestion des Utilisateurs',
      icon: 'fas fa-user-cog',
      route: '/dossier/utilisateurs',
      roles: [Role.CHEF_DEPARTEMENT_DOSSIER]
    },
    {
      label: 'Tâches',
      icon: 'fas fa-tasks',
      route: '/admin/taches',
      roles: [Role.SUPER_ADMIN]
    },
    {
      label: 'Tâches',
      icon: 'fas fa-tasks',
      route: '/dossier/taches',
      roles: [Role.CHEF_DEPARTEMENT_DOSSIER]
    },
    {
      label: 'Gestion Juridique',
      icon: 'fas fa-gavel',
      route: '/admin/juridique',
      roles: [Role.SUPER_ADMIN],
      children: [
        {
          label: 'Vue d\'ensemble',
          icon: 'fas fa-chart-pie',
          route: '/admin/juridique',
          roles: [Role.SUPER_ADMIN]
        },
        {
          label: 'Avocats',
          icon: 'fas fa-user-tie',
          route: '/admin/juridique/avocats',
          roles: [Role.SUPER_ADMIN]
        },
        {
          label: 'Huissiers',
          icon: 'fas fa-balance-scale',
          route: '/admin/juridique/huissiers',
          roles: [Role.SUPER_ADMIN]
        },
        {
          label: 'Audiences',
          icon: 'fas fa-gavel',
          route: '/admin/juridique/audiences',
          roles: [Role.SUPER_ADMIN]
        }
      ]
    },
    // Chef Juridique - Menus spécifiques (remplace la sidebar locale)
    {
      label: 'Avocats',
      icon: 'fas fa-user-tie',
      route: '/juridique/avocats',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE],
      children: [
        {
          label: 'Liste des Avocats',
          icon: 'fas fa-list',
          route: '/juridique/avocats',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
        },
        {
          label: 'Ajouter Avocat',
          icon: 'fas fa-plus',
          route: '/juridique/avocats/add',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
        }
      ]
    },
    {
      label: 'Huissiers',
      icon: 'fas fa-user-shield',
      route: '/juridique/huissiers',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE],
      children: [
        {
          label: 'Liste des Huissiers',
          icon: 'fas fa-list',
          route: '/juridique/huissiers',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
        },
        {
          label: 'Ajouter Huissier',
          icon: 'fas fa-plus',
          route: '/juridique/huissiers/add',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
        }
      ]
    },
    {
      label: 'Affectation des Dossiers',
      icon: 'fas fa-folder-open',
      route: '/juridique/affectation-dossiers',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
    },
    {
      label: 'Gestion Huissier',
      icon: 'fas fa-file-contract',
      route: '/juridique/huissier/documents',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE],
      children: [
        {
          label: 'Documents Huissier',
          icon: 'fas fa-file-alt',
          route: '/juridique/huissier/documents',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
        },
        {
          label: 'Actions Huissier',
          icon: 'fas fa-gavel',
          route: '/juridique/huissier/actions',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
        }
      ]
    },
    {
      label: 'Gestion des Audiences',
      icon: 'fas fa-gavel',
      route: '/juridique/gestion-audiences',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
    },
    {
      label: 'Gestion des Utilisateurs',
      icon: 'fas fa-users',
      route: '/juridique/gestion-utilisateurs',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
    },
    {
      label: 'Tâches',
      icon: 'fas fa-tasks',
      route: '/juridique/taches',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
    },
    {
      label: 'Notifications',
      icon: 'fas fa-bell',
      route: '/juridique/notifications',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE],
      children: [
        {
          label: 'Mes Notifications',
          icon: 'fas fa-bell',
          route: '/juridique/notifications',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
        },
        {
          label: 'Envoyer Notification',
          icon: 'fas fa-paper-plane',
          route: '/juridique/send-notification',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
        }
      ]
    },
    // Agent Juridique - Menu spécifique
    {
      label: 'Tableau de bord',
      icon: 'fas fa-tachometer-alt',
      route: '/agent-juridique/dashboard',
      roles: [Role.AGENT_RECOUVREMENT_JURIDIQUE]
    },
    {
      label: 'Mes Dossiers',
      icon: 'fas fa-folder-open',
      route: '/agent-juridique/dossiers',
      roles: [Role.AGENT_RECOUVREMENT_JURIDIQUE]
    },
    {
      label: 'Gestion Audiences',
      icon: 'fas fa-gavel',
      route: '/agent-juridique/audiences',
      roles: [Role.AGENT_RECOUVREMENT_JURIDIQUE]
    },
    {
      label: 'Consultation Avocats/Huissiers',
      icon: 'fas fa-search',
      route: '/agent-juridique/consultation',
      roles: [Role.AGENT_RECOUVREMENT_JURIDIQUE]
    },
    {
      label: 'Gestion des Actions',
      icon: 'fas fa-tasks',
      route: '/chef-amiable/gestion-actions',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]
    },
    {
      label: 'Gestion Utilisateurs',
      icon: 'fas fa-users',
      route: '/chef-amiable/gestion-utilisateurs',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]
    },
    {
      label: 'Mes Agents',
      icon: 'fas fa-user-friends',
      route: '/mes-agents',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]
    },
    {
      label: 'Tâches',
      icon: 'fas fa-clipboard-list',
      route: '/chef-amiable/taches',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]
    },
    {
      label: 'Recouvrement Amiable',
      icon: 'fas fa-handshake',
      route: '/amiable',
      roles: [Role.SUPER_ADMIN],
      children: [
        {
          label: 'Dossiers Affectés',
          icon: 'fas fa-folder-open',
          route: '/dossiers/amiable',
          roles: [Role.SUPER_ADMIN]
        },
        {
          label: 'Actions Amiables',
          icon: 'fas fa-phone',
          route: '/amiable/actions',
          roles: [Role.SUPER_ADMIN]
        },
        {
          label: 'Relances',
          icon: 'fas fa-envelope',
          route: '/amiable/relances',
          roles: [Role.SUPER_ADMIN]
        }
      ]
    },
    // Agent Amiable - Menu spécifique
    {
      label: 'Tableau de bord',
      icon: 'fas fa-tachometer-alt',
      route: '/agent-amiable/dashboard',
      roles: [Role.AGENT_RECOUVREMENT_AMIABLE]
    },
    {
      label: 'Mes Dossiers',
      icon: 'fas fa-folder-open',
      route: '/agent-amiable/dossiers',
      roles: [Role.AGENT_RECOUVREMENT_AMIABLE]
    },
    {
      label: 'Gestion Actions',
      icon: 'fas fa-tasks',
      route: '/agent-amiable/actions',
      roles: [Role.AGENT_RECOUVREMENT_AMIABLE]
    },
    {
      label: 'Administration',
      icon: 'fas fa-cogs',
      route: '/admin',
      roles: [Role.SUPER_ADMIN],
      children: [
        {
          label: 'Utilisateurs',
          icon: 'fas fa-users-cog',
          route: '/admin/utilisateurs',
          roles: [Role.SUPER_ADMIN]
        },
        {
          label: 'Paramètres',
          icon: 'fas fa-sliders-h',
          route: '/admin/parametres',
          roles: [Role.SUPER_ADMIN]
        }
      ]
    },
    {
      label: 'Notifications',
      icon: 'fas fa-bell',
      route: '/notifications',
      roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.AGENT_RECOUVREMENT_JURIDIQUE, Role.AGENT_RECOUVREMENT_AMIABLE],
      children: [
        {
          label: 'Mes Notifications',
          icon: 'fas fa-bell',
          route: '/notifications',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.AGENT_RECOUVREMENT_JURIDIQUE, Role.AGENT_RECOUVREMENT_AMIABLE]
        },
        {
          label: 'Envoyer Notification',
          icon: 'fas fa-paper-plane',
          route: '/send-notification',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER]
        }
      ]
    },
    // Notifications spécifiques pour Chef Amiable
    {
      label: 'Notifications',
      icon: 'fas fa-bell',
      route: '/chef-amiable/notifications',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE],
      children: [
        {
          label: 'Mes Notifications',
          icon: 'fas fa-bell',
          route: '/chef-amiable/notifications',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]
        },
        {
          label: 'Envoyer Notification',
          icon: 'fas fa-paper-plane',
          route: '/chef-amiable/send-notification',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]
        }
      ]
    }
  ];

  constructor(
    private router: Router,
    private jwtAuthService: JwtAuthService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    // Récupérer l'utilisateur actuel
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
      this.currentUser = user;
          console.log('✅ Sidebar - Utilisateur chargé:', user);
          console.log('✅ Sidebar - Rôle utilisateur:', user?.roleUtilisateur);
          
          // Debug: vérifier la visibilité de "Mes Agents"
          const mesAgentsItem = this.menuItems.find(item => item.label === 'Mes Agents');
          if (mesAgentsItem) {
            const isVisible = this.isMenuItemVisible(mesAgentsItem);
            console.log('🔍 Sidebar - "Mes Agents" visible?', isVisible, 'Rôles autorisés:', mesAgentsItem.roles);
          }
        },
        error: (error) => {
          console.error('❌ Sidebar - Erreur lors du chargement de l\'utilisateur:', error);
          // Fallback: essayer de récupérer l'utilisateur depuis le token JWT
          try {
            const userId = this.jwtAuthService.getCurrentUserId();
            const userRole = this.jwtAuthService.loggedUserAuthority();
            if (userId && userRole) {
              // Créer un objet User minimal depuis les informations du token
              const role = userRole.replace(/^RoleUtilisateur_/, '') as Role;
              this.currentUser = new User({
                id: userId.toString(),
                nom: '',
                prenom: '',
                email: '',
                roleUtilisateur: role,
                actif: false
              });
              console.log('✅ Sidebar - Utilisateur récupéré depuis le token JWT:', this.currentUser);
            }
          } catch (fallbackError) {
            console.error('❌ Sidebar - Impossible de récupérer l\'utilisateur depuis le token:', fallbackError);
          }
        }
      });

    // Suivre les changements de route
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.currentRoute = event.url;
          this.autoExpandActiveMenus();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  logout(): void {
    // logOut() retourne un Observable et gère déjà la redirection dans finalize()
    this.jwtAuthService.logOut().subscribe({
      next: (response) => {
        console.log('✅ Logout réussi:', response);
      },
      error: (error) => {
        console.error('❌ Erreur lors du logout:', error);
        // La redirection est déjà gérée dans le service (finalize)
      }
    });
  }

  isMenuItemVisible(item: MenuItem): boolean {
    if (!this.currentUser) return false;
    const userRole = this.currentUser.roleUtilisateur;
    
    // Convertir le rôle en string pour la comparaison si nécessaire
    const userRoleStr = typeof userRole === 'string' ? userRole : String(userRole);
    
    // Vérifier si le rôle de l'utilisateur correspond à l'un des rôles autorisés
    const hasAccess = item.roles.some(role => {
      const roleStr = typeof role === 'string' ? role : String(role);
      return roleStr === userRoleStr || role === userRole;
    });
    
    // Si le menu a des enfants, vérifier si au moins un enfant est visible
    if (item.children && item.children.length > 0) {
      const hasVisibleChild = item.children.some(child => {
        return child.roles.some(role => {
          const roleStr = typeof role === 'string' ? role : String(role);
          return roleStr === userRoleStr || role === userRole;
        });
      });
      return hasAccess && hasVisibleChild;
    }
    
    // Sinon, vérifier simplement les rôles du menu
    return hasAccess;
  }

  isChildMenuItemVisible(item: MenuItem): boolean {
    if (!this.currentUser) return false;
    const userRole = this.currentUser.roleUtilisateur;
    const userRoleStr = typeof userRole === 'string' ? userRole : String(userRole);
    
    return item.roles.some(role => {
      const roleStr = typeof role === 'string' ? role : String(role);
      return roleStr === userRoleStr || role === userRole;
    });
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }

  hasActiveChild(item: MenuItem): boolean {
    if (!item.children) return false;
    return item.children.some(child => this.isActiveRoute(child.route));
  }

  isMenuExpanded(item: MenuItem): boolean {
    return this.expandedMenus.has(item.label);
  }

  toggleMenu(item: MenuItem): void {
    if (this.expandedMenus.has(item.label)) {
      this.expandedMenus.delete(item.label);
    } else {
      this.expandedMenus.add(item.label);
    }
  }

  handleMenuClick(item: MenuItem): void {
    if (item.children) {
      // Si c'est un menu avec des enfants, toggle l'expansion
      this.toggleMenu(item);
    } else {
      // Si c'est un menu simple, naviguer
      this.navigateTo(item.route);
    }
  }

  private autoExpandActiveMenus(): void {
    // Auto-expandir les menus qui ont des enfants actifs
    this.menuItems.forEach(item => {
      if (item.children && this.hasActiveChild(item)) {
        this.expandedMenus.add(item.label);
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    
    const roleNames: { [key in Role]: string } = {
      [Role.SUPER_ADMIN]: 'Super Administrateur',
      [Role.CHEF_DEPARTEMENT_DOSSIER]: 'Chef Département Dossier',
      [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]: 'Chef Département Recouvrement Juridique',
      [Role.AGENT_RECOUVREMENT_JURIDIQUE]: 'Agent Recouvrement Juridique',
      [Role.CHEF_DEPARTEMENT_FINANCE]: 'Chef Département Finance',
      [Role.AGENT_DOSSIER]: 'Agent Dossier',
      [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]: 'Chef Département Recouvrement Amiable',
      [Role.AGENT_RECOUVREMENT_AMIABLE]: 'Agent Recouvrement Amiable',
      [Role.AGENT_FINANCE]: 'Agent Finance'
    };

    return roleNames[this.currentUser.roleUtilisateur] || this.currentUser.roleUtilisateur;
  }

  getRoleClass(): string {
    if (!this.currentUser?.roleUtilisateur) return 'user-role';
    const normalizedRole = this.currentUser.roleUtilisateur.toLowerCase().replace(/_/g, '-');
    return `user-role role-${normalizedRole}`;
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    const fullName = `${this.currentUser.prenom} ${this.currentUser.nom}`;
    return fullName.split(' ').map((n: string) => n[0]).join('');
  }
}
