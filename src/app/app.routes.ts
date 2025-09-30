import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
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
    path: 'auth-test',
    loadComponent: () => import('./shared/components/auth-test/auth-test.component').then(m => m.AuthTestComponent),
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
