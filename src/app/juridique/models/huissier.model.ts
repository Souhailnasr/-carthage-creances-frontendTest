export interface Huissier {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  numeroOrdre?: string;
  actif: boolean;
  dateCreation?: string;
  dateModification?: string;
}

export interface HuissierRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  numeroOrdre?: string;
  actif: boolean;
}

export class HuissierModel implements Huissier {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  numeroOrdre?: string;
  actif: boolean;
  dateCreation?: string;
  dateModification?: string;

  constructor(data: Partial<Huissier> = {}) {
    this.id = data.id;
    this.nom = data.nom || '';
    this.prenom = data.prenom || '';
    this.email = data.email || '';
    this.telephone = data.telephone;
    this.adresse = data.adresse;
    this.numeroOrdre = data.numeroOrdre;
    this.actif = data.actif ?? true;
    this.dateCreation = data.dateCreation;
    this.dateModification = data.dateModification;
  }

  getFullName(): string {
    return `${this.prenom} ${this.nom}`;
  }

  getInitials(): string {
    return `${this.prenom.charAt(0)}${this.nom.charAt(0)}`.toUpperCase();
  }
}
