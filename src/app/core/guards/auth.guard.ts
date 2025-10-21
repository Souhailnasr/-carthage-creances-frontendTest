import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Si l'utilisateur est sur la page de login, le rediriger vers son interface appropriée
    if (state.url === '/login') {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const redirectUrl = getRedirectUrlByRole(currentUser.role);
        router.navigate([redirectUrl]);
        return false;
      }
    }
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

function getRedirectUrlByRole(role: string): string {
  // Normaliser le rôle (enlever les préfixes possibles)
  const normalizedRole = role.replace(/^RoleUtilisateur_/, '').replace(/^ROLE_/, '');
  
  switch (normalizedRole) {
    case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
      return '/juridique/dashboard';
    case 'CHEF_DEPARTEMENT_DOSSIER':
      return '/dossier/chef-dashboard';
    case 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
      return '/chef-amiable/dashboard';
    case 'AGENT_DOSSIER':
      return '/dossier/dashboard';
    case 'AGENT_RECOUVREMENT_JURIDIQUE':
      return '/juridique/dashboard';
    case 'AGENT_RECOUVREMENT_AMIABLE':
      return '/amiable/dashboard';
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    default:
      return '/dashboard';
  }
}
