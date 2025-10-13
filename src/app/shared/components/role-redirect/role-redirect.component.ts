import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-role-redirect',
  standalone: true,
  template: `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Redirection en cours...</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    p {
      font-size: 18px;
      margin: 0;
      opacity: 0.9;
    }
  `]
})
export class RoleRedirectComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      const redirectUrl = this.getRedirectUrlByRole(currentUser.role);
      this.router.navigate([redirectUrl]);
    } else {
      // Si pas d'utilisateur connecté, rediriger vers login
      this.router.navigate(['/login']);
    }
  }

  private getRedirectUrlByRole(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return '/dashboard';
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
        return '/chef-amiable/dashboard';
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        return '/juridique/dashboard';
      case 'CHEF_DEPARTEMENT_DOSSIER':
        return '/dossier/dashboard';
      case 'AGENT_RECOUVREMENT_AMIABLE':
        return '/amiable/dashboard';
      case 'AGENT_RECOUVREMENT_JURIDIQUE':
        return '/juridique/dashboard';
      case 'AGENT_DOSSIER':
        return '/dossier/dashboard';
      default:
        return '/dashboard';
    }
  }
}
