import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-management">
      <h1>Gestion des Utilisateurs</h1>
      <p>Interface de gestion des utilisateurs (à implémenter)</p>
    </div>
  `,
  styles: [`
    .user-management {
      padding: 20px;
    }
  `]
})
export class UserManagementComponent {}
