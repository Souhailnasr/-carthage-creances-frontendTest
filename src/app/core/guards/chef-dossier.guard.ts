import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RoleService } from '../services/role.service';
import { JwtAuthService } from '../services/jwt-auth.service';
import { Role } from '../../shared/models';

export const ChefDossierGuard: CanActivateFn = async (route, state) => {
  const roleService = inject(RoleService);
  const jwtAuthService = inject(JwtAuthService);
  const router = inject(Router);

  // Vérifier d'abord si l'utilisateur est connecté
  if (!jwtAuthService.isUserLoggedIn()) {
    console.warn('❌ ChefDossierGuard - Utilisateur non connecté');
    router.navigate(['/login']);
    return false;
  }

  try {
    // Attendre que l'utilisateur soit chargé de manière synchrone
    const currentUser = await firstValueFrom(jwtAuthService.getCurrentUser());
    
    if (!currentUser) {
      console.warn('❌ ChefDossierGuard - Utilisateur non trouvé');
      router.navigate(['/login']);
      return false;
    }

    const userRole = currentUser.roleUtilisateur;
    console.log('🔍 ChefDossierGuard - Rôle utilisateur:', userRole);
    console.log('🔍 ChefDossierGuard - CHEF_DEPARTEMENT_DOSSIER:', Role.CHEF_DEPARTEMENT_DOSSIER);
    console.log('🔍 ChefDossierGuard - SUPER_ADMIN:', Role.SUPER_ADMIN);
    console.log('🔍 ChefDossierGuard - Comparaison:', userRole === Role.CHEF_DEPARTEMENT_DOSSIER || userRole === Role.SUPER_ADMIN);

    // Vérifier directement le rôle
    if (userRole === Role.CHEF_DEPARTEMENT_DOSSIER || userRole === Role.SUPER_ADMIN) {
      console.log('✅ ChefDossierGuard - Accès autorisé');
      return true;
    } else {
      console.warn('❌ ChefDossierGuard - Accès refusé, rôle:', userRole);
      router.navigate(['/unauthorized']);
      return false;
    }
  } catch (error) {
    console.error('❌ ChefDossierGuard - Erreur lors du chargement de l\'utilisateur:', error);
    router.navigate(['/login']);
    return false;
  }
};
