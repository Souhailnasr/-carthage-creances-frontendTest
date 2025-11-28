import { Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from './core/guards';
import { Role } from './shared/models';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./shared/components/role-redirect/role-redirect.component').then(m => m.RoleRedirectComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./shared/components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'utilisateurs',
    loadComponent: () => import('./components/utilisateurs-list/utilisateurs-list.component').then(m => m.UtilisateursListComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: {
      allowedRoles: [
        Role.SUPER_ADMIN,
        Role.CHEF_DEPARTEMENT_DOSSIER,
        Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE,
        Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE,
        Role.CHEF_DEPARTEMENT_FINANCE
      ]
    }
  },
  {
    path: 'dossier',
    loadChildren: () => import('./dossier/dossier.module').then(m => m.DossierModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'dossiers/amiable',
    loadComponent: () => import('./dossier/components/dossiers-amiable/dossiers-amiable.component').then(m => m.DossiersAmiableComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'dossiers/juridique',
    loadComponent: () => import('./dossier/components/dossiers-juridique/dossiers-juridique.component').then(m => m.DossiersJuridiqueComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'juridique',
    loadChildren: () => import('./juridique/juridique.module').then(m => m.JuridiqueModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'amiable',
    loadChildren: () => import('./amiable/amiable.module').then(m => m.AmiableModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'chef-amiable',
    loadChildren: () => import('./chef-amiable/chef-amiable.module').then(m => m.ChefAmiableModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'agent-amiable',
    loadChildren: () => import('./agent-amiable/agent-amiable.module').then(m => m.AgentAmiableModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'agent-juridique',
    loadChildren: () => import('./agent-juridique/agent-juridique.module').then(m => m.AgentJuridiqueModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'finance',
    loadChildren: () => import('./finance/finance.module').then(m => m.FinanceModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'validation',
    loadChildren: () => import('./validation/validation.module').then(m => m.ValidationModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'enquetes',
    children: [
      {
        path: '',
        redirectTo: 'gestion',
        pathMatch: 'full'
      },
      {
        path: 'gestion',
        loadComponent: () => import('./enquete/components/enquete-gestion/enquete-gestion.component').then(m => m.EnqueteGestionComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'statistiques',
        loadComponent: () => import('./enquete/components/statistiques-enquetes/statistiques-enquetes.component').then(m => m.StatistiquesEnquetesComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'validation',
        loadComponent: () => import('./enquete/components/enquetes-en-attente/enquetes-en-attente.component').then(m => m.EnquetesEnAttenteComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'en-attente',
        loadComponent: () => import('./enquete/components/enquetes-en-attente/enquetes-en-attente.component').then(m => m.EnquetesEnAttenteComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'nouvelle',
        loadComponent: () => import('./enquete/components/create-enquete/create-enquete.component').then(m => m.CreateEnqueteComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'create',
        redirectTo: 'nouvelle',
        pathMatch: 'full'
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./enquete/components/edit-enquete/edit-enquete.component').then(m => m.EditEnqueteComponent),
        canActivate: [AuthGuard]
      },
      {
        path: ':id/modifier',
        redirectTo: 'edit/:id',
        pathMatch: 'full'
      },
      {
        path: 'mes-validations',
        loadComponent: () => import('./enquete/components/mes-validations-enquete/mes-validations-enquete.component').then(m => m.MesValidationsEnqueteComponent),
        canActivate: [AuthGuard]
      },
      {
        path: ':id',
        loadComponent: () => import('./enquete/components/enquete-details/enquete-details.component').then(m => m.EnqueteDetailsComponent),
        canActivate: [AuthGuard]
      }
    ]
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/utilisateurs',
    loadComponent: () => import('./admin/components/utilisateurs/utilisateurs.component').then(m => m.UtilisateursComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/utilisateurs/:id',
    loadComponent: () => import('./admin/components/utilisateur-detail/utilisateur-detail.component').then(m => m.UtilisateurDetailComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./shared/components/user-profile/user-profile.component').then(m => m.UserProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profil',
    loadComponent: () => import('./shared/components/profil/profil.component').then(m => m.ProfilComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./shared/components/notifications-page/notifications-page.component').then(m => m.NotificationsPageComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'send-notification',
    loadComponent: () => import('./shared/components/send-notification/send-notification.component').then(m => m.SendNotificationComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'mes-agents',
    loadComponent: () => import('./shared/components/mes-agents/mes-agents.component').then(m => m.MesAgentsComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: {
      allowedRoles: [
        Role.SUPER_ADMIN,
        Role.CHEF_DEPARTEMENT_DOSSIER,
        Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE,
        Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE,
        Role.CHEF_DEPARTEMENT_FINANCE
      ]
    }
  },
  {
    path: 'chef/dashboard',
    loadComponent: () => import('./chef/components/chef-dashboard/chef-dashboard.component').then(m => m.ChefDashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'chef-dossier',
    loadComponent: () => import('./chef-dossier/chef-dossier.component').then(m => m.ChefDossierComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'chef-dossier/taches',
    loadComponent: () => import('./chef-amiable/components/taches/taches.component').then(m => m.TachesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/taches',
    loadComponent: () => import('./chef-amiable/components/taches/taches.component').then(m => m.TachesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'creanciers',
    loadComponent: () => import('./creancier/creancier-gestion/creancier-gestion.component').then(m => m.CreancierGestionComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'debiteurs',
    loadComponent: () => import('./debiteur/debiteur-gestion/debiteur-gestion.component').then(m => m.DebiteurGestionComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
