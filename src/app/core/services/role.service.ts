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
    this.jwtAuthService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  getRole(): Role | null {
    return this.currentUser ? this.currentUser.roleUtilisateur : null;
  }

  hasRole(requiredRole: Role): boolean {
    return this.getRole() === requiredRole.toString();
  }

  isSuperAdmin(): boolean {
    return this.hasRole(Role.SUPER_ADMIN);
  }

  isChefDossier(): boolean {
    return this.hasRole(Role.CHEF_DEPARTEMENT_DOSSIER);
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
