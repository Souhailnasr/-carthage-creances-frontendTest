import { Routes } from '@angular/router';
import { JuridiqueLayoutComponent } from './components/juridique-layout/juridique-layout.component';
import { JuridiqueDashboardComponent } from './components/juridique-dashboard/juridique-dashboard.component';
import { JuridiqueUserManagementComponent } from './components/juridique-user-management/juridique-user-management.component';
import { JuridiqueProfileComponent } from './components/juridique-profile/juridique-profile.component';
import { AvocatFormComponent } from './components/avocat-form/avocat-form.component';
import { AvocatListComponent } from './components/avocat-list/avocat-list.component';
import { HuissierFormComponent } from './components/huissier-form/huissier-form.component';
import { HuissierListComponent } from './components/huissier-list/huissier-list.component';
import { AffectationDossiersComponent } from './components/affectation-dossiers/affectation-dossiers.component';
import { GestionAudiencesComponent } from './components/gestion-audiences/gestion-audiences.component';
import { TachesComponent } from '../shared/components/taches/taches.component';

export const juridiqueRoutes: Routes = [
  {
    path: '',
    component: JuridiqueLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: JuridiqueDashboardComponent
      },
      {
        path: 'gestion-utilisateurs',
        component: JuridiqueUserManagementComponent
      },
      {
        path: 'avocats',
        component: AvocatListComponent
      },
      {
        path: 'avocats/add',
        component: AvocatFormComponent
      },
      {
        path: 'avocats/edit/:id',
        component: AvocatFormComponent
      },
      {
        path: 'huissiers',
        component: HuissierListComponent
      },
      {
        path: 'huissiers/add',
        component: HuissierFormComponent
      },
      {
        path: 'huissiers/edit/:id',
        component: HuissierFormComponent
      },
      {
        path: 'affectation-dossiers',
        component: AffectationDossiersComponent
      },
      {
        path: 'gestion-audiences',
        component: GestionAudiencesComponent
      },
      {
        path: 'taches',
        component: TachesComponent
      },
      {
        path: 'profile',
        component: JuridiqueProfileComponent
      }
    ]
  }
];
