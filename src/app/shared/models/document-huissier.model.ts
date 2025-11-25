export type TypeDocumentHuissier =
  | 'PV_MISE_EN_DEMEURE'
  | 'ORDONNANCE_PAIEMENT'
  | 'PV_NOTIFICATION_ORDONNANCE';

export type StatutDocumentHuissier = 'PENDING' | 'EXPIRED' | 'COMPLETED';

export interface DocumentHuissier {
  id: number;
  dossierId: number;
  typeDocument: TypeDocumentHuissier;
  dateCreation: string;
  delaiLegalDays: number;
  pieceJointeUrl?: string;
  huissierName: string;
  status: StatutDocumentHuissier;
  notified: boolean;
}

export interface DocumentHuissierDTO {
  dossierId: number;
  typeDocument: TypeDocumentHuissier;
  huissierName: string;
  pieceJointeUrl?: string;
  dateCreation?: string;
  delaiLegalDays?: number;
}


