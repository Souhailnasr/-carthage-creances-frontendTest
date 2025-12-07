/**
 * Interface pour les résultats de prédiction IA
 * Alignée avec le backend qui retourne datePrediction au format ISO string "2025-12-03T10:30:00"
 */
export interface IaPredictionResult {
  etatFinal: 'RECOVERED_TOTAL' | 'RECOVERED_PARTIAL' | 'NOT_RECOVERED';
  riskScore: number; // 0-100
  riskLevel: 'Faible' | 'Moyen' | 'Élevé';
  datePrediction: string; // Format ISO "2025-12-03T10:30:00"
}

/**
 * Helper pour formater la date de prédiction
 */
export function formatPredictionDate(datePrediction: string | null | undefined): string {
  if (!datePrediction) return 'Non disponible';
  
  try {
    const date = new Date(datePrediction);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Date invalide';
  }
}

/**
 * Interface pour les données de prédiction dans un dossier
 */
export interface DossierPrediction {
  etatPrediction?: 'RECOVERED_TOTAL' | 'RECOVERED_PARTIAL' | 'NOT_RECOVERED';
  riskScore?: number;
  riskLevel?: 'Faible' | 'Moyen' | 'Élevé';
  datePrediction?: string; // Format ISO string depuis le backend
}

