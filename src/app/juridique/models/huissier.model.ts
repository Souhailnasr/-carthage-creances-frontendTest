export interface Huissier {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  adresse: string | null;
  specialite: string | null;
  numeroOrdre: string | null;
  dateCreation?: string;
  dateModification?: string;
}

export interface HuissierRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string; // 8 chiffres
  adresse?: string | null;
  specialite?: string | null;
}

export class HuissierModel implements Huissier {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  adresse: string | null;
  specialite: string | null;
  numeroOrdre: string | null;
  dateCreation?: string;
  dateModification?: string;

  constructor(huissier: Partial<Huissier> = {}) {
    this.id = huissier.id;
    this.nom = huissier.nom || '';
    this.prenom = huissier.prenom || '';
    this.email = huissier.email || '';
    this.telephone = huissier.telephone || null;
    this.adresse = huissier.adresse || null;
    this.specialite = huissier.specialite || null;
    this.numeroOrdre = huissier.numeroOrdre || null;
    this.dateCreation = huissier.dateCreation;
    this.dateModification = huissier.dateModification;
  }

  get fullName(): string {
    return `${this.prenom} ${this.nom}`.trim();
  }

  get initials(): string {
    const firstInitial = this.prenom ? this.prenom.charAt(0).toUpperCase() : '';
    const lastInitial = this.nom ? this.nom.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  }

  get displayPhone(): string {
    if (!this.telephone) return 'Non renseigné';
    return this.telephone;
  }

  get displayAddress(): string {
    return this.adresse || 'Non renseignée';
  }

  get displaySpecialty(): string {
    return this.specialite || 'Non renseignée';
  }

  toRequest(): HuissierRequest {
    return {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      telephone: (this.telephone || '').replace(/\D/g, ''), // Clean phone for backend
      adresse: this.adresse,
      specialite: this.specialite,
    };
  }

  static fromPartial(partial: Partial<Huissier>): HuissierModel {
    return new HuissierModel(partial);
  }
}