import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="team-management">
      <h1>Gestion d'Équipe</h1>
      <p>Interface de gestion d'équipe (à implémenter)</p>
    </div>
  `,
  styles: [`
    .team-management {
      padding: 20px;
    }
  `]
})
export class TeamManagementComponent {}
