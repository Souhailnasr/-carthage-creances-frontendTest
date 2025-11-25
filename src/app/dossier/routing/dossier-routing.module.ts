import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PartiePrenanteFormComponent } from '../components/partie-prenante-form/partie-prenante-form.component';
import { PartiePrenanteListComponent } from '../components/partie-prenante-list/partie-prenante-list.component';
import { PartiePrenanteDetailComponent } from '../components/partie-prenante-detail/partie-prenante-detail.component';
import { DossierGestionComponent } from '../components/dossier-gestion/dossier-gestion.component';
import { DossierDetailComponent } from '../components/dossier-detail/dossier-detail.component';
import { EnqueteDetailComponent } from '../components/enquete-detail/enquete-detail.component';
import { UserManagementComponent } from '../components/user-management/user-management.component';
import { UserProfileComponent } from '../../shared/components/user-profile/user-profile.component';
import { AuthGuard, ChefDossierGuard } from '../../core/guards';
import { Role } from '../../shared/models';

const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('../../shared/components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.AGENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'chef-dashboard',
    redirectTo: 'dashboard',
    pathMatch: 'full'
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
    path: 'affectation',
    loadComponent: () => import('../components/affectation-dossiers/affectation-dossiers.component').then(m => m.AffectationDossiersComponent),
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
  {
    path: 'en-attente',
    loadComponent: () => import('../components/dossiers-en-attente/dossiers-en-attente.component').then(m => m.DossiersEnAttenteComponent),
    canActivate: [AuthGuard, ChefDossierGuard],
    data: { allowedRoles: [Role.CHEF_DEPARTEMENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'mes-validations',
    loadComponent: () => import('../components/mes-validations/mes-validations.component').then(m => m.MesValidationsComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.AGENT_DOSSIER, Role.CHEF_DEPARTEMENT_DOSSIER, Role.SUPER_ADMIN] }
  },
  {
    path: 'mes-dossiers',
    loadComponent: () => import('../components/liste-dossiers-agent/liste-dossiers-agent.component').then(m => m.ListeDossiersAgentComponent),
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.AGENT_DOSSIER, Role.AGENT_RECOUVREMENT_AMIABLE, Role.AGENT_RECOUVREMENT_JURIDIQUE, Role.AGENT_FINANCE, Role.CHEF_DEPARTEMENT_DOSSIER] }
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DossierRoutingModule { }
