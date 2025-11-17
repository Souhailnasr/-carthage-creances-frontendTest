import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Audience, AudienceRequest } from '../models/audience.model';

@Injectable({
  providedIn: 'root'
})
export class AudienceService {
  private baseUrl = `${environment.apiUrl}/api`;
  private audiencesSubject = new BehaviorSubject<Audience[]>([]);
  public audiences$ = this.audiencesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtenir toutes les audiences depuis l'API backend
   */
  getAllAudiences(): Observable<Audience[]> {
    console.log('📤 AudienceService.getAllAudiences - Appel API:', `${this.baseUrl}/audiences`);
    return this.http.get<any[]>(`${this.baseUrl}/audiences`)
      .pipe(
        tap(rawAudiences => {
          console.log('📥 AudienceService - Audiences brutes reçues du backend:', rawAudiences);
          console.log('📥 AudienceService - Nombre d\'audiences:', rawAudiences?.length || 0);
          
          // Log détaillé de la première audience pour voir tous les champs
          if (rawAudiences && rawAudiences.length > 0) {
            console.log('📥 AudienceService - PREMIÈRE AUDIENCE BRUTE (tous les champs):', rawAudiences[0]);
            console.log('📥 AudienceService - Clés de la première audience:', Object.keys(rawAudiences[0]));
            console.log('📥 AudienceService - JSON stringifié:', JSON.stringify(rawAudiences[0], null, 2));
          }
        }),
        map(audiences => {
          if (!Array.isArray(audiences)) {
            console.error('❌ AudienceService - Les audiences ne sont pas un tableau:', audiences);
            return [];
          }
          
          // Normaliser les audiences pour avoir dossierId même si le backend retourne dossier.id
          const normalized = audiences.map((a, index) => {
            const audience: any = { ...a };
            
            console.log(`🔧 AudienceService - Audience ${index + 1} brute:`, {
              id: audience.id,
              dossierId: audience.dossierId,
              dossier_id: audience.dossier_id, // Vérifier avec underscore
              dossierIdType: typeof audience.dossierId,
              dossier: audience.dossier,
              hasDossier: !!audience.dossier,
              dossierIdFromDossier: audience.dossier?.id,
              allKeys: Object.keys(audience) // Voir tous les champs disponibles
            });
            
            // PRIORITÉ 1: Vérifier dossier_id (avec underscore) - format base de données
            if (audience.dossier_id !== null && audience.dossier_id !== undefined) {
              audience.dossierId = typeof audience.dossier_id === 'string' 
                ? parseInt(audience.dossier_id, 10) 
                : audience.dossier_id;
              console.log(`🔧 AudienceService - Audience ${audience.id}: dossierId extrait de dossier_id = ${audience.dossierId}`);
            }
            // PRIORITÉ 2: Si l'audience a déjà dossierId (camelCase)
            else if (audience.dossierId !== null && audience.dossierId !== undefined) {
              // Normaliser dossierId en number si c'est une string
              if (typeof audience.dossierId === 'string') {
                audience.dossierId = parseInt(audience.dossierId, 10);
                if (!isNaN(audience.dossierId)) {
                  console.log(`🔧 AudienceService - Audience ${audience.id}: dossierId converti de string en number = ${audience.dossierId}`);
                }
              }
            }
            // PRIORITÉ 3: Si l'audience a un objet dossier mais pas dossierId, extraire l'ID
            else if (audience.dossier && audience.dossier.id !== null && audience.dossier.id !== undefined) {
              audience.dossierId = typeof audience.dossier.id === 'string' 
                ? parseInt(audience.dossier.id, 10) 
                : audience.dossier.id;
              console.log(`🔧 AudienceService - Audience ${audience.id}: dossierId extrait de dossier.id = ${audience.dossierId}`);
            }
            else {
              console.error(`❌ AudienceService - Audience ${audience.id} n'a AUCUN champ dossierId/dossier_id/dossier!`, {
                allKeys: Object.keys(audience),
                audience: audience
              });
            }
            
            // Si l'audience a resultat mais pas decisionResult, mapper
            if (!audience.decisionResult && audience.resultat) {
              audience.decisionResult = audience.resultat;
            }
            
            console.log(`✅ AudienceService - Audience ${audience.id} normalisée:`, {
              id: audience.id,
              dossierId: audience.dossierId,
              dossierIdType: typeof audience.dossierId
            });
            
            return audience as Audience;
          });
          
          console.log('✅ AudienceService - Audiences normalisées:', normalized.length);
          return normalized;
        }),
        tap(normalizedAudiences => {
          console.log('📤 AudienceService - Envoi des audiences normalisées au composant:', normalizedAudiences);
          this.audiencesSubject.next(normalizedAudiences);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les audiences d'un dossier spécifique
   */
  getAudiencesByDossier(dossierId: number): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.baseUrl}/audiences/dossier/${dossierId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir une audience par ID depuis l'API backend
   */
  getAudienceById(id: number): Observable<Audience> {
    return this.http.get<Audience>(`${this.baseUrl}/audiences/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Créer une nouvelle audience via l'API backend
   */
  createAudience(audience: AudienceRequest | any): Observable<Audience> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Convertir AudienceRequest en format backend si nécessaire
    // Le backend attend: dossier (objet), avocat (objet), huissier (objet), resultat (pas decisionResult)
    // Propriétés connues backend: "resultat", "dateAudience", "dateProchaine", "tribunalType", 
    // "commentaireDecision", "lieuTribunal", "huissier", "id", "avocat", "dossier"
    let payload: any;
    
    if (audience.dossierId) {
      // Si c'est un AudienceRequest avec dossierId, convertir en format backend
      payload = {
        dateAudience: audience.dateAudience,
        dateProchaine: audience.dateProchaine || null,
        tribunalType: audience.tribunalType,
        lieuTribunal: audience.lieuTribunal,
        commentaireDecision: audience.commentaireDecision || null,
        resultat: audience.decisionResult || audience.resultat || null, // Backend attend "resultat"
        dossier: { id: audience.dossierId },
        avocat: audience.avocatId ? { id: audience.avocatId } : null,
        huissier: audience.huissierId ? { id: audience.huissierId } : null
      };
    } else {
      // Si c'est déjà au format backend (avec dossier, avocat, huissier comme objets)
      payload = { ...audience };
    }
    
    // Nettoyer les valeurs undefined
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });


    return this.http.post<Audience>(`${this.baseUrl}/audiences`, payload, { headers })
      .pipe(
        tap(newAudience => {
          // Mettre à jour la liste locale après création
          const currentAudiences = this.audiencesSubject.value;
          this.audiencesSubject.next([...currentAudiences, newAudience]);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Mettre à jour une audience via l'API backend
   */
  updateAudience(id: number, audience: AudienceRequest | any): Observable<Audience> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Convertir AudienceRequest en format backend si nécessaire
    // Le backend attend: dossier (objet), avocat (objet), huissier (objet), resultat (pas decisionResult)
    // Propriétés connues backend: "resultat", "dateAudience", "dateProchaine", "tribunalType", 
    // "commentaireDecision", "lieuTribunal", "huissier", "id", "avocat", "dossier"
    let payload: any;
    
    if (audience.dossierId) {
      // Si c'est un AudienceRequest avec dossierId, convertir en format backend
      payload = {
        dateAudience: audience.dateAudience,
        dateProchaine: audience.dateProchaine || null,
        tribunalType: audience.tribunalType,
        lieuTribunal: audience.lieuTribunal,
        commentaireDecision: audience.commentaireDecision || null,
        resultat: audience.decisionResult || audience.resultat || null, // Backend attend "resultat"
        dossier: { id: audience.dossierId },
        avocat: audience.avocatId ? { id: audience.avocatId } : null,
        huissier: audience.huissierId ? { id: audience.huissierId } : null
      };
    } else {
      // Si c'est déjà au format backend (avec dossier, avocat, huissier comme objets)
      payload = { ...audience };
    }
    
    // Nettoyer les valeurs undefined
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });


    return this.http.put<Audience>(`${this.baseUrl}/audiences/${id}`, payload, { headers })
      .pipe(
        tap(updatedAudience => {
          // Mettre à jour la liste locale après modification
          const currentAudiences = this.audiencesSubject.value;
          const index = currentAudiences.findIndex(a => a.id === id);
          if (index !== -1) {
            currentAudiences[index] = updatedAudience;
            this.audiencesSubject.next([...currentAudiences]);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer une audience via l'API backend
   */
  deleteAudience(id: number): Observable<void> {
    const deleteUrl = `${this.baseUrl}/audiences/${id}`;
    return this.http.delete<void>(deleteUrl)
      .pipe(
        tap(() => {
          // Mettre à jour la liste locale après suppression
          const currentAudiences = this.audiencesSubject.value;
          const filteredAudiences = currentAudiences.filter(a => a.id !== id);
          this.audiencesSubject.next(filteredAudiences);
        }),
        catchError((error) => {
          console.error('❌ Erreur lors de la suppression:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Rechercher des audiences via l'API backend
   */
  searchAudiences(searchTerm: string): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.baseUrl}/audiences/search?q=${encodeURIComponent(searchTerm)}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les audiences par tribunal
   */
  getAudiencesByTribunal(tribunalType: string): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.baseUrl}/audiences/tribunal/${tribunalType}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les audiences par avocat
   */
  getAudiencesByAvocat(avocatId: number): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.baseUrl}/audiences/avocat/${avocatId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les audiences par huissier
   */
  getAudiencesByHuissier(huissierId: number): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.baseUrl}/audiences/huissier/${huissierId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gérer les erreurs HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur dans AudienceService:', error);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client (problème réseau, CORS, etc.)
      errorMessage = `Erreur réseau: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.status === 0) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
      } else if (error.status === 404) {
        errorMessage = 'Endpoint non trouvé. Vérifiez l\'URL du backend.';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur interne.';
      } else {
        errorMessage = `Erreur ${error.status}: ${error.error?.message || error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
