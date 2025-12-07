/**
 * Modèle pour l'historique des recouvrements par phase
 */
export interface HistoriqueRecouvrement {
  id: number;
  dossierId: number;
  phase: 'AMIABLE' | 'JURIDIQUE';
  montantRecouvre: number;
  montantTotalRecouvre: number;
  montantRestant: number;
  typeAction: 'ACTION_AMIABLE' | 'ACTION_HUISSIER' | 'FINALISATION_AMIABLE' | 'FINALISATION_JURIDIQUE';
  actionId?: number | null;
  utilisateurId?: number | null;
  dateEnregistrement: Date | string;
  commentaire?: string | null;
}

/**
 * Résumé des montants recouvrés par phase pour un dossier
 */
export interface ResumeRecouvrement {
  dossierId: number;
  montantRecouvrePhaseAmiable: number;
  montantRecouvrePhaseJuridique: number;
  montantRecouvreTotal: number;
  nombreOperationsAmiable: number;
  nombreOperationsJuridique: number;
  dernierEnregistrement?: {
    date: Date | string;
    montant: number;
    phase: string;
    typeAction: string;
  } | null;
}

/**
 * Statistiques de recouvrement par phase (global ou département)
 */
export interface StatistiquesRecouvrementParPhase {
  montantRecouvrePhaseAmiable: number;
  montantRecouvrePhaseJuridique: number;
  montantRecouvreTotal: number;
  dossiersAvecRecouvrementAmiable: number;
  dossiersAvecRecouvrementJuridique: number;
  tauxRecouvrementAmiable: number;
  tauxRecouvrementJuridique: number;
  tauxRecouvrementTotal: number;
  montantTotalCreances: number;
}

