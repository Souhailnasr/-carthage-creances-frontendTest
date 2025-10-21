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
    
    console.log('🔍 RoleRedirectComponent - Utilisateur actuel:', currentUser);
    console.log('🔍 RoleRedirectComponent - Rôle:', currentUser?.role);
    
    if (currentUser) {
      const redirectUrl = this.getRedirectUrlByRole(currentUser.role);
      console.log('🔍 RoleRedirectComponent - URL de redirection:', redirectUrl);
      this.router.navigate([redirectUrl]);
    } else {
      // Si pas d'utilisateur connecté, rediriger vers login
      console.log('🔍 RoleRedirectComponent - Pas d\'utilisateur, redirection vers login');
      this.router.navigate(['/login']);
    }
  }

  private getRedirectUrlByRole(role: string): string {
    console.log('🔍 getRedirectUrlByRole - Rôle reçu:', role);
    
    // Normaliser le rôle (enlever les préfixes possibles)
    const normalizedRole = role.replace(/^RoleUtilisateur_/, '').replace(/^ROLE_/, '');
    console.log('🔍 getRedirectUrlByRole - Rôle normalisé:', normalizedRole);
    
    switch (normalizedRole) {
      case 'SUPER_ADMIN':
        console.log('🔍 getRedirectUrlByRole - Cas SUPER_ADMIN');
        return '/admin/dashboard';
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
        console.log('🔍 getRedirectUrlByRole - Cas CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE');
        return '/chef-amiable/dashboard';
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        console.log('🔍 getRedirectUrlByRole - Cas CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE');
        return '/juridique/dashboard';
      case 'CHEF_DEPARTEMENT_DOSSIER':
        console.log('🔍 getRedirectUrlByRole - Cas CHEF_DEPARTEMENT_DOSSIER');
        return '/dossier/chef-dashboard';
      case 'AGENT_RECOUVREMENT_AMIABLE':
        console.log('🔍 getRedirectUrlByRole - Cas AGENT_RECOUVREMENT_AMIABLE');
        return '/amiable/dashboard';
      case 'AGENT_RECOUVREMENT_JURIDIQUE':
        console.log('🔍 getRedirectUrlByRole - Cas AGENT_RECOUVREMENT_JURIDIQUE');
        return '/juridique/dashboard';
      case 'AGENT_DOSSIER':
        console.log('🔍 getRedirectUrlByRole - Cas AGENT_DOSSIER');
        return '/dossier/dashboard';
      default:
        console.log('🔍 getRedirectUrlByRole - Cas DEFAULT pour rôle:', role, 'normalisé:', normalizedRole);
        return '/dashboard';
    }
  }
}
