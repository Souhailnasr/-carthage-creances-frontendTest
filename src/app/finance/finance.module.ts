import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards';
import { Role } from '../shared/models';

const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./components/chef-finance-dashboard/chef-finance-dashboard.component').then(m => m.ChefFinanceDashboardComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'factures',
    loadComponent: () => import('./components/factures-list/factures-list.component').then(m => m.FacturesListComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'factures/:id',
    loadComponent: () => import('./components/facture-detail/facture-detail.component').then(m => m.FactureDetailComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'paiements',
    loadComponent: () => import('./components/paiements-gestion/paiements-gestion.component').then(m => m.PaiementsGestionComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'paiements/facture/:factureId',
    loadComponent: () => import('./components/paiements-gestion/paiements-gestion.component').then(m => m.PaiementsGestionComponent),
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
    loadComponent: () => import('./components/mes-dossiers-finance/mes-dossiers-finance.component').then(m => m.MesDossiersFinanceComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.AGENT_FINANCE, Role.CHEF_DEPARTEMENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'utilisateurs',
    loadComponent: () => import('./components/finance-user-management/finance-user-management.component').then(m => m.FinanceUserManagementComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE] }
  },
  {
    path: 'validation-tarifs/:dossierId',
    loadComponent: () => import('./components/validation-tarifs-complete/validation-tarifs-complete.component').then(m => m.ValidationTarifsCompleteComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.SUPER_ADMIN] }
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
