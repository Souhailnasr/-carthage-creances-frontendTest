import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface Utilisateur {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  roleUtilisateur?: string; // Changé pour correspondre à ton backend
  role?: string; // Pour compatibilité temporaire
  departement?: string;
  chefId?: number;
  actif: boolean;
  dateCreation?: string;
  dateModification?: string;
  motDePasse?: string;
}

export interface UtilisateurRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  roleUtilisateur?: string; // Changé pour correspondre à ton backend
  role?: string; // Pour compatibilité temporaire
  departement?: string;
  chefId?: number;
  actif: boolean;
  motDePasse?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {
  private baseUrl = 'http://localhost:8089/carthage-creance/api'; // ✅ CORRIGÉ
  private utilisateursSubject = new BehaviorSubject<Utilisateur[]>([]);
  public utilisateurs$ = this.utilisateursSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtenir tous les utilisateurs depuis l'API backend
   */
  getAllUtilisateurs(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.baseUrl}/users`) // ✅ Donne .../api/users
      .pipe(
        tap(data => {
          this.utilisateursSubject.next(data);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir un utilisateur par ID depuis l'API backend
   */
  getUtilisateurById(id: number): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.baseUrl}/users/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Créer un nouvel utilisateur via l'API backend
   */
  createUtilisateur(utilisateur: UtilisateurRequest): Observable<Utilisateur> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Adapter la charge utile au format backend
    const payload: any = { ...utilisateur };
    if (!payload.roleUtilisateur && payload.role) {
      payload.roleUtilisateur = payload.role;
      delete payload.role;
    }
    if (!payload.motDePasse) {
      payload.motDePasse = 'password123';
    }

    console.log('🔵 UtilisateurService.createUtilisateur appelé');
    console.log('🔵 URL:', `${this.baseUrl}/users`); // ✅ CORRIGÉ
    console.log('🔵 Données envoyées:', payload);
    console.log('🔵 Headers:', headers);

    return this.http.post<Utilisateur>(`${this.baseUrl}/users`, payload, { headers })
      .pipe(
        tap(newUtilisateur => {
          console.log('✅ Utilisateur créé avec succès:', newUtilisateur);
          // Mettre à jour la liste locale après création
          const currentUtilisateurs = this.utilisateursSubject.value;
          this.utilisateursSubject.next([...currentUtilisateurs, newUtilisateur]);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Mettre à jour un utilisateur via l'API backend
   */
  updateUtilisateur(id: number, utilisateur: UtilisateurRequest): Observable<Utilisateur> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<Utilisateur>(`${this.baseUrl}/users/${id}`, utilisateur, { headers })
      .pipe(
        tap(updatedUtilisateur => {
          // Mettre à jour la liste locale après modification
          const currentUtilisateurs = this.utilisateursSubject.value;
          const index = currentUtilisateurs.findIndex(u => u.id === id);
          if (index !== -1) {
            currentUtilisateurs[index] = updatedUtilisateur;
            this.utilisateursSubject.next([...currentUtilisateurs]);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer un utilisateur via l'API backend
   */
  deleteUtilisateur(id: number): Observable<void> {
    const deleteUrl = `${this.baseUrl}/users/${id}`;
    console.log('🗑️ Suppression utilisateur - URL:', deleteUrl);
    console.log('🗑️ ID utilisateur à supprimer:', id);
    
    return this.http.delete<void>(deleteUrl)
      .pipe(
        tap(() => {
          console.log('✅ Utilisateur supprimé avec succès, ID:', id);
          // Mettre à jour la liste locale après suppression
          const currentUtilisateurs = this.utilisateursSubject.value;
          const filteredUtilisateurs = currentUtilisateurs.filter(u => u.id !== id);
          this.utilisateursSubject.next(filteredUtilisateurs);
        }),
        catchError((error) => {
          console.error('❌ Erreur lors de la suppression:', error);
          console.error('❌ URL de suppression:', deleteUrl);
          console.error('❌ Détails de l\'erreur:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message
          });
          return this.handleError(error);
        })
      );
  }


  /**
   * Rechercher des utilisateurs via l'API backend
   */
  searchUtilisateurs(searchTerm: string): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.baseUrl}/users/search?q=${encodeURIComponent(searchTerm)}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les utilisateurs par rôle via l'API backend
   */
  getUtilisateursByRole(role: string): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.baseUrl}/users/role/${role}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les agents d'un chef via l'API backend
   */
  getAgentsByChef(chefId: number): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.baseUrl}/users/chef/${chefId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Activer/Désactiver un utilisateur via l'API backend
   */
  toggleUtilisateurStatus(id: number, actif: boolean): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${this.baseUrl}/users/${id}/status`, { actif })
      .pipe(
        tap(updatedUtilisateur => {
          // Mettre à jour la liste locale après changement de statut
          const currentUtilisateurs = this.utilisateursSubject.value;
          const index = currentUtilisateurs.findIndex(u => u.id === id);
          if (index !== -1) {
            currentUtilisateurs[index] = updatedUtilisateur;
            this.utilisateursSubject.next([...currentUtilisateurs]);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les statistiques des utilisateurs via l'API backend
   */
  getUtilisateurStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/stats`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gérer les erreurs HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur dans UtilisateurService:', error);
    console.error('❌ Status:', error.status);
    console.error('❌ StatusText:', error.statusText);
    console.error('❌ URL:', error.url);
    console.error('❌ Error body:', error.error);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client (problème réseau, CORS, etc.)
      errorMessage = `Erreur réseau: ${error.error.message}`;
      console.error('❌ Erreur côté client:', error.error);
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