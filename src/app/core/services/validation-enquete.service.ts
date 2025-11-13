import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ValidationEnquete, StatutValidation } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ValidationEnqueteService {
  private readonly API_URL = `${environment.apiUrl}/api/validation/enquetes`;

  constructor(private http: HttpClient) {}

  /**
   * Crée une nouvelle validation d'enquête
   * POST /api/validation/enquetes
   */
  createValidationEnquete(validation: Partial<ValidationEnquete>): Observable<ValidationEnquete> {
    // Le backend n'accepte pas enqueteId directement, on envoie un objet enquete minimal
    // Le backend n'accepte PAS agentCreateurId non plus selon l'erreur "Unrecognized field agentCreateurId"
    // Le backend attend probablement juste l'objet enquete
    const payload: any = {};
    
    // Si enqueteId est présent, le convertir en objet enquete
    if (validation.enqueteId && !validation.enquete) {
      payload.enquete = { id: validation.enqueteId };
    } else if (validation.enquete) {
      payload.enquete = { id: validation.enquete.id || validation.enquete };
    }
    
    // Ajouter le statut si fourni
    if (validation.statut) {
      payload.statut = validation.statut;
    }
    
    // NE PAS envoyer agentCreateurId - le backend le déduit probablement de l'enquête
    // NE PAS envoyer les objets complets
    // Le backend créera automatiquement la ValidationEnquete avec les bonnes relations
    
    console.log('📤 Envoi de la requête POST à:', this.API_URL);
    console.log('📦 Payload nettoyé pour ValidationEnquete (sans agentCreateurId):', JSON.stringify(payload, null, 2));
    
    return this.http.post<ValidationEnquete>(this.API_URL, payload)
      .pipe(
        catchError(error => {
          console.error('❌ Erreur lors de la création de la validation:', error);
          
          // Gestion spécifique des erreurs
          if (error.status === 500) {
            const errorMessage = error.error?.message || error.error?.error || 'Erreur serveur lors de la création de la validation';
            console.error('❌ Erreur 500 - Message du backend:', errorMessage);
            
            // Vérifier si l'erreur concerne un champ non reconnu
            if (errorMessage.includes('enqueteId') || errorMessage.includes('Unrecognized field')) {
              console.error('❌ Erreur: enqueteId non reconnu, le backend attend un objet enquete');
            }
            if (errorMessage.includes('Utilisateur') || errorMessage.includes('agentCreateurId')) {
              console.error('❌ Erreur: agentCreateurId invalide ou Utilisateur non trouvé');
            }
          } else if (error.status === 400) {
            const errorMessage = error.error?.message || 'Données invalides';
            console.error('❌ Erreur 400 - Données invalides:', errorMessage);
          } else if (error.status === 404) {
            console.error('❌ Erreur 404 - Ressource non trouvée');
          }
          
          // Extraire le message d'erreur détaillé du backend
          const detailedMessage = this.extractErrorMessage(error);
          return throwError(() => new Error(detailedMessage));
        })
      );
  }

  /**
   * Met à jour une validation d'enquête (seulement si statut EN_ATTENTE)
   * PUT /api/validation/enquetes/{id}
   */
  updateValidationEnquete(id: number, validation: Partial<ValidationEnquete>): Observable<ValidationEnquete> {
    return this.http.put<ValidationEnquete>(`${this.API_URL}/${id}`, validation)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la mise à jour de la validation ${id}:`, error);
          // Extraire le message d'erreur détaillé du backend
          const detailedMessage = this.extractErrorMessage(error);
          return throwError(() => new Error(detailedMessage));
        })
      );
  }

  /**
   * Supprime une validation d'enquête
   * DELETE /api/validation/enquetes/{id}
   */
  deleteValidationEnquete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la suppression de la validation ${id}:`, error);
          // Extraire le message d'erreur détaillé du backend
          const detailedMessage = this.extractErrorMessage(error);
          return throwError(() => new Error(detailedMessage));
        })
      );
  }

  /**
   * Récupère une validation par son ID
   * GET /api/validation/enquetes/{id}
   */
  getValidationEnqueteById(id: number): Observable<ValidationEnquete> {
    return this.http.get<ValidationEnquete>(`${this.API_URL}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération de la validation ${id}:`, error);
          // Extraire le message d'erreur détaillé du backend
          const detailedMessage = this.extractErrorMessage(error);
          return throwError(() => new Error(detailedMessage));
        })
      );
  }

  /**
   * Récupère toutes les validations d'enquêtes
   * GET /api/validation/enquetes
   */
  getAllValidationsEnquete(): Observable<ValidationEnquete[]> {
    return this.http.get<ValidationEnquete[]>(this.API_URL)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des validations:', error);
          return of([]);
        })
      );
  }

  /**
   * Récupère les enquêtes en attente de validation
   * GET /api/validation/enquetes/en-attente
   */
  getEnquetesEnAttente(): Observable<ValidationEnquete[]> {
    return this.http.get<ValidationEnquete[]>(`${this.API_URL}/en-attente`)
      .pipe(
        map(validations => {
          console.log('📥 Validations en attente reçues du backend:', validations.length);
          console.log('📋 Détails des validations:', validations.map(v => ({
            id: v.id,
            enqueteId: v.enqueteId || v.enquete?.id,
            statut: v.statut,
            agentCreateurId: v.agentCreateurId || v.agentCreateur?.id,
            chefValidateurId: v.chefValidateurId || v.chefValidateur?.id
          })));
          return validations;
        }),
        catchError(error => {
          console.error('❌ Erreur lors de la récupération des enquêtes en attente:', error);
          console.error('❌ Détails de l\'erreur:', {
            status: error.status,
            statusText: error.statusText,
            message: error.error?.message,
            error: error.error?.error,
            url: error.url
          });
          // En cas d'erreur, retourner un tableau vide mais logger l'erreur
          return of([]);
        })
      );
  }

  /**
   * Récupère les validations d'un agent créateur
   * GET /api/validation/enquetes/agent/{agentId}
   * Si l'endpoint n'existe pas (404), charge toutes les validations et filtre côté client
   */
  getValidationsByAgent(agentId: number): Observable<ValidationEnquete[]> {
    return this.http.get<ValidationEnquete[]>(`${this.API_URL}/agent/${agentId}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des validations de l'agent ${agentId}:`, error);
          
          // Si l'endpoint n'existe pas (404), charger toutes les validations et filtrer côté client
          if (error.status === 404) {
            console.warn('⚠️ Endpoint /agent/{id} non disponible, chargement de toutes les validations');
            return this.getAllValidationsEnquete().pipe(
              map(validations => validations.filter(v => {
                // Comparer agentCreateurId (number)
                if (v.agentCreateurId === agentId) return true;
                // Comparer agentCreateur.id (peut être string ou number)
                if (v.agentCreateur?.id) {
                  const createurId = Number(v.agentCreateur.id);
                  return !isNaN(createurId) && createurId === agentId;
                }
                return false;
              }))
            );
          }
          
          return of([]);
        })
      );
  }

  /**
   * Récupère les validations d'un chef validateur
   * GET /api/validation/enquetes/chef/{chefId}
   */
  getValidationsByChef(chefId: number): Observable<ValidationEnquete[]> {
    return this.http.get<ValidationEnquete[]>(`${this.API_URL}/chef/${chefId}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des validations du chef ${chefId}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Récupère toutes les validations d'une enquête spécifique
   * GET /api/validation/enquetes/enquete/{enqueteId}
   */
  getValidationsByEnquete(enqueteId: number): Observable<ValidationEnquete[]> {
    return this.http.get<ValidationEnquete[]>(`${this.API_URL}/enquete/${enqueteId}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des validations de l'enquête ${enqueteId}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Récupère les validations par statut
   * GET /api/validation/enquetes/statut/{statut}
   */
  getValidationsByStatut(statut: StatutValidation): Observable<ValidationEnquete[]> {
    return this.http.get<ValidationEnquete[]>(`${this.API_URL}/statut/${statut}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des validations avec statut ${statut}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Valide une enquête
   * POST /api/validation/enquetes/{id}/valider?chefId={chefId}&commentaire={commentaire}
   * Le backend attend chefId comme @RequestParam (query parameter) - OBLIGATOIRE
   * IMPORTANT: Utiliser HttpParams pour construire les query parameters proprement
   */
  validerEnquete(validationId: number, chefId: number, commentaire?: string): Observable<ValidationEnquete> {
    // Construire les query parameters avec HttpParams
    let params = new HttpParams().set('chefId', chefId.toString());
    
    // Ajouter commentaire seulement s'il est défini et non vide
    if (commentaire && commentaire.trim() !== '') {
      params = params.set('commentaire', commentaire.trim());
    }
    
    const url = `${this.API_URL}/${validationId}/valider`;
    const fullUrl = `${url}?${params.toString()}`;
    
    console.log(`📤 Validation ValidationEnquete ${validationId} par chef ${chefId}`);
    console.log(`📦 Query params:`, { 
      chefId: chefId.toString(), 
      commentaire: commentaire && commentaire.trim() !== '' ? commentaire.trim() : '(non envoyé)' 
    });
    console.log(`📦 URL complète: ${fullUrl}`);
    console.log(`📦 Méthode: POST, Body: null`);
    
    // Envoyer avec query params dans l'URL, body null (pas de body JSON)
    return this.http.post<ValidationEnquete>(url, null, { params })
      .pipe(
        catchError(error => {
          console.error(`❌ Erreur lors de la validation de la ValidationEnquete ${validationId}:`, error);
          console.error(`❌ Détails complets de l'erreur:`, {
            status: error.status,
            statusText: error.statusText,
            message: error.error?.message,
            error: error.error?.error,
            errors: error.error?.errors,
            url: error.url,
            urlConstruite: fullUrl,
            paramsEnvoyes: params.toString(),
            chefId: chefId,
            commentaire: commentaire || '(non fourni)',
            errorResponse: error.error
          });
          
          // Log supplémentaire pour déboguer
          if (error.error) {
            console.error(`❌ Contenu de error.error:`, JSON.stringify(error.error, null, 2));
          }
          
          // Vérifier si l'erreur indique que chefId est manquant
          const errorMessage = error.error?.message || error.error?.error || '';
          if (errorMessage.includes('chefId') && (errorMessage.includes('not present') || errorMessage.includes('not found'))) {
            console.error(`❌ PROBLÈME CRITIQUE: Le backend ne reçoit pas chefId dans les query params!`);
            console.error(`❌ URL construite: ${fullUrl}`);
            console.error(`❌ URL reçue par le backend (d'après error.url): ${error.url}`);
            console.error(`❌ Params envoyés: ${params.toString()}`);
          }
          
          // Extraire le message d'erreur détaillé du backend
          const detailedMessage = this.extractErrorMessage(error);
          return throwError(() => new Error(detailedMessage));
        })
      );
  }

  /**
   * Rejette une enquête
   * POST /api/validation/enquetes/{id}/rejeter?chefId={chefId}&commentaire={commentaire}
   * Le backend attend chefId comme @RequestParam (query parameter) - OBLIGATOIRE
   * IMPORTANT: Utiliser HttpParams pour construire les query parameters proprement
   */
  rejeterEnquete(validationId: number, chefId: number, commentaire?: string): Observable<ValidationEnquete> {
    // Construire les query parameters avec HttpParams
    let params = new HttpParams().set('chefId', chefId.toString());
    
    // Ajouter commentaire seulement s'il est défini et non vide
    if (commentaire && commentaire.trim() !== '') {
      params = params.set('commentaire', commentaire.trim());
    }
    
    const url = `${this.API_URL}/${validationId}/rejeter`;
    const fullUrl = `${url}?${params.toString()}`;
    
    console.log(`📤 Rejet ValidationEnquete ${validationId} par chef ${chefId}`);
    console.log(`📦 Query params:`, { 
      chefId: chefId.toString(), 
      commentaire: commentaire && commentaire.trim() !== '' ? commentaire.trim() : '(non envoyé)' 
    });
    console.log(`📦 URL complète: ${fullUrl}`);
    console.log(`📦 Méthode: POST, Body: null`);
    
    // Envoyer avec query params dans l'URL, body null (pas de body JSON)
    return this.http.post<ValidationEnquete>(url, null, { params })
      .pipe(
        catchError(error => {
          console.error(`❌ Erreur lors du rejet de la ValidationEnquete ${validationId}:`, error);
          console.error(`❌ Détails complets de l'erreur:`, {
            status: error.status,
            statusText: error.statusText,
            message: error.error?.message,
            error: error.error?.error,
            errors: error.error?.errors,
            url: error.url,
            urlConstruite: fullUrl,
            paramsEnvoyes: params.toString(),
            chefId: chefId,
            commentaire: commentaire || '(non fourni)',
            errorResponse: error.error
          });
          
          // Log supplémentaire pour déboguer
          if (error.error) {
            console.error(`❌ Contenu de error.error:`, JSON.stringify(error.error, null, 2));
          }
          
          // Extraire le message d'erreur détaillé du backend
          const detailedMessage = this.extractErrorMessage(error);
          return throwError(() => new Error(detailedMessage));
        })
      );
  }

  /**
   * Remet une validation en attente
   * POST /api/validation/enquetes/{id}/en-attente?commentaire={commentaire}
   */
  remettreEnAttente(validationId: number, commentaire?: string): Observable<ValidationEnquete> {
    let params = new HttpParams();
    if (commentaire) {
      params = params.set('commentaire', commentaire);
    }
    
    return this.http.post<ValidationEnquete>(`${this.API_URL}/${validationId}/en-attente`, null, { params })
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la remise en attente de la validation ${validationId}:`, error);
          // Extraire le message d'erreur détaillé du backend
          const detailedMessage = this.extractErrorMessage(error);
          return throwError(() => new Error(detailedMessage));
        })
      );
  }

  /**
   * Compte les validations par statut
   * GET /api/validation/enquetes/statistiques/statut/{statut}
   */
  countValidationsByStatut(statut: StatutValidation): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/statistiques/statut/${statut}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors du comptage des validations avec statut ${statut}:`, error);
          return of(0);
        })
      );
  }

  /**
   * Compte les validations d'un agent
   * GET /api/validation/enquetes/statistiques/agent/{agentId}
   */
  countValidationsByAgent(agentId: number): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/statistiques/agent/${agentId}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors du comptage des validations de l'agent ${agentId}:`, error);
          return of(0);
        })
      );
  }

  /**
   * Compte les validations d'un chef
   * GET /api/validation/enquetes/statistiques/chef/{chefId}
   */
  countValidationsByChef(chefId: number): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/statistiques/chef/${chefId}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors du comptage des validations du chef ${chefId}:`, error);
          return of(0);
        })
      );
  }

  /**
   * Nettoie les validations orphelines (nouveau)
   * POST /api/validation/enquetes/nettoyer-orphelines
   */
  nettoyerValidationsOrphelines(): Observable<number> {
    return this.http.post<{nombreSupprime: number}>(`${this.API_URL}/nettoyer-orphelines`, null)
      .pipe(
        map(response => response.nombreSupprime || 0),
        catchError(error => {
          console.error('Erreur lors du nettoyage des validations orphelines:', error);
          // Extraire le message d'erreur détaillé du backend
          const detailedMessage = this.extractErrorMessage(error);
          return throwError(() => new Error(detailedMessage));
        })
      );
  }

  /**
   * Extrait le message d'erreur détaillé depuis la réponse du backend
   * Le backend retourne des messages comme "Erreur : [message détaillé]"
   * Cette méthode extrait et nettoie le message pour l'affichage
   */
  private extractErrorMessage(error: any): string {
    // Essayer d'extraire le message depuis error.error
    let errorMessage = '';
    
    if (error.error) {
      // Si error.error est une string, l'utiliser directement
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
      // Si error.error est un objet avec une propriété message
      else if (error.error.message) {
        errorMessage = error.error.message;
      }
      // Si error.error est un objet avec une propriété error
      else if (error.error.error) {
        errorMessage = error.error.error;
      }
    }
    
    // Si pas de message trouvé, utiliser le message par défaut selon le code HTTP
    if (!errorMessage) {
      if (error.status === 400) {
        const detail = error.error?.detail || '';
        if (detail.includes('enqueteId') || detail.includes('Unrecognized field')) {
          errorMessage = 'Format de données invalide. Veuillez réessayer.';
        } else if (detail.includes('agentCreateurId') || detail.includes('Utilisateur')) {
          errorMessage = 'ID utilisateur invalide. Veuillez vous reconnecter.';
        } else {
          errorMessage = 'Données invalides ou action non autorisée. Vérifiez les champs du formulaire.';
        }
      } else if (error.status === 401) {
        errorMessage = 'Session expirée, veuillez vous reconnecter';
      } else if (error.status === 403) {
        errorMessage = 'Vous n\'avez pas les droits pour effectuer cette action';
      } else if (error.status === 404) {
        errorMessage = 'Ressource non trouvée';
      } else if (error.status === 500) {
        const serverError = error.error?.error || '';
        if (serverError.includes('enqueteId') || serverError.includes('Unrecognized field')) {
          errorMessage = 'Format de données invalide. Le backend attend un objet enquete, pas enqueteId.';
        } else if (serverError.includes('Utilisateur') || serverError.includes('agentCreateurId')) {
          errorMessage = 'Utilisateur non trouvé. Veuillez vérifier votre connexion.';
        } else {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        }
      } else {
        errorMessage = error.message || 'Une erreur inattendue s\'est produite.';
      }
    }
    
    // Retirer le préfixe "Erreur : " ou "Erreur: " si présent pour un affichage plus propre
    if (errorMessage.startsWith('Erreur : ')) {
      errorMessage = errorMessage.substring(9);
    } else if (errorMessage.startsWith('Erreur: ')) {
      errorMessage = errorMessage.substring(8);
    }
    
    return errorMessage.trim();
  }

  /**
   * Gestion des erreurs HTTP (méthode legacy, conservée pour compatibilité)
   * Utilise maintenant extractErrorMessage pour une extraction cohérente
   */
  private handleError(error: any): string {
    return this.extractErrorMessage(error);
  }
}

