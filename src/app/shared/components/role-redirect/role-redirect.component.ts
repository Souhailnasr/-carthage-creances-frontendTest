import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { Subject } from 'rxjs';
import { takeUntil, first } from 'rxjs/operators';

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
export class RoleRedirectComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // ✅ CORRECTION: Utiliser l'Observable pour attendre que l'utilisateur soit chargé
    // Essayer d'abord avec JwtAuthService (plus fiable)
    this.jwtAuthService.getCurrentUser()
      .pipe(
        takeUntil(this.destroy$),
        first() // Prendre seulement la première valeur
      )
      .subscribe({
        next: (currentUser) => {
          console.log('🔍 RoleRedirectComponent - Utilisateur chargé (JwtAuthService):', currentUser);
          this.redirectUser(currentUser);
        },
        error: (error) => {
          console.warn('⚠️ RoleRedirectComponent - Erreur avec JwtAuthService, fallback vers AuthService:', error);
          // Fallback vers AuthService
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            console.log('🔍 RoleRedirectComponent - Utilisateur chargé (AuthService):', currentUser);
            this.redirectUser(currentUser);
          } else {
            // Attendre un peu et réessayer avec l'Observable
            this.authService.currentUser$
              .pipe(
                takeUntil(this.destroy$),
                first((user) => user !== null) // Attendre qu'un utilisateur soit disponible
              )
              .subscribe({
                next: (user) => {
                  console.log('🔍 RoleRedirectComponent - Utilisateur chargé (Observable):', user);
                  this.redirectUser(user);
                },
                error: () => {
                  console.log('🔍 RoleRedirectComponent - Pas d\'utilisateur, redirection vers login');
                  this.router.navigate(['/login']);
                }
              });
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private redirectUser(currentUser: any): void {
    if (!currentUser) {
      console.log('🔍 RoleRedirectComponent - Pas d\'utilisateur, redirection vers login');
      this.router.navigate(['/login']);
      return;
    }

    console.log('🔍 RoleRedirectComponent - Utilisateur actuel:', currentUser);
    console.log('🔍 RoleRedirectComponent - Rôle:', currentUser?.roleUtilisateur);
    
    const redirectUrl = this.getRedirectUrlByRole(currentUser.roleUtilisateur);
    console.log('🔍 RoleRedirectComponent - URL de redirection:', redirectUrl);
    this.router.navigate([redirectUrl]);
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
        return '/dossier/dashboard';
      case 'AGENT_RECOUVREMENT_AMIABLE':
        console.log('🔍 getRedirectUrlByRole - Cas AGENT_RECOUVREMENT_AMIABLE');
        return '/agent-amiable/dashboard';
      case 'AGENT_RECOUVREMENT_JURIDIQUE':
        console.log('🔍 getRedirectUrlByRole - Cas AGENT_RECOUVREMENT_JURIDIQUE');
        return '/agent-juridique/dashboard';
      case 'AGENT_DOSSIER':
        console.log('🔍 getRedirectUrlByRole - Cas AGENT_DOSSIER');
        return '/dossier/dashboard';
      case 'CHEF_DEPARTEMENT_FINANCE':
        console.log('🔍 getRedirectUrlByRole - Cas CHEF_DEPARTEMENT_FINANCE');
        return '/finance/dashboard';
      case 'AGENT_FINANCE':
        console.log('🔍 getRedirectUrlByRole - Cas AGENT_FINANCE');
        return '/finance/dashboard';
      default:
        console.log('🔍 getRedirectUrlByRole - Cas DEFAULT pour rôle:', role, 'normalisé:', normalizedRole);
        return '/dashboard';
    }
  }
}
