import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-creer-dossier',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="creer-dossier">
      <h1>Créer un Dossier</h1>
      <p>Interface de création de dossier (à implémenter)</p>
    </div>
  `,
  styles: [`
    .creer-dossier {
      padding: 20px;
    }
  `]
})
export class CreerDossierComponent {}
