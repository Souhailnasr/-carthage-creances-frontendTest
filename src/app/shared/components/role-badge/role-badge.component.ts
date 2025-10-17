import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-role-badge',
  standalone: true,
  template: `
    <span 
      class="role-badge" 
      [class]="getRoleClass()"
      [class.compact]="compact"
      [class.large]="large"
      [class.icon-only]="iconOnly"
      [title]="getRoleDisplayName()"
    >
      {{ getRoleDisplayName() }}
    </span>
  `,
  styleUrls: ['./role-badge.component.scss']
})
export class RoleBadgeComponent {
  @Input() role: string = '';
  @Input() compact: boolean = false;
  @Input() large: boolean = false;
  @Input() iconOnly: boolean = false;

  getRoleClass(): string {
    if (!this.role) return '';
    
    // Normaliser le rôle pour la classe CSS
    const normalizedRole = this.role.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
    return `role-${normalizedRole}`;
  }

  getRoleDisplayName(): string {
    if (!this.role) return '';

    const roleNames: { [key: string]: string } = {
      'SUPER_ADMIN': 'Super Administrateur',
      'CHEF_DEPARTEMENT_DOSSIER': 'Chef Département Dossier',
      'AGENT_DOSSIER': 'Agent de Dossier',
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': 'Chef Département Recouvrement Juridique',
      'AGENT_RECOUVREMENT_JURIDIQUE': 'Agent Recouvrement Juridique',
      'CHEF_DEPARTEMENT_FINANCE': 'Chef Département Finance',
      'AGENT_FINANCE': 'Agent Finance',
      'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE': 'Chef Département Recouvrement Amiable',
      'AGENT_RECOUVREMENT_AMIABLE': 'Agent Recouvrement Amiable'
    };

    return roleNames[this.role] || this.role;
  }

  isChefRole(): boolean {
    return this.role && this.role.includes('CHEF_DEPARTEMENT');
  }

  getRoleIcon(): string {
    if (!this.role) return '';

    const roleIcons: { [key: string]: string } = {
      'SUPER_ADMIN': '👑',
      'CHEF_DEPARTEMENT_DOSSIER': '👑',
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': '⚖️',
      'CHEF_DEPARTEMENT_FINANCE': '💰',
      'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE': '🤝',
      'AGENT_DOSSIER': '📁',
      'AGENT_RECOUVREMENT_JURIDIQUE': '⚖️',
      'AGENT_FINANCE': '💰',
      'AGENT_RECOUVREMENT_AMIABLE': '🤝'
    };

    return roleIcons[this.role] || '👤';
  }
}
