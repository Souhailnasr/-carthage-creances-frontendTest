import { Component } from '@angular/core';
import { RoleBadgeComponent } from './role-badge.component';

@Component({
  selector: 'app-role-badge-demo',
  standalone: true,
  imports: [RoleBadgeComponent],
  template: `
    <div class="role-badge-demo">
      <h2>Démonstration des Badges de Rôles</h2>
      
      <div class="demo-section">
        <h3>Chefs de Département</h3>
        <div class="badge-grid">
          <app-role-badge role="CHEF_DEPARTEMENT_DOSSIER"></app-role-badge>
          <app-role-badge role="CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE"></app-role-badge>
          <app-role-badge role="CHEF_DEPARTEMENT_FINANCE"></app-role-badge>
          <app-role-badge role="CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE"></app-role-badge>
        </div>
      </div>

      <div class="demo-section">
        <h3>Agents</h3>
        <div class="badge-grid">
          <app-role-badge role="AGENT_DOSSIER"></app-role-badge>
          <app-role-badge role="AGENT_RECOUVREMENT_JURIDIQUE"></app-role-badge>
          <app-role-badge role="AGENT_FINANCE"></app-role-badge>
          <app-role-badge role="AGENT_RECOUVREMENT_AMIABLE"></app-role-badge>
        </div>
      </div>

      <div class="demo-section">
        <h3>Super Admin</h3>
        <div class="badge-grid">
          <app-role-badge role="SUPER_ADMIN"></app-role-badge>
        </div>
      </div>

      <div class="demo-section">
        <h3>Variantes de Taille</h3>
        <div class="badge-grid">
          <app-role-badge role="CHEF_DEPARTEMENT_DOSSIER" [compact]="true"></app-role-badge>
          <app-role-badge role="CHEF_DEPARTEMENT_DOSSIER"></app-role-badge>
          <app-role-badge role="CHEF_DEPARTEMENT_DOSSIER" [large]="true"></app-role-badge>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .role-badge-demo {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .demo-section {
      margin-bottom: 2rem;
      
      h3 {
        color: #2c3e50;
        margin-bottom: 1rem;
        border-bottom: 2px solid #3498db;
        padding-bottom: 0.5rem;
      }
    }

    .badge-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }
  `]
})
export class RoleBadgeDemoComponent {
  // Composant de démonstration pour tester les badges de rôles
}










