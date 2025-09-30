import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionsAmiableComponent } from './components/actions-amiable/actions-amiable.component';
import { RelancesComponent } from './components/relances/relances.component';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards';
import { Role } from '../shared/models';

const routes: Routes = [
  {
    path: 'actions',
    component: ActionsAmiableComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DOSSIER, Role.AGENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'relances',
    component: RelancesComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DOSSIER, Role.AGENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  { path: '', redirectTo: 'actions', pathMatch: 'full' }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ActionsAmiableComponent,
    RelancesComponent
  ]
})
export class AmiableModule { }
