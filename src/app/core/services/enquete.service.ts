import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Enquette, ValidationEnquete } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class EnqueteService {
  private readonly API_URL = `${environment.apiUrl}/api/enquettes`;

  constructor(private http: HttpClient) {}

  /**
   * Crée une nouvelle enquête
   * POST /api/enquettes
   */
  createEnquete(enquete: Partial<Enquette>): Observable<Enquette> {
    // S'assurer qu'on n'envoie que les IDs, pas les objets complets
    const payload: any = { ...enquete };
    
    // Si dossier est un objet, extraire l'ID et le mettre dans dossierId
    if (payload.dossier && typeof payload.dossier === 'object' && payload.dossier.id) {
      payload.dossierId = Number(payload.dossier.id);
      delete payload.dossier;
    }
    
    // Supprimer les objets complets non acceptés par le backend
    delete payload.agentCreateur; // Ne pas envoyer l'objet complet
    delete payload.agentResponsable; // Ne pas envoyer l'objet complet
    
    // Nettoyer les champs vides (null, undefined, chaînes vides) pour éviter les erreurs de validation
    // MAIS garder les champs numériques à 0 et les booléens false
    Object.keys(payload).forEach(key => {
      const value = payload[key];
      if (value === null || value === undefined || 
          (typeof value === 'string' && value.trim() === '')) {
        delete payload[key];
      }
    });
    
    console.log('📤 Envoi de la requête POST à:', this.API_URL);
    console.log('📦 Payload nettoyé:', JSON.stringify(payload, null, 2));
    
    return this.http.post<Enquette>(this.API_URL, payload)
      .pipe(
        catchError(error => {
          console.error('❌ Erreur lors de la création de l\'enquête:', error);
          
          // Gestion spécifique des erreurs
          if (error.status === 500) {
            const errorMessage = error.error?.message || error.error?.error || 'Erreur serveur lors de la création de l\'enquête';
            console.error('❌ Erreur 500 - Message du backend:', errorMessage);
            
            // Vérifier si l'erreur concerne un Utilisateur non trouvé
            if (errorMessage.includes('Utilisateur') || errorMessage.includes('agentCreateurId')) {
              console.error('❌ Erreur: agentCreateurId invalide ou Utilisateur non trouvé');
            }
          } else if (error.status === 400) {
            const errorMessage = error.error?.message || error.error?.error || 'Données invalides';
            console.error('❌ Erreur 400 - Données invalides:', errorMessage);
            console.error('❌ Détails de l\'erreur:', {
              message: error.error?.message,
              error: error.error?.error,
              errors: error.error?.errors,
              payload: payload
            });
          } else if (error.status === 404) {
            console.error('❌ Erreur 404 - Ressource non trouvée');
          }
          
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Récupère une enquête par son ID
   * GET /api/enquettes/{id}
   */
  getEnqueteById(id: number): Observable<Enquette> {
    return this.http.get<Enquette>(`${this.API_URL}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération de l'enquête ${id}:`, error);
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Récupère toutes les enquêtes
   * GET /api/enquettes
   */
  getAllEnquetes(): Observable<Enquette[]> {
    return this.http.get<Enquette[]>(this.API_URL)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des enquêtes:', error);
          return of([]);
        })
      );
  }

  /**
   * Récupère les enquêtes créées par un agent
   * GET /api/enquettes/agent/{agentId}
   * Si l'endpoint n'existe pas (404 ou 500), charge toutes les enquêtes et filtre côté client
   */
  getEnquetesByAgent(agentId: number): Observable<Enquette[]> {
    // L'endpoint /agent/{id} n'existe pas dans le backend (retourne "No static resource")
    // Problème : Après validation, agent_createur_id devient NULL dans la table enquette
    // Solution : Utiliser getAllEnquetes() + getAllValidationsEnquete() pour trouver les enquêtes
    // via validation_enquetes.agent_createur_id si enquette.agent_createur_id est NULL
    
    console.log(`📤 Chargement des enquêtes pour l'agent ${agentId} (via getAllEnquetes + getAllValidationsEnquete)`);
    
    // Charger toutes les enquêtes et toutes les validations en parallèle
    return forkJoin({
      enquetes: this.getAllEnquetes(),
      validations: this.http.get<ValidationEnquete[]>(`${environment.apiUrl}/api/validation/enquetes`).pipe(
        catchError(error => {
          console.warn('⚠️ Erreur lors du chargement des validations, continuation sans:', error);
          return of([]);
        })
      )
    }).pipe(
      map(({ enquetes, validations }: { enquetes: Enquette[], validations: ValidationEnquete[] }) => {
        console.log(`📥 ${enquetes.length} enquêtes totales chargées, ${validations.length} validations chargées`);
        
        // Créer un map des enquete_id -> agent_createur_id depuis les validations
        const agentCreateurFromValidations = new Map<number, number>();
        validations.forEach((v: ValidationEnquete) => {
          const enqueteId = v.enqueteId || v.enquete?.id;
          const agentCreateurId = v.agentCreateurId || (v.agentCreateur?.id ? Number(v.agentCreateur.id) : null);
          if (enqueteId && agentCreateurId) {
            agentCreateurFromValidations.set(Number(enqueteId), Number(agentCreateurId));
            console.log(`📋 Validation ${v.id}: enqueteId=${enqueteId}, agentCreateurId=${agentCreateurId}`);
          }
        });
        
        const filtered = enquetes.filter((e: Enquette) => {
          if (!e.id) return false;
          
          // Log détaillé pour chaque enquête
          const agentCreateurId = e.agentCreateurId;
          const agentCreateurIdFromObject = e.agentCreateur?.id ? Number(e.agentCreateur.id) : null;
          const agentCreateurIdFromValidation = agentCreateurFromValidations.get(e.id);
          
          console.log(`🔍 Enquête ${e.id}:`, {
            agentCreateurId: agentCreateurId,
            agentCreateurIdFromObject: agentCreateurIdFromObject,
            agentCreateurIdFromValidation: agentCreateurIdFromValidation,
            rapportCode: e.rapportCode
          });
          
          // Comparer agentCreateurId (number) depuis enquette
          if (agentCreateurId === agentId) {
            console.log(`✅ Enquête ${e.id} correspond (agentCreateurId: ${agentCreateurId})`);
            return true;
          }
          
          // Comparer agentCreateur.id (peut être string ou number) depuis enquette
          if (agentCreateurIdFromObject !== null && !isNaN(agentCreateurIdFromObject) && agentCreateurIdFromObject === agentId) {
            console.log(`✅ Enquête ${e.id} correspond (agentCreateur.id: ${agentCreateurIdFromObject})`);
            return true;
          }
          
          // Si agent_createur_id est NULL dans enquette, utiliser validation_enquetes
          if ((!agentCreateurId && !agentCreateurIdFromObject) && agentCreateurIdFromValidation === agentId) {
            console.log(`✅ Enquête ${e.id} correspond (agentCreateurId depuis validation: ${agentCreateurIdFromValidation})`);
            // Mettre à jour l'enquête avec l'agentCreateurId trouvé dans les validations
            e.agentCreateurId = agentCreateurIdFromValidation;
            return true;
          }
          
          // Log pour debug si l'enquête ne correspond pas
          console.log(`❌ Enquête ${e.id} ne correspond pas:`, {
            agentIdRecherche: agentId,
            agentCreateurId: agentCreateurId,
            agentCreateurIdFromObject: agentCreateurIdFromObject,
            agentCreateurIdFromValidation: agentCreateurIdFromValidation,
            rapportCode: e.rapportCode
          });
          
          return false;
        });
        
        console.log(`✅ ${filtered.length} enquêtes trouvées pour l'agent ${agentId} (sur ${enquetes.length} totales)`);
        console.log(`📋 Détails des enquêtes trouvées:`, filtered.map((e: Enquette) => ({
          id: e.id,
          rapportCode: e.rapportCode,
          agentCreateurId: e.agentCreateurId,
          agentCreateurIdFromObject: e.agentCreateur?.id,
          dossierId: e.dossierId
        })));
        
        return filtered;
      }),
      catchError(error => {
        console.error(`❌ Erreur lors du chargement des enquêtes pour l'agent ${agentId}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Met à jour une enquête existante
   * PUT /api/enquettes/{id}
   */
  updateEnquete(id: number, enquete: Partial<Enquette>): Observable<Enquette> {
    return this.http.put<Enquette>(`${this.API_URL}/${id}`, enquete)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la mise à jour de l'enquête ${id}:`, error);
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Supprime une enquête
   * DELETE /api/enquettes/{id}
   * Le backend supprime automatiquement toutes les validations associées
   * Retourne 'success' si la suppression réussit, ou un message d'erreur détaillé
   */
  deleteEnquete(id: number): Observable<string> {
    console.log(`🗑️ Appel DELETE pour l'enquête ${id}`);
    
    return this.http.delete(`${this.API_URL}/${id}`, {
      observe: 'response',
      responseType: 'text' // Le backend peut retourner du texte dans le body
    }).pipe(
      map(response => {
        console.log(`✅ Réponse DELETE pour l'enquête ${id}:`, {
          status: response.status,
          statusText: response.statusText,
          body: response.body
        });
        
        // Si 204 NO_CONTENT, suppression réussie
        if (response.status === 204) {
          console.log(`✅ Enquête ${id} supprimée avec succès du backend`);
          return 'success';
        }
        
        // Sinon, extraire le message d'erreur du body
        const errorMessage = response.body || 'Erreur inconnue lors de la suppression';
        console.warn(`⚠️ Statut inattendu lors de la suppression: ${response.status} - ${errorMessage}`);
        return errorMessage;
      }),
      catchError(error => {
        console.error(`❌ Erreur lors de la suppression de l'enquête ${id}:`, error);
        console.error(`❌ Détails de l'erreur:`, {
          status: error.status,
          statusText: error.statusText,
          message: error.error?.message,
          error: error.error,
          url: error.url
        });
        
        // Gérer les erreurs HTTP avec messages détaillés
        let errorMessage = 'Erreur lors de la suppression de l\'enquête';
        
        // Erreur de connexion
        if (error.status === 0 || error.name === 'TimeoutError') {
          errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
        }
        // Erreurs HTTP spécifiques - vérifier d'abord le statut
        if (error.status === 404) {
          // Pour 404, extraire le message du backend s'il existe
          if (error.error) {
            errorMessage = typeof error.error === 'string' 
              ? error.error 
              : error.error.message || 'Enquête non trouvée. Elle a peut-être déjà été supprimée ou n\'existe plus dans la base de données.';
          } else {
            errorMessage = 'Enquête non trouvée. Elle a peut-être déjà été supprimée ou n\'existe plus dans la base de données.';
          }
        } else if (error.status === 409) {
          errorMessage = 'Impossible de supprimer l\'enquête : contrainte de base de données. L\'enquête est probablement liée à un dossier ou à d\'autres entités.';
        } else if (error.status === 500) {
          // Pour 500, extraire le message détaillé du backend
          if (error.error) {
            errorMessage = typeof error.error === 'string' 
              ? error.error 
              : error.error.message || 'Erreur serveur lors de la suppression. Veuillez réessayer plus tard.';
          } else {
            errorMessage = 'Erreur serveur lors de la suppression. Veuillez réessayer plus tard.';
          }
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas les droits pour supprimer cette enquête.';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Impossible de supprimer cette enquête.';
        }
        // Erreur avec message du backend (pour les autres statuts)
        else if (error.error) {
          errorMessage = typeof error.error === 'string' 
            ? error.error 
            : error.error.message || errorMessage;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Récupère l'enquête associée à un dossier
   * GET /api/enquettes/dossier/{dossierId}
   * Retourne null si aucune enquête n'existe pour ce dossier (404 est attendu et silencieux)
   */
  getEnqueteByDossier(dossierId: number): Observable<Enquette | null> {
    return this.http.get<Enquette>(`${this.API_URL}/dossier/${dossierId}`)
      .pipe(
        map(enquete => enquete || null),
        catchError(error => {
          // 404 est attendu quand un dossier n'a pas d'enquête - ne pas logger comme erreur
          if (error.status === 404) {
            // Retourner null silencieusement sans logger l'erreur
            return of(null);
          }
          // Pour les autres erreurs, logger et propager
          console.error(`Erreur lors de la récupération de l'enquête du dossier ${dossierId}:`, error);
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Récupère les enquêtes créées à une date spécifique
   * GET /api/enquettes/creation-date/{date}
   * Format date: YYYY-MM-DD
   */
  getEnquetesByCreationDate(date: string): Observable<Enquette[]> {
    return this.http.get<Enquette[]>(`${this.API_URL}/creation-date/${date}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des enquêtes pour la date ${date}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Récupère les enquêtes créées dans une plage de dates
   * GET /api/enquettes/creation-date-range?startDate={date}&endDate={date}
   */
  getEnquetesByCreationDateRange(startDate: string, endDate: string): Observable<Enquette[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<Enquette[]>(`${this.API_URL}/creation-date-range`, { params })
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des enquêtes pour la plage ${startDate}-${endDate}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Récupère les enquêtes par secteur d'activité
   * GET /api/enquettes/sector/{sector}
   */
  getEnquetesBySector(sector: string): Observable<Enquette[]> {
    return this.http.get<Enquette[]>(`${this.API_URL}/sector/${sector}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des enquêtes pour le secteur ${sector}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Récupère les enquêtes par forme juridique
   * GET /api/enquettes/legal-form/{legalForm}
   */
  getEnquetesByLegalForm(legalForm: string): Observable<Enquette[]> {
    return this.http.get<Enquette[]>(`${this.API_URL}/legal-form/${legalForm}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des enquêtes pour la forme juridique ${legalForm}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Récupère les enquêtes par PDG (nom du PDG)
   * GET /api/enquettes/pdg/{pdg}
   */
  getEnquetesByPDG(pdg: string): Observable<Enquette[]> {
    return this.http.get<Enquette[]>(`${this.API_URL}/pdg/${pdg}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des enquêtes pour le PDG ${pdg}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Récupère les enquêtes par plage de capital
   * GET /api/enquettes/capital-range?minCapital={min}&maxCapital={max}
   */
  getEnquetesByCapitalRange(minCapital: number, maxCapital: number): Observable<Enquette[]> {
    const params = new HttpParams()
      .set('minCapital', minCapital.toString())
      .set('maxCapital', maxCapital.toString());
    
    return this.http.get<Enquette[]>(`${this.API_URL}/capital-range`, { params })
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des enquêtes pour la plage de capital:`, error);
          return of([]);
        })
      );
  }

  /**
   * Récupère les enquêtes par plage de chiffre d'affaires
   * GET /api/enquettes/revenue-range?minRevenue={min}&maxRevenue={max}
   */
  getEnquetesByRevenueRange(minRevenue: number, maxRevenue: number): Observable<Enquette[]> {
    const params = new HttpParams()
      .set('minRevenue', minRevenue.toString())
      .set('maxRevenue', maxRevenue.toString());
    
    return this.http.get<Enquette[]>(`${this.API_URL}/revenue-range`, { params })
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des enquêtes pour la plage de CA:`, error);
          return of([]);
        })
      );
  }

  /**
   * Récupère les enquêtes par plage d'effectif
   * GET /api/enquettes/staff-range?minStaff={min}&maxStaff={max}
   */
  getEnquetesByStaffRange(minStaff: number, maxStaff: number): Observable<Enquette[]> {
    const params = new HttpParams()
      .set('minStaff', minStaff.toString())
      .set('maxStaff', maxStaff.toString());
    
    return this.http.get<Enquette[]>(`${this.API_URL}/staff-range`, { params })
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des enquêtes pour la plage d'effectif:`, error);
          return of([]);
        })
      );
  }

  /**
   * Récupère les enquêtes avec bien immobilier
   * GET /api/enquettes/with-real-estate
   */
  getEnquetesWithRealEstate(): Observable<Enquette[]> {
    return this.http.get<Enquette[]>(`${this.API_URL}/with-real-estate`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des enquêtes avec bien immobilier:', error);
          return of([]);
        })
      );
  }

  /**
   * Récupère les enquêtes avec bien mobilier
   * GET /api/enquettes/with-movable-property
   */
  getEnquetesWithMovableProperty(): Observable<Enquette[]> {
    return this.http.get<Enquette[]>(`${this.API_URL}/with-movable-property`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des enquêtes avec bien mobilier:', error);
          return of([]);
        })
      );
  }

  /**
   * Récupère les enquêtes avec observations
   * GET /api/enquettes/with-observations
   */
  getEnquetesWithObservations(): Observable<Enquette[]> {
    return this.http.get<Enquette[]>(`${this.API_URL}/with-observations`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des enquêtes avec observations:', error);
          return of([]);
        })
      );
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: any): string {
    // Priorité aux messages d'erreur du backend
    if (error.error?.message) {
      return error.error.message;
    }
    
    // Messages d'erreur spécifiques selon le code HTTP
    if (error.status === 400) {
      const detail = error.error?.error || error.error?.detail || '';
      if (detail.includes('agentCreateurId') || detail.includes('Utilisateur')) {
        return 'Erreur: ID utilisateur invalide. Veuillez vous reconnecter.';
      }
      return 'Données invalides: ' + (detail || 'Vérifiez les champs du formulaire');
    }
    if (error.status === 401) {
      return 'Session expirée, veuillez vous reconnecter';
    }
    if (error.status === 403) {
      return 'Vous n\'avez pas les droits pour effectuer cette action';
    }
    if (error.status === 404) {
      return 'Ressource non trouvée';
    }
    if (error.status === 500) {
      const errorMessage = error.error?.error || error.error?.message || '';
      if (errorMessage.includes('Utilisateur') || errorMessage.includes('agentCreateurId')) {
        return 'Erreur: Utilisateur non trouvé. Veuillez vérifier votre connexion.';
      }
      if (errorMessage.includes('dossierId') || errorMessage.includes('Dossier')) {
        return 'Erreur: Dossier non trouvé ou invalide.';
      }
      return 'Erreur serveur: ' + (errorMessage || 'Veuillez réessayer plus tard');
    }
    
    return 'Une erreur est survenue: ' + (error.message || 'Erreur inconnue');
  }

  /**
   * Valide une enquête
   * PUT /api/enquettes/{id}/valider?chefId={chefId}
   */
  validerEnquete(id: number, chefId: number, commentaire?: string): Observable<Enquette> {
    let params = new HttpParams().set('chefId', chefId.toString());
    
    // Ajouter le commentaire si fourni
    if (commentaire) {
      params = params.set('commentaire', commentaire);
    }
    
    console.log(`📤 Validation de l'enquête ${id} par le chef ${chefId}`);
    console.log(`📦 Paramètres:`, { chefId, commentaire: commentaire || 'aucun' });
    
    return this.http.put<Enquette>(`${this.API_URL}/${id}/valider`, null, { params })
      .pipe(
        catchError(error => {
          console.error(`❌ Erreur lors de la validation de l'enquête ${id}:`, error);
          console.error(`❌ Détails de l'erreur:`, {
            status: error.status,
            statusText: error.statusText,
            message: error.error?.message,
            error: error.error?.error,
            errors: error.error?.errors,
            url: error.url,
            params: { chefId, commentaire }
          });
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Rejette une enquête
   * PUT /api/enquettes/{id}/rejeter?commentaire={commentaire}
   */
  rejeterEnquete(id: number, commentaire: string): Observable<Enquette> {
    const params = new HttpParams().set('commentaire', commentaire);
    
    console.log(`📤 Rejet de l'enquête ${id} avec commentaire: ${commentaire}`);
    
    return this.http.put<Enquette>(`${this.API_URL}/${id}/rejeter`, null, { params })
      .pipe(
        catchError(error => {
          console.error(`❌ Erreur lors du rejet de l'enquête ${id}:`, error);
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Récupère le total d'enquêtes
   * GET /api/enquettes/statistiques/total
   */
  getTotalEnquetes(): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/statistiques/total`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération du total d\'enquêtes:', error);
          // Fallback: compter toutes les enquêtes
          return this.getAllEnquetes().pipe(
            map(enquetes => enquetes.length)
          );
        })
      );
  }

  /**
   * Récupère le nombre d'enquêtes par statut
   * GET /api/enquettes/statistiques/statut/{statut}
   */
  getEnquetesByStatut(statut: string): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/statistiques/statut/${statut}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des enquêtes avec statut ${statut}:`, error);
          // Fallback: filtrer côté client
          return this.getAllEnquetes().pipe(
            map(enquetes => enquetes.filter(e => e.statut === statut).length)
          );
        })
      );
  }

  /**
   * Récupère le nombre d'enquêtes validées
   * GET /api/enquettes/statistiques/valides
   */
  getEnquetesValides(): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/statistiques/valides`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des enquêtes validées:', error);
          // Fallback: filtrer côté client
          return this.getAllEnquetes().pipe(
            map(enquetes => enquetes.filter(e => e.valide === true || e.statut === 'VALIDE').length)
          );
        })
      );
  }

  /**
   * Récupère le nombre d'enquêtes non validées
   * GET /api/enquettes/statistiques/non-valides
   */
  getEnquetesNonValides(): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/statistiques/non-valides`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des enquêtes non validées:', error);
          // Fallback: filtrer côté client
          return this.getAllEnquetes().pipe(
            map(enquetes => enquetes.filter(e => e.valide === false || e.statut !== 'VALIDE').length)
          );
        })
      );
  }

  /**
   * Récupère le nombre d'enquêtes créées ce mois
   * GET /api/enquettes/statistiques/ce-mois
   */
  getEnquetesCreesCeMois(): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/statistiques/ce-mois`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des enquêtes créées ce mois:', error);
          // Fallback: filtrer côté client
          return this.getAllEnquetes().pipe(
            map(enquetes => {
              const now = new Date();
              const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              return enquetes.filter(e => {
                if (!e.dateCreation) return false;
                const dateCreation = new Date(e.dateCreation);
                return dateCreation >= firstDayOfMonth;
              }).length;
            })
          );
        })
      );
  }

  /**
   * Récupère le nombre d'enquêtes créées par un agent
   * GET /api/enquettes/statistiques/agent/{agentId}/crees
   */
  getEnquetesByAgentCreateur(agentId: number): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/statistiques/agent/${agentId}/crees`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des enquêtes créées par l'agent ${agentId}:`, error);
          // Fallback: utiliser getEnquetesByAgent
          return this.getEnquetesByAgent(agentId).pipe(
            map(enquetes => enquetes.length)
          );
        })
      );
  }

  /**
   * Récupère le nombre d'enquêtes dont un agent est responsable
   * GET /api/enquettes/statistiques/agent/{agentId}/responsable
   */
  getEnquetesByAgentResponsable(agentId: number): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/statistiques/agent/${agentId}/responsable`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération des enquêtes dont l'agent ${agentId} est responsable:`, error);
          // Fallback: filtrer côté client
          return this.getAllEnquetes().pipe(
            map(enquetes => {
              return enquetes.filter(e => {
                if (e.agentResponsableId === agentId) return true;
                if (e.agentResponsable?.id) {
                  const responsableId = Number(e.agentResponsable.id);
                  return !isNaN(responsableId) && responsableId === agentId;
                }
                return false;
              }).length;
            })
          );
        })
      );
  }
}

