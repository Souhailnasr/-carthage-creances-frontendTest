import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-detail-dossier',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-dossier">
      <h1>Détail du Dossier</h1>
      <p>Interface de détail du dossier (à implémenter)</p>
    </div>
  `,
  styles: [`
    .detail-dossier {
      padding: 20px;
    }
  `]
})
export class DetailDossierComponent {}
