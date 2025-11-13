import { User } from './user.model';
import { Dossier } from './dossier.model';
import { ValidationStatut } from './enums.model';

// Enum pour les statuts de validation (ValidationEnquete)
export enum StatutValidation {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE'
}

// Réutiliser ValidationStatut pour les statuts d'enquête (même logique que Dossier)
export type StatutEnquete = ValidationStatut;

export interface Enquette {
  // Champs de base
  id?: number;
  rapportCode?: string; // Exemple: CC6008

  // Éléments financiers
  nomElementFinancier?: string;
  pourcentage?: number;
  banqueAgence?: string;
  banques?: string;
  exercices?: string;
  chiffreAffaire?: number;
  resultatNet?: number;
  disponibiliteBilan?: string;

  // Solvabilité
  appreciationBancaire?: string;
  paiementsCouverture?: string;
  reputationCommerciale?: string;
  incidents?: string;

  // Patrimoine débiteur
  bienImmobilier?: string;
  situationJuridiqueImmobilier?: string;
  bienMobilier?: string;
  situationJuridiqueMobilier?: string;

  // Autres affaires & observations
  autresAffaires?: string;
  observations?: string;

  // Décision comité recouvrement
  decisionComite?: string;
  visaDirecteurJuridique?: string;
  visaEnqueteur?: string;
  visaDirecteurCommercial?: string;
  registreCommerce?: string;
  codeDouane?: string;
  matriculeFiscale?: string;
  formeJuridique?: string;
  dateCreation?: string; // Format: YYYY-MM-DD
  capital?: number;

  // Dirigeants
  pdg?: string;
  directeurAdjoint?: string;
  directeurFinancier?: string;
  directeurCommercial?: string;

  // Activité
  descriptionActivite?: string;
  secteurActivite?: string;
  effectif?: number;

  // Informations diverses
  email?: string;
  marques?: string;
  groupe?: string;

  // Relations (IMPORTANT - pour création/modification)
  dossierId?: number; // OBLIGATOIRE pour création - sera automatiquement affecté lors de la sélection du dossier
  agentCreateurId?: number; // ID de l'agent créateur
  agentResponsableId?: number; // ID de l'agent responsable

  // Relations complètes (pour lecture)
  dossier?: Dossier; // Objet complet (optionnel, pour lecture)
  agentCreateur?: User; // Objet complet (optionnel, pour lecture)
  agentResponsable?: User; // Objet complet (optionnel, pour lecture)

  // Propriétés de validation
  valide?: boolean;
  dateValidation?: string; // Format ISO 8601
  commentaireValidation?: string;
  statut?: 'EN_ATTENTE_VALIDATION' | 'VALIDE' | 'REJETE' | ValidationStatut | string;
}

export interface ValidationEnquete {
  id?: number;
  enquete?: Enquette; // Objet Enquette complet (pas juste id)
  enqueteId?: number; // ID de l'enquête pour création
  agentCreateur?: User; // Objet User complet
  agentCreateurId?: number; // ID de l'agent pour création
  chefValidateur?: User | null; // null si pas encore validé/rejeté
  chefValidateurId?: number; // ID du chef pour validation/rejet
  dateValidation?: string | null; // ISO 8601 format, null si EN_ATTENTE
  statut: StatutValidation; // Statut de validation
  commentaires?: string | null; // Commentaires de validation/rejet
  dateCreation?: string; // ISO 8601 format
  dateModification?: string | null; // ISO 8601 format
}

