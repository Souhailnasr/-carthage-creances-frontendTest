import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { RoleService } from '../services/role.service';
import { JwtAuthService } from '../services/jwt-auth.service';
import { Role } from '../../shared/models';

/**
 * Convertit un rôle authority (ex: RoleUtilisateur_AGENT_DOSSIER) vers l'enum Role
 */
function mapRoleAuthorityToEnum(roleAuthority: string | null): Role | null {
  if (!roleAuthority) return null;
  
  const normalizedRole = roleAuthority.replace(/^RoleUtilisateur_/, '');
  
  switch (normalizedRole) {
    case 'SUPER_ADMIN':
      return Role.SUPER_ADMIN;
    case 'CHEF_DEPARTEMENT_DOSSIER':
      return Role.CHEF_DEPARTEMENT_DOSSIER;
    case 'AGENT_DOSSIER':
      return Role.AGENT_DOSSIER;
    case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
      return Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE;
    case 'AGENT_RECOUVREMENT_JURIDIQUE':
      return Role.AGENT_RECOUVREMENT_JURIDIQUE;
    case 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
      return Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE;
    case 'AGENT_RECOUVREMENT_AMIABLE':
      return Role.AGENT_RECOUVREMENT_AMIABLE;
    case 'CHEF_DEPARTEMENT_FINANCE':
      return Role.CHEF_DEPARTEMENT_FINANCE;
    case 'AGENT_FINANCE':
      return Role.AGENT_FINANCE;
    default:
      return null;
  }
}

export const RoleGuard: CanActivateFn = (route, state) => {
  const roleService = inject(RoleService);
  const jwtAuthService = inject(JwtAuthService);
  const router = inject(Router);

  const allowedRoles = route.data['allowedRoles'] as Role[];

  // 🔧 CORRECTION: Utiliser jwtAuthService.isUserLoggedIn() qui vérifie sessionStorage
  if (!jwtAuthService.isUserLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // 🔧 CORRECTION: Récupérer le rôle depuis jwtAuthService et le convertir en enum
    const roleAuthority = jwtAuthService.loggedUserAuthority();
    const userRole = mapRoleAuthorityToEnum(roleAuthority);
    
    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    } else {
      console.warn('⚠️ Rôle non autorisé:', roleAuthority, 'converti en:', userRole, 'Rôles autorisés:', allowedRoles);
      router.navigate(['/unauthorized']);
      return false;
    }
  }

  return true; // If no specific roles are required, allow access
};
