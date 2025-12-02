export interface Finance {
  id?: number;
  devise: string;
  dateOperation: Date | string;
  description?: string;
  fraisAvocat?: number;
  fraisHuissier?: number;
  fraisCreationDossier?: number;
  fraisGestionDossier?: number;
  dureeGestionMois?: number;
  coutActionsAmiable?: number;
  coutActionsJuridique?: number;
  nombreActionsAmiable?: number;
  nombreActionsJuridique?: number;
  factureFinalisee?: boolean;
  dateFacturation?: Date | string;
  dossierId?: number;
  dossier?: {
    id: number;
    numeroDossier?: string;
  };
  numeroDossier?: string; // Numéro de dossier direct (si fourni par le backend)
}

export interface FluxFrais {
  id?: number;
  phase: PhaseFrais;
  categorie: string;
  quantite: number;
  tarifUnitaire?: number;
  montant?: number;
  statut: StatutFrais;
  dateAction: Date | string;
  justificatifUrl?: string;
  commentaire?: string;
  dossierId: number;
  actionId?: number;
  enqueteId?: number;
  audienceId?: number;
  avocatId?: number;
  huissierId?: number;
  factureId?: number;
}

export enum PhaseFrais {
  CREATION = 'CREATION',
  AMIABLE = 'AMIABLE',
  ENQUETE = 'ENQUETE',
  JURIDIQUE = 'JURIDIQUE'
}

export enum StatutFrais {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE',
  FACTURE = 'FACTURE',
  PAYE = 'PAYE'
}

export interface Facture {
  id?: number;
  numeroFacture: string;
  dossierId: number;
  periodeDebut?: Date | string;
  periodeFin?: Date | string;
  dateEmission: Date | string;
  dateEcheance?: Date | string;
  montantHT: number;
  montantTTC: number;
  tva: number;
  statut: FactureStatut;
  pdfUrl?: string;
  envoyee: boolean;
  relanceEnvoyee: boolean;
}

export enum FactureStatut {
  BROUILLON = 'BROUILLON',
  EMISE = 'EMISE',
  PAYEE = 'PAYEE',
  EN_RETARD = 'EN_RETARD',
  ANNULEE = 'ANNULEE'
}

export interface Paiement {
  id?: number;
  factureId: number;
  datePaiement: Date | string;
  montant: number;
  modePaiement: ModePaiement;
  reference?: string;
  statut: StatutPaiement;
  commentaire?: string;
}

export interface SoldeFactureDTO {
  factureId: number;
  montantTTC: number;
  totalPaiementsValides: number;
  soldeRestant: number;
  estEntierementPayee: boolean;
}

export enum ModePaiement {
  VIREMENT = 'VIREMENT',
  CHEQUE = 'CHEQUE',
  ESPECES = 'ESPECES',
  TRAITE = 'TRAITE',
  AUTRE = 'AUTRE'
}

export enum StatutPaiement {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  REFUSE = 'REFUSE'
}

export interface TarifCatalogue {
  id?: number;
  phase: PhaseFrais;
  categorie: string;
  description?: string;
  fournisseur?: string;
  tarifUnitaire: number;
  devise: string;
  dateDebut: Date | string;
  dateFin?: Date | string;
  actif: boolean;
}

export interface DetailFacture {
  fraisCreationDossier: number;
  fraisEnquete?: number;  // Frais d'enquête (300 TND fixe + traitements variables)
  coutGestionTotal: number;
  coutActionsAmiable: number;
  coutActionsJuridique: number;
  fraisAvocat: number;
  fraisHuissier: number;
  commissionAmiable?: number;
  commissionJuridique?: number;
  commissionRelance?: number;
  commissionInterets?: number;
  totalFacture: number;
}

export interface ValidationFraisDTO {
  commentaire?: string;
}

export interface StatistiquesCouts {
  totalFraisCreation: number;
  totalFraisGestion: number;
  totalActionsAmiable: number;
  totalActionsJuridique: number;
  totalAvocat: number;
  totalHuissier: number;
  grandTotal: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ========== NOUVELLES INTERFACES POUR GESTION TARIFS DOSSIER ==========

export interface TarifDossierDTO {
  id?: number;
  dossierId: number;
  phase: PhaseFrais;
  categorie: string;
  typeElement: string;
  coutUnitaire: number;
  quantite: number;
  montantTotal: number;
  statut: StatutTarif;
  dateCreation?: Date | string;
  dateValidation?: Date | string;
  commentaire?: string;
  documentHuissierId?: number;
  actionHuissierId?: number;
  audienceId?: number;
  actionAmiableId?: number;
  enqueteId?: number;
}

export interface TarifDossierRequest {
  phase: PhaseFrais;
  categorie: string;
  typeElement: string;
  coutUnitaire: number;
  quantite?: number;
  commentaire?: string;
  elementId?: number; // ID de l'élément lié (action, document, audience, etc.)
}

export enum StatutTarif {
  EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE'
}

export enum StatutValidationTarifs {
  EN_COURS = 'EN_COURS',
  TARIFS_CREATION_VALIDES = 'TARIFS_CREATION_VALIDES',
  TARIFS_ENQUETE_VALIDES = 'TARIFS_ENQUETE_VALIDES',
  TARIFS_AMIABLE_VALIDES = 'TARIFS_AMIABLE_VALIDES',
  TARIFS_JURIDIQUE_VALIDES = 'TARIFS_JURIDIQUE_VALIDES',
  TOUS_TARIFS_VALIDES = 'TOUS_TARIFS_VALIDES',
  FACTURE_GENEREE = 'FACTURE_GENEREE'
}

export interface TraitementDTO {
  type: string;
  date: Date | string;
  fraisFixe?: number;
  tarifExistant?: TarifDossierDTO | null;
  statut: string;
}

export interface TraitementPossibleDTO {
  type: string;
  libelle: string;
  tarifExistant: TarifDossierDTO | null;
  statut: string;
  selected?: boolean; // Pour le frontend
  coutUnitaire?: number; // Pour le frontend
  quantite?: number; // Pour le frontend
  commentaire?: string; // Pour le frontend
}

export interface PhaseCreationDTO {
  traitements: TraitementDTO[];
}

export interface PhaseEnqueteDTO {
  enquetePrecontentieuse: TraitementDTO;
  traitementsPossibles: TraitementPossibleDTO[];
}

export interface ActionAmiableDTO {
  id: number;
  type: string;
  date: Date | string;
  occurrences: number;
  coutUnitaire?: number;
  tarifExistant?: TarifDossierDTO | null;
  statut: string;
}

export interface PhaseAmiableDTO {
  actions: ActionAmiableDTO[];
  commissions?: CommissionDTO[];
}

export interface DocumentHuissierDTO {
  id: number;
  type: string;
  date: Date | string;
  coutUnitaire?: number;
  tarifExistant?: TarifDossierDTO | null;
  statut: string;
}

export interface ActionHuissierDTO {
  id: number;
  type: string;
  date: Date | string;
  coutUnitaire?: number;
  tarifExistant?: TarifDossierDTO | null;
  statut: string;
}

export interface AudienceDTO {
  id: number;
  date: Date | string;
  type: string;
  avocatId?: number;
  avocatNom?: string;
  coutAudience?: number;
  coutAvocat?: number;
  tarifAudience?: TarifDossierDTO | null;
  tarifAvocat?: TarifDossierDTO | null;
  statut: string;
}

export interface PhaseJuridiqueDTO {
  documentsHuissier: DocumentHuissierDTO[];
  actionsHuissier: ActionHuissierDTO[];
  audiences: AudienceDTO[];
  fraisFixes?: FraisFixeDTO[];
  commissions?: CommissionDTO[];
}

export interface FraisFixeDTO {
  type: string;
  libelle: string;
  montant: number;
  tarifExistant?: TarifDossierDTO | null;
  statut: string;
}

export interface CommissionDTO {
  type: string;
  libelle: string;
  taux: number;
  montant: number;
  tarifExistant?: TarifDossierDTO | null;
  statut: string;
}

export interface TraitementsDossierDTO {
  phaseCreation?: PhaseCreationDTO;
  phaseEnquete?: PhaseEnqueteDTO;
  phaseAmiable?: PhaseAmiableDTO;
  phaseJuridique?: PhaseJuridiqueDTO;
}

export interface ValidationEtatDTO {
  dossierId: number;
  statutGlobal: string;
  phases: {
    [key: string]: {
      statut: string;
      tarifsTotal: number;
      tarifsValides: number;
    };
  };
  peutGenererFacture: boolean;
}

export interface FactureDetailDTO {
  facture: Facture;
  detail: {
    fraisCreation: number;
    fraisEnquete: number;
    fraisAmiable: number;
    fraisJuridique: number;
    commissionsAmiable: number;
    commissionsJuridique: number;
    totalHT: number;
    tva: number;
    totalTTC: number;
  };
}

