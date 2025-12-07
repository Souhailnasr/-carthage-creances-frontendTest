import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Interfaces pour les requêtes et réponses de récupération de mot de passe
 */
export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
}

export interface ValidateTokenResponse {
  valid: boolean;
  message: string;
  error?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
  success: boolean;
  error?: string;
}

export interface ResendResetEmailRequest {
  email: string;
}

export interface ResendResetEmailResponse {
  message: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:8089/carthage-creance'}/api/auth`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Demande de réinitialisation de mot de passe
   * Endpoint : POST /api/auth/forgot-password
   */
  requestPasswordReset(email: string): Observable<ForgotPasswordResponse> {
    const headers = this.getHeaders();
    const body: ForgotPasswordRequest = { email };

    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/forgot-password`, body, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Validation du token de réinitialisation
   * Endpoint : GET /api/auth/reset-password/validate?token={token}
   */
  validateToken(token: string): Observable<ValidateTokenResponse> {
    const headers = this.getHeaders();
    const params = new HttpParams().set('token', token);

    return this.http.get<ValidateTokenResponse>(`${this.apiUrl}/reset-password/validate`, { headers, params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Réinitialisation du mot de passe
   * Endpoint : POST /api/auth/reset-password
   */
  resetPassword(token: string, newPassword: string, confirmPassword: string): Observable<ResetPasswordResponse> {
    const headers = this.getHeaders();
    const body: ResetPasswordRequest = {
      token,
      newPassword,
      confirmPassword
    };

    return this.http.post<ResetPasswordResponse>(`${this.apiUrl}/reset-password`, body, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Renvoyer un email de réinitialisation
   * Endpoint : POST /api/auth/forgot-password/resend
   */
  resendResetEmail(email: string): Observable<ResendResetEmailResponse> {
    const headers = this.getHeaders();
    const body: ResendResetEmailRequest = { email };

    return this.http.post<ResendResetEmailResponse>(`${this.apiUrl}/forgot-password/resend`, body, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur dans PasswordResetService:', error);
    
    let errorMessage = 'Une erreur inconnue est survenue.';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      const status = error.status;
      const message = error.error?.message || error.message || 'Erreur inconnue';
      
      switch (status) {
        case 400:
          errorMessage = message || 'Requête invalide. Veuillez vérifier vos informations.';
          break;
        case 401:
          errorMessage = message || 'Non autorisé. Veuillez vérifier vos identifiants.';
          break;
        case 404:
          errorMessage = message || 'Ressource non trouvée.';
          break;
        case 429:
          errorMessage = message || 'Trop de demandes. Veuillez réessayer dans quelques minutes.';
          break;
        case 500:
          errorMessage = message || 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = message || `Erreur ${status}: ${error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}

