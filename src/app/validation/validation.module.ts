import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Components
import { ValidationDossierListComponent } from './components/validation-dossier-list/validation-dossier-list.component';
import { ValidationDossierFormComponent } from './components/validation-dossier-form/validation-dossier-form.component';
import { ValidationStatsComponent } from './components/validation-stats/validation-stats.component';
import { ValidationNotificationsComponent } from './components/validation-notifications/validation-notifications.component';

// Services
import { ValidationDossierService } from '../core/services/validation-dossier.service';

// Guards
import { ValidationGuard } from '../core/guards/validation.guard';

const routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full' as const
  },
  {
    path: 'list',
    component: ValidationDossierListComponent,
    canActivate: [ValidationGuard]
  },
  {
    path: 'create',
    component: ValidationDossierFormComponent,
    canActivate: [ValidationGuard]
  },
  {
    path: 'stats',
    component: ValidationStatsComponent,
    canActivate: [ValidationGuard]
  },
  {
    path: 'notifications',
    component: ValidationNotificationsComponent,
    canActivate: [ValidationGuard]
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    ValidationDossierListComponent,
    ValidationDossierFormComponent,
    ValidationStatsComponent,
    ValidationNotificationsComponent
  ],
  providers: [
    ValidationDossierService,
    ValidationGuard
  ]
})
export class ValidationModule { }
