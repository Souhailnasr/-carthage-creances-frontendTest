import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports">
      <h1>Rapports</h1>
      <p>Interface des rapports (à implémenter)</p>
    </div>
  `,
  styles: [`
    .reports {
      padding: 20px;
    }
  `]
})
export class ReportsComponent {}
