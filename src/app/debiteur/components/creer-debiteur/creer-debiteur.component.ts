import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-creer-debiteur',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="creer-debiteur">
      <h1>Créer un Débiteur</h1>
      <p>Interface de création de débiteur (à implémenter)</p>
    </div>
  `,
  styles: [`
    .creer-debiteur {
      padding: 20px;
    }
  `]
})
export class CreerDebiteurComponent {}
