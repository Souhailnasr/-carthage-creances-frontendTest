import { Role } from './enums.model';

export class User {
  id: string = '';
  nom: string = '';
  prenom: string = '';
  email: string = '';
  motDePasse: string = ''; // Should not be sent to frontend in real app
  role: Role = Role.AGENT_DOSSIER;
  actif: boolean = true;

  constructor(data?: Partial<User>) {
    Object.assign(this, data);
  }

  getFullName(): string {
    return `${this.prenom} ${this.nom}`;
  }

  // Utility method to check if user has a specific role
  hasRole(role: Role): boolean {
    return this.role === role;
  }
}
