import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, Role } from '../../models';
import { Subject, takeUntil, filter } from 'rxjs';

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
    // Other roles use the generic dashboard
    {
      label: 'Tableau de bord',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard',
      roles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE, Role.AGENT_RECOUVREMENT_JURIDIQUE, Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE]
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
      label: 'Gestion des Dossiers',
      icon: 'fas fa-folder-open',
      route: '/dossier/gestion',
      roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER]
    },
    {
      label: 'Utilisateurs',
      icon: 'fas fa-users',
      route: '/admin/utilisateurs',
      roles: [Role.SUPER_ADMIN]
    },
    {
      label: 'Phase d\'Enquête',
      icon: 'fas fa-search',
      route: '/dossier/enquete',
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
      route: '/chef-dossier/taches',
      roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER]
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
    {
      label: 'Gestion Juridique',
      icon: 'fas fa-gavel',
      route: '/juridique',
      roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE, Role.AGENT_RECOUVREMENT_JURIDIQUE],
      children: [
        {
          label: 'Avocats',
          icon: 'fas fa-user-tie',
          route: '/juridique/avocats',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE, Role.AGENT_RECOUVREMENT_JURIDIQUE]
        },
        {
          label: 'Huissiers',
          icon: 'fas fa-balance-scale',
          route: '/juridique/huissiers',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE, Role.AGENT_RECOUVREMENT_JURIDIQUE]
        },
        {
          label: 'Nouvel Avocat',
          icon: 'fas fa-user-plus',
          route: '/juridique/avocats/ajouter',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
        },
        {
          label: 'Nouvel Huissier',
          icon: 'fas fa-user-plus',
          route: '/juridique/huissiers/ajouter',
          roles: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]
        }
      ]
    },
    {
      label: 'Gestion Finance',
      icon: 'fas fa-chart-line',
      route: '/finance',
      roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE],
      children: [
        {
          label: 'Tableau de Bord',
          icon: 'fas fa-chart-pie',
          route: '/finance/dashboard',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE]
        },
        {
          label: 'Rapports',
          icon: 'fas fa-file-alt',
          route: '/finance/rapports',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE]
        }
      ]
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
      roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE, Role.AGENT_RECOUVREMENT_JURIDIQUE, Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE, Role.AGENT_RECOUVREMENT_AMIABLE],
      children: [
        {
          label: 'Mes Notifications',
          icon: 'fas fa-bell',
          route: '/notifications',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE, Role.AGENT_RECOUVREMENT_JURIDIQUE, Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE, Role.AGENT_RECOUVREMENT_AMIABLE]
        },
        {
          label: 'Envoyer Notification',
          icon: 'fas fa-paper-plane',
          route: '/send-notification',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE, Role.CHEF_DEPARTEMENT_FINANCE, Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]
        }
      ]
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    // Récupérer l'utilisateur actuel
    this.currentUser = this.authService.getCurrentUser();

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
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isMenuItemVisible(item: MenuItem): boolean {
    if (!this.currentUser) return false;
    return item.roles.includes(this.currentUser.role);
  }

  isChildMenuItemVisible(item: MenuItem): boolean {
    if (!this.currentUser) return false;
    return item.roles.includes(this.currentUser.role);
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

    return roleNames[this.currentUser.role] || this.currentUser.role;
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    const fullName = `${this.currentUser.prenom} ${this.currentUser.nom}`;
    return fullName.split(' ').map((n: string) => n[0]).join('');
  }
}
