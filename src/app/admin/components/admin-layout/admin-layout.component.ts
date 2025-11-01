import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {
  currentUser: any = null;
  sidebarOpen: boolean = true;

  constructor(
    private jwtAuthService: JwtAuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUser = this.jwtAuthService.getCurrentUser();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.jwtAuthService.logOut();
    this.router.navigate(['/login']);
  }

  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profil']);
  }

  getInitials(): string {
    if (this.currentUser) {
      return `${this.currentUser.prenom.charAt(0)}${this.currentUser.nom.charAt(0)}`.toUpperCase();
    }
    return 'SA';
  }

  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    
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

    return roleNames[this.currentUser.roleUtilisateur] || this.currentUser.roleUtilisateur;
  }
}
