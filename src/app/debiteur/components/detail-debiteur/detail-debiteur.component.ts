import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-detail-debiteur',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-debiteur">
      <h1>Détail du Débiteur</h1>
      <p>Interface de détail du débiteur (à implémenter)</p>
    </div>
  `,
  styles: [`
    .detail-debiteur {
      padding: 20px;
    }
  `]
})
export class DetailDebiteurComponent {}
