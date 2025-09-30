export class Debiteur {
  id: number = 0;
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

  constructor(data?: Partial<Debiteur>) {
    Object.assign(this, data);
  }

  getFullName(): string {
    return `${this.prenom} ${this.nom}`;
  }

  getFullAddress(): string {
    return `${this.adresse}, ${this.codePostal} ${this.ville}`;
  }
}
