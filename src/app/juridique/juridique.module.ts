import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { juridiqueRoutes } from './juridique-routes';
import { JuridiqueLayoutComponent } from './components/juridique-layout/juridique-layout.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(juridiqueRoutes),
    JuridiqueLayoutComponent
  ]
})
export class JuridiqueModule { }