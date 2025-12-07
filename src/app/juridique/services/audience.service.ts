import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, timer } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
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
   * Obtenir toutes les audiences brutes depuis l'API backend (sans normalisation)
   */
  getAllAudiencesRaw(): Observable<any[]> {
    console.log('📤 AudienceService.getAllAudiencesRaw - Appel API:', `${this.baseUrl}/audiences`);
    return this.http.get<any[]>(`${this.baseUrl}/audiences`).pipe(
      tap(rawAudiences => {
        console.log('📥 AudienceService.getAllAudiencesRaw - Audiences brutes reçues:', rawAudiences?.length || 0);
        if (rawAudiences && rawAudiences.length > 0) {
          console.log('📥 AudienceService.getAllAudiencesRaw - PREMIÈRE AUDIENCE BRUTE:', rawAudiences[0]);
          console.log('📥 AudienceService.getAllAudiencesRaw - Clés:', Object.keys(rawAudiences[0]));
        }
      }),
      catchError(this.handleError)
    );
  }

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
            if (audience.dossier_id !== null && audience.dossier_id !== undefined && audience.dossier_id !== '') {
              const dossierIdValue = typeof audience.dossier_id === 'string' 
                ? parseInt(audience.dossier_id, 10) 
                : audience.dossier_id;
              if (!isNaN(dossierIdValue)) {
                audience.dossierId = dossierIdValue;
                console.log(`🔧 AudienceService - Audience ${audience.id}: dossierId extrait de dossier_id = ${audience.dossierId}`);
              } else {
                console.warn(`⚠️ AudienceService - Audience ${audience.id}: dossier_id n'est pas un nombre valide: ${audience.dossier_id}`);
              }
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
              // Audience sans dossierId - on l'avertit mais on continue
              console.warn(`⚠️ AudienceService - Audience ${audience.id} n'a AUCUN champ dossierId/dossier_id/dossier. Elle sera ignorée.`, {
                allKeys: Object.keys(audience)
              });
              // Marquer cette audience comme invalide pour qu'elle soit filtrée plus tard
              audience._invalid = true;
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
          
          // Filtrer les audiences invalides (sans dossierId)
          const validAudiences = normalized.filter(a => !(a as any)._invalid);
          if (validAudiences.length < normalized.length) {
            console.warn(`⚠️ AudienceService - ${normalized.length - validAudiences.length} audience(s) sans dossierId ont été ignorées`);
          }
          console.log('✅ AudienceService - Audiences normalisées:', validAudiences.length);
          return validAudiences;
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
   * Crée une audience et récupère le dossier mis à jour avec le nouveau score IA
   */
  createAudienceWithDossier(audience: AudienceRequest | any): Observable<{ audience: Audience; dossier?: any }> {
    return this.createAudience(audience).pipe(
      switchMap((createdAudience) => {
        // Attendre 2 secondes pour laisser le temps au backend de recalculer le score IA
        return timer(2000).pipe(
          switchMap(() => {
            // Récupérer le dossier mis à jour
            // Le backend peut retourner createdAudience.dossier (objet) ou createdAudience.dossierId (number)
            const dossierId = (createdAudience as any).dossier?.id || createdAudience.dossierId || audience.dossierId;
            if (dossierId) {
              return this.http.get<any>(`${this.baseUrl}/dossiers/${dossierId}`).pipe(
                map((dossier) => ({ audience: createdAudience, dossier })),
                catchError(() => {
                  // Si la récupération du dossier échoue, retourner quand même l'audience
                  console.warn('⚠️ AudienceService - Impossible de récupérer le dossier mis à jour');
                  return [{ audience: createdAudience }];
                })
              );
            }
            return [{ audience: createdAudience }];
          })
        );
      }),
      catchError((error) => {
        console.error('❌ AudienceService - Erreur lors de la création de l\'audience:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Met à jour une audience et récupère le dossier mis à jour avec le nouveau score IA
   */
  updateAudienceWithDossier(id: number, audience: AudienceRequest | any): Observable<{ audience: Audience; dossier?: any }> {
    return this.updateAudience(id, audience).pipe(
      switchMap((updatedAudience) => {
        // Attendre 2 secondes pour laisser le temps au backend de recalculer le score IA
        return timer(2000).pipe(
          switchMap(() => {
            // Récupérer le dossier mis à jour
            // Le backend peut retourner updatedAudience.dossier (objet) ou updatedAudience.dossierId (number)
            const dossierId = (updatedAudience as any).dossier?.id || updatedAudience.dossierId || audience.dossierId;
            if (dossierId) {
              return this.http.get<any>(`${this.baseUrl}/dossiers/${dossierId}`).pipe(
                map((dossier) => ({ audience: updatedAudience, dossier })),
                catchError(() => {
                  // Si la récupération du dossier échoue, retourner quand même l'audience
                  console.warn('⚠️ AudienceService - Impossible de récupérer le dossier mis à jour');
                  return [{ audience: updatedAudience }];
                })
              );
            }
            return [{ audience: updatedAudience }];
          })
        );
      }),
      catchError((error) => {
        console.error('❌ AudienceService - Erreur lors de la mise à jour de l\'audience:', error);
        return throwError(() => error);
      })
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

    // Convertir AudienceRequest en format backend
    // Le backend attend: dossier (objet), avocat (objet), huissier (objet), resultat (pas decisionResult)
    // Format des dates: YYYY-MM-DD (string ISO)
    let payload: any;
    
    // Extraire les IDs depuis différents formats possibles
    const dossierId = audience.dossierId || audience.dossier?.id;
    const avocatId = audience.avocatId || audience.avocat?.id;
    const huissierId = audience.huissierId || audience.huissier?.id;
    
    // Formater les dates correctement (YYYY-MM-DD)
    let dateAudienceFormatted = audience.dateAudience;
    if (dateAudienceFormatted instanceof Date) {
      dateAudienceFormatted = dateAudienceFormatted.toISOString().split('T')[0];
    } else if (typeof dateAudienceFormatted === 'string' && dateAudienceFormatted.includes('T')) {
      dateAudienceFormatted = dateAudienceFormatted.split('T')[0];
    }
    
    let dateProchaineFormatted = audience.dateProchaine;
    if (dateProchaineFormatted) {
      if (dateProchaineFormatted instanceof Date) {
        dateProchaineFormatted = dateProchaineFormatted.toISOString().split('T')[0];
      } else if (typeof dateProchaineFormatted === 'string' && dateProchaineFormatted.includes('T')) {
        dateProchaineFormatted = dateProchaineFormatted.split('T')[0];
      }
    }
    
    // Construire le payload avec le format attendu par le backend
    // Utiliser des objets simples { id: ... } pour éviter la classe imbriquée DossierReference
    payload = {
      dateAudience: dateAudienceFormatted,
      tribunalType: audience.tribunalType,
      lieuTribunal: audience.lieuTribunal,
      resultat: audience.decisionResult || audience.resultat || null
    };
    
    // Ajouter dateProchaine seulement si elle existe
    if (dateProchaineFormatted) {
      payload.dateProchaine = dateProchaineFormatted;
    }
    
    // Ajouter commentaireDecision seulement s'il existe
    if (audience.commentaireDecision) {
      payload.commentaireDecision = audience.commentaireDecision;
    }
    
    // Ajouter dossier comme objet simple (le backend devrait pouvoir le désérialiser)
    if (dossierId) {
      payload.dossier = { id: Number(dossierId) };
    }
    
    // Ajouter avocat comme objet simple si sélectionné
    if (avocatId) {
      payload.avocat = { id: Number(avocatId) };
    }
    
    // Ajouter huissier comme objet simple si sélectionné
    if (huissierId) {
      payload.huissier = { id: Number(huissierId) };
    }
    
    // Nettoyer les valeurs undefined et null pour les champs optionnels
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    
    console.log('📤 Payload envoyé au backend:', JSON.stringify(payload, null, 2));


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

    // Convertir AudienceRequest en format backend
    // Le backend attend: dossier (objet), avocat (objet), huissier (objet), resultat (pas decisionResult)
    // Format des dates: YYYY-MM-DD (string ISO)
    let payload: any;
    
    // Extraire les IDs depuis différents formats possibles
    const dossierId = audience.dossierId || audience.dossier?.id;
    const avocatId = audience.avocatId || audience.avocat?.id;
    const huissierId = audience.huissierId || audience.huissier?.id;
    
    // Formater les dates correctement (YYYY-MM-DD)
    let dateAudienceFormatted = audience.dateAudience;
    if (dateAudienceFormatted instanceof Date) {
      dateAudienceFormatted = dateAudienceFormatted.toISOString().split('T')[0];
    } else if (typeof dateAudienceFormatted === 'string' && dateAudienceFormatted.includes('T')) {
      dateAudienceFormatted = dateAudienceFormatted.split('T')[0];
    }
    
    let dateProchaineFormatted = audience.dateProchaine;
    if (dateProchaineFormatted) {
      if (dateProchaineFormatted instanceof Date) {
        dateProchaineFormatted = dateProchaineFormatted.toISOString().split('T')[0];
      } else if (typeof dateProchaineFormatted === 'string' && dateProchaineFormatted.includes('T')) {
        dateProchaineFormatted = dateProchaineFormatted.split('T')[0];
      }
    }
    
    // Construire le payload avec le format attendu par le backend
    // Utiliser des objets simples { id: ... } pour éviter la classe imbriquée DossierReference
    payload = {
      dateAudience: dateAudienceFormatted,
      tribunalType: audience.tribunalType,
      lieuTribunal: audience.lieuTribunal,
      resultat: audience.decisionResult || audience.resultat || null
    };
    
    // Ajouter dateProchaine seulement si elle existe
    if (dateProchaineFormatted) {
      payload.dateProchaine = dateProchaineFormatted;
    }
    
    // Ajouter commentaireDecision seulement s'il existe
    if (audience.commentaireDecision) {
      payload.commentaireDecision = audience.commentaireDecision;
    }
    
    // Ajouter dossier comme objet simple (le backend devrait pouvoir le désérialiser)
    if (dossierId) {
      payload.dossier = { id: Number(dossierId) };
    }
    
    // Ajouter avocat comme objet simple si sélectionné
    if (avocatId) {
      payload.avocat = { id: Number(avocatId) };
    }
    
    // Ajouter huissier comme objet simple si sélectionné
    if (huissierId) {
      payload.huissier = { id: Number(huissierId) };
    }
    
    // Nettoyer les valeurs undefined et null pour les champs optionnels
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    
    console.log('📤 Payload de mise à jour envoyé au backend:', JSON.stringify(payload, null, 2));


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
    console.error('❌ Détails de l\'erreur:', {
      status: error.status,
      statusText: error.statusText,
      error: error.error,
      message: error.message,
      url: error.url
    });
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client (problème réseau, CORS, etc.)
      errorMessage = `Erreur réseau: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.status === 0) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
      } else if (error.status === 400) {
        // Bad Request - souvent lié à des données invalides ou des contraintes de validation
        const backendMessage = error.error?.message || error.error?.error || 'Données invalides';
        errorMessage = `Erreur de validation: ${backendMessage}. Vérifiez que tous les champs sont corrects et que le dossier existe.`;
      } else if (error.status === 404) {
        errorMessage = 'Endpoint non trouvé. Vérifiez l\'URL du backend.';
      } else if (error.status === 500) {
        // Erreur serveur interne - peut être liée à une transaction rollback
        const backendMessage = error.error?.message || error.error?.error || 'Erreur serveur interne';
        if (backendMessage.includes('rollback') || backendMessage.includes('Transaction')) {
          errorMessage = `Erreur de transaction: ${backendMessage}. Vérifiez que le dossier, l'avocat et l'huissier existent et sont valides.`;
        } else {
          errorMessage = `Erreur serveur interne: ${backendMessage}`;
        }
      } else {
        errorMessage = `Erreur ${error.status}: ${error.error?.message || error.error?.error || error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
