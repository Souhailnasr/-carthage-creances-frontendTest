import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

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
    huissier: false
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Initialize expanded menus based on current route
    this.updateExpandedMenus();
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
      this.authService.logout();
      this.toastService.success('Déconnexion réussie !');
      this.router.navigate(['/login']);
    }
  }
}
