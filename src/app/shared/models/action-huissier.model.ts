export type TypeActionHuissier =
  | 'ACLA_TA7AFOUDHIA'
  | 'ACLA_TANFITHIA'
  | 'ACLA_TAW9IFIYA'
  | 'ACLA_A9ARYA';

export interface ActionHuissier {
  id: number;
  dossierId: number;
  typeAction: TypeActionHuissier;
  montantRecouvre?: number;
  montantRestant?: number;
  etatDossier?: 'RECOVERED_TOTAL' | 'RECOVERED_PARTIAL' | 'NOT_RECOVERED';
  dateAction: string;
  pieceJointeUrl?: string;
  huissierName: string;
}

export interface ActionHuissierDTO {
  dossierId: number;
  typeAction: TypeActionHuissier;
  montantRecouvre?: number;
  huissierName: string;
  pieceJointeUrl?: string;
  updateMode?: 'ADD' | 'SET';
}


