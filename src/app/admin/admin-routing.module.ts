import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards';
import { Role } from '../shared/models';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { SuperadminDashboardComponent } from './components/superadmin-dashboard/superadmin-dashboard.component';
import { UtilisateursComponent } from './components/utilisateurs/utilisateurs.component';
import { ParametresComponent } from './components/parametres/parametres.component';
// Imports directs pour éviter les erreurs de résolution TypeScript
import { SendNotificationComponent } from '../shared/components/send-notification/send-notification.component';
import { TacheFormComponent } from '../shared/components/tache-form/tache-form.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.SUPER_ADMIN] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: SuperadminDashboardComponent
      },
      {
        path: 'utilisateurs',
        component: UtilisateursComponent
      },
      {
        path: 'parametres',
        component: ParametresComponent
      },
      {
        path: 'juridique',
        loadComponent: () => import('./components/juridique-overview/juridique-overview.component').then(m => m.JuridiqueOverviewComponent)
      },
      {
        path: 'juridique/avocats',
        loadComponent: () => import('./components/avocats-admin/avocats-admin.component').then(m => m.AvocatsAdminComponent)
      },
      {
        path: 'juridique/huissiers',
        loadComponent: () => import('./components/huissiers-admin/huissiers-admin.component').then(m => m.HuissiersAdminComponent)
      },
      {
        path: 'juridique/audiences',
        loadComponent: () => import('./components/audiences-admin/audiences-admin.component').then(m => m.AudiencesAdminComponent)
      },
      {
        path: 'notifications/envoyer',
        component: SendNotificationComponent
      },
      {
        path: 'taches/create',
        component: TacheFormComponent
      },
      {
        path: 'taches/:id/edit',
        component: TacheFormComponent
      },
      // Nouveaux modules de supervision
      {
        path: 'supervision/dossiers-actifs',
        loadComponent: () => import('./components/supervision/dossiers-actifs/dossiers-actifs.component').then(m => m.DossiersActifsComponent)
      },
      {
        path: 'supervision/dossiers-clotures',
        loadComponent: () => import('./components/supervision/dossiers-clotures/dossiers-clotures.component').then(m => m.DossiersCloturesComponent)
      },
      {
        path: 'supervision/dossiers-archives',
        loadComponent: () => import('./components/supervision/dossiers-archives/dossiers-archives.component').then(m => m.DossiersArchivesComponent)
      },
      {
        path: 'supervision/dossiers',
        loadComponent: () => import('./components/supervision/supervision-dossiers/supervision-dossiers.component').then(m => m.SupervisionDossiersComponent)
      },
      {
        path: 'supervision/juridique',
        loadComponent: () => import('./components/supervision/supervision-juridique/supervision-juridique.component').then(m => m.SupervisionJuridiqueComponent)
      },
      {
        path: 'supervision/finance',
        loadComponent: () => import('./components/supervision/supervision-finance/supervision-finance.component').then(m => m.SupervisionFinanceComponent)
      },
      {
        path: 'supervision/amiable',
        loadComponent: () => import('./components/supervision/supervision-amiable/supervision-amiable.component').then(m => m.SupervisionAmiableComponent)
      },
      {
        path: 'alertes-actions',
        loadComponent: () => import('./components/alertes-actions/alertes-actions.component').then(m => m.AlertesActionsComponent)
      },
      {
        path: 'rapports-analyses',
        loadComponent: () => import('./components/rapports-analyses/rapports-analyses.component').then(m => m.RapportsAnalysesComponent)
      },
      {
        path: 'audit',
        loadComponent: () => import('./components/audit/audit.component').then(m => m.AuditComponent)
      }
      // TODO: Créer le composant performance avant d'activer la route
      // {
      //   path: 'supervision/performance',
      //   loadComponent: () => import('./components/supervision/performance/performance.component').then(m => m.PerformanceComponent)
      // }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
