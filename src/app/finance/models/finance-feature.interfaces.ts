export interface FinanceMetricCards {
  totalFraisEngages: number;
  montantRecouvre: number;
  fraisRecuperes: number;
  netGenere: number;
}

export interface FinanceFeeCategorySlice {
  categorie: string;
  montant: number;
  pourcentage: number;
}

export interface FinanceMonthlySerie {
  mois: string;
  frais: number;
  recouvre: number;
}

export interface FinanceRoiAgentRow {
  agentId: number;
  agentNom: string;
  montantRecouvre: number;
  fraisEngages: number;
  roi: number;
}

export type FinanceAlertType =
  | 'FRAIS_SUP_40'
  | 'DOSSIER_SANS_RECOUVREMENT'
  | 'DEPASSEMENT_BUDGET';

export interface FinanceAlert {
  id: number;
  type: FinanceAlertType;
  dossierId: number;
  agentId?: number;
  message: string;
  seuil?: number;
  valeurObservee?: number;
  createdAt: string;
}

export interface FinanceDashboardData {
  metrics: FinanceMetricCards;
  repartitionFrais: FinanceFeeCategorySlice[];
  serieMensuelle: FinanceMonthlySerie[];
  roiAgents: FinanceRoiAgentRow[];
  alerts: FinanceAlert[];
}

export type FraisStatut = 'EN_ATTENTE' | 'VALIDE' | 'REJETE';

export interface DossierFraisRow {
  id: number;
  phase: string;
  categorie: string;
  quantite: number;
  tarifUnitaire: number;
  montant: number;
  statut: FraisStatut;
  justificatifUrl?: string;
  demandeur?: string;
  creeLe: string;
}

export interface DossierPhaseSummary {
  phase: string;
  total: number;
  ratioVsDu: number;
  color: 'success' | 'warning' | 'danger';
}

export interface DossierInvoiceHistoryItem {
  factureId: number;
  periode: string;
  montant: number;
  statut: 'GENEREE' | 'ENVOYEE' | 'PAYEE';
  urlPdf?: string;
  creeLe: string;
}

export interface DossierFinanceTabData {
  frais: DossierFraisRow[];
  synthese: DossierPhaseSummary[];
  montantDu: number;
  ratioFraisMontantDu: number;
  factures: DossierInvoiceHistoryItem[];
}

export interface PendingFraisFilter {
  phase?: string;
  agentId?: number;
  montantMin?: number;
  montantMax?: number;
}

export interface PendingFraisItem {
  id: number;
  dossierId: number;
  phase: string;
  categorie: string;
  montant: number;
  demandeur: string;
  justificationUrl?: string;
  creeLe: string;
}

export interface PendingFraisStats {
  totalFrais: number;
  montantTotal: number;
}

export interface TarifItem {
  id: number;
  phase: string;
  categorie: string;
  tarif: number;
  devise: string;
  dateEffet: string;
  dateFin?: string;
  actif: boolean;
}

export interface TarifFormInput {
  phase: string;
  categorie: string;
  tarif: number;
  devise: string;
  dateDebut: string;
  dateFin?: string;
}

export interface TarifVersionHistory {
  version: string;
  auteur: string;
  date: string;
  changements: string;
}

export interface TarifSimulationRequest {
  phase: string;
  categorie: string;
  occurrences: number;
}

export interface TarifSimulationResult {
  coutTotal: number;
  coutUnitaire?: number;
}

export interface FraisImportColumnMapping {
  dossierId: string;
  phase: string;
  categorie: string;
  quantite: string;
  tarifUnitaire: string;
  fournisseur: string;
  date: string;
}

export interface FraisImportPreviewRow {
  dossierId: number;
  phase: string;
  categorie: string;
  quantite: number;
  tarifUnitaire: number;
  fournisseur: string;
  date: string;
  valid?: boolean;
  erreurs?: string[];
}

export interface FraisImportReport {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: { row: number; message: string }[];
}

export type FinanceReportType =
  | 'MENSUEL'
  | 'PAR_CLIENT'
  | 'PAR_AGENT'
  | 'PAR_SECTEUR';

export interface FinanceReportRequest {
  type: FinanceReportType;
  start: string;
  end: string;
  filtreClientId?: number;
  filtreAgentId?: number;
  filtreSecteur?: string;
}

export interface FinanceReportPreview {
  table: unknown[];
  chartSerie: FinanceMonthlySerie[];
}

export interface FinanceReportHistoryItem {
  id: number;
  type: FinanceReportType;
  start: string;
  end: string;
  utilisateur: string;
  createdAt: string;
  urlPdf?: string;
  urlExcel?: string;
}

export type FinanceInsightCategory =
  | 'OPTIMISATION_COUTS'
  | 'RISQUES_DOSSIER'
  | 'PERFORMANCE_AGENT';

export interface FinanceInsight {
  id: number;
  categorie: FinanceInsightCategory;
  message: string;
  actionSuggeree: string;
  dossierId?: number;
  agentId?: number;
  montantPotentiel?: number;
  createdAt: string;
  traite: boolean;
}




