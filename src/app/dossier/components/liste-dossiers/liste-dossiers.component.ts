import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-liste-dossiers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="liste-dossiers">
      <h1>Liste des Dossiers</h1>
      <p>Interface de liste des dossiers (à implémenter)</p>
    </div>
  `,
  styles: [`
    .liste-dossiers {
      padding: 20px;
    }
  `]
})
export class ListeDossiersComponent {}
