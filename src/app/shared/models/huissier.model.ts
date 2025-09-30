export class Huissier {
  id: string = '';
  nom: string = '';
  prenom: string = '';
  email: string = '';
  telephone: string = '';
  specialite: string = '';
  adresse: string = '';

  constructor(data?: Partial<Huissier>) {
    Object.assign(this, data);
  }

  getFullName(): string {
    return `${this.prenom} ${this.nom}`;
  }
}
