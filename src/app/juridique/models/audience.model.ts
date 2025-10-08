export enum TribunalType {
  TRIBUNAL_PREMIERE_INSTANCE = 'TRIBUNAL_PREMIERE_INSTANCE',
  TRIBUNAL_APPEL = 'TRIBUNAL_APPEL',
  TRIBUNAL_CASSATION = 'TRIBUNAL_CASSATION'
}

export enum DecisionResult {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  RAPPORTER = 'RAPPORTER'
}

export interface Audience {
  id?: number;
  dossierId: number;
  avocatId?: number;
  huissierId?: number;
  dateAudience: string;
  dateProchaine?: string;
  tribunalType: TribunalType;
  lieuTribunal: string;
  commentaireDecision?: string;
  decisionResult?: DecisionResult;
  actif: boolean;
  dateCreation?: string;
  dateModification?: string;
}

export interface AudienceRequest {
  dossierId: number;
  avocatId?: number;
  huissierId?: number;
  dateAudience: string;
  dateProchaine?: string;
  tribunalType: TribunalType;
  lieuTribunal: string;
  commentaireDecision?: string;
  decisionResult?: DecisionResult;
  actif: boolean;
}

export class AudienceModel implements Audience {
  id?: number;
  dossierId: number;
  avocatId?: number;
  huissierId?: number;
  dateAudience: string;
  dateProchaine?: string;
  tribunalType: TribunalType;
  lieuTribunal: string;
  commentaireDecision?: string;
  decisionResult?: DecisionResult;
  actif: boolean;
  dateCreation?: string;
  dateModification?: string;

  constructor(data: Partial<Audience> = {}) {
    this.id = data.id;
    this.dossierId = data.dossierId || 0;
    this.avocatId = data.avocatId;
    this.huissierId = data.huissierId;
    this.dateAudience = data.dateAudience || '';
    this.dateProchaine = data.dateProchaine;
    this.tribunalType = data.tribunalType || TribunalType.TRIBUNAL_PREMIERE_INSTANCE;
    this.lieuTribunal = data.lieuTribunal || '';
    this.commentaireDecision = data.commentaireDecision;
    this.decisionResult = data.decisionResult;
    this.actif = data.actif ?? true;
    this.dateCreation = data.dateCreation;
    this.dateModification = data.dateModification;
  }

  getTribunalTypeDisplayName(): string {
    const typeNames: { [key in TribunalType]: string } = {
      [TribunalType.TRIBUNAL_PREMIERE_INSTANCE]: 'Tribunal de Première Instance',
      [TribunalType.TRIBUNAL_APPEL]: 'Tribunal d\'Appel',
      [TribunalType.TRIBUNAL_CASSATION]: 'Tribunal de Cassation'
    };
    return typeNames[this.tribunalType] || this.tribunalType;
  }

  getDecisionResultDisplayName(): string {
    if (!this.decisionResult) return 'Non défini';
    
    const resultNames: { [key in DecisionResult]: string } = {
      [DecisionResult.POSITIVE]: 'Positive',
      [DecisionResult.NEGATIVE]: 'Négative',
      [DecisionResult.RAPPORTER]: 'Rapporter'
    };
    return resultNames[this.decisionResult] || this.decisionResult;
  }

  getDecisionResultClass(): string {
    if (!this.decisionResult) return 'decision-undefined';
    
    const classNames: { [key in DecisionResult]: string } = {
      [DecisionResult.POSITIVE]: 'decision-positive',
      [DecisionResult.NEGATIVE]: 'decision-negative',
      [DecisionResult.RAPPORTER]: 'decision-rapporter'
    };
    return classNames[this.decisionResult] || 'decision-undefined';
  }
}
