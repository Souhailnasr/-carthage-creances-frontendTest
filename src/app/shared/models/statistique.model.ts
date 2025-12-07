export class StatistiqueAmiable {
  totalDossiers: number = 0;
  dossiersEnCours: number = 0;
  dossiersClotures: number = 0;
  tauxReussite: number = 0;
  montantRecupere: number = 0;
  montantRecouvre: number = 0; // Alias pour compatibilité
  montantEnCours: number = 0;
  actionsEffectuees: number = 0;
  actionsReussies: number = 0;
  actionsAmiables: number = 0; // Total actions amiables
  actionsAmiablesCompletees: number = 0; // Actions amiables complétées
  coutTotalActions: number = 0;

  constructor(data?: Partial<StatistiqueAmiable>) {
    Object.assign(this, data);
  }

  getFormattedMontantRecupere(): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(this.montantRecupere);
  }

  getFormattedMontantEnCours(): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(this.montantEnCours);
  }

  getFormattedCoutTotal(): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(this.coutTotalActions);
  }
}

export class PerformanceAgent {
  agentId: string = '';
  nomAgent: string = '';
  dossiersAssignes: number = 0;
  dossiersClotures: number = 0;
  tauxReussite: number = 0;
  montantRecupere: number = 0;
  actionsEffectuees: number = 0;
  moyenneTempsTraitement: number = 0; // en jours

  constructor(data?: Partial<PerformanceAgent>) {
    Object.assign(this, data);
  }

  getFormattedMontantRecupere(): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(this.montantRecupere);
  }
}
