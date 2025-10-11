import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards';
import { Role } from '../shared/models';
import { UtilisateursComponent } from './components/utilisateurs/utilisateurs.component';
import { ParametresComponent } from './components/parametres/parametres.component';

const routes: Routes = [
  {
    path: 'utilisateurs',
    component: UtilisateursComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.SUPER_ADMIN] }
  },
  {
    path: 'parametres',
    component: ParametresComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.SUPER_ADMIN] }
  },
  {
    path: 'juridique',
    loadComponent: () => import('./components/juridique-overview/juridique-overview.component').then(m => m.JuridiqueOverviewComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.SUPER_ADMIN] }
  },
  {
    path: 'juridique/avocats',
    loadComponent: () => import('./components/avocats-admin/avocats-admin.component').then(m => m.AvocatsAdminComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.SUPER_ADMIN] }
  },
  {
    path: 'juridique/huissiers',
    loadComponent: () => import('./components/huissiers-admin/huissiers-admin.component').then(m => m.HuissiersAdminComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.SUPER_ADMIN] }
  },
  {
    path: 'juridique/audiences',
    loadComponent: () => import('./components/audiences-admin/audiences-admin.component').then(m => m.AudiencesAdminComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.SUPER_ADMIN] }
  },
  { path: '', redirectTo: 'utilisateurs', pathMatch: 'full' }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminModule { }
