import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PartiePrenanteFormComponent } from '../components/partie-prenante-form/partie-prenante-form.component';
import { PartiePrenanteListComponent } from '../components/partie-prenante-list/partie-prenante-list.component';
import { PartiePrenanteDetailComponent } from '../components/partie-prenante-detail/partie-prenante-detail.component';
import { DossierGestionComponent } from '../components/dossier-gestion/dossier-gestion.component';
import { DossierDetailComponent } from '../components/dossier-detail/dossier-detail.component';
import { EnquetePhaseComponent } from '../components/enquete-phase/enquete-phase.component';
import { EnqueteDetailComponent } from '../components/enquete-detail/enquete-detail.component';
import { UserManagementComponent } from '../components/user-management/user-management.component';
import { UserProfileComponent } from '../../shared/components/user-profile/user-profile.component';
import { AuthGuard, ChefDossierGuard } from '../../core/guards';
import { Role } from '../../shared/models';

const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('../../chef-dossier/chef-dossier.component').then(m => m.ChefDossierComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'parties-prenantes',
    component: PartiePrenanteListComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'parties-prenantes/ajouter/:type',
    component: PartiePrenanteFormComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'parties-prenantes/modifier/:type/:id',
    component: PartiePrenanteFormComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'parties-prenantes/voir/:type/:id',
    component: PartiePrenanteDetailComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'gestion',
    component: DossierGestionComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'detail/:id',
    component: DossierDetailComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'enquete',
    component: EnquetePhaseComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'enquete-detail/:id',
    component: EnqueteDetailComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'utilisateurs',
    component: UserManagementComponent,
    canActivate: [AuthGuard, ChefDossierGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'profil',
    component: UserProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'taches',
    loadComponent: () => import('../components/taches-dossier/taches-dossier.component').then(m => m.TachesDossierComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DossierRoutingModule { }
