import { Role } from './enums.model';

export class User {
  id: string = '';
  nom: string = '';
  prenom: string = '';
  email: string = '';
  role: Role = Role.AGENT_DOSSIER;
  actif: boolean = true;
  motDePasse?: string = '';

  constructor(data?: Partial<User>) {
    Object.assign(this, data);
  }

  getFullName(): string {
    return `${this.prenom} ${this.nom}`;
  }
}
