import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-creer-creancier',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="creer-creancier">
      <h1>Créer un Créancier</h1>
      <p>Interface de création de créancier (à implémenter)</p>
    </div>
  `,
  styles: [`
    .creer-creancier {
      padding: 20px;
    }
  `]
})
export class CreerCreancierComponent {}
