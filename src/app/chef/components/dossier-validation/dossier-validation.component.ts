import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dossier-validation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dossier-validation">
      <h1>Validation des Dossiers</h1>
      <p>Interface de validation des dossiers (à implémenter)</p>
    </div>
  `,
  styles: [`
    .dossier-validation {
      padding: 20px;
    }
  `]
})
export class DossierValidationComponent {}
