import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ChefAmiableLayoutComponent } from './components/chef-amiable-layout/chef-amiable-layout.component';
import { ChefAmiableDashboardComponent } from './components/chef-amiable-dashboard/chef-amiable-dashboard.component';
import { GestionActionsComponent } from './components/gestion-actions/gestion-actions.component';
import { GestionUtilisateursComponent } from './components/gestion-utilisateurs/gestion-utilisateurs.component';
import { TachesComponent } from './components/taches/taches.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { ProfilChefAmiableComponent } from './components/profil-chef-amiable/profil-chef-amiable.component';
import { SendNotificationComponent } from './components/send-notification/send-notification.component';
// import { NotificationsPageComponent } from '../../shared/components/notifications-page/notifications-page.component';
// import { SendNotificationComponent } from '../../shared/components/send-notification/send-notification.component';

const routes: Routes = [
  {
    path: '',
    component: ChefAmiableLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: ChefAmiableDashboardComponent
      },
      {
        path: 'gestion-actions',
        component: GestionActionsComponent
      },
      {
        path: 'gestion-utilisateurs',
        component: GestionUtilisateursComponent
      },
      {
        path: 'taches',
        component: TachesComponent
      },
      {
        path: 'notifications',
        component: NotificationsComponent
      },
      {
        path: 'send-notification',
        component: SendNotificationComponent
      },
      {
        path: 'profil',
        component: ProfilChefAmiableComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChefAmiableRoutingModule { }
