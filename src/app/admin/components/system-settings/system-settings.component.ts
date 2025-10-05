import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="system-settings">
      <h1>Paramètres Système</h1>
      <p>Configuration des paramètres système (à implémenter)</p>
    </div>
  `,
  styles: [`
    .system-settings {
      padding: 20px;
    }
  `]
})
export class SystemSettingsComponent {}
