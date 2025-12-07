/**
 * Modèles complets pour les tâches alignés avec le backend
 */

/**
 * Enum pour les types de tâches
 */
export enum TypeTache {
  ENQUETE = 'ENQUETE',
  RELANCE = 'RELANCE',
  DOSSIER = 'DOSSIER',
  AUDIENCE = 'AUDIENCE',
  ACTION = 'ACTION',
  ACTION_AMIABLE = 'ACTION_AMIABLE',
  VALIDATION = 'VALIDATION',
  TRAITEMENT = 'TRAITEMENT',
  SUIVI = 'SUIVI',
  RAPPEL = 'RAPPEL'
}

/**
 * Enum pour les priorités de tâches
 */
export enum PrioriteTache {
  FAIBLE = 'FAIBLE',
  MOYENNE = 'MOYENNE',
  ELEVEE = 'ELEVEE',
  TRES_URGENTE = 'TRES_URGENTE'
}

/**
 * Enum pour les statuts de tâches
 */
export enum StatutTache {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  ANNULEE = 'ANNULEE'
}

/**
 * Interface pour une tâche urgente (DTO du backend)
 */
export interface TacheUrgente {
  id: number;
  titre: string;
  description?: string;
  type: TypeTache;
  priorite: PrioriteTache;
  statut: StatutTache;
  agentAssignéId: number;
  agentAssignéNom?: string;
  agentAssignéPrenom?: string;
  chefCreateurId: number;
  chefCreateurNom?: string;
  chefCreateurPrenom?: string;
  dateCreation: Date | string; // Backend retourne string ISO
  dateEcheance: Date | string; // Backend retourne string ISO
  dateCompletion?: Date | string;
  dossierId?: number;
  dossierNumero?: string;
  enqueteId?: number;
  commentaires?: string;
  estUrgente: boolean; // Calculé par le backend : échéance dans les 3 jours
  estEnRetard: boolean; // Calculé par le backend : échéance passée
}

/**
 * Interface pour créer une tâche
 */
export interface CreateTacheUrgenteRequest {
  titre: string;
  description?: string;
  type: TypeTache;
  priorite: PrioriteTache;
  agentAssignéId: number;
  dateEcheance: Date | string; // Format ISO string ou Date
  dossierId?: number;
  enqueteId?: number;
}

/**
 * Interface pour mettre à jour une tâche
 */
export interface UpdateTacheUrgenteRequest {
  titre?: string;
  description?: string;
  type?: TypeTache;
  priorite?: PrioriteTache;
  agentAssignéId?: number;
  dateEcheance?: Date | string;
  dossierId?: number;
  enqueteId?: number;
  commentaires?: string;
}

/**
 * Interface pour compléter une tâche
 */
export interface CompleteTacheRequest {
  commentaire?: string;
}

/**
 * Interface pour annuler une tâche
 */
export interface AnnulerTacheRequest {
  raison: string;
}

