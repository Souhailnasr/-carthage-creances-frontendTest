export class Finance {
  id: string = '';
  devise: string = 'TND';
  dateOperation: Date = new Date();
  description: string = '';
  fraisAvocat: number = 0;
  fraisHuissier: number = 0;

  constructor(data?: Partial<Finance>) {
    Object.assign(this, data);
  }

  getTotalFrais(): number {
    return this.fraisAvocat + this.fraisHuissier;
  }

  getFormattedDate(): string {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(this.dateOperation));
  }
}
