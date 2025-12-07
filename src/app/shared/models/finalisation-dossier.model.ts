/**
 * DTO pour la finalisation d'un dossier (juridique ou amiable)
 */
export interface FinalisationDossierDTO {
  etatFinal: 'RECOUVREMENT_TOTAL' | 'RECOUVREMENT_PARTIEL' | 'NON_RECOUVRE';
  montantRecouvre: number;
}

