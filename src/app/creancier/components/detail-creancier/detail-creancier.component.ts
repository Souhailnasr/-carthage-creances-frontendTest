import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-detail-creancier',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-creancier">
      <h1>Détail du Créancier</h1>
      <p>Interface de détail du créancier (à implémenter)</p>
    </div>
  `,
  styles: [`
    .detail-creancier {
      padding: 20px;
    }
  `]
})
export class DetailCreancierComponent {}
