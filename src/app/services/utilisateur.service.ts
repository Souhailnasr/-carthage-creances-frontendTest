import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { JwtAuthService } from '../core/services/jwt-auth.service';

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
  chefCreateur?: Utilisateur; // Chef qui a créé cet agent
  chef_createur_id?: number; // Format snake_case retourné par le backend
  chefCreateurId?: number; // Format camelCase alternatif
  actif: boolean;
  derniereConnexion?: string | null;
  derniereDeconnexion?: string | null;
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
  derniereConnexion?: string | null;
  derniereDeconnexion?: string | null;
  motDePasse?: string;
}

export interface AuthenticationResponse {
  token: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {
  private baseUrl = 'http://localhost:8089/carthage-creance/api'; // ✅ CORRIGÉ
  private utilisateursSubject = new BehaviorSubject<Utilisateur[]>([]);
  public utilisateurs$ = this.utilisateursSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService
  ) {}

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
   * Alias pour getAllUtilisateurs (compatibilité)
   */
  getAllUsers(): Observable<Utilisateur[]> {
    return this.getAllUtilisateurs();
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
   * Retourne maintenant AuthenticationResponse avec token JWT
   * Ajoute automatiquement le chefId si c'est un agent créé par un chef
   */
  createUtilisateur(utilisateur: UtilisateurRequest): Observable<AuthenticationResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Adapter la charge utile au format backend
    const payload: any = { ...utilisateur };
    
    // 🔧 CORRECTION: Retirer les champs non reconnus par le backend
    // Le backend ne reconnaît pas "departement" dans l'entité Utilisateur
    delete payload.departement;
    
    // 🔧 CORRECTION: Normaliser le rôle - utiliser uniquement roleUtilisateur
    // Le backend ne reconnaît que "roleUtilisateur", pas "role"
    if (payload.role && !payload.roleUtilisateur) {
      payload.roleUtilisateur = payload.role;
    }
    // Retirer "role" car le backend ne le reconnaît pas
    delete payload.role;
    
    // 🆕 NOUVEAU: Si c'est un agent, ajouter automatiquement le chefId du chef connecté
    if (this.isAgent(payload.roleUtilisateur)) {
      // Méthode 1: Essayer de récupérer l'ID depuis JwtAuthService (le plus fiable)
      let currentUserId: number | null = this.jwtAuthService.getCurrentUserId();
      
      // Méthode 2: Si JwtAuthService ne fonctionne pas, essayer AuthService
      if (!currentUserId) {
        currentUserId = this.authService.getCurrentUserIdNumber();
      }
      
      // Méthode 3: Si toujours pas d'ID, essayer de récupérer depuis currentUser
      if (!currentUserId) {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.id) {
          const parsedId = parseInt(currentUser.id.toString());
          if (!isNaN(parsedId)) {
            currentUserId = parsedId;
          }
        }
      }
      
      // Vérifier que l'utilisateur est un chef ou super admin
      const currentUser = this.authService.getCurrentUser();
      const userRole = currentUser?.roleUtilisateur?.toString();
      const roleAuthority = this.jwtAuthService.loggedUserAuthority();
      
      // Vérifier le rôle depuis currentUser ou depuis le token
      const isChefRole = userRole ? this.isChef(userRole) : (roleAuthority ? this.isChef(roleAuthority.replace(/^RoleUtilisateur_/, '')) : false);
      const isSuperAdmin = userRole === 'SUPER_ADMIN' || roleAuthority?.includes('SUPER_ADMIN');
      
      if (!isChefRole && !isSuperAdmin) {
        return throwError(() => new Error('Seuls les chefs et super admins peuvent créer des agents.'));
      }
      
      if (!currentUserId) {
        console.error('❌ Impossible de récupérer l\'ID de l\'utilisateur connecté');
        return throwError(() => new Error('Impossible de récupérer l\'ID de l\'utilisateur connecté. Veuillez vous reconnecter.'));
      }
      
      // Si le chefId n'est pas déjà fourni, l'ajouter automatiquement
      if (!payload.chefId) {
        payload.chefId = currentUserId;
      }
    }
    
    // Le mot de passe sera crypté côté backend, on l'envoie tel quel
    if (!payload.motDePasse) {
      payload.motDePasse = 'password123'; // Mot de passe par défaut
    }

    // Validation des champs requis
    if (!payload.nom || !payload.prenom || !payload.email || !payload.roleUtilisateur) {
      console.error('❌ Champs requis manquants:', {
        nom: payload.nom,
        prenom: payload.prenom,
        email: payload.email,
        roleUtilisateur: payload.roleUtilisateur
      });
      return throwError(() => new Error('Champs requis manquants pour la création d\'utilisateur'));
    }

    // Validation spécifique pour les agents : ils doivent avoir un chefId
    if (this.isAgent(payload.roleUtilisateur) && !payload.chefId) {
      console.error('❌ Un agent doit être rattaché à un chef créateur (chefId manquant)');
      return throwError(() => new Error('Un agent doit être rattaché à un chef créateur. Veuillez contacter l\'administrateur.'));
    }

    console.log('🔵 UtilisateurService.createUtilisateur appelé');
    console.log('🔵 URL:', `${this.baseUrl}/users`);
    console.log('🔵 Données envoyées:', JSON.stringify(payload, null, 2));
    console.log('🔵 Headers:', headers);

    return this.http.post<AuthenticationResponse>(`${this.baseUrl}/users`, payload, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Utilisateur créé avec succès');
          console.log('✅ Token reçu:', response.token ? 'OUI' : 'NON');
          console.log('✅ Erreurs éventuelles:', response.errors);
          
          if (!response.token) {
            console.warn('⚠️ Aucun token reçu dans la réponse');
          }
          
          // Recharger la liste des utilisateurs après création
          this.getAllUtilisateurs().subscribe();
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Vérifie si un rôle est un agent
   */
  private isAgent(role: string | undefined): boolean {
    if (!role) return false;
    return role.startsWith('AGENT_');
  }

  /**
   * Vérifie si un rôle est un chef
   */
  private isChef(role: string | undefined): boolean {
    if (!role) return false;
    return role.startsWith('CHEF_');
  }

  /**
   * Mettre à jour un utilisateur via l'API backend
   */
  updateUtilisateur(id: number, utilisateur: UtilisateurRequest): Observable<Utilisateur> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // 🔧 CORRECTION: Retirer les champs non reconnus par le backend
    const payload: any = { ...utilisateur };
    delete payload.departement; // Le backend ne reconnaît pas "departement" dans l'entité Utilisateur
    delete payload.role; // Le backend ne reconnaît que "roleUtilisateur", pas "role"
    
    // Normaliser le rôle si nécessaire
    if (payload.role && !payload.roleUtilisateur) {
      payload.roleUtilisateur = payload.role;
      delete payload.role;
    }

    return this.http.put<Utilisateur>(`${this.baseUrl}/users/${id}`, payload, { headers })
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
    const url = `${this.baseUrl}/users/chef/${chefId}`;
    
    return this.http.get<Utilisateur[]>(url)
      .pipe(
        tap(agents => {
          const count = agents?.length || 0;
          if (count === 0) {
            console.warn('⚠️ Aucun agent trouvé pour le chef ID:', chefId);
          }
        }),
        catchError((error) => {
          console.error('❌ Erreur getAgentsByChef:', {
            url,
            status: error?.status,
            message: error?.error?.message || error?.message,
            chefId
          });
          
          // Améliorer le message d'erreur selon le statut
          if (error?.status === 403 || error?.status === 401) {
            const errorMsg = error?.error?.message || error?.message || 'Accès non autorisé';
            return throwError(() => new Error(`Accès non autorisé: ${errorMsg}`));
          } else if (error?.status === 404) {
            return throwError(() => new Error(`Endpoint non trouvé: ${url}. Vérifiez que le backend expose bien GET /api/users/chef/{chefId}`));
          } else if (error?.status === 500) {
            const errorMsg = error?.error?.message || error?.message || 'Erreur serveur interne';
            return throwError(() => new Error(`Erreur serveur lors du chargement des agents (${errorMsg})`));
          }
          return this.handleError(error);
        })
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
        // Analyser l'erreur 500 plus en détail
        if (error.error && error.error.errors && Array.isArray(error.error.errors)) {
          errorMessage = `Erreur serveur: ${error.error.errors.join(', ')}`;
        } else if (error.error && error.error.message) {
          errorMessage = `Erreur serveur: ${error.error.message}`;
        } else {
          errorMessage = 'Erreur serveur interne. Vérifiez les logs du backend.';
        }
        console.error('❌ Détails de l\'erreur 500:', {
          message: error.error?.message,
          errors: error.error?.errors,
          token: error.error?.token
        });
      } else if (error.status === 400) {
        errorMessage = 'Données invalides. Vérifiez les informations saisies.';
        if (error.error && error.error.errors) {
          errorMessage += ` Détails: ${error.error.errors.join(', ')}`;
        }
      } else {
        errorMessage = `Erreur ${error.status}: ${error.error?.message || error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}

