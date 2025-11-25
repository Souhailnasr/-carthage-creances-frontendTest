export type TypeChangementAudit =
  | 'AMOUNT_UPDATE'
  | 'DOCUMENT_CREATE'
  | 'ACTION_CREATE'
  | 'STATUS_UPDATE'
  | 'DOSSIER_UPDATE';

export interface AuditLog {
  id: number;
  dossierId: number;
  userId?: number;
  changeType: TypeChangementAudit;
  before: any;
  after: any;
  timestamp: string;
  description?: string;
}


