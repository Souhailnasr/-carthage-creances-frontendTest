export class Avocat {
  id: string = '';
  nom: string = '';
  prenom: string = '';
  email: string = '';
  telephone: string = '';
  specialite: string = '';
  adresse: string = '';

  constructor(data?: Partial<Avocat>) {
    Object.assign(this, data);
  }

  getFullName(): string {
    return `${this.prenom} ${this.nom}`;
  }
}
