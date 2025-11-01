import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { DebiteurApi, DebiteurRequest, DebiteurResponse, DebiteursResponse } from '../../shared/models/debiteur-api.model';
import { JwtAuthService } from './jwt-auth.service';
import { ApiLoggerService } from './api-logger.service';

@Injectable({
  providedIn: 'root'
})
export class DebiteurApiService {
  private apiUrl = 'http://localhost:8089/carthage-creance/api/debiteurs';

  constructor(
    private http: HttpClient,
    private jwtAuthService: JwtAuthService,
    private apiLogger: ApiLoggerService
  ) { }

  /**private getHeaders(): HttpHeaders {
    return this.jwtAuthService.getAuthHeaders();
  }**/

  // ===== CRUD OPERATIONS =====
  
  createDebiteur(debiteur: DebiteurRequest): Observable<DebiteurApi> {
    this.apiLogger.logEntityCreation('Débiteur', debiteur);
    
    // Nettoyer et formater les données pour le backend
    const debiteurData = {
      type: debiteur.typeDebiteur || '',
      codeCreance: debiteur.codeCreance || '',
      nom: debiteur.nom,
      prenom: debiteur.prenom,
      email: debiteur.email,
      telephone: debiteur.telephone.replace(/[^\d]/g, '').substring(0, 8), // Supprimer tous les caractères non numériques et limiter à 8 chiffres
      adresse: debiteur.adresse,
      adresseElue: debiteur.adresseElue || '',
      ville: debiteur.ville || '',
      codePostal: debiteur.codePostal || ''
    };
    
    console.log('Données envoyées au backend:', debiteurData);
    
    // Utiliser des headers simples sans authentification pour le moment
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    return this.http.post<DebiteurApi>(this.apiUrl, debiteurData, { headers })
      .pipe(
        tap(response => {
          this.apiLogger.logEntityCreated('Débiteur', response);
        }),
        catchError(error => {
          this.apiLogger.logEntityCreationError('Débiteur', error);
          console.error('Erreur lors de la création du débiteur:', error);
          console.error('Détails de l\'erreur:', error.status, error.message);
          console.error('URL:', this.apiUrl);
          console.error('Data envoyée:', debiteurData);
          throw error; // Propager l'erreur pour voir le vrai problème
        })
      );
  }

  getDebiteurById(id: number): Observable<DebiteurApi> {
    return this.http.get<DebiteurApi>(`${this.apiUrl}/${id}`);
  }

  getAllDebiteurs(): Observable<DebiteurApi[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    console.log('=== RÉCUPÉRATION DES VRAIES DONNÉES DE LA BASE ===');
    console.log('URL API:', this.apiUrl);
    
    return this.http.get<any[]>(this.apiUrl, { headers })
      .pipe(
        map(response => {
          console.log('Réponse brute de l\'API:', response);
          
          const debiteurs: DebiteurApi[] = [];
          
          if (Array.isArray(response)) {
            response.forEach(item => {
              // Si l'item a déjà la structure d'un débiteur
              if (item.id && item.nom) {
                const debiteur: DebiteurApi = {
                  id: item.id,
                  typeDebiteur: item.type || item.typeDebiteur || undefined,
                  codeCreance: item.codeCreance || item.code_creance || '',
                  nom: item.nom || '',
                  prenom: item.prenom || '',
                  email: item.email || '',
                  telephone: item.telephone || '',
                  fax: item.fax || '',
                  adresse: item.adresse || '',
                  adresseElue: item.adresseElue || item.adresse_elue || '',
                  ville: item.ville || '',
                  codePostal: item.codePostal || item.code_postal || ''
                };
                debiteurs.push(debiteur);
              }
              // Si l'item contient un débiteur imbriqué
              else if (item.debiteur && item.debiteur.id) {
                const debiteur: DebiteurApi = {
                  id: item.debiteur.id,
                  typeDebiteur: item.debiteur.type || item.debiteur.typeDebiteur || undefined,
                  codeCreance: item.debiteur.codeCreance || item.debiteur.code_creance || '',
                  nom: item.debiteur.nom || '',
                  prenom: item.debiteur.prenom || '',
                  email: item.debiteur.email || '',
                  telephone: item.debiteur.telephone || '',
                  fax: item.debiteur.fax || '',
                  adresse: item.debiteur.adresse || '',
                  adresseElue: item.debiteur.adresseElue || item.debiteur.adresse_elue || '',
                  ville: item.debiteur.ville || '',
                  codePostal: item.debiteur.codePostal || item.debiteur.code_postal || ''
                };
                debiteurs.push(debiteur);
              }
            });
          }
          
          console.log('Débiteurs extraits de la base:', debiteurs);
          return debiteurs;
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des débiteurs:', error);
          console.error('Détails de l\'erreur:', error.status, error.message);
          console.error('URL:', this.apiUrl);
          
          // En cas d'erreur, retourner un tableau vide
          return of([]);
        })
      );
  }

  updateDebiteur(id: number, debiteur: DebiteurRequest): Observable<DebiteurApi> {
    return this.http.put<DebiteurApi>(`${this.apiUrl}/${id}`, debiteur);
  }

  deleteDebiteur(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ===== SEARCH OPERATIONS =====

  // Recherche par code créance
  getDebiteurByCode(codeCreance: string): Observable<DebiteurApi> {
    return this.http.get<DebiteurApi>(`${this.apiUrl}/code/${codeCreance}`);
  }

  // Recherche par nom
  getDebiteursByName(name: string): Observable<DebiteurApi[]> {
    return this.http.get<DebiteurApi[]>(`${this.apiUrl}/search/name?name=${name}`);
  }

  // Recherche par prénom
  getDebiteursByFirstName(firstName: string): Observable<DebiteurApi[]> {
    return this.http.get<DebiteurApi[]>(`${this.apiUrl}/search/firstname?firstName=${firstName}`);
  }

  // Recherche par nom et prénom
  getDebiteursByFullName(name: string, firstName: string): Observable<DebiteurApi[]> {
    return this.http.get<DebiteurApi[]>(`${this.apiUrl}/search/fullname?name=${name}&firstName=${firstName}`);
  }

  // Recherche par email
  getDebiteurByEmail(email: string): Observable<DebiteurApi> {
    return this.http.get<DebiteurApi>(`${this.apiUrl}/email/${email}`);
  }

  // Recherche par téléphone
  getDebiteurByPhone(phone: string): Observable<DebiteurApi> {
    return this.http.get<DebiteurApi>(`${this.apiUrl}/phone/${phone}`);
  }

  // Recherche par ville
  getDebiteursByCity(city: string): Observable<DebiteurApi[]> {
    return this.http.get<DebiteurApi[]>(`${this.apiUrl}/city/${city}`);
  }

  // Recherche par code postal
  getDebiteursByPostalCode(postalCode: string): Observable<DebiteurApi[]> {
    return this.http.get<DebiteurApi[]>(`${this.apiUrl}/postal-code/${postalCode}`);
  }

  // Recherche par ville et code postal
  getDebiteursByCityAndPostalCode(city: string, postalCode: string): Observable<DebiteurApi[]> {
    return this.http.get<DebiteurApi[]>(`${this.apiUrl}/city-postal?city=${city}&postalCode=${postalCode}`);
  }

  // Recherche des débiteurs avec adresse élue
  getDebiteursWithElectedAddress(): Observable<DebiteurApi[]> {
    return this.http.get<DebiteurApi[]>(`${this.apiUrl}/with-elected-address`);
  }

  // Recherche globale
  searchDebiteurs(searchTerm: string): Observable<DebiteurApi[]> {
    return this.http.get<DebiteurApi[]>(`${this.apiUrl}/search?searchTerm=${searchTerm}`);
  }

  // ===== VALIDATION OPERATIONS =====

  // Vérifier l'existence par email
  existsByEmail(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists/email/${email}`);
  }

  // Vérifier l'existence par téléphone
  existsByPhone(phone: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists/phone/${phone}`);
  }

  // Vérifier l'existence par code créance
  existsByCode(codeCreance: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists/code/${codeCreance}`);
  }

  // ===== MÉTHODES UTILITAIRES =====

  // Recherche par nom (pour la création de dossiers)
  searchDebiteurByName(nom: string): Observable<DebiteurApi[]> {
    return this.searchDebiteurs(nom);
  }
}
