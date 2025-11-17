import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

@Component({
  selector: 'app-juridique-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './juridique-sidebar.component.html',
  styleUrls: ['./juridique-sidebar.component.scss']
})
export class JuridiqueSidebarComponent implements OnInit {
  isCollapsed = false;
  expandedMenus: { [key: string]: boolean } = {
    avocat: false,
    huissier: false,
    notifications: true
  };
  currentUser: any = null;

  constructor(
    private router: Router,
    private jwtAuthService: JwtAuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Initialize expanded menus based on current route
    this.updateExpandedMenus();
    // Charger les données de l'utilisateur connecté
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
      }
    });
  }

  getUserInitials(): string {
    if (this.currentUser && this.currentUser.prenom && this.currentUser.nom) {
      return `${this.currentUser.prenom.charAt(0)}${this.currentUser.nom.charAt(0)}`.toUpperCase();
    }
    return 'U';
  }

  getUserName(): string {
    if (this.currentUser && this.currentUser.prenom && this.currentUser.nom) {
      return `${this.currentUser.prenom} ${this.currentUser.nom}`;
    }
    return 'Utilisateur';
  }

  getUserRole(): string {
    if (this.currentUser) {
      const role = this.currentUser.roleUtilisateur || this.currentUser.role || '';
      const roleNames: { [key: string]: string } = {
        'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': 'Chef Département Recouvrement Juridique',
        'CHEF_JURIDIQUE': 'Chef Juridique',
        'AGENT_RECOUVREMENT_JURIDIQUE': 'Agent Recouvrement Juridique',
        'AGENT_JURIDIQUE': 'Agent Juridique'
      };
      return roleNames[role] || 'Chef Juridique';
    }
    return 'Chef Juridique';
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleSubmenu(menuKey: string): void {
    this.expandedMenus[menuKey] = !this.expandedMenus[menuKey];
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  private updateExpandedMenus(): void {
    const currentUrl = this.router.url;
    
    // Expand avocat menu if on avocat routes
    if (currentUrl.includes('/juridique/avocats')) {
      this.expandedMenus['avocat'] = true;
    }
    
    // Expand huissier menu if on huissier routes
    if (currentUrl.includes('/juridique/huissiers')) {
      this.expandedMenus['huissier'] = true;
    }
  }

  goToProfile(): void {
    this.router.navigate(['/juridique/profile']);
  }

  logout(): void {
    // Confirmer la déconnexion
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.jwtAuthService.logOut();
      this.toastService.success('Déconnexion réussie !');
      this.router.navigate(['/login']);
    }
  }
}
