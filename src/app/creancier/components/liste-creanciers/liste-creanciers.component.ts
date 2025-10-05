import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-liste-creanciers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="liste-creanciers">
      <h1>Liste des Créanciers</h1>
      <p>Interface de liste des créanciers (à implémenter)</p>
    </div>
  `,
  styles: [`
    .liste-creanciers {
      padding: 20px;
    }
  `]
})
export class ListeCreanciersComponent {}
