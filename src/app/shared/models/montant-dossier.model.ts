export type EtatDossierRecouvrement = 'RECOVERED_TOTAL' | 'RECOVERED_PARTIAL' | 'NOT_RECOVERED';

export interface MontantDossierDTO {
  montantTotal?: number;
  montantRecouvre?: number;
  updateMode: 'ADD' | 'SET';
}


