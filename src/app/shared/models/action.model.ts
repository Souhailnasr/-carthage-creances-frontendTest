import { TypeAction } from './enums.model';

export class Action {
  id: string = '';
  type: TypeAction = TypeAction.APPEL_TELEPHONIQUE;
  dateAction: Date = new Date();
  nbOccurrences: number = 0;
  coutUnitaire: number = 0;

  constructor(data?: Partial<Action>) {
    Object.assign(this, data);
  }

  getTotalCost(): number {
    return this.nbOccurrences * this.coutUnitaire;
  }

  getFormattedDate(): string {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(this.dateAction));
  }
}
