export enum TypeDocumentHuissier {
  PV_MISE_EN_DEMEURE = 'PV_MISE_EN_DEMEURE',           // Procès-verbal de mise en demeure (Phase 1)
  ORDONNANCE_PAIEMENT = 'ORDONNANCE_PAIEMENT',          // Ordonnance de paiement (Phase 2)
  PV_NOTIFICATION_ORDONNANCE = 'PV_NOTIFICATION_ORDONNANCE'   // PV de notification d'ordonnance (Phase 2)
}

export enum StatutDocumentHuissier {
  PENDING = 'PENDING',    // En attente (délai légal non expiré)
  EXPIRED = 'EXPIRED',    // Délai légal expiré
  COMPLETED = 'COMPLETED'   // Complété (action suivante effectuée)
}

export interface DocumentHuissier {
  id?: number;
  dossierId: number;
  typeDocument: TypeDocumentHuissier;
  dateCreation?: string;  // ISO string format
  delaiLegalDays?: number;  // 10 pour PV_MISE_EN_DEMEURE, 20 pour ORDONNANCE_PAIEMENT
  pieceJointeUrl?: string;
  huissierName: string;
  status?: StatutDocumentHuissier;
  notified?: boolean;
}

export interface DocumentHuissierDTO {
  dossierId: number;
  typeDocument: TypeDocumentHuissier;
  huissierName: string;
  pieceJointeUrl?: string;
  pieceJointe?: File;  // Pour l'upload de fichier
}

