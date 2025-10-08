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
  private destroy$ = new Subject<void>();

  menuItems: MenuItem[] = [
    {
      label: 'Tableau de bord',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard',
      roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE, Role.AGENT_RECOUVREMENT_JURIDIQUE, Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE]
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
      roles: [Role.SUPER_ADMIN, Role.CHEF_DOSSIER]
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
      route: '/juridique',
      roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE, Role.AGENT_RECOUVREMENT_JURIDIQUE],
      children: [
        {
          label: 'Avocats',
          icon: 'fas fa-user-tie',
          route: '/juridique/avocats',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE, Role.AGENT_RECOUVREMENT_JURIDIQUE]
        },
        {
          label: 'Huissiers',
          icon: 'fas fa-balance-scale',
          route: '/juridique/huissiers',
          roles: [Role.SUPER_ADMIN, Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE, Role.AGENT_RECOUVREMENT_JURIDIQUE]
        },
        {
          label: 'Nouvel Avocat',
          icon: 'fas fa-user-plus',
          route: '/juridique/avocats/ajouter',
          roles: [Role.SUPER_ADMIN, Role.CHEF_JURIDIQUE]
        },
        {
          label: 'Nouvel Huissier',
          icon: 'fas fa-user-plus',
          route: '/juridique/huissiers/ajouter',
          roles: [Role.SUPER_ADMIN, Role.CHEF_JURIDIQUE]
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

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    
    const roleNames: { [key in Role]: string } = {
      [Role.SUPER_ADMIN]: 'Super Administrateur',
      [Role.CHEF_DOSSIER]: 'Chef de Dossier',
      [Role.AGENT_DOSSIER]: 'Agent de Dossier',
      [Role.CHEF_JURIDIQUE]: 'Chef Juridique',
      [Role.AGENT_JURIDIQUE]: 'Agent Juridique',
      [Role.CHEF_FINANCE]: 'Chef Finance',
      [Role.AGENT_FINANCE]: 'Agent Finance',
      [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]: 'Chef Département Recouvrement Amiable',
      [Role.AGENT_RECOUVREMENT_AMIABLE]: 'Agent Recouvrement Amiable'
    };

    return roleNames[this.currentUser.role] || this.currentUser.role;
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    const fullName = `${this.currentUser.prenom} ${this.currentUser.nom}`;
    return fullName.split(' ').map((n: string) => n[0]).join('');
  }
}
