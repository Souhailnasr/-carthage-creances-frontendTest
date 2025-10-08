export interface Avocat {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  specialite?: string;
  numeroOrdre?: string;
  actif: boolean;
  dateCreation?: string;
  dateModification?: string;
}

export interface AvocatRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  specialite?: string;
  numeroOrdre?: string;
  actif: boolean;
}

export class AvocatModel implements Avocat {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  specialite?: string;
  numeroOrdre?: string;
  actif: boolean;
  dateCreation?: string;
  dateModification?: string;

  constructor(data: Partial<Avocat> = {}) {
    this.id = data.id;
    this.nom = data.nom || '';
    this.prenom = data.prenom || '';
    this.email = data.email || '';
    this.telephone = data.telephone;
    this.adresse = data.adresse;
    this.specialite = data.specialite;
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
