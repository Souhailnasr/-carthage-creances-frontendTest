import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="agent-dashboard">
      <h1>Tableau de bord Agent</h1>
      <p>Interface de l'agent de dossier (à implémenter)</p>
    </div>
  `,
  styles: [`
    .agent-dashboard {
      padding: 20px;
    }
  `]
})
export class AgentDashboardComponent {}
