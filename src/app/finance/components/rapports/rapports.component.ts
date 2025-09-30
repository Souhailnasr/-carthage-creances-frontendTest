import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Rapports Financiers</h2>
      <p>Contenu pour la génération de rapports financiers.</p>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `]
})
export class RapportsComponent { }
