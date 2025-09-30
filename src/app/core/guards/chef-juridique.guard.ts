import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { RoleService } from '../services/role.service';
import { Role } from '../../shared/models';

export const ChefJuridiqueGuard: CanActivateFn = (route, state) => {
  const roleService = inject(RoleService);
  const router = inject(Router);

  if (roleService.isChefJuridique() || roleService.isSuperAdmin()) {
    return true;
  } else {
    router.navigate(['/unauthorized']);
    return false;
  }
};
