import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards';
import { Role } from '../shared/models';

const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./components/agent-amiable-dashboard/agent-amiable-dashboard.component').then(m => m.AgentAmiableDashboardComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.AGENT_RECOUVREMENT_AMIABLE] }
  },
  {
    path: 'dossiers',
    loadComponent: () => import('./components/agent-amiable-dossiers/agent-amiable-dossiers.component').then(m => m.AgentAmiableDossiersComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.AGENT_RECOUVREMENT_AMIABLE] }
  },
  {
    path: 'actions',
    loadComponent: () => import('./components/agent-amiable-actions/agent-amiable-actions.component').then(m => m.AgentAmiableActionsComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.AGENT_RECOUVREMENT_AMIABLE] }
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class AgentAmiableModule { }

