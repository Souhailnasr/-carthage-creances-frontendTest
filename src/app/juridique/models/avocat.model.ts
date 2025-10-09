export interface Avocat {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  adresse?: string | null;
  specialite?: string | null;
  numeroOrdre?: string | null;
  actif: boolean;
  dateCreation?: string | null;
  dateModification?: string | null;
}

export interface AvocatRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string; // exactly 8 digits required by backend
  adresse?: string | null;
  specialite?: string | null;
}

export class AvocatModel implements Avocat {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  adresse?: string | null;
  specialite?: string | null;
  numeroOrdre?: string | null;
  actif: boolean;
  dateCreation?: string | null;
  dateModification?: string | null;

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

  toRequest(): AvocatRequest {
    return {
      nom: this.nom.trim(),
      prenom: this.prenom.trim(),
      email: this.email.trim().toLowerCase(),
      telephone: (this.telephone || '').replace(/\D/g, ''),
      adresse: this.adresse?.trim() || null,
      specialite: this.specialite?.trim() || null,
      
    };
  }

  static fromPartial(data: Partial<Avocat>): AvocatModel {
    return new AvocatModel(data);
  }
}
