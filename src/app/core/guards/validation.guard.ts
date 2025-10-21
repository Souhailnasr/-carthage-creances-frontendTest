import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Role } from '../../shared/models/enums.model';

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
    private authService: AuthService,
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
    // Vérifier si l'utilisateur est authentifié
    if (!this.authService.isAuthenticated()) {
      console.warn('❌ Utilisateur non authentifié - redirection vers login');
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return false;
    }

    // Récupérer l'utilisateur actuel
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.warn('❌ Utilisateur non trouvé - redirection vers login');
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return false;
    }

    // Vérifier le rôle de l'utilisateur
    const hasValidRole = this.authorizedRoles.includes(currentUser.role);
    
    if (!hasValidRole) {
      console.warn(`❌ Rôle non autorisé: ${currentUser.role} - redirection vers dashboard`);
      this.router.navigate(['/dashboard'], { 
        queryParams: { error: 'access_denied' } 
      });
      return false;
    }

    console.log(`✅ Accès autorisé pour le rôle: ${currentUser.role}`);
    return true;
  }

  /**
   * Vérifie si l'utilisateur peut valider des dossiers
   */
  canValidateDossiers(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? this.authorizedRoles.includes(currentUser.role) : false;
  }

  /**
   * Vérifie si l'utilisateur peut créer des validations
   */
  canCreateValidations(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Tous les rôles autorisés peuvent créer des validations
    return this.authorizedRoles.includes(currentUser.role);
  }

  /**
   * Vérifie si l'utilisateur peut voir les statistiques
   */
  canViewStats(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Seuls les chefs et super admin peuvent voir les stats
    return [
      Role.SUPER_ADMIN,
      Role.CHEF_DEPARTEMENT_DOSSIER,
      Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE,
      Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE,
      Role.CHEF_DEPARTEMENT_FINANCE
    ].includes(currentUser.role);
  }
}
