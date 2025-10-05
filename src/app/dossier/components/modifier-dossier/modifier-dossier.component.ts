import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modifier-dossier',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modifier-dossier">
      <h1>Modifier le Dossier</h1>
      <p>Interface de modification du dossier (à implémenter)</p>
    </div>
  `,
  styles: [`
    .modifier-dossier {
      padding: 20px;
    }
  `]
})
export class ModifierDossierComponent {}
