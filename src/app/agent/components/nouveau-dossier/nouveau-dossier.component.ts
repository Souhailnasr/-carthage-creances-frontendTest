import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nouveau-dossier',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nouveau-dossier">
      <h1>Nouveau Dossier</h1>
      <p>Interface de création de dossier (à implémenter)</p>
    </div>
  `,
  styles: [`
    .nouveau-dossier {
      padding: 20px;
    }
  `]
})
export class NouveauDossierComponent {}
