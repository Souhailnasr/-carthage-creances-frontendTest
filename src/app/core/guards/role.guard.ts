import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { RoleService } from '../services/role.service';
import { AuthService } from '../services/auth.service';
import { Role } from '../../shared/models';

export const RoleGuard: CanActivateFn = (route, state) => {
  const roleService = inject(RoleService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['allowedRoles'] as Role[];

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = authService.getRole();
    if (userRole && allowedRoles.includes(userRole as Role)) {
      return true;
    } else {
      router.navigate(['/unauthorized']);
      return false;
    }
  }

  return true; // If no specific roles are required, allow access
};
