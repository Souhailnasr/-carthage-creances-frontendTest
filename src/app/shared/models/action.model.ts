import { TypeAction, ReponseDebiteur } from './enums.model';

export class Action {
  id: string = '';
  type: TypeAction = TypeAction.APPEL;
  dateAction: Date = new Date();
  nbOccurrences: number = 0;
  coutUnitaire: number = 0;
  reponseDebiteur: ReponseDebiteur = ReponseDebiteur.EN_ATTENTE;
  dossierId: string = '';
  agentId: string = '';
  commentaire?: string = '';

  constructor(data?: Partial<Action>) {
    Object.assign(this, data);
  }

  getTotalCost(): number {
    return this.nbOccurrences * this.coutUnitaire;
  }

  getFormattedDate(): string {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(this.dateAction));
  }

  getFormattedCost(): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(this.coutUnitaire);
  }
}
