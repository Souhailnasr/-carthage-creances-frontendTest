import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User } from '../../shared/models/user.model';
import { Role } from '../../shared/models/enums.model';
import { ToastService } from './toast.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;      // ✅ ID utilisateur du backend
  email: string;        // ✅ Email utilisateur
  nom: string;          // ✅ Nom utilisateur
  prenom: string;       // ✅ Prénom utilisateur
  role: string;         // ✅ Rôle utilisateur
  errors?: string[];
}

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8089/carthage-creance/auth';
  private usersApi = 'http://localhost:8089/carthage-creance/api/users';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private toastService: ToastService) {
    // 🔧 CORRECTION: Vérifier d'abord si le token est expiré avant de charger
    const rawToken = localStorage.getItem('token');
    if (rawToken && this.isTokenExpired(rawToken)) {
      console.warn('⚠️ Token expiré détecté au démarrage, nettoyage');
      this.logout(); // Nettoie tout
      return; // Ne pas charger l'utilisateur si le token est expiré
    }
    
    this.loadUserFromStorage();
    const token = this.getToken(); // getToken() vérifie l'expiration et nettoie si nécessaire
    const user = this.currentUserSubject.value as User | null;
    const userIdMissing = !user || user.id === null || user.id === undefined || user.id === 'null' || user.id === 'undefined';
    
    // Si un token valide existe et que l'utilisateur est manquant OU a un id invalide, rafraîchir depuis /api/users/me
    if (token && userIdMissing) {
      this.fetchCurrentUserFromMe().catch(() => {});
    }
  }


  /**
   * Récupère l'utilisateur courant depuis l'endpoint protégé /api/users/me
   * et le stocke comme source de vérité dans currentUser/localStorage
   */
  async fetchCurrentUserFromMe(): Promise<User | null> {
    const token = this.getToken(); // getToken() vérifie déjà l'expiration
    if (!token) {
      console.warn('⚠️ Aucun token valide disponible pour /api/users/me');
      return null;
    }

    try {
      const res = await fetch(`${this.usersApi}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // 🔧 CORRECTION: Gestion spéciale des 401 (token expiré/invalide)
      if (res.status === 401) {
        console.error('❌ 401 Unauthorized - Token expiré ou invalide');
        console.error('🔧 Nettoyage du localStorage et redirection vers login');
        
        // Nettoyer complètement le localStorage
        this.logout();
        
        // Optionnel: rediriger vers login (si Router injecté)
        // Note: On ne peut pas injecter Router ici car c'est un service,
        // mais l'interceptor gérera la redirection
        
        return null;
      }

      if (!res.ok) {
        console.error('❌ /api/users/me a échoué:', res.status, res.statusText);
        return null;
      }

      const me = await res.json();
      // Normaliser vers le modèle User
      const user = new User({
        id: (me.id ?? me.userId ?? me.user_id).toString(),
        email: me.email,
        nom: me.nom,
        prenom: me.prenom,
        roleUtilisateur: this.mapRoleFromBackend(me.role)
      });

      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      console.log('✅ Profil /me chargé et stocké:', user);
      return user;
    } catch (e) {
      console.error('❌ Erreur réseau /api/users/me:', e);
      
      // Si c'est une erreur liée à l'authentification, nettoyer
      if (e instanceof Error && e.message.includes('401')) {
        console.error('🔧 Erreur 401 détectée, nettoyage du localStorage');
        this.logout();
      }
      
      return null;
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('🔐 Tentative de connexion avec:', credentials.email);
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/authenticate`, credentials)
      .pipe(
        tap(response => {
          console.log('✅ Réponse d\'authentification complète:', response);
          
          // 🔧 CORRECTION: Utiliser DIRECTEMENT les données de la réponse d'authentification
          // Le backend retourne déjà userId, email, nom, prenom, role, token
          
          // Validation des champs requis
          const requiredFields = ['email', 'nom', 'prenom', 'role', 'token', 'userId'];
          const missingFields = requiredFields.filter(field => {
            const value = response[field as keyof LoginResponse];
            return !value || (field === 'userId' && (value === null || value === undefined || isNaN(Number(value))));
          });
          
          if (missingFields.length > 0) {
            console.error('❌ Champs manquants dans la réponse:', missingFields);
            this.toastService.error(`Données utilisateur incomplètes. Champs manquants: ${missingFields.join(', ')}`);
            throw new Error(`Champs manquants: ${missingFields.join(', ')}`);
          }
          
          // ✅ Créer l'utilisateur DIRECTEMENT depuis la réponse (pas besoin d'appeler /api/users/me)
          const user = new User({
            id: response.userId!.toString(), // userId est garanti non-null grâce à la validation
            email: response.email!,
            nom: response.nom!,
            prenom: response.prenom!,
            roleUtilisateur: this.mapRoleFromBackend(response.role!),
            actif: true
          });
          
          console.log('✅ Utilisateur créé depuis la réponse d\'authentification:', user);
          console.log('✅ ID utilisateur:', user.id);
          console.log('✅ Nom:', user.nom);
          console.log('✅ Prénom:', user.prenom);
          console.log('✅ Email:', user.email);
          console.log('✅ Rôle:', user.roleUtilisateur);
          
          // 🔧 CORRECTION: Stocker le token ET l'utilisateur IMMÉDIATEMENT
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          
          console.log('✅ Token et utilisateur stockés dans localStorage');
          this.toastService.success(`Connexion réussie. Bienvenue ${user.getFullName()} !`);
          
          // Optionnel: Appeler /api/users/me en arrière-plan pour synchroniser (mais pas bloquant)
          // Cela permet de s'assurer que les données sont à jour, mais on n'attend pas le résultat
          this.fetchCurrentUserFromMe()
            .then(updatedUser => {
              if (updatedUser && updatedUser.id) {
                console.log('✅ Profil mis à jour depuis /api/users/me:', updatedUser);
                // Le currentUser a déjà été mis à jour par fetchCurrentUserFromMe()
              }
            })
            .catch(error => {
              // Pas grave si /me échoue, on a déjà les données de la réponse d'authentification
              console.warn('⚠️ /api/users/me a échoué (non bloquant):', error);
            });
        }),
        catchError(error => {
          console.error('❌ Erreur de connexion API:', error);
          this.toastService.error('Erreur de connexion. Vérifiez vos identifiants.');
          return throwError(() => error);
        })
      );
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
    console.log('🔐 Déconnexion - Nettoyage du localStorage');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    // Nettoyer aussi les autres clés potentielles
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('auth-user');
    sessionStorage.removeItem('token');
    this.currentUserSubject.next(null);
    console.log('✅ localStorage nettoyé');
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

  /**
   * Retourne un Observable de l'utilisateur actuel pour s'abonner aux changements
   */
  getCurrentUserObservable(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  saveUserToStorage(user: User, token: string): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', token);
    this.currentUserSubject.next(user);
    console.log('✅ Utilisateur sauvegardé:', user);
  }

  getRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.roleUtilisateur : null;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Vérifie si un token JWT est expiré
   */
  isTokenExpired(token: string): boolean {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        console.warn('⚠️ Token malformé: pas de payload');
        return true;
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      
      // Vérifier si le token a une date d'expiration
      if (!payload.exp) {
        console.warn('⚠️ Token sans date d\'expiration');
        return true; // Considérer comme expiré par sécurité
      }
      
      // exp est en secondes Unix, convertir en millisecondes
      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();
      const isExpired = expirationDate < now;
      
      if (isExpired) {
        const diffMs = now.getTime() - expirationDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        console.error(`❌ Token expiré depuis ${diffDays} jour(s). Expiré le: ${expirationDate.toISOString()}, Date actuelle: ${now.toISOString()}`);
      }
      
      return isExpired;
    } catch (e) {
      console.error('❌ Erreur lors de la vérification d\'expiration du token:', e);
      return true; // En cas d'erreur, considérer comme expiré
    }
  }

  /**
   * Récupère le token uniquement s'il est valide et non expiré
   */
  getToken(): string | null {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    // Vérifier si le token est expiré
    if (this.isTokenExpired(token)) {
      console.error('❌ Token expiré détecté, nettoyage du localStorage');
      this.logout(); // Nettoie token et currentUser
      return null;
    }
    
    return token;
  }


  /**
   * Mappe le rôle depuis la réponse du backend
   */
  private mapRoleFromBackend(roleString: string | undefined): Role {
    if (!roleString) return Role.AGENT_DOSSIER;
    
    switch (roleString.toUpperCase()) {
      case 'SUPER_ADMIN':
        return Role.SUPER_ADMIN;
      case 'CHEF_DEPARTEMENT_DOSSIER':
        return Role.CHEF_DEPARTEMENT_DOSSIER;
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
        return Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE;
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        return Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE;
      case 'CHEF_DEPARTEMENT_FINANCE':
        return Role.CHEF_DEPARTEMENT_FINANCE;
      case 'AGENT_DOSSIER':
        return Role.AGENT_DOSSIER;
      case 'AGENT_RECOUVREMENT_AMIABLE':
        return Role.AGENT_RECOUVREMENT_AMIABLE;
      case 'AGENT_RECOUVREMENT_JURIDIQUE':
        return Role.AGENT_RECOUVREMENT_JURIDIQUE;
      case 'AGENT_FINANCE':
        return Role.AGENT_FINANCE;
      default:
        return Role.AGENT_DOSSIER;
    }
  }

  /**
   * Récupère l'ID utilisateur de manière robuste
   */
  getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    if (!user) {
      console.warn('⚠️ Aucun utilisateur connecté');
      return null;
    }
    
    if (!user.id || user.id === 'null' || user.id === 'undefined') {
      console.error('❌ ID utilisateur invalide dans l\'objet utilisateur:', user.id);
      return null;
    }
    
    console.log('✅ ID utilisateur récupéré:', user.id);
    return user.id;
  }

  /**
   * Récupère l'ID utilisateur numérique pour les APIs backend
   */
  getCurrentUserIdNumber(): number | null {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return null;
    }
    
    const numericId = parseInt(userId);
    if (isNaN(numericId)) {
      console.error('❌ ID utilisateur non numérique:', userId);
      return null;
    }
    
    return numericId;
  }
  /**
   * Extrait l'ID utilisateur depuis un token JWT
   */
  extractUserIdFromToken(token: string): string | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      
      console.log('🔍 Payload du token:', payload);
      
      // Chercher l'ID dans différentes propriétés possibles
      const userId = payload.userId || payload.id || payload.user_id || payload.sub || null;
      console.log('🔍 ID extrait du token:', userId);
      
      // Si c'est un email (sub), essayer de récupérer l'ID depuis le backend
      if (userId && userId.includes('@')) {
        console.log('🔍 Email trouvé dans le token, récupération de l\'ID depuis le backend...');
        return null; // On laissera le fallback backend gérer cela
      }
      
      return userId ? userId.toString() : null;
    } catch (e) {
      console.error('Erreur lors du décodage du token:', e);
      return null;
    }
  }

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
   * Récupère les données complètes utilisateur depuis le backend
   */
  async getCompleteUserDataFromBackend(email: string): Promise<any | null> {
    try {
      console.log('🔍 Tentative de récupération des données complètes utilisateur pour l\'email:', email);

      const response = await fetch(`http://localhost:8089/carthage-creance/api/utilisateurs/by-email/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Données utilisateur complètes récupérées depuis le backend:', userData);
        return userData;
      } else if (response.status === 404) {
        console.warn('⚠️ Utilisateur non trouvé avec l\'email:', email);
        return null;
      } else {
        console.error('❌ Erreur lors de la récupération des données utilisateur:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'appel au backend:', error);
      return null;
    }
  }

  /**
   * Récupère l'ID utilisateur depuis le backend de manière synchrone (pour la connexion)
   */
  async getUserIdFromBackendSync(email: string): Promise<string | null> {
    try {
      console.log('🔍 Tentative de récupération de l\'ID utilisateur pour l\'email:', email);

      const response = await fetch(`http://localhost:8089/carthage-creance/api/utilisateurs/by-email/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ ID utilisateur récupéré depuis le backend:', userData.id);
        console.log('✅ Données utilisateur complètes:', userData);
        return userData.id.toString();
      } else if (response.status === 404) {
        console.warn('⚠️ Utilisateur non trouvé avec l\'email:', email);
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
      const response = await fetch(`http://localhost:8089/carthage-creance/api/utilisateurs/by-email/${encodeURIComponent(email)}`, {
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
   * Récupère l'ID utilisateur depuis le backend en utilisant l'email directement
   */
  async getUserIdFromBackendByEmail(email: string): Promise<string | null> {
    if (!email) {
      console.log('🔍 Aucun email fourni');
      return null;
    }
    
    try {
      // Essayer l'endpoint utilisateurs/by-email
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
      } else {
        console.error('❌ Erreur lors de la récupération de l\'ID utilisateur:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'appel API:', error);
    return null;
    }
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
    
    return validationRoles.includes(user.roleUtilisateur);
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
    return user ? user.roleUtilisateur === role : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.roleUtilisateur) : false;
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
      console.log('🔍 Utilisateur chargé depuis localStorage:', user);
      console.log('🔍 ID utilisateur dans localStorage:', user.id);
      
      // Recréer une instance de User pour récupérer les méthodes (ex: getFullName)
      const hydratedUser = new User({ ...user });
      console.log('🔍 Utilisateur hydraté:', hydratedUser);
      console.log('🔍 ID utilisateur hydraté:', hydratedUser.id);
      
      this.currentUserSubject.next(hydratedUser);
    }
  }

  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, {})
      .pipe(
        tap(response => {
          // Créer l'utilisateur avec les données de la réponse
          const user = new User({
            id: response.userId.toString(),
            email: response.email,
            nom: response.nom,
            prenom: response.prenom,
            roleUtilisateur: this.mapRoleFromBackend(response.role),
            actif: true
          });
          this.saveUserToStorage(user, response.token);
          this.currentUserSubject.next(user);
        })
      );
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, userData)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.saveUserToStorage(user, localStorage.getItem('token')!);
        })
      );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, {
      oldPassword,
      newPassword
    });
  }

  /**
   * Parse un token JWT pour extraire le payload
   */
  private parseJwtToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Erreur lors du parsing du token JWT:', error);
      return null;
    }
  }

  /**
   * Force la mise à jour de l'ID utilisateur depuis le backend
   */
  async updateUserWithRealId(): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser?.email) {
      console.error('❌ Aucun utilisateur connecté ou email manquant');
      return;
    }

    try {
      console.log('🔄 Tentative de mise à jour de l\'ID utilisateur pour:', currentUser.email);
      
      // Récupérer l'ID depuis le backend
      const realId = await this.getUserIdFromBackendByEmail(currentUser.email);
      
      if (realId) {
        console.log('✅ ID réel récupéré:', realId);
        
        // Mettre à jour l'objet utilisateur avec l'ID réel
        const updatedUser = new User({
          ...currentUser,
          id: realId
        });
        
        // Sauvegarder dans localStorage
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Mettre à jour le BehaviorSubject
        this.currentUserSubject.next(updatedUser);
        
        console.log('✅ Utilisateur mis à jour avec l\'ID réel:', updatedUser);
      } else {
        console.error('❌ Impossible de récupérer l\'ID réel depuis le backend');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'ID utilisateur:', error);
    }
  }

  /**
   * Mappe le rôle depuis le token vers l'enum Role
   */
  private mapRoleFromToken(roleAuthority: string): Role {
    if (!roleAuthority) return Role.AGENT_DOSSIER;
    
    switch (roleAuthority) {
      case 'ROLE_UTILISATEUR_SUPER_ADMIN':
        return Role.SUPER_ADMIN;
      case 'ROLE_UTILISATEUR_CHEF_DEPARTEMENT_DOSSIER':
        return Role.CHEF_DEPARTEMENT_DOSSIER;
      case 'ROLE_UTILISATEUR_AGENT_DOSSIER':
        return Role.AGENT_DOSSIER;
      case 'ROLE_UTILISATEUR_CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
        return Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE;
      case 'ROLE_UTILISATEUR_CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        return Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE;
      case 'ROLE_UTILISATEUR_CHEF_DEPARTEMENT_FINANCE':
        return Role.CHEF_DEPARTEMENT_FINANCE;
      default:
        return Role.AGENT_DOSSIER;
    }
  }


}