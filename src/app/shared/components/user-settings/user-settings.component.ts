import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-settings">
      <h1>Paramètres</h1>
      <p>Configuration des paramètres utilisateur</p>
    </div>
  `,
  styles: [`
    .user-settings {
      padding: 20px;
    }
  `]
})
export class UserSettingsComponent {}
