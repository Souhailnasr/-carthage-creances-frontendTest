import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ChefAmiableRoutingModule } from './chef-amiable-routing.module';

// Components
// import { ChefAmiableLayoutComponent } from './components/chef-amiable-layout/chef-amiable-layout.component';
import { ChefAmiableDashboardComponent } from './components/chef-amiable-dashboard/chef-amiable-dashboard.component';
import { GestionActionsComponent } from './components/gestion-actions/gestion-actions.component';
import { GestionUtilisateursComponent } from './components/gestion-utilisateurs/gestion-utilisateurs.component';
import { TachesComponent } from './components/taches/taches.component';
import { NotificationsComponent } from './components/notifications/notifications.component';

@NgModule({
  declarations: [
    // ChefAmiableLayoutComponent, // Standalone component
            ChefAmiableDashboardComponent,
    GestionActionsComponent,
    GestionUtilisateursComponent,
    TachesComponent,
    NotificationsComponent
  ],
          imports: [
            CommonModule,
            ReactiveFormsModule,
            FormsModule,
            RouterModule,
            ChefAmiableRoutingModule
          ]
})
export class ChefAmiableModule { }
