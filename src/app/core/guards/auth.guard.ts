import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { JwtAuthService } from '../services/jwt-auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const jwtAuthService = inject(JwtAuthService);
  const router = inject(Router);

  // 🔧 CORRECTION: Utiliser jwtAuthService.isUserLoggedIn() qui vérifie sessionStorage
  if (jwtAuthService.isUserLoggedIn()) {
    // Si l'utilisateur est sur la page de login, le rediriger vers son interface appropriée
    if (state.url === '/login') {
      const roleAuthority = jwtAuthService.loggedUserAuthority();
      if (roleAuthority) {
        const redirectUrl = getRedirectUrlByRoleAuthority(roleAuthority);
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

/**
 * Récupère l'URL de redirection selon le rôle authority
 * Utilise le même format que dans login.component.ts
 */
function getRedirectUrlByRoleAuthority(roleAuthority: string): string {
  // Normaliser le rôle (supprimer le préfixe RoleUtilisateur_ si présent)
  const normalizedRole = roleAuthority.replace(/^RoleUtilisateur_/, '');
  
  switch (normalizedRole) {
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'CHEF_DEPARTEMENT_DOSSIER':
      return '/dossier/chef-dashboard';
    case 'AGENT_DOSSIER':
      return '/dossier/dashboard';
    case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
      return '/juridique/dashboard';
    case 'AGENT_RECOUVREMENT_JURIDIQUE':
      return '/juridique/dashboard';
    case 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
      return '/chef-amiable/dashboard';
    case 'AGENT_RECOUVREMENT_AMIABLE':
      return '/chef-amiable/dashboard';
    case 'CHEF_DEPARTEMENT_FINANCE':
      return '/dashboard';
    case 'AGENT_FINANCE':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}
