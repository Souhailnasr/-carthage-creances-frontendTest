/**
 * Modèles complets pour les statistiques alignés avec le backend
 */

/**
 * Interface pour les statistiques globales (SuperAdmin uniquement)
 */
export interface StatistiquesGlobales {
  totalDossiers: number;
  dossiersEnCours: number;
  dossiersValides: number;
  dossiersRejetes: number;
  dossiersClotures: number;
  dossiersCreesCeMois: number;
  dossiersPhaseCreation: number;
  dossiersPhaseEnquete: number;
  dossiersPhaseAmiable: number;
  dossiersPhaseJuridique: number;
  enquetesCompletees: number;
  enquetesEnCours?: number; // ✅ NOUVEAU : Enquêtes en cours (calculé par le backend)
  actionsAmiables: number;
  actionsAmiablesCompletees: number;
  documentsHuissierCrees: number;
  documentsHuissierCompletes: number;
  actionsHuissierCrees: number;
  actionsHuissierCompletes: number;
  audiencesTotales: number;
  audiencesProchaines: number;
  tachesCompletees: number;
  tachesEnCours: number;
  tachesEnRetard: number;
  tauxReussiteGlobal: number;
  montantRecouvre: number;
  montantEnCours: number;
  montantRecouvrePhaseAmiable?: number; // ✅ NOUVEAU : Montant recouvré en phase amiable
  montantRecouvrePhaseJuridique?: number; // ✅ NOUVEAU : Montant recouvré en phase juridique
}

/**
 * Interface pour les statistiques d'un agent
 */
export interface StatistiquesAgent {
  agentId: number;
  agentNom: string;
  agentPrenom?: string;
  dossiersTraites: number;
  dossiersValides: number;
  dossiersClotures: number;
  enquetesCompletees: number;
  actionsAmiables: number;
  documentsHuissier: number;
  actionsHuissier: number;
  audiences: number;
  taches: number;
  tachesCompletees: number;
  montantRecouvre: number;
  montantEnCours: number;
  tauxReussite: number;
}

/**
 * Interface pour les statistiques d'un chef et de ses agents
 */
export interface StatistiquesChef {
  chef: StatistiquesAgent;
  agents: StatistiquesAgent[];
  totalDossiersDepartement: number;
  nombreAgents: number;
}

/**
 * Interface pour les statistiques des dossiers
 */
export interface StatistiquesDossiers {
  parStatut: { [key: string]: number };
  parTypeRecouvrement: { [key: string]: number };
  parUrgence: { [key: string]: number };
}

/**
 * Interface pour les statistiques des actions amiables
 */
export interface StatistiquesActionsAmiables {
  total: number;
  completees: number;
  enCours: number;
  tauxReussite: number;
}

/**
 * Interface pour les statistiques des audiences
 */
export interface StatistiquesAudiences {
  total: number;
  prochaines: number;
  passees: number;
}

/**
 * Interface pour les statistiques des tâches
 */
export interface StatistiquesTaches {
  total: number;
  enAttente: number;
  enCours: number;
  terminees: number;
  annulees: number;
  enRetard: number;
}

/**
 * Interface pour les statistiques financières
 */
export interface StatistiquesFinancieres {
  montantRecouvre: number;
  montantEnCours: number;
  totalFraisEngages: number;
  fraisRecuperes: number;
  netGenere: number;
  montantRecouvrePhaseAmiable?: number; // ✅ NOUVEAU : Montant recouvré en phase amiable
  montantRecouvrePhaseJuridique?: number; // ✅ NOUVEAU : Montant recouvré en phase juridique
  totalFactures?: number; // ✅ NOUVEAU : Total des factures
  facturesPayees?: number; // ✅ NOUVEAU : Factures payées
  facturesEnAttente?: number; // ✅ NOUVEAU : Factures en attente
  totalPaiements?: number; // ✅ NOUVEAU : Total des paiements
  paiementsCeMois?: number; // ✅ NOUVEAU : Paiements ce mois
}

/**
 * Interface pour les statistiques de recouvrement par phase
 */
export interface StatistiquesRecouvrementParPhase {
  montantRecouvrePhaseAmiable: number;
  montantRecouvrePhaseJuridique: number;
  montantRecouvreTotal: number;
  dossiersAvecRecouvrementAmiable: number;
  dossiersAvecRecouvrementJuridique: number;
  tauxRecouvrementAmiable: number;
  tauxRecouvrementJuridique: number;
  tauxRecouvrementTotal: number;
  montantTotalCreances: number;
}

/**
 * Réponse pour les statistiques de tous les chefs
 */
export interface StatistiquesTousChefs {
  chefs: StatistiquesChef[];
  nombreChefs: number;
}

