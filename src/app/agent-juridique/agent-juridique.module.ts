import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards';
import { Role } from '../shared/models';

const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./components/agent-juridique-dashboard/agent-juridique-dashboard.component').then(m => m.AgentJuridiqueDashboardComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.AGENT_RECOUVREMENT_JURIDIQUE] }
  },
  {
    path: 'dossiers',
    loadComponent: () => import('./components/agent-juridique-dossiers/agent-juridique-dossiers.component').then(m => m.AgentJuridiqueDossiersComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.AGENT_RECOUVREMENT_JURIDIQUE] }
  },
  {
    path: 'audiences',
    loadComponent: () => import('./components/agent-juridique-audiences/agent-juridique-audiences.component').then(m => m.AgentJuridiqueAudiencesComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.AGENT_RECOUVREMENT_JURIDIQUE] }
  },
  {
    path: 'consultation',
    loadComponent: () => import('./components/agent-juridique-consultation/agent-juridique-consultation.component').then(m => m.AgentJuridiqueConsultationComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.AGENT_RECOUVREMENT_JURIDIQUE] }
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
export class AgentJuridiqueModule { }

