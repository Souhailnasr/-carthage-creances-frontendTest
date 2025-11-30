import { Routes } from '@angular/router';
import { JuridiqueLayoutComponent } from './components/juridique-layout/juridique-layout.component';
import { JuridiqueDashboardComponent } from './components/juridique-dashboard/juridique-dashboard.component';
import { JuridiqueUserManagementComponent } from './components/juridique-user-management/juridique-user-management.component';
import { JuridiqueProfileComponent } from './components/juridique-profile/juridique-profile.component';
import { NotificationsPageComponent } from '../shared/components/notifications-page/notifications-page.component';
import { SendNotificationComponent } from '../shared/components/send-notification/send-notification.component';
import { AvocatFormComponent } from './components/avocat-form/avocat-form.component';
import { AvocatListComponent } from './components/avocat-list/avocat-list.component';
import { AvocatDetailsComponent } from './components/avocat-details/avocat-details.component';
import { HuissierFormComponent } from './components/huissier-form/huissier-form.component';
import { HuissierListComponent } from './components/huissier-list/huissier-list.component';
import { HuissierDetailsComponent } from './components/huissier-details/huissier-details.component';
import { AffectationDossiersComponent } from './components/affectation-dossiers/affectation-dossiers.component';
import { GestionAudiencesComponent } from './components/gestion-audiences/gestion-audiences.component';
import { GestionHuissierComponent } from './components/gestion-huissier/gestion-huissier.component';
import { TachesComponent } from '../chef-amiable/components/taches/taches.component';

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
        path: 'avocats/:id',
        component: AvocatDetailsComponent
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
        path: 'huissiers/:id',
        component: HuissierDetailsComponent
      },
      {
        path: 'affectation-dossiers',
        component: AffectationDossiersComponent
      },
      {
        path: 'gestion-huissier',
        component: GestionHuissierComponent
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
        path: 'notifications',
        component: NotificationsPageComponent
      },
      {
        path: 'send-notification',
        component: SendNotificationComponent
      },
      {
        path: 'profile',
        component: JuridiqueProfileComponent
      }
    ]
  }
];
