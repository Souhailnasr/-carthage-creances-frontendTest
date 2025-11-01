import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { JwtAuthService } from '../services/jwt-auth.service';
import { Role } from '../../shared/models/enums.model';

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

@Injectable({
  providedIn: 'root'
})
export class ValidationGuard implements CanActivate, CanActivateChild {
  
  // Rôles autorisés pour la validation des dossiers
  private readonly authorizedRoles: Role[] = [
    Role.SUPER_ADMIN,
    Role.CHEF_DEPARTEMENT_DOSSIER,
    Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE,
    Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE,
    Role.CHEF_DEPARTEMENT_FINANCE
  ];

  constructor(
    private jwtAuthService: JwtAuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkValidationAccess();
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkValidationAccess();
  }

  private checkValidationAccess(): boolean {
    // 🔧 CORRECTION: Utiliser jwtAuthService.isUserLoggedIn() qui vérifie sessionStorage
    if (!this.jwtAuthService.isUserLoggedIn()) {
      console.warn('❌ Utilisateur non authentifié - redirection vers login');
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return false;
    }

    // 🔧 CORRECTION: Récupérer le rôle depuis jwtAuthService
    const roleAuthority = this.jwtAuthService.loggedUserAuthority();
    const userRole = mapRoleAuthorityToEnum(roleAuthority);
    
    if (!userRole) {
      console.warn('❌ Rôle non trouvé ou non reconnu - redirection vers login');
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return false;
    }

    // Vérifier le rôle de l'utilisateur
    const hasValidRole = this.authorizedRoles.includes(userRole);
    
    if (!hasValidRole) {
      console.warn(`❌ Rôle non autorisé: ${roleAuthority} (${userRole}) - redirection vers dashboard`);
      this.router.navigate(['/dashboard'], { 
        queryParams: { error: 'access_denied' } 
      });
      return false;
    }

    console.log(`✅ Accès autorisé pour le rôle: ${roleAuthority} (${userRole})`);
    return true;
  }

  /**
   * Vérifie si l'utilisateur peut valider des dossiers
   */
  canValidateDossiers(): boolean {
    if (!this.jwtAuthService.isUserLoggedIn()) {
      return false;
    }
    
    const roleAuthority = this.jwtAuthService.loggedUserAuthority();
    const userRole = mapRoleAuthorityToEnum(roleAuthority);
    
    return userRole ? this.authorizedRoles.includes(userRole) : false;
  }

  /**
   * Vérifie si l'utilisateur peut créer des validations
   */
  canCreateValidations(): boolean {
    if (!this.jwtAuthService.isUserLoggedIn()) {
      return false;
    }
    
    const roleAuthority = this.jwtAuthService.loggedUserAuthority();
    const userRole = mapRoleAuthorityToEnum(roleAuthority);
    
    if (!userRole) return false;
    
    // Tous les rôles autorisés peuvent créer des validations
    return this.authorizedRoles.includes(userRole);
  }

  /**
   * Vérifie si l'utilisateur peut voir les statistiques
   */
  canViewStats(): boolean {
    if (!this.jwtAuthService.isUserLoggedIn()) {
      return false;
    }
    
    const roleAuthority = this.jwtAuthService.loggedUserAuthority();
    const userRole = mapRoleAuthorityToEnum(roleAuthority);
    
    if (!userRole) return false;
    
    // Seuls les chefs et super admin peuvent voir les stats
    return [
      Role.SUPER_ADMIN,
      Role.CHEF_DEPARTEMENT_DOSSIER,
      Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE,
      Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE,
      Role.CHEF_DEPARTEMENT_FINANCE
    ].includes(userRole);
  }
}








