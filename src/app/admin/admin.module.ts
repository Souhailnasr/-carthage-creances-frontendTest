import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtilisateursComponent } from './components/utilisateurs/utilisateurs.component';
import { ParametresComponent } from './components/parametres/parametres.component';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards';
import { Role } from '../shared/models';

const routes: Routes = [
  {
    path: 'utilisateurs',
    component: UtilisateursComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.SUPER_ADMIN] }
  },
  {
    path: 'parametres',
    component: ParametresComponent,
    canActivate: [AuthGuard],
    data: { allowedRoles: [Role.SUPER_ADMIN] }
  },
  { path: '', redirectTo: 'utilisateurs', pathMatch: 'full' }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    UtilisateursComponent,
    ParametresComponent
  ]
})
export class AdminModule { }
