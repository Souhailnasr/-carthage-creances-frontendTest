import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JuridiqueRoutingModule } from './routing/juridique-routing.module';
import { AvocatListComponent } from './components/avocat-list/avocat-list.component';
import { AvocatFormComponent } from './components/avocat-form/avocat-form.component';
import { HuissierListComponent } from './components/huissier-list/huissier-list.component';
import { HuissierFormComponent } from './components/huissier-form/huissier-form.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    JuridiqueRoutingModule,
    AvocatListComponent,
    AvocatFormComponent,
    HuissierListComponent,
    HuissierFormComponent
  ]
})
export class JuridiqueModule { }
