import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CreancierApi, CreancierRequest, CreancierResponse, CreanciersResponse } from '../../shared/models/creancier-api.model';
import { JwtAuthService } from './jwt-auth.service';

@Injectable({
  providedIn: 'root'
})
export class CreancierApiService {
  private apiUrl = 'http://localhost:8089/carthage-creance/api/creanciers';

  constructor(
    private http: HttpClient,
    private jwtAuthService: JwtAuthService
  ) { }

  private getHeaders(): HttpHeaders {
    return this.jwtAuthService.getAuthHeaders();
  }

  // ===== CRUD OPERATIONS =====
  
  createCreancier(creancier: CreancierRequest): Observable<CreancierApi> {
    // Nettoyer et formater les données pour le backend
    const creancierData = {
      codeCreancier: creancier.codeCreancier || '',
      codeCreance: creancier.codeCreance || '',
      nom: creancier.nom,
      prenom: creancier.prenom,
      email: creancier.email,
      telephone: creancier.telephone.replace(/[^\d]/g, '').substring(0, 8), // Supprimer tous les caractères non numériques et limiter à 8 chiffres
      adresse: creancier.adresse,
      ville: creancier.ville || '',
      codePostal: creancier.codePostal || '',
      fax: creancier.fax || '0' // S'assurer que fax a une valeur par défaut
    };
    
    console.log('Données envoyées au backend:', creancierData);
    
    // Utiliser des headers simples sans authentification pour le moment
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    return this.http.post<CreancierApi>(this.apiUrl, creancierData, { headers })
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la création du créancier:', error);
          console.error('Détails de l\'erreur:', error.status, error.message);
          console.error('URL:', this.apiUrl);
          console.error('Data envoyée:', creancierData);
          console.error('Response body:', error.error);
          throw error; // Propager l'erreur pour voir le vrai problème
        })
      );
  }

  getCreancierById(id: number): Observable<CreancierApi> {
    return this.http.get<CreancierApi>(`${this.apiUrl}/${id}`);
  }

  getAllCreanciers(): Observable<CreancierApi[]> {
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
          
          const creanciers: CreancierApi[] = [];
          
          if (Array.isArray(response)) {
            response.forEach(item => {
              // Si l'item a déjà la structure d'un créancier
              if (item.id && item.nom) {
                const creancier: CreancierApi = {
                  id: item.id,
                  codeCreancier: item.codeCreancier || item.code_creancier || '',
                  codeCreance: item.codeCreance || item.code_creance || '',
                  nom: item.nom || '',
                  prenom: item.prenom || '',
                  email: item.email || '',
                  telephone: item.telephone || '',
                  adresse: item.adresse || '',
                  ville: item.ville || '',
                  codePostal: item.codePostal || item.code_postal || '',
                  fax: item.fax || ''
                };
                creanciers.push(creancier);
              }
              // Si l'item contient un créancier imbriqué
              else if (item.creancier && item.creancier.id) {
                const creancier: CreancierApi = {
                  id: item.creancier.id,
                  codeCreancier: item.creancier.codeCreancier || item.creancier.code_creancier || '',
                  codeCreance: item.creancier.codeCreance || item.creancier.code_creance || '',
                  nom: item.creancier.nom || '',
                  prenom: item.creancier.prenom || '',
                  email: item.creancier.email || '',
                  telephone: item.creancier.telephone || '',
                  adresse: item.creancier.adresse || '',
                  ville: item.creancier.ville || '',
                  codePostal: item.creancier.codePostal || item.creancier.code_postal || '',
                  fax: item.creancier.fax || ''
                };
                creanciers.push(creancier);
              }
            });
          }
          
          console.log('Créanciers extraits de la base:', creanciers);
          return creanciers;
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des créanciers:', error);
          console.error('Détails de l\'erreur:', error.status, error.message);
          console.error('URL:', this.apiUrl);
          
          // En cas d'erreur, retourner un tableau vide
          return of([]);
        })
      );
  }

  updateCreancier(id: number, creancier: CreancierRequest): Observable<CreancierApi> {
    return this.http.put<CreancierApi>(`${this.apiUrl}/${id}`, creancier);
  }

  deleteCreancier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ===== SEARCH OPERATIONS =====

  // Recherche par code créancier
  getCreancierByCode(codeCreancier: string): Observable<CreancierApi> {
    return this.http.get<CreancierApi>(`${this.apiUrl}/code/${codeCreancier}`);
  }

  // Recherche par nom
  getCreanciersByName(name: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/search/name?name=${name}`);
  }

  // Recherche par prénom
  getCreanciersByFirstName(firstName: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/search/firstname?firstName=${firstName}`);
  }

  // Recherche par nom et prénom
  getCreanciersByFullName(name: string, firstName: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/search/fullname?name=${name}&firstName=${firstName}`);
  }

  // Recherche par email
  getCreancierByEmail(email: string): Observable<CreancierApi> {
    return this.http.get<CreancierApi>(`${this.apiUrl}/email/${email}`);
  }

  // Recherche par téléphone
  getCreancierByPhone(phone: string): Observable<CreancierApi> {
    return this.http.get<CreancierApi>(`${this.apiUrl}/phone/${phone}`);
  }

  // Recherche par ville
  getCreanciersByCity(city: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/city/${city}`);
  }

  // Recherche par code postal
  getCreanciersByPostalCode(postalCode: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/postal-code/${postalCode}`);
  }

  // Recherche par ville et code postal
  getCreanciersByCityAndPostalCode(city: string, postalCode: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/city-postal?city=${city}&postalCode=${postalCode}`);
  }

  // Recherche globale
  searchCreanciers(searchTerm: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/search?searchTerm=${searchTerm}`);
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

  // Vérifier l'existence par code créancier
  existsByCode(codeCreancier: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists/code/${codeCreancier}`);
  }

  // ===== MÉTHODES UTILITAIRES =====

  // Recherche par nom (pour la création de dossiers)
  searchCreancierByName(nom: string): Observable<CreancierApi[]> {
    return this.searchCreanciers(nom);
  }
}
