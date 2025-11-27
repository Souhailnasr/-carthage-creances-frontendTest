import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JuridiqueUserManagementComponent } from '../components/juridique-user-management/juridique-user-management.component';
import { AuthGuard } from '../../core/guards';
import { Role } from '../../shared/models';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('../components/juridique-dashboard/juridique-dashboard.component').then(m => m.JuridiqueDashboardComponent)
  },
  {
    path: 'avocats',
    loadComponent: () => import('../components/avocats/avocats.component').then(m => m.AvocatsComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_JURIDIQUE, Role.SUPER_ADMIN] }
  },
  {
    path: 'huissiers',
    loadComponent: () => import('../components/huissiers/huissiers.component').then(m => m.HuissiersComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_JURIDIQUE, Role.SUPER_ADMIN] }
  },
  {
    path: 'affectation-dossiers',
    loadComponent: () => import('../components/affectation-dossiers/affectation-dossiers.component').then(m => m.AffectationDossiersComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_JURIDIQUE, Role.SUPER_ADMIN] }
  },
  {
    path: 'gestion-audiences',
    loadComponent: () => import('../components/gestion-audiences/gestion-audiences.component').then(m => m.GestionAudiencesComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_JURIDIQUE, Role.SUPER_ADMIN] }
  },
  {
    path: 'utilisateurs',
    component: JuridiqueUserManagementComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_JURIDIQUE, Role.SUPER_ADMIN] }
  },
  {
    path: 'taches',
    loadComponent: () => import('../../chef-amiable/components/taches/taches.component').then(m => m.TachesComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_JURIDIQUE, Role.SUPER_ADMIN] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JuridiqueRoutingModule { }
