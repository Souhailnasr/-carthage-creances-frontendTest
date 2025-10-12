import { StatutTache } from './enums.model';

export class Tache {
  id: string = '';
  titre: string = '';
  description: string = '';
  dateCreation: Date = new Date();
  dateEcheance?: Date;
  statut: StatutTache = StatutTache.EN_ATTENTE;
  agentId: string = '';
  chefId: string = '';
  dossierId?: string = '';
  priorite: 'FAIBLE' | 'MOYENNE' | 'ELEVEE' = 'MOYENNE';

  constructor(data?: Partial<Tache>) {
    Object.assign(this, data);
  }

  getFormattedDateCreation(): string {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(this.dateCreation));
  }

  getFormattedDateEcheance(): string {
    if (!this.dateEcheance) return 'Non définie';
    return new Intl.DateTimeFormat('fr-FR').format(new Date(this.dateEcheance));
  }

  isEnRetard(): boolean {
    if (!this.dateEcheance || this.statut === StatutTache.TERMINEE) return false;
    return new Date() > new Date(this.dateEcheance);
  }
}
