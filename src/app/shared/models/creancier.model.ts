export class Creancier {
  id: number = 0;
  codeCreancier: string = '';
  codeCreance: string = '';
  nom: string = '';
  prenom: string = '';
  adresse: string = '';
  ville: string = '';
  codePostal: string = '';
  telephone: string = '';
  fax: string = '';
  email: string = '';
  agentCreateur: string = '';

  constructor(data?: Partial<Creancier>) {
    Object.assign(this, data);
  }

  getFullName(): string {
    return this.prenom ? `${this.prenom} ${this.nom}` : this.nom;
  }

  getFullAddress(): string {
    return `${this.adresse}, ${this.codePostal} ${this.ville}`;
  }
}
