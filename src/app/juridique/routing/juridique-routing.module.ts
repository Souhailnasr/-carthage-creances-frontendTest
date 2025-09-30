import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AvocatListComponent } from '../components/avocat-list/avocat-list.component';
import { AvocatFormComponent } from '../components/avocat-form/avocat-form.component';
import { HuissierListComponent } from '../components/huissier-list/huissier-list.component';
import { HuissierFormComponent } from '../components/huissier-form/huissier-form.component';
import { AuthGuard, ChefJuridiqueGuard } from '../../core/guards';
import { Role } from '../../shared/models';

const routes: Routes = [
  {
    path: 'avocats',
    component: AvocatListComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_JURIDIQUE, Role.AGENT_JURIDIQUE, Role.SUPER_ADMIN] }
  },
  {
    path: 'avocats/ajouter',
    component: AvocatFormComponent,
    canActivate: [AuthGuard, ChefJuridiqueGuard],
    data: { allowedRoles: [Role.CHEF_JURIDIQUE, Role.SUPER_ADMIN] }
  },
  {
    path: 'avocats/modifier/:id',
    component: AvocatFormComponent,
    canActivate: [AuthGuard, ChefJuridiqueGuard],
    data: { allowedRoles: [Role.CHEF_JURIDIQUE, Role.SUPER_ADMIN] }
  },
  {
    path: 'huissiers',
    component: HuissierListComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_JURIDIQUE, Role.AGENT_JURIDIQUE, Role.SUPER_ADMIN] }
  },
  {
    path: 'huissiers/ajouter',
    component: HuissierFormComponent,
    canActivate: [AuthGuard, ChefJuridiqueGuard],
    data: { allowedRoles: [Role.CHEF_JURIDIQUE, Role.SUPER_ADMIN] }
  },
  {
    path: 'huissiers/modifier/:id',
    component: HuissierFormComponent,
    canActivate: [AuthGuard, ChefJuridiqueGuard],
    data: { allowedRoles: [Role.CHEF_JURIDIQUE, Role.SUPER_ADMIN] }
  },
  { path: '', redirectTo: 'avocats', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JuridiqueRoutingModule { }
