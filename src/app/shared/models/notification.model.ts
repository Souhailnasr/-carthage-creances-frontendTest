export interface Notification {
  id?: number;
  utilisateur: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  type: TypeNotification;
  titre: string;
  message: string;
  statut: StatutNotification;
  dateCreation: string;
  dateLecture?: string;
  entiteId?: number;
  entiteType?: TypeEntite;
  lienAction?: string;
}

export interface NotificationRequest {
  utilisateur: {
    id: number;
  };
  type: TypeNotification;
  titre: string;
  message: string;
  entiteId?: number;
  entiteType?: TypeEntite;
  lienAction?: string;
}

export enum TypeNotification {
  DOSSIER_CREE = 'DOSSIER_CREE',
  DOSSIER_VALIDE = 'DOSSIER_VALIDE',
  DOSSIER_REJETE = 'DOSSIER_REJETE',
  DOSSIER_EN_ATTENTE = 'DOSSIER_EN_ATTENTE',
  ENQUETE_CREE = 'ENQUETE_CREE',
  ENQUETE_VALIDE = 'ENQUETE_VALIDE',
  ENQUETE_REJETE = 'ENQUETE_REJETE',
  ENQUETE_EN_ATTENTE = 'ENQUETE_EN_ATTENTE',
  TACHE_URGENTE = 'TACHE_URGENTE',
  RAPPEL = 'RAPPEL',
  INFO = 'INFO'
}

export enum StatutNotification {
  NON_LUE = 'NON_LUE',
  LUE = 'LUE'
}

export enum TypeEntite {
  DOSSIER = 'DOSSIER',
  ENQUETE = 'ENQUETE',
  TACHE_URGENTE = 'TACHE_URGENTE',
  ACTION = 'ACTION',
  AUDIENCE = 'AUDIENCE',
  UTILISATEUR = 'UTILISATEUR'
}

export interface NotificationStats {
  total: number;
  nonLues: number;
  parType: { [key in TypeNotification]: number };
}

export interface NotificationFilter {
  statut?: StatutNotification;
  type?: TypeNotification;
  dateDebut?: string;
  dateFin?: string;
  entiteType?: TypeEntite;
}
