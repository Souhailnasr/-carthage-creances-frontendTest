import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../../shared/models/user.model';
import { Role } from '../../shared/models/enums.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8089/carthage-creance/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Mock authentication for development
    return new Observable<LoginResponse>(observer => {
      setTimeout(() => {
        const mockUsers = [
          {
            id: '1',
            nom: 'Smith',
            prenom: 'Jane',
            email: 'jane.smith@carthage-creance.tn',
            role: Role.CHEF_DEPARTEMENT_DOSSIER,
            actif: true
          },
          {
            id: '2',
            nom: 'Doe',
            prenom: 'John',
            email: 'john.doe@carthage-creance.tn',
            role: Role.AGENT_DOSSIER,
            actif: true
          },
          {
            id: '3',
            nom: 'Trabelsi',
            prenom: 'Fatma',
            email: 'fatma.trabelsi@carthage-creance.tn',
            role: Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE,
            actif: true
          },
          {
            id: '4',
            nom: 'Khelil',
            prenom: 'Mohamed',
            email: 'mohamed.khelil@carthage-creance.tn',
            role: Role.SUPER_ADMIN,
            actif: true
          },
          {
            id: '5',
            nom: 'Amiable',
            prenom: 'Chef',
            email: 'chef.amiable@carthage-creance.tn',
            role: Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE,
            actif: true
          }
        ];

        const user = mockUsers.find(u => u.email === credentials.email && credentials.password === 'password123');
        
        if (user) {
          const response: LoginResponse = {
            token: 'mock-jwt-token-' + user.id,
            user: new User({ ...user }),
            expiresIn: 3600
          };
          
          this.saveUserToStorage(response.user, response.token);
          this.currentUserSubject.next(response.user);
          observer.next(response);
          observer.complete();
        } else {
          observer.error('Invalid credentials');
        }
      }, 500);
    });
  }

  authenticate(email: string, password: string): Observable<any> {
    return this.http.post(
      `http://localhost:8089/carthage-creance/auth/authenticate`,
      {
        email,
        password,
      },
      httpOptions
    );
  }

  getUserProfile(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Token non trouvé'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(`${this.apiUrl}/profile`, { headers });
  }

  register(userData: any): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    const user = this.currentUserSubject.value;
    if (!user) {
      // Essayer de charger depuis le localStorage si pas en mémoire
      this.loadUserFromStorage();
      return this.currentUserSubject.value;
    }
    return user;
  }

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  saveUserToStorage(user: User, token: string): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', token);
    this.currentUserSubject.next(user);
  }

  getRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Extrait l'ID utilisateur du token JWT
   */
  getUserIdFromToken(): string | null {
    const token = this.getToken();
    if (!token) {
      console.log('🔍 Aucun token trouvé');
      return null;
    }

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      
      console.log('🔍 Payload du token:', payload);
      
      // Chercher l'ID dans différentes propriétés possibles
      const userId = payload.sub || payload.id || payload.userId || payload.user_id || null;
      console.log('🔍 ID extrait du token:', userId);
      return userId;
    } catch (e) {
      console.error('Erreur lors du décodage du token:', e);
      return null;
    }
  }

  /**
   * Méthode alternative pour récupérer l'ID utilisateur depuis localStorage
   */
  getUserIdFromStorage(): string | null {
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('🔍 Utilisateur depuis localStorage:', user);
        return user.id || null;
      }
    } catch (e) {
      console.error('Erreur lors de la lecture du localStorage:', e);
    }
    return null;
  }

  /**
   * Récupère l'ID utilisateur depuis le backend en utilisant l'email du token
   */
  async getUserIdFromBackend(): Promise<string | null> {
    const email = this.getUserIdFromToken();
    if (!email) {
      console.log('🔍 Aucun email trouvé dans le token');
      return null;
    }

    try {
      // Appel au backend pour récupérer l'ID utilisateur par email
      const response = await fetch(`http://localhost:8089/carthage-creance/api/utilisateurs/by-email/${email}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ ID utilisateur récupéré depuis le backend:', userData.id);
        return userData.id.toString();
      } else if (response.status === 404) {
        console.warn('⚠️ Utilisateur non trouvé avec l\'email:', email);
        return null;
      } else if (response.status === 500) {
        console.error('❌ Erreur serveur 500 - Endpoint /api/utilisateurs/by-email/{email} non implémenté');
        console.error('🔧 SOLUTION: Créer l\'endpoint GET /api/utilisateurs/by-email/{email} dans le UserController');
        return null;
      } else {
        console.error('❌ Erreur lors de la récupération de l\'ID utilisateur:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'appel au backend:', error);
      return null;
    }
  }

  /**
   * Obtient l'ID utilisateur depuis le token ou l'utilisateur actuel
   */
  getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    console.log('🔍 getCurrentUserId - user:', user);
    console.log('🔍 getCurrentUserId - user.id:', user?.id);
    
    if (user && user.id && user.id !== 'null' && user.id !== 'undefined' && !isNaN(Number(user.id))) {
      console.log('✅ ID utilisateur trouvé dans user:', user.id);
      return user.id;
    }
    
    // Fallback 1: extraire depuis localStorage
    const storageId = this.getUserIdFromStorage();
    console.log('🔍 getCurrentUserId - storageId:', storageId);
    if (storageId && !isNaN(Number(storageId))) {
      return storageId;
    }
    
    // Fallback 2: essayer de récupérer depuis le backend
    console.log('⚠️ ID utilisateur non trouvé localement, tentative depuis le backend...');
    return null; // Retourner null pour forcer l'appel à getUserIdFromBackend()
  }

  /**
   * Obtient l'ID numérique de l'utilisateur (pour les APIs qui nécessitent un ID numérique)
   */
  getCurrentUserIdNumber(): number | null {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return null;
    }
    
    // Si c'est déjà un nombre, le retourner
    if (!isNaN(Number(userId))) {
      return parseInt(userId);
    }
    
    // Si c'est un email, essayer de récupérer l'ID depuis le backend
    // Pour l'instant, on retourne null pour forcer l'utilisation de getAllDossiers()
    console.log('⚠️ ID utilisateur est un email, utilisation de getAllDossiers()');
    return null;
  }

  /**
   * Vérifie si l'utilisateur peut valider des dossiers
   */
  canValidateDossiers(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const validationRoles = [
      Role.SUPER_ADMIN,
      Role.CHEF_DEPARTEMENT_DOSSIER,
      Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE,
      Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE,
      Role.CHEF_DEPARTEMENT_FINANCE
    ];
    
    return validationRoles.includes(user.role);
  }

  /**
   * Vérifie si l'utilisateur peut créer des validations
   */
  canCreateValidations(): boolean {
    return this.canValidateDossiers();
  }

  /**
   * Vérifie si l'utilisateur peut voir les statistiques de validation
   */
  canViewValidationStats(): boolean {
    return this.canValidateDossiers();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  canManageDossiers(): boolean {
    return this.hasAnyRole(['SUPER_ADMIN', 'CHEF_DEPARTEMENT_DOSSIER', 'AGENT_DOSSIER']);
  }

  canManageAgents(): boolean {
    return this.hasAnyRole(['SUPER_ADMIN', 'CHEF_DEPARTEMENT_DOSSIER']);
  }


  canCreateDossiers(): boolean {
    return this.hasAnyRole(['SUPER_ADMIN', 'CHEF_DEPARTEMENT_DOSSIER', 'AGENT_DOSSIER']);
  }


  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      // Recréer une instance de User pour récupérer les méthodes (ex: getFullName)
      const hydratedUser = new User({ ...user });
      this.currentUserSubject.next(hydratedUser);
    }
  }

  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, {})
      .pipe(
        tap(response => {
          this.saveUserToStorage(response.user, response.token);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, userData)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.saveUserToStorage(user, this.getToken()!);
        })
      );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, {
      oldPassword,
      newPassword
    });
  }

}