import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DossierRoutingModule } from './routing/dossier-routing.module';
import { PartiePrenanteFormComponent } from './components/partie-prenante-form/partie-prenante-form.component';
import { PartiePrenanteListComponent } from './components/partie-prenante-list/partie-prenante-list.component';
import { PartiePrenanteDetailComponent } from './components/partie-prenante-detail/partie-prenante-detail.component';
import { DossierGestionComponent } from './components/dossier-gestion/dossier-gestion.component';
import { DossierDetailComponent } from './components/dossier-detail/dossier-detail.component';
import { EnquetePhaseComponent } from './components/enquete-phase/enquete-phase.component';
import { EnqueteDetailComponent } from './components/enquete-detail/enquete-detail.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { UserProfileComponent } from '../shared/components/user-profile/user-profile.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FormInputComponent } from '../shared/components/form-input/form-input.component';
import { DossierFormComponent } from './components/dossier-form/dossier-form.component';
import { DossierListComponent } from './components/dossier-list/dossier-list.component';
import { DossierDemoComponent } from './components/dossier-demo/dossier-demo.component';

@NgModule({
  declarations: [], // Standalone components don't need to be declared here
  imports: [
    CommonModule,
    DossierRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    FormInputComponent, // Import standalone components directly
    PartiePrenanteFormComponent, // Import standalone components directly
    PartiePrenanteListComponent,
    PartiePrenanteDetailComponent,
    DossierGestionComponent,
    DossierDetailComponent,
    EnquetePhaseComponent,
    EnqueteDetailComponent,
    UserManagementComponent,
    UserProfileComponent,
    DossierFormComponent,
    DossierListComponent,
    DossierDemoComponent
  ]
})
export class DossierModule { }
