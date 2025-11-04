import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Role, User } from '../../shared/models';
import { JwtAuthService } from './jwt-auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  currentUser: User | null = null;
  constructor(private jwtAuthService: JwtAuthService) {
    this.loadCurrentUser();
  }

  private loadCurrentUser() {
    this.jwtAuthService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        console.log('🔍 RoleService - Utilisateur chargé:', user);
        console.log('🔍 RoleService - Rôle:', user?.roleUtilisateur);
      },
      error: (error) => {
        console.error('❌ RoleService - Erreur lors du chargement de l\'utilisateur:', error);
      }
    });
  }

  getRole(): Role | null {
    return this.currentUser ? this.currentUser.roleUtilisateur : null;
  }

  hasRole(requiredRole: Role): boolean {
    const userRole = this.getRole();
    if (!userRole) {
      console.warn('⚠️ RoleService.hasRole - Aucun rôle utilisateur trouvé');
      return false;
    }
    
    // Comparer les enums directement
    const hasRole = userRole === requiredRole;
    console.log(`🔍 RoleService.hasRole - userRole: ${userRole}, requiredRole: ${requiredRole}, match: ${hasRole}`);
    return hasRole;
  }

  isSuperAdmin(): boolean {
    const result = this.hasRole(Role.SUPER_ADMIN);
    console.log('🔍 RoleService.isSuperAdmin:', result);
    return result;
  }

  isChefDossier(): boolean {
    const result = this.hasRole(Role.CHEF_DEPARTEMENT_DOSSIER);
    console.log('🔍 RoleService.isChefDossier:', result, 'userRole:', this.getRole());
    return result;
  }

  isAgentDossier(): boolean {
    return this.hasRole(Role.AGENT_DOSSIER);
  }

  isChefJuridique(): boolean {
    return this.hasRole(Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE);
  }

  isAgentJuridique(): boolean {
    return this.hasRole(Role.AGENT_RECOUVREMENT_JURIDIQUE);
  }

  isChefFinance(): boolean {
    return this.hasRole(Role.CHEF_DEPARTEMENT_FINANCE);
  }

  isAgentFinance(): boolean {
    return this.hasRole(Role.AGENT_FINANCE);
  }

  canManageDossiers(): boolean {
    const userRole = this.getRole()
    return userRole === Role.CHEF_DEPARTEMENT_DOSSIER.toString() || userRole === Role.AGENT_DOSSIER.toString() || userRole === Role.SUPER_ADMIN.toString();
  }

  canManageJuridique(): boolean {
    const userRole = this.getRole()
    return userRole === Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE.toString() || userRole === Role.AGENT_RECOUVREMENT_JURIDIQUE.toString() || userRole === Role.SUPER_ADMIN.toString();
  }

  canManageFinance(): boolean {
    const userRole = this.getRole()
    return userRole === Role.CHEF_DEPARTEMENT_FINANCE.toString() || userRole === Role.AGENT_FINANCE.toString() || userRole === Role.SUPER_ADMIN.toString();
  }
}
