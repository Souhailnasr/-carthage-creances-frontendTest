import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards';
import { Role } from '../shared/models';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { SuperadminDashboardComponent } from './components/superadmin-dashboard/superadmin-dashboard.component';
import { UtilisateursComponent } from './components/utilisateurs/utilisateurs.component';
import { ParametresComponent } from './components/parametres/parametres.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.SUPER_ADMIN] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: SuperadminDashboardComponent
      },
      {
        path: 'utilisateurs',
        component: UtilisateursComponent
      },
      {
        path: 'parametres',
        component: ParametresComponent
      },
      {
        path: 'juridique',
        loadComponent: () => import('./components/juridique-overview/juridique-overview.component').then(m => m.JuridiqueOverviewComponent)
      },
      {
        path: 'juridique/avocats',
        loadComponent: () => import('./components/avocats-admin/avocats-admin.component').then(m => m.AvocatsAdminComponent)
      },
      {
        path: 'juridique/huissiers',
        loadComponent: () => import('./components/huissiers-admin/huissiers-admin.component').then(m => m.HuissiersAdminComponent)
      },
      {
        path: 'juridique/audiences',
        loadComponent: () => import('./components/audiences-admin/audiences-admin.component').then(m => m.AudiencesAdminComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
