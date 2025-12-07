/**
 * Modèles complets pour les notifications alignés avec le backend
 */

/**
 * Enum pour les types de notifications
 */
export enum TypeNotification {
  // Notifications Dossiers
  DOSSIER_CREE = 'DOSSIER_CREE',
  DOSSIER_VALIDE = 'DOSSIER_VALIDE',
  DOSSIER_REJETE = 'DOSSIER_REJETE',
  DOSSIER_EN_ATTENTE = 'DOSSIER_EN_ATTENTE',
  DOSSIER_AFFECTE = 'DOSSIER_AFFECTE',
  DOSSIER_CLOTURE = 'DOSSIER_CLOTURE',
  
  // Notifications Enquêtes
  ENQUETE_CREE = 'ENQUETE_CREE',
  ENQUETE_VALIDE = 'ENQUETE_VALIDE',
  ENQUETE_REJETE = 'ENQUETE_REJETE',
  ENQUETE_EN_ATTENTE = 'ENQUETE_EN_ATTENTE',
  
  // Notifications Actions
  ACTION_AMIABLE_CREE = 'ACTION_AMIABLE_CREE',
  ACTION_AMIABLE_COMPLETEE = 'ACTION_AMIABLE_COMPLETEE',
  
  // Notifications Audiences
  AUDIENCE_PROCHAINE = 'AUDIENCE_PROCHAINE',
  AUDIENCE_CREE = 'AUDIENCE_CREE',
  AUDIENCE_REPORTEE = 'AUDIENCE_REPORTEE',
  
  // Notifications Tâches
  TACHE_URGENTE = 'TACHE_URGENTE',
  TACHE_AFFECTEE = 'TACHE_AFFECTEE',
  TACHE_COMPLETEE = 'TACHE_COMPLETEE',
  
  // Notifications Utilisateurs
  UTILISATEUR_CREE = 'UTILISATEUR_CREE',
  UTILISATEUR_AFFECTE = 'UTILISATEUR_AFFECTE',
  UTILISATEUR_MODIFIE = 'UTILISATEUR_MODIFIE',
  
  // Notifications Huissier (fusionnées)
  DOCUMENT_HUISSIER_CREE = 'DOCUMENT_HUISSIER_CREE',
  DOCUMENT_HUISSIER_EXPIRE = 'DOCUMENT_HUISSIER_EXPIRE',
  DELAY_WARNING = 'DELAY_WARNING',
  DELAY_EXPIRED = 'DELAY_EXPIRED',
  ACTION_HUISSIER_PERFORMED = 'ACTION_HUISSIER_PERFORMED',
  AMIABLE_RESPONSE_POSITIVE = 'AMIABLE_RESPONSE_POSITIVE',
  AMIABLE_RESPONSE_NEGATIVE = 'AMIABLE_RESPONSE_NEGATIVE',
  AMOUNT_UPDATED = 'AMOUNT_UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  
  // Notifications Générales
  TRAITEMENT_DOSSIER = 'TRAITEMENT_DOSSIER',
  RAPPEL = 'RAPPEL',
  INFO = 'INFO',
  NOTIFICATION_MANUELLE = 'NOTIFICATION_MANUELLE',
  
  // Notifications Hiérarchiques
  NOTIFICATION_CHEF_VERS_AGENT = 'NOTIFICATION_CHEF_VERS_AGENT',
  NOTIFICATION_SUPERADMIN_VERS_CHEF = 'NOTIFICATION_SUPERADMIN_VERS_CHEF',
  NOTIFICATION_SUPERADMIN_VERS_AGENT = 'NOTIFICATION_SUPERADMIN_VERS_AGENT'
}

/**
 * Enum pour les statuts de notifications
 */
export enum StatutNotification {
  NON_LUE = 'NON_LUE',
  LUE = 'LUE'
}

/**
 * Enum pour les types d'entités
 */
export enum TypeEntite {
  DOSSIER = 'DOSSIER',
  ENQUETE = 'ENQUETE',
  ACTION = 'ACTION',
  AUDIENCE = 'AUDIENCE',
  TACHE_URGENTE = 'TACHE_URGENTE',
  UTILISATEUR = 'UTILISATEUR'
}

/**
 * Interface pour une notification
 */
export interface Notification {
  id: number;
  utilisateurId: number;
  utilisateurNom?: string;
  type: TypeNotification;
  titre: string;
  message: string;
  statut: StatutNotification;
  dateCreation: Date | string; // Backend peut retourner string ISO
  dateLecture?: Date | string;
  entiteId?: number;
  entiteType?: TypeEntite;
  lienAction?: string;
}

/**
 * Interface pour créer une notification
 */
export interface CreateNotificationRequest {
  utilisateurId: number;
  type: TypeNotification;
  titre: string;
  message: string;
  entiteId?: number;
  entiteType?: TypeEntite;
  lienAction?: string;
}

/**
 * Interface pour envoyer une notification à plusieurs utilisateurs
 */
export interface SendNotificationMultipleRequest {
  userIds: number[];
  type: TypeNotification;
  titre: string;
  message: string;
  entiteId?: number;
  entiteType?: TypeEntite;
}

/**
 * Interface pour envoyer une notification à tous les agents d'un chef
 */
export interface SendNotificationToAgentsRequest {
  type: TypeNotification;
  titre: string;
  message: string;
  entiteId?: number;
  entiteType?: TypeEntite;
}

/**
 * Réponse pour l'envoi de notifications multiples
 */
export interface SendNotificationResponse {
  count: number;
  message?: string; // Message de succès optionnel (ajouté côté backend)
}

