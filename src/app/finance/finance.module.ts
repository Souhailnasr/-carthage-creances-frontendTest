import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards';
import { Role } from '../shared/models';

const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./components/finance-dashboard/finance-dashboard.component').then(m => m.FinanceDashboardComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'dossier/:id/finance',
    loadComponent: () => import('./components/dossier-finance-tab/dossier-finance-tab.component').then(m => m.DossierFinanceTabComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'dossier/:id/facture',
    loadComponent: () => import('./components/facture-detail/facture-detail.component').then(m => m.FactureDetailComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'validation-frais',
    loadComponent: () => import('./components/frais-validation/frais-validation.component').then(m => m.FraisValidationComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'tarifs',
    loadComponent: () => import('./components/tarif-catalogue/tarif-catalogue.component').then(m => m.TarifCatalogueComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'import-frais',
    loadComponent: () => import('./components/frais-import/frais-import.component').then(m => m.FraisImportComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'reporting',
    loadComponent: () => import('./components/finance-reporting/finance-reporting.component').then(m => m.FinanceReportingComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'insights',
    loadComponent: () => import('./components/finance-insights/finance-insights.component').then(m => m.FinanceInsightsComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'rapports',
    loadComponent: () => import('./components/rapports/rapports.component').then(m => m.RapportsComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'mes-dossiers',
    loadComponent: () => import('./components/finance-agent-dossiers/finance-agent-dossiers.component').then(m => m.FinanceAgentDossiersComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.AGENT_FINANCE, Role.CHEF_DEPARTEMENT_FINANCE] }
  },
  {
    path: 'utilisateurs',
    loadComponent: () => import('./components/finance-user-management/finance-user-management.component').then(m => m.FinanceUserManagementComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE] }
  },
  {
    path: 'taches',
    redirectTo: '/admin/taches',
    pathMatch: 'full'
  },
  {
    path: 'notifications',
    redirectTo: '/notifications',
    pathMatch: 'full'
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class FinanceModule { }
