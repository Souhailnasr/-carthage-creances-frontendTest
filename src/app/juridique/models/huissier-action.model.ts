export enum TypeActionHuissier {
  ACLA_TA7AFOUDHIA = 'ACLA_TA7AFOUDHIA',   // العقلة التحفظية - Saisie conservatoire
  ACLA_TANFITHIA = 'ACLA_TANFITHIA',     // العقلة التنفيذية - Saisie exécutive
  ACLA_TAW9IFIYA = 'ACLA_TAW9IFIYA',     // العقلة التوقيفية - Saisie de blocage
  ACLA_A9ARYA = 'ACLA_A9ARYA'         // العقلة العقارية - Saisie immobilière
}

export enum EtatDossier {
  EN_COURS = 'EN_COURS',
  CLOTURE = 'CLOTURE',
  SUSPENDU = 'SUSPENDU'
}

export interface ActionHuissier {
  id?: number;
  dossierId: number;
  typeAction: TypeActionHuissier;
  montantRecouvre?: number;
  montantRestant?: number;
  etatDossier?: EtatDossier;
  dateAction?: string;  // ISO string format
  pieceJointeUrl?: string;
  huissierName: string;
}

export interface ActionHuissierDTO {
  dossierId: number;
  typeAction: TypeActionHuissier;
  huissierName: string;
  montantRecouvre?: number;
  montantRestant?: number;
  etatDossier?: string;
  pieceJointeUrl?: string;
  updateMode?: 'ADD' | 'SET';  // Pour la mise à jour des montants
}

