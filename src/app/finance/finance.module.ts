import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceDashboardComponent } from './components/finance-dashboard/finance-dashboard.component';
import { RapportsComponent } from './components/rapports/rapports.component';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards';
import { Role } from '../shared/models';

const routes: Routes = [
  {
    path: 'dashboard',
    component: FinanceDashboardComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.SUPER_ADMIN] }
  },
  {
    path: 'rapports',
    component: RapportsComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_FINANCE, Role.AGENT_FINANCE, Role.SUPER_ADMIN] }
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FinanceDashboardComponent,
    RapportsComponent
  ]
})
export class FinanceModule { }
