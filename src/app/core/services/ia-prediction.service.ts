import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IaPredictionResult } from '../../shared/models/ia-prediction-result.model';
import { Dossier } from '../../shared/models/dossier.model';

@Injectable({
  providedIn: 'root'
})
export class IaPredictionService {
  private apiUrl = 'http://localhost:8089/carthage-creance/api/dossiers';

  constructor(private http: HttpClient) {}

  /**
   * Déclencher une prédiction IA pour un dossier
   * @param dossierId ID du dossier
   * @returns Observable avec les résultats de la prédiction
   */
  /**
   * Déclencher une prédiction IA pour un dossier
   * ⚠️ IMPORTANT : Le backend met maintenant à jour automatiquement le dossier
   * Il faut rafraîchir le dossier après cet appel pour obtenir les valeurs mises à jour
   * 
   * @param dossierId ID du dossier
   * @returns Observable avec les résultats de la prédiction (datePrediction au format ISO string)
   */
  predictForDossier(dossierId: number | string): Observable<IaPredictionResult> {
    const headers = this.getHeaders();
    return this.http.post<IaPredictionResult>(
      `${this.apiUrl}/${dossierId}/predict-ia`,
      {},
      { headers }
    ).pipe(
      map(response => {
        // Le backend retourne datePrediction au format ISO string "2025-12-03T10:30:00"
        // On s'assure que c'est bien une string
        if (response.datePrediction && typeof response.datePrediction !== 'string') {
          // Si c'est un objet Date, le convertir en ISO string
          response.datePrediction = new Date(response.datePrediction).toISOString();
        }
        return response;
      }),
      catchError(error => {
        // Gérer les nouvelles erreurs de validation
        if (error.status === 400) {
          const errorMessage = error.error?.error || 'Le dossier doit avoir un montant de créance valide pour la prédiction';
          console.error('Erreur de validation:', errorMessage);
          return throwError(() => new Error(errorMessage));
        } else if (error.status === 404) {
          const errorMessage = error.error?.error || 'Dossier non trouvé';
          console.error('Dossier non trouvé:', errorMessage);
          return throwError(() => new Error(errorMessage));
        } else {
          console.error('❌ Erreur lors de la prédiction IA:', error);
          return throwError(() => new Error(error.error?.message || 'Erreur lors de la prédiction IA'));
        }
      })
    );
  }

  /**
   * Obtenir la prédiction depuis un dossier (si déjà calculée)
   * @param dossier Dossier avec les champs de prédiction
   * @returns Résultat de prédiction ou null
   */
  getPredictionFromDossier(dossier: Dossier): IaPredictionResult | null {
    if (dossier.etatPrediction && dossier.riskScore !== undefined) {
      return {
        etatFinal: dossier.etatPrediction,
        riskScore: dossier.riskScore,
        riskLevel: dossier.riskLevel || 'Moyen',
        datePrediction: dossier.datePrediction || '' // Format ISO string depuis le backend
      };
    }
    return null;
  }

  /**
   * Vérifier si un dossier a une prédiction IA
   * @param dossier Dossier à vérifier
   * @returns true si le dossier a une prédiction
   */
  hasPrediction(dossier: Dossier): boolean {
    return dossier.etatPrediction !== undefined && 
           dossier.riskScore !== undefined;
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return new HttpHeaders(headers);
  }
}

