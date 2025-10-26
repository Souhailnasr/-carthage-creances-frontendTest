// Interfaces pour les APIs de dossiers
export interface DossierApi {
  id: number;
  titre: string;
  description: string;
  numeroDossier: string;
  montantCreance: number;
  dateCreation: string;
  dateCloture?: string;
  contratSigne?: string;
  pouvoir?: string;
  urgence: Urgence;
  dossierStatus: DossierStatus;
  typeDocumentJustificatif: TypeDocumentJustificatif;
  creancier: CreancierApi;
  debiteur: DebiteurApi;
  agentCreateur?: UtilisateurApi;
  agentResponsable?: UtilisateurApi;
  valide: boolean;
  dateValidation?: string;
  commentaireValidation?: string;
  avocat?: AvocatApi;
  huissier?: HuissierApi;
  avocatId?: number;
  huissierId?: number;
  enquette?: EnquetteApi;
  audiences?: AudienceApi[];
  actions?: ActionApi[];
  finance?: FinanceApi;
}

export interface DossierRequest {
  titre: string;
  description: string;
  numeroDossier: string;
  montantCreance: number;
  contratSigne?: string;
  pouvoir?: string;
  urgence: Urgence;
  typeDocumentJustificatif: TypeDocumentJustificatif;
  agentCreateurId?: number;
  agentResponsableId?: number;
  // Champs pour compatibilité backend (recherche par nom)
  typeCreancier?: string;
  nomCreancier?: string;
  prenomCreancier?: string;
  typeDebiteur?: string;
  nomDebiteur?: string;
  prenomDebiteur?: string;
  // Champs supplémentaires pour le backend
  statut?: string;
  dossierStatus?: string;
  contratSigneFile?: File;
  pouvoirFile?: File;
  contratSigneFilePath?: string;
  pouvoirFilePath?: string;
  codeCreancier?: string;
  codeDebiteur?: string;
  codeCreanceCreancier?: string;
  codeCreanceDebiteur?: string;
}

export interface CreancierApi {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  agentCreateur?: string;
}

export interface DebiteurApi {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  agentCreateur?: string;
}

export interface UtilisateurApi {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  roleUtilisateur: RoleUtilisateur;
  actif: boolean;
}

export interface AvocatApi {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  specialite: string;
}

export interface HuissierApi {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
}

export interface EnquetteApi {
  id: number;
  dossierId: number;
  dateEnquete: string;
  resultat: string;
  observations: string;
  statut: StatutEnquete;
}

export interface AudienceApi {
  id: number;
  dossierId: number;
  dateAudience: string;
  heureAudience: string;
  tribunal: string;
  juge: string;
  statut: StatutAudience;
}

export interface ActionApi {
  id: number;
  dossierId: number;
  typeAction: TypeAction;
  dateAction: string;
  description: string;
  statut: StatutAction;
}

export interface FinanceApi {
  id: number;
  dossierId: number;
  montantRecupere: number;
  fraisJuridiques: number;
  fraisAdministratifs: number;
  datePaiement?: string;
}

// Enums
export enum Urgence {
  FAIBLE = 'FAIBLE',
  MOYENNE = 'MOYENNE',
  TRES_URGENT = 'TRES_URGENT'
}

export enum DossierStatus {
  ENCOURSDETRAITEMENT = 'ENCOURSDETRAITEMENT',
  CLOTURE = 'CLOTURE'
}

export enum TypeDocumentJustificatif {
  CONTRAT = 'CONTRAT',
  FACTURE = 'FACTURE',
  BON_COMMANDE = 'BON_COMMANDE',
  AUTRE = 'AUTRE'
}

export enum RoleUtilisateur {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CHEF_DEPARTEMENT_DOSSIER = 'CHEF_DEPARTEMENT_DOSSIER',
  CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE = 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE',
  CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE = 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE',
  CHEF_DEPARTEMENT_FINANCE = 'CHEF_DEPARTEMENT_FINANCE',
  AGENT_DOSSIER = 'AGENT_DOSSIER',
  AGENT_RECOUVREMENT_AMIABLE = 'AGENT_RECOUVREMENT_AMIABLE',
  AGENT_RECOUVREMENT_JURIDIQUE = 'AGENT_RECOUVREMENT_JURIDIQUE',
  AGENT_FINANCE = 'AGENT_FINANCE'
}

export enum StatutEnquete {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  ANNULEE = 'ANNULEE'
}

export enum StatutAudience {
  PROGRAMMEE = 'PROGRAMMEE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  REPORTEE = 'REPORTEE',
  ANNULEE = 'ANNULEE'
}

export enum StatutAction {
  PLANIFIEE = 'PLANIFIEE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  ANNULEE = 'ANNULEE'
}

export enum TypeAction {
  RELANCE = 'RELANCE',
  MISE_EN_DEMEURE = 'MISE_EN_DEMEURE',
  SAISIE = 'SAISIE',
  AUTRE = 'AUTRE'
}

// Interfaces pour les réponses API
export interface DossierResponse {
  data: DossierApi;
  message: string;
  success: boolean;
}

export interface DossiersResponse {
  data: DossierApi[];
  message: string;
  success: boolean;
  total: number;
}

export interface ValidationRequest {
  dossierId: number;
  chefId: number;
  commentaire?: string;
}

export interface RejetRequest {
  dossierId: number;
  commentaire: string;
}
