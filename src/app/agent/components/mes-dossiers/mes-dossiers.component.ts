import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mes-dossiers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mes-dossiers">
      <h1>Mes Dossiers</h1>
      <p>Interface des dossiers de l'agent (à implémenter)</p>
    </div>
  `,
  styles: [`
    .mes-dossiers {
      padding: 20px;
    }
  `]
})
export class MesDossiersComponent {}
