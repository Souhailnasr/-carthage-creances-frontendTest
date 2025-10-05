import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-liste-debiteurs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="liste-debiteurs">
      <h1>Liste des Débiteurs</h1>
      <p>Interface de liste des débiteurs (à implémenter)</p>
    </div>
  `,
  styles: [`
    .liste-debiteurs {
      padding: 20px;
    }
  `]
})
export class ListeDebiteursComponent {}
