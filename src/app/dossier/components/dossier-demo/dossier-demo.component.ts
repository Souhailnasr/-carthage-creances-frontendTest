import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DossierFormComponent } from '../dossier-form/dossier-form.component';
import { DossierListComponent } from '../dossier-list/dossier-list.component';

@Component({
  selector: 'app-dossier-demo',
  standalone: true,
  imports: [CommonModule, DossierFormComponent, DossierListComponent],
  templateUrl: './dossier-demo.component.html',
  styleUrls: ['./dossier-demo.component.scss']
})
export class DossierDemoComponent {
  activeTab: 'form' | 'list' = 'form';

  switchTab(tab: 'form' | 'list'): void {
    this.activeTab = tab;
  }
}

