import { User } from './user.model';
import { Dossier } from './dossier.model';

export enum StatutValidation {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE'
}

export interface ValidationDossier {
  id: number;
  dossier: Dossier;
  agentCreateur: User;
  chefValidateur?: User;
  dateValidation?: Date;
  statut: StatutValidation;
  commentaires?: string;
  dateCreation: Date;
  dateModification?: Date;
}

export interface ValidationDossierRequest {
  dossierId: number;
  agent_createur_id: number;
  commentaires?: string;
}

export interface ValidationDossierResponse {
  id: number;
  dossier: {
    id: number;
    titre: string;
    numeroDossier: string;
    montantCreance: number;
  };
  agentCreateur: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  chefValidateur?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  dateValidation?: string;
  statut: StatutValidation;
  commentaires?: string;
  dateCreation: string;
  dateModification?: string;
}

export interface ValidationStats {
  total: number;
  enAttente: number;
  valides: number;
  rejetes: number;
  parAgent: { [agentId: number]: number };
  parChef: { [chefId: number]: number };
}

export interface ValidationFilter {
  statut?: StatutValidation;
  agentId?: number;
  chefId?: number;
  dossierId?: number;
  dateDebut?: Date;
  dateFin?: Date;
  searchTerm?: string;
}




