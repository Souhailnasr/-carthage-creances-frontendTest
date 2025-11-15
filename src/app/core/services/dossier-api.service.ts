import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { 
  DossierApi, 
  DossierRequest, 
  DossiersResponse, 
  DossierResponse,
  ValidationRequest,
  RejetRequest,
  Urgence,
  DossierStatus,
  TypeRecouvrement
} from '../../shared/models/dossier-api.model';
import { Page } from '../../shared/models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class DossierApiService {
  private apiUrl = 'http://localhost:8089/carthage-creance/api/dossiers';

  constructor(private http: HttpClient) { }

  // ==================== TYPES POUR RECHERCHE AVANCÉE ====================

  /**
   * Paramètres de recherche/filtrage combinés pour dossiers
   */
  public static readonly DEFAULT_PAGE_SIZE = 10;

  private buildSearchParams(params: AdvancedSearchParams): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      // cast sécurisée en string
      httpParams = httpParams.set(key, String(value));
    });
    return httpParams;
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Crée un nouveau dossier
   */
  createDossier(dossier: DossierRequest): Observable<DossierApi> {
    return this.http.post<DossierApi>(`${this.apiUrl}`, dossier);
  }

  /**
   * Nouvelle création: POST /create?isChef=
   */
  create(dossier: DossierRequest, isChef: boolean): Observable<DossierApi> {
    return this.http.post<DossierApi>(`${this.apiUrl}/create`, dossier, {
      params: { isChef: String(isChef) }
    });
  }

  /**
   * Création robuste: si /create renvoie un 500 (ex: Duplicate entry sur numeroDossier),
   * on régénère un numeroDossier unique et on retente sur la même route /create.
   */
  createWithFallback(dossier: DossierRequest, isChef: boolean): Observable<DossierApi> {
  return new Observable<DossierApi>(observer => {

    const tryCreate = (payload: DossierRequest, attempt: number = 1) => {
      console.log(`🔄 Tentative ${attempt} de création pour numeroDossier: ${payload.numeroDossier}`);

      // 1️⃣ Construction du FormData
      const formData = new FormData();
      formData.append('dossier', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

      // Ajouter les fichiers PDF si présents
      if (payload.contratSigneFile) formData.append('contratSigne', payload.contratSigneFile);
      if (payload.pouvoirFile) formData.append('pouvoir', payload.pouvoirFile);

      // 2️⃣ Récupérer l'ID utilisateur
      const userId = payload.agentCreateurId;
      if (!userId) {
        console.error('❌ Aucun userId trouvé (agentCreateurId)');
        observer.error('User ID manquant');
        return;
      }

      // 3️⃣ Ajouter le token JWT si disponible
      const token = sessionStorage.getItem('auth-user');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 4️⃣ Appel HTTP vers Spring Boot
      this.http.post<DossierApi>(
        `${this.apiUrl}/create/${userId}`,
        formData,
        {
          params: new HttpParams().set('isChef', isChef.toString()),
          headers: headers
        }
      ).subscribe({
        next: d => {
          console.log(`✅ Dossier créé avec succès: ${payload.numeroDossier}`);
          observer.next(d);
          observer.complete();
        },
        error: err => {
          console.warn(`❌ Erreur tentative ${attempt}:`, err);

          const msg: string = (err?.error?.error || err?.error?.message || err?.message || '').toString();

          // 5️⃣ Gestion numéro de dossier dupliqué
          const isDuplicate = msg.toLowerCase().includes('duplicate') || msg.includes('numero_dossier');

          if (err.status === 500 && isDuplicate && attempt < 3) {
            const uniqueNumero = `${payload.numeroDossier}-${Date.now().toString().slice(-6)}-${attempt}`;
            console.log(`🔄 Duplicate détecté, retry avec numeroDossier: ${uniqueNumero}`);

            const newPayload: DossierRequest = { ...payload, numeroDossier: uniqueNumero } as DossierRequest;
            tryCreate(newPayload, attempt + 1);
          } else {
            console.error(`❌ Échec définitif après ${attempt} tentatives`);
            observer.error({ message: 'Impossible de créer le dossier après plusieurs tentatives', details: err });
          }
        }
      });
    };

    tryCreate(dossier);
  });
}



  /**
   * Crée un nouveau dossier avec fichiers
   */
  createDossierWithFiles(
    dossier: DossierRequest, 
    contratSigne?: File, 
    pouvoir?: File
  ): Observable<DossierApi> {
    const formData = new FormData();
    formData.append('dossier', JSON.stringify(dossier));
    
    if (contratSigne) {
      formData.append('contratSigne', contratSigne);
    }
    if (pouvoir) {
      formData.append('pouvoir', pouvoir);
    }

    return this.http.post<DossierApi>(`${this.apiUrl}/addDossier`, formData);
  }

  /**
   * Nouvelle création avec fichiers: /create?isChef=
   * FormData keys: dossier(json), contratSigne, pouvoir
   */
  createWithFiles(
    dossier: DossierRequest,
    contratSigne: File | undefined,
    pouvoir: File | undefined,
    isChef: boolean
  ): Observable<DossierApi> {
    const formData = new FormData();
    
    // CORRECTION: Ajouter la partie 'dossier' que le backend attend comme Blob
    const dossierBlob = new Blob([JSON.stringify(dossier)], { type: 'application/json' });
    formData.append('dossier', dossierBlob);
    console.log('✅ Partie dossier ajoutée au FormData comme Blob:', JSON.stringify(dossier, null, 2));
    
    // Fichiers (clés conformes au DTO: contratSigneFile, pouvoirFile)
    if (contratSigne) formData.append('contratSigneFile', contratSigne);
    if (pouvoir) formData.append('pouvoirFile', pouvoir);

    // Log du contenu du FormData
    console.log('🔍 Contenu du FormData:');
    try {
      for (let [key, value] of (formData as any).entries()) {
        if (key === 'dossier') {
          console.log(`  ${key}:`, JSON.parse(value as string));
        } else {
          console.log(`  ${key}:`, value);
        }
      }
    } catch (error) {
      console.log('  Impossible d\'afficher le contenu du FormData');
    }

    // 🔧 CORRECTION: Ajouter le token JWT explicitement aux headers
    const token = sessionStorage.getItem('auth-user');
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Token JWT ajouté explicitement aux headers:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ Aucun token JWT trouvé dans sessionStorage');
    }

    return this.http.post<DossierApi>(`${this.apiUrl}/create`, formData, { 
      params: { isChef: String(isChef) },
      headers: headers
    });
  }


  /**
   * Récupère un dossier par ID
   */
  getDossierById(id: number): Observable<DossierApi> {
    return this.http.get<DossierApi>(`${this.apiUrl}/${id}`);
  }


  /**
   * Affecte un dossier validé au recouvrement amiable
   * PUT /api/dossiers/{dossierId}/affecter/recouvrement-amiable
   * Note: L'endpoint doit être implémenté dans le backend
   */
  affecterAuRecouvrementAmiable(dossierId: number): Observable<DossierApi> {
    const url = `${this.apiUrl}/${dossierId}/affecter/recouvrement-amiable`;
    console.log('📤 Affectation au recouvrement amiable:', url);
    
    return this.http.put<DossierApi>(url, null).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de l\'affectation au recouvrement amiable:', error);
        console.error('❌ URL appelée:', url);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.error?.message || error.message);
        console.error('❌ Détails complets:', JSON.stringify(error.error, null, 2));
        
        let errorMessage = 'Erreur lors de l\'affectation au recouvrement amiable';
        
        // Erreur 400 - Bad Request (problème de données)
        if (error.status === 400) {
          const errorDetail = error.error?.message || error.error?.error || '';
          if (errorDetail.includes('dossiers_id') || errorDetail.includes("doesn't have a default value")) {
            errorMessage = 'Erreur technique: Problème de base de données. Le champ dossiers_id n\'a pas de valeur par défaut. Veuillez contacter l\'administrateur système.';
          } else if (errorDetail.includes('dossier non validé') || errorDetail.includes('non validé')) {
            errorMessage = 'Ce dossier n\'est pas encore validé. Veuillez d\'abord valider le dossier avant de l\'affecter.';
          } else if (errorDetail.includes('chef') || errorDetail.includes('Chef')) {
            errorMessage = 'Aucun chef du département recouvrement amiable trouvé. Veuillez contacter l\'administrateur.';
          } else {
            errorMessage = errorDetail || 'Erreur lors de l\'affectation. Veuillez vérifier que le dossier est validé et qu\'un chef amiable est disponible.';
          }
        }
        // Si l'endpoint n'existe pas (404 ou 500 avec "No static resource")
        else if (error.status === 404 || (error.status === 500 && error.error?.message?.includes('No static resource'))) {
          errorMessage = 'L\'endpoint d\'affectation au recouvrement amiable n\'est pas encore disponible dans le backend. Veuillez contacter l\'administrateur.';
        } 
        // Erreur 500 - Server Error
        else if (error.status === 500) {
          const errorDetail = error.error?.message || error.error?.error || '';
          if (errorDetail.includes('dossiers_id') || errorDetail.includes("doesn't have a default value")) {
            errorMessage = 'Erreur technique: Problème de base de données. Le champ dossiers_id n\'a pas de valeur par défaut. Veuillez contacter l\'administrateur système.';
          } else {
            errorMessage = 'Erreur serveur lors de l\'affectation. Veuillez réessayer ou contacter l\'administrateur.';
          }
        }
        // Autres erreurs
        else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Affecte un dossier validé au recouvrement juridique
   * PUT /api/dossiers/{dossierId}/affecter/recouvrement-juridique
   * Note: L'endpoint doit être implémenté dans le backend
   */
  affecterAuRecouvrementJuridique(dossierId: number): Observable<DossierApi> {
    const url = `${this.apiUrl}/${dossierId}/affecter/recouvrement-juridique`;
    console.log('📤 Affectation au recouvrement juridique:', url);
    
    return this.http.put<DossierApi>(url, null).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de l\'affectation au recouvrement juridique:', error);
        console.error('❌ URL appelée:', url);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.error?.message || error.message);
        console.error('❌ Détails complets:', JSON.stringify(error.error, null, 2));
        
        let errorMessage = 'Erreur lors de l\'affectation au recouvrement juridique';
        
        // Erreur 400 - Bad Request (problème de données)
        if (error.status === 400) {
          const errorDetail = error.error?.message || error.error?.error || '';
          if (errorDetail.includes('dossiers_id') || errorDetail.includes("doesn't have a default value")) {
            errorMessage = 'Erreur technique: Problème de base de données. Le champ dossiers_id n\'a pas de valeur par défaut. Veuillez contacter l\'administrateur système.';
          } else if (errorDetail.includes('dossier non validé') || errorDetail.includes('non validé')) {
            errorMessage = 'Ce dossier n\'est pas encore validé. Veuillez d\'abord valider le dossier avant de l\'affecter.';
          } else if (errorDetail.includes('chef') || errorDetail.includes('Chef')) {
            errorMessage = 'Aucun chef du département recouvrement juridique trouvé. Veuillez contacter l\'administrateur.';
          } else {
            errorMessage = errorDetail || 'Erreur lors de l\'affectation. Veuillez vérifier que le dossier est validé et qu\'un chef juridique est disponible.';
          }
        }
        // Si l'endpoint n'existe pas (404 ou 500 avec "No static resource")
        else if (error.status === 404 || (error.status === 500 && error.error?.message?.includes('No static resource'))) {
          errorMessage = 'L\'endpoint d\'affectation au recouvrement juridique n\'est pas encore disponible dans le backend. Veuillez contacter l\'administrateur.';
        } 
        // Erreur 500 - Server Error
        else if (error.status === 500) {
          const errorDetail = error.error?.message || error.error?.error || '';
          if (errorDetail.includes('dossiers_id') || errorDetail.includes("doesn't have a default value")) {
            errorMessage = 'Erreur technique: Problème de base de données. Le champ dossiers_id n\'a pas de valeur par défaut. Veuillez contacter l\'administrateur système.';
          } else {
            errorMessage = 'Erreur serveur lors de l\'affectation. Veuillez réessayer ou contacter l\'administrateur.';
          }
        }
        // Autres erreurs
        else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Clôture un dossier validé
   * PUT /api/dossiers/{id}/cloturer
   * Note: L'endpoint doit être implémenté dans le backend
   */
  cloturerDossier(id: number): Observable<DossierApi> {
    const url = `${this.apiUrl}/${id}/cloturer`;
    console.log('📤 Clôture du dossier:', url);
    
    return this.http.put<DossierApi>(url, null).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la clôture du dossier:', error);
        console.error('❌ URL appelée:', url);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.error?.message || error.message);
        
        let errorMessage = 'Erreur lors de la clôture du dossier';
        
        // Si l'endpoint n'existe pas (404 ou 500 avec "No static resource")
        if (error.status === 404 || (error.status === 500 && error.error?.message?.includes('No static resource'))) {
          errorMessage = 'L\'endpoint de clôture de dossier n\'est pas encore disponible dans le backend. Veuillez contacter l\'administrateur.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Récupère les dossiers validés disponibles pour l'affectation
   * GET /api/dossiers/valides-disponibles
   * Note: L'endpoint doit être placé AVANT les routes avec {id} dans le backend pour éviter les conflits
   */
  getDossiersValidesDisponibles(params?: {
    page?: number;
    size?: number;
    sort?: string;
    direction?: string;
    search?: string;
  }): Observable<Page<DossierApi>> {
    let httpParams = new HttpParams();
    
    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params?.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params?.direction) {
      httpParams = httpParams.set('direction', params.direction);
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    
    // Utiliser l'URL complète pour éviter les conflits avec les routes {id}
    const url = `${this.apiUrl}/valides-disponibles`;
    console.log('📤 Requête vers:', url, 'avec params:', httpParams.toString());
    
    return this.http.get<Page<DossierApi>>(url, {
      params: httpParams
    }).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des dossiers validés:', error);
        console.error('❌ URL appelée:', url);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.error?.message || error.message);
        
        // Si l'endpoint n'existe pas (404 ou 500), fallback vers getAllDossiers avec filtre côté client
        if (error.status === 404 || error.status === 500) {
          console.warn('⚠️ Endpoint /valides-disponibles non disponible, utilisation de getAllDossiers avec filtre');
          return this.getAllDossiers(params?.page || 0, params?.size || 10).pipe(
            map(page => {
              // Filtrer uniquement les dossiers validés
              const dossiersValides = (page.content || []).filter((d: DossierApi) => 
                d.valide === true && d.statut === 'VALIDE'
              );
              
              // Appliquer la recherche côté client si nécessaire
              let filtered = dossiersValides;
              if (params?.search) {
                const searchTerm = params.search.toLowerCase();
                filtered = dossiersValides.filter((d: DossierApi) =>
                  d.numeroDossier?.toLowerCase().includes(searchTerm) ||
                  d.titre?.toLowerCase().includes(searchTerm) ||
                  d.creancier?.nom?.toLowerCase().includes(searchTerm) ||
                  d.debiteur?.nom?.toLowerCase().includes(searchTerm)
                );
              }
              
              // Appliquer le tri côté client si nécessaire
              if (params?.sort) {
                filtered.sort((a: DossierApi, b: DossierApi) => {
                  const dir = params.direction === 'ASC' ? 1 : -1;
                  if (params.sort === 'dateCreation') {
                    const dateA = new Date(a.dateCreation).getTime();
                    const dateB = new Date(b.dateCreation).getTime();
                    return (dateA - dateB) * dir;
                  }
                  if (params.sort === 'montantCreance') {
                    return ((a.montantCreance || 0) - (b.montantCreance || 0)) * dir;
                  }
                  return 0;
                });
              }
              
              // Pagination côté client
              const start = (params?.page || 0) * (params?.size || 10);
              const end = start + (params?.size || 10);
              const pagedContent = filtered.slice(start, end);
              
              return {
                content: pagedContent,
                totalElements: filtered.length,
                totalPages: Math.ceil(filtered.length / (params?.size || 10)),
                size: params?.size || 10,
                number: params?.page || 0,
                first: (params?.page || 0) === 0,
                last: (params?.page || 0) >= Math.ceil(filtered.length / (params?.size || 10)) - 1,
                empty: pagedContent.length === 0
              } as Page<DossierApi>;
            }),
            catchError(fallbackError => {
              console.error('❌ Erreur également lors du fallback:', fallbackError);
              return throwError(() => new Error('Erreur lors de la récupération des dossiers validés'));
            })
          );
        }
        
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la récupération des dossiers validés';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Récupère tous les dossiers avec pagination
   */
  /**
   * Récupère les dossiers affectés au recouvrement amiable
   * GET /api/dossiers/recouvrement-amiable
   * Note: Si l'endpoint n'existe pas, utilise getAllDossiers avec filtre côté client
   */
  getDossiersRecouvrementAmiable(page: number = 0, size: number = 10, sort?: string): Observable<Page<DossierApi>> {
    const url = `${this.apiUrl}/recouvrement-amiable`;
    console.log('📤 Récupération des dossiers recouvrement amiable:', url);
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (sort) {
      params = params.set('sort', sort);
    }
    
    return this.http.get<Page<DossierApi>>(url, { params }).pipe(
      catchError((error) => {
        // Si l'erreur est 404 ou 500 (endpoint n'existe pas), utiliser le fallback
        if (error.status === 404 || error.status === 500 || error.status === 400) {
          console.warn('⚠️ Endpoint /recouvrement-amiable non disponible, utilisation de getAllDossiers avec filtre côté client');
          // Fallback: récupérer tous les dossiers avec une taille raisonnable et filtrer côté client
          const fallbackSize = Math.min(size, 100); // Limiter à 100 pour éviter les erreurs 400
          return this.getAllDossiers(0, fallbackSize, sort).pipe(
            catchError((fallbackError) => {
              console.error('❌ Erreur également lors du fallback getAllDossiers:', fallbackError);
              // Si même le fallback échoue, retourner une page vide
              return of({
                content: [],
                totalElements: 0,
                totalPages: 0,
                size: size,
                number: page,
                first: true,
                last: true,
                empty: true
              } as Page<DossierApi>);
            }),
            map((allDossiersPage: Page<DossierApi>) => {
              // Filtrer les dossiers affectés au recouvrement amiable
              // Utiliser typeRecouvrement si disponible, sinon fallback sur heuristiques
              const filtered = allDossiersPage.content.filter(d => {
                if (d.typeRecouvrement) {
                  return d.typeRecouvrement === TypeRecouvrement.AMIABLE;
                }
                // Fallback: heuristique basée sur dossierStatus et absence d'avocat/huissier
                // Un dossier est considéré comme amiable si :
                // - Il est validé (valide === true)
                // - Il est en cours (statut === 'EN_COURS' ou dossierStatus === 'ENCOURSDETRAITEMENT')
                // - Il n'est pas clôturé (!dateCloture)
                // - Il n'a pas d'avocat ni d'huissier (pas encore passé au juridique)
                return d.valide === true && 
                       (d.statut === 'EN_COURS' || d.dossierStatus === 'ENCOURSDETRAITEMENT') &&
                       !d.dateCloture &&
                       !d.avocat &&
                       !d.huissier;
              });
              
              // Appliquer la pagination côté client si nécessaire
              const startIndex = page * size;
              const endIndex = startIndex + size;
              const paginatedContent = filtered.slice(startIndex, endIndex);
              
              return {
                content: paginatedContent,
                totalElements: filtered.length,
                totalPages: Math.ceil(filtered.length / size),
                size: size,
                number: page,
                first: page === 0,
                last: endIndex >= filtered.length,
                empty: filtered.length === 0
              } as Page<DossierApi>;
            })
          );
        }
        // Si c'est une autre erreur, la propager
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les dossiers affectés au recouvrement juridique
   * GET /api/dossiers/recouvrement-juridique
   * Note: Si l'endpoint n'existe pas, utilise getAllDossiers avec filtre côté client
   */
  getDossiersRecouvrementJuridique(page: number = 0, size: number = 10, sort?: string): Observable<Page<DossierApi>> {
    const url = `${this.apiUrl}/recouvrement-juridique`;
    console.log('📤 Récupération des dossiers recouvrement juridique:', url);
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (sort) {
      params = params.set('sort', sort);
    }
    
    return this.http.get<Page<DossierApi>>(url, { params }).pipe(
      catchError((error) => {
        // Si l'erreur est 404 ou 500 (endpoint n'existe pas), utiliser le fallback
        if (error.status === 404 || error.status === 500 || error.status === 400) {
          console.warn('⚠️ Endpoint /recouvrement-juridique non disponible, utilisation de getAllDossiers avec filtre côté client');
          // Fallback: récupérer tous les dossiers avec une taille raisonnable et filtrer côté client
          const fallbackSize = Math.min(size, 100); // Limiter à 100 pour éviter les erreurs 400
          return this.getAllDossiers(0, fallbackSize, sort).pipe(
            catchError((fallbackError) => {
              console.error('❌ Erreur également lors du fallback getAllDossiers:', fallbackError);
              // Si même le fallback échoue, retourner une page vide
              return of({
                content: [],
                totalElements: 0,
                totalPages: 0,
                size: size,
                number: page,
                first: true,
                last: true,
                empty: true
              } as Page<DossierApi>);
            }),
            map((allDossiersPage: Page<DossierApi>) => {
              // Filtrer les dossiers affectés au recouvrement juridique
              // Utiliser typeRecouvrement si disponible, sinon fallback sur heuristiques
              const filtered = allDossiersPage.content.filter(d => {
                if (d.typeRecouvrement) {
                  return d.typeRecouvrement === TypeRecouvrement.JURIDIQUE;
                }
                // Fallback: heuristique basée sur présence d'avocat ou huissier
                // Un dossier est considéré comme juridique si :
                // - Il est validé (valide === true)
                // - Il est en cours (statut === 'EN_COURS' ou dossierStatus === 'ENCOURSDETRAITEMENT')
                // - Il n'est pas clôturé (!dateCloture)
                // - Il a un avocat ou un huissier (passé au juridique)
                return d.valide === true && 
                       (d.statut === 'EN_COURS' || d.dossierStatus === 'ENCOURSDETRAITEMENT') &&
                       !d.dateCloture &&
                       (d.avocat || d.huissier);
              });
              
              // Appliquer la pagination côté client si nécessaire
              const startIndex = page * size;
              const endIndex = startIndex + size;
              const paginatedContent = filtered.slice(startIndex, endIndex);
              
              return {
                content: paginatedContent,
                totalElements: filtered.length,
                totalPages: Math.ceil(filtered.length / size),
                size: size,
                number: page,
                first: page === 0,
                last: endIndex >= filtered.length,
                empty: filtered.length === 0
              } as Page<DossierApi>;
            })
          );
        }
        // Si c'est une autre erreur, la propager
        return throwError(() => error);
      })
    );
  }

  getAllDossiers(page: number = 0, size: number = 10, sort?: string): Observable<Page<DossierApi>> {
    const params: any = {
      page: page.toString(),
      size: size.toString()
    };
    if (sort) {
      params.sort = sort;
    }
    return this.http.get<Page<DossierApi>>(this.apiUrl, { params });
  }

  /**
   * Liste filtrée: GET /?role=&userId=
   */
  list(role?: 'CHEF' | 'AGENT', userId?: number): Observable<Page<DossierApi>> {
    const params: any = {};
    if (role) params.role = role;
    if (userId !== undefined) params.userId = String(userId);
    return this.http.get<Page<DossierApi>>(this.apiUrl, { params });
  }

  /**
   * Récupère les dossiers par statut
   */
  getDossiersByStatut(statut: DossierStatus | string | undefined): Observable<DossierApi[]> {
    const status: string | undefined = typeof statut === 'string' ? statut : (statut as DossierStatus | undefined);
    const safe = status ?? '';
    return this.http.get<DossierApi[]>(`${this.apiUrl}/statut/${safe}`);
  }

  /**
   * Met à jour un dossier
   */
  updateDossier(id: number, dossier: DossierApi): Observable<DossierApi> {
    return this.http.put<DossierApi>(`${this.apiUrl}/${id}`, dossier);
  }

  /**
   * Supprime un dossier
   */
  deleteDossier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ==================== SEARCH OPERATIONS ====================

  /**
   * Recherche par numéro de dossier
   */
  getDossierByNumber(numeroDossier: string): Observable<DossierApi> {
    return this.http.get<DossierApi>(`${this.apiUrl}/number/${numeroDossier}`);
  }

  /**
   * Recherche par titre
   */
  getDossiersByTitle(title: string): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/search/title`, {
      params: { title }
    });
  }

  /**
   * Recherche par description
   */
  getDossiersByDescription(description: string): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/search/description`, {
      params: { description }
    });
  }

  /**
   * Recherche par urgence
   */
  getDossiersByUrgency(urgency: Urgence): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/urgency/${urgency}`);
  }

  /**
   * Recherche par créancier
   */
  getDossiersByCreancier(creancierId: number): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/creancier/${creancierId}`);
  }

  /**
   * Recherche par débiteur
   */
  getDossiersByDebiteur(debiteurId: number): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/debiteur/${debiteurId}`);
  }

  /**
   * Recherche par utilisateur
   */
  getDossiersByUser(userId: number): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Recherche globale
   */
  searchDossiers(searchTerm: string): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/search`, {
      params: { searchTerm }
    });
  }

  /**
   * Recherche simplifiée: GET /search?term=
   */
  search(term: string): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/search`, { params: { term } });
  }

  // ==================== SPECIAL OPERATIONS ====================

  /**
   * Récupère les dossiers ouverts
   */
  getOpenDossiers(): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/open`);
  }

  /**
   * Récupère les dossiers fermés
   */
  getClosedDossiers(): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/closed`);
  }

  /**
   * Récupère les dossiers récents
   */
  getRecentDossiers(): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/recent`);
  }

  /**
   * Téléverse un fichier PDF (contrat ou pouvoir) pour un dossier existant
   */
  uploadPdf(
    dossierId: number,
    type: 'contratSigne' | 'pouvoir',
    file: File
  ): Observable<DossierApi> {
    const formData = new FormData();
    formData.append(type, file);
    return this.http.post<DossierApi>(`${this.apiUrl}/${dossierId}/upload-${type}`, formData);
  }

  /**
   * Uploads dédiés: POST /{id}/upload/contrat|pouvoir avec clé 'file'
   */
  uploadContrat(dossierId: number, file: File): Observable<DossierApi> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<DossierApi>(`${this.apiUrl}/${dossierId}/upload/contrat`, fd);
  }

  uploadPouvoir(dossierId: number, file: File): Observable<DossierApi> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<DossierApi>(`${this.apiUrl}/${dossierId}/upload/pouvoir`, fd);
  }

  /**
   * Supprime un fichier PDF (contrat ou pouvoir) d'un dossier
   */
  deletePdf(
    dossierId: number,
    type: 'contratSigne' | 'pouvoir'
  ): Observable<DossierApi> {
    return this.http.delete<DossierApi>(`${this.apiUrl}/${dossierId}/delete-${type}`);
  }

  deleteContrat(dossierId: number): Observable<DossierApi> {
    return this.http.delete<DossierApi>(`${this.apiUrl}/${dossierId}/upload/contrat`);
  }

  deletePouvoir(dossierId: number): Observable<DossierApi> {
    return this.http.delete<DossierApi>(`${this.apiUrl}/${dossierId}/upload/pouvoir`);
  }

  /**
   * Vérifie l'existence d'un numéro de dossier
   */
  existsByNumber(numeroDossier: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists/number/${numeroDossier}`);
  }

  // ==================== WORKFLOW OPERATIONS ====================

  /**
   * Récupère les dossiers en attente de validation
   */
  getDossiersEnAttente(): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/en-attente`);
  }

  /**
   * Récupère les dossiers assignés à un agent
   */
  getDossiersByAgent(agentId: number): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/agent/${agentId}`);
  }

  /**
   * Récupère les dossiers créés par un agent (sans pagination - alternative)
   * Utilise l'endpoint /agent/{agentId}/crees sans paramètres de pagination
   */
  getDossiersCreesByAgentSimple(agentId: number): Observable<DossierApi[]> {
    console.log('🔍 DossierApiService.getDossiersCreesByAgentSimple appelé avec agentId:', agentId);
    const url = `${this.apiUrl}/agent/${agentId}/crees`;
    console.log('🔍 URL simple:', url);
    
    return this.http.get<DossierApi[]>(url).pipe(
      tap(response => {
        console.log('✅ Réponse API getDossiersCreesByAgentSimple:', response);
        console.log('✅ Type:', Array.isArray(response) ? 'Array' : typeof response);
        console.log('✅ Nombre de dossiers:', Array.isArray(response) ? response.length : 0);
        if (Array.isArray(response) && response.length > 0) {
          console.log('✅ Premier dossier:', response[0]);
          console.log('✅ Agent créateur du premier dossier:', response[0]?.agentCreateur);
        }
      }),
      catchError(error => {
        console.error('❌ Erreur dans getDossiersCreesByAgentSimple:', error);
        return of([]);
      })
    );
  }

  /**
   * Récupère les dossiers créés par un agent avec pagination
   */
  getDossiersCreesByAgent(agentId: number, page: number = 0, size: number = 10, sort?: string): Observable<Page<DossierApi>> {
    console.log('🔍 DossierApiService.getDossiersCreesByAgent appelé avec:', { agentId, page, size, sort });
    
    if (!agentId || isNaN(agentId)) {
      console.error('❌ AgentId invalide:', agentId);
      throw new Error(`AgentId invalide: ${agentId}`);
    }
    
    const params: any = {
      page: page.toString(),
      size: size.toString()
    };
    if (sort) {
      params.sort = sort;
    }
    
    const url = `${this.apiUrl}/agent/${agentId}/crees`;
    console.log('🔍 URL complète:', url);
    console.log('🔍 Paramètres:', params);
    
    return this.http.get<any>(url, { params }).pipe(
      map((response: any) => {
        console.log('✅ Réponse API brute getDossiersCreesByAgent:', response);
        console.log('✅ Type de réponse:', Array.isArray(response) ? 'Array' : typeof response);
        
        // Si la réponse est un tableau directement
        if (Array.isArray(response)) {
          console.log('✅ Réponse est un tableau, conversion en Page');
          const pageResponse: Page<DossierApi> = {
            content: response,
            totalElements: response.length,
            totalPages: Math.ceil(response.length / size),
            size: size,
            number: page,
            first: page === 0,
            last: page >= Math.ceil(response.length / size) - 1,
            empty: response.length === 0
          };
          console.log('✅ Page convertie:', pageResponse);
          console.log('✅ Nombre de dossiers:', pageResponse.content.length);
          if (pageResponse.content.length > 0) {
            console.log('✅ Premier dossier:', pageResponse.content[0]);
          }
          return pageResponse;
        }
        
        // Si la réponse est déjà un objet Page
        if (response && response.content !== undefined) {
          console.log('✅ Réponse est déjà un objet Page');
          console.log('✅ Nombre de dossiers:', response.content?.length || 0);
          if (response.content && response.content.length > 0) {
            console.log('✅ Premier dossier:', response.content[0]);
          }
          return response as Page<DossierApi>;
        }
        
        // Si la réponse est vide ou invalide
        console.warn('⚠️ Format de réponse inattendu, création d\'une Page vide');
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: size,
          number: page,
          first: true,
          last: true,
          empty: true
        } as Page<DossierApi>;
      }),
      catchError(error => {
        console.error('❌ Erreur dans getDossiersCreesByAgent:', error);
        // Retourner une Page vide en cas d'erreur
        return of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: size,
          number: page,
          first: true,
          last: true,
          empty: true
        } as Page<DossierApi>);
      })
    );
  }

  /**
   * Filtrage par statut de validation: GET /status/{statut}
   */
  byValidationStatut(statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE'): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/status/${statut}`);
  }

  /**
   * Valide un dossier
   */
  validerDossier(dossierId: number, chefId: number): Observable<DossierApi> {
    return this.http.put<DossierApi>(`${this.apiUrl}/${dossierId}/valider`, null, {
      params: { chefId: chefId.toString() }
    });
  }

  /**
   * Alias attendu par certains composants (validateDossier)
   */
  validateDossier(dossierId: number, chefId: number): Observable<DossierApi> {
    return this.validerDossier(dossierId, chefId);
  }

  /**
   * Rejette un dossier
   */
  rejeterDossier(dossierId: number, commentaire: string): Observable<DossierApi> {
    return this.http.put<DossierApi>(`${this.apiUrl}/${dossierId}/rejeter`, null, {
      params: { commentaire }
    });
  }

  /**
   * Alias attendu par certains composants (rejectDossier)
   */
  rejectDossier(dossierId: number, commentaire: string): Observable<DossierApi> {
    return this.rejeterDossier(dossierId, commentaire);
  }

  // ==================== STATISTIQUES ====================

  /**
   * Compte le total des dossiers
   */
  countTotalDossiers(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/total`);
  }

  /**
   * Compte les dossiers en cours
   */
  countDossiersEnCours(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/en-cours`);
  }

  /**
   * Compte les dossiers validés
   */
  countDossiersValides(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/valides`);
  }

  /**
   * Compte les dossiers créés ce mois
   */
  countDossiersCreesCeMois(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/ce-mois`);
  }

  /**
   * Statistiques unifiées: GET /stats?role=&agentId=
   */
  stats(role?: 'CHEF' | 'AGENT', agentId?: number): Observable<any> {
    const params: any = {};
    if (role) params.role = role;
    if (agentId !== undefined) params.agentId = String(agentId);
    return this.http.get<any>(`${this.apiUrl}/stats`, { params });
  }

  /**
   * Compte les dossiers par agent
   */
  countDossiersByAgent(agentId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/agent/${agentId}`);
  }

  /**
   * Compte les dossiers créés par un agent
   */
  countDossiersCreesByAgent(agentId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/agent/${agentId}/crees`);
  }

  // ==================== FILTRES AVANCÉS ====================

  /**
   * Recherche par date de création
   */
  getDossiersByCreationDate(date: string): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/creation-date/${date}`);
  }

  /**
   * Recherche par plage de dates
   */
  getDossiersByCreationDateRange(startDate: string, endDate: string): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/creation-date-range`, {
      params: { startDate, endDate }
    });
  }

  /**
   * Recherche par montant
   */
  getDossiersByAmount(amount: number): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/amount/${amount}`);
  }

  /**
   * Recherche par plage de montants
   */
  getDossiersByAmountRange(minAmount: number, maxAmount: number): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/amount-range`, {
      params: { minAmount: minAmount.toString(), maxAmount: maxAmount.toString() }
    });
  }

  /**
   * Recherche avancée combinable via query params optionnels
   */
  searchAdvanced(params: AdvancedSearchParams): Observable<DossiersResponse> {
    const httpParams = this.buildSearchParams(params);
    return this.http.get<DossiersResponse>(`${this.apiUrl}/search/advanced`, { params: httpParams });
  }

  /**
   * Méthode conviviale pour effectuer une recherche combinée avec pagination/tri
   */
  combinedSearch(options: {
    query?: string;
    filters?: Omit<AdvancedSearchParams, 'page' | 'size' | 'sort' | 'searchTerm'>;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<DossiersResponse> {
    const { query, filters = {}, page = 0, size = DossierApiService.DEFAULT_PAGE_SIZE, sort } = options;
    const params: AdvancedSearchParams = {
      ...filters,
      page,
      size,
      sort,
      // autoriser aussi une clé générique "searchTerm" côté backend si supportée
      searchTerm: query
    };
    return this.searchAdvanced(params);
  }
}

// Types exportés pour les appels avancés
export interface AdvancedSearchParams {
  numero?: string;
  titre?: string;
  description?: string;
  searchTerm?: string;
  agentId?: number;
  creancierId?: number;
  debiteurId?: number;
  minMontant?: number;
  maxMontant?: number;
  urgence?: Urgence;
  dateCreationDebut?: string; // ISO date
  dateCreationFin?: string;   // ISO date
  dateClotureDebut?: string;  // ISO date
  dateClotureFin?: string;    // ISO date
  statut?: DossierStatus | string;
  page?: number;              // 0-based
  size?: number;              // page size
  sort?: string;              // e.g. "dateCreation,desc"
}
