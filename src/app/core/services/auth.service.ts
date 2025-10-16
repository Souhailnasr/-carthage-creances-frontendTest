import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
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

  register(userData: any): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
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

  canValidateDossiers(): boolean {
    return this.hasAnyRole(['SUPER_ADMIN', 'CHEF_DEPARTEMENT_DOSSIER']);
  }

  canCreateDossiers(): boolean {
    return this.hasAnyRole(['SUPER_ADMIN', 'CHEF_DEPARTEMENT_DOSSIER', 'AGENT_DOSSIER']);
  }

  private saveUserToStorage(user: User, token: string): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', token);
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