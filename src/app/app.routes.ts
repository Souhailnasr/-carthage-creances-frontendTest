import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards';

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
    path: 'dossier',
    loadChildren: () => import('./dossier/dossier.module').then(m => m.DossierModule),
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
    path: 'finance',
    loadChildren: () => import('./finance/finance.module').then(m => m.FinanceModule),
    canActivate: [AuthGuard]
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
    loadComponent: () => import('./chef-dossier/components/taches/taches.component').then(m => m.TachesComponent),
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
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
