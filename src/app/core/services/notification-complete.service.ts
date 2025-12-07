import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, interval } from 'rxjs';
import { catchError, tap, switchMap, startWith, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { JwtAuthService } from './jwt-auth.service';
import {
  Notification,
  CreateNotificationRequest,
  SendNotificationMultipleRequest,
  SendNotificationToAgentsRequest,
  SendNotificationResponse,
  StatutNotification,
  TypeNotification
} from '../../shared/models/notification-complete.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationCompleteService {
  private apiUrl = `${environment.apiUrl}/api/notifications`;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private jwtAuthService: JwtAuthService
  ) {
    this.startAutoRefresh();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('auth-user');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Démarrer le rafraîchissement automatique des notifications
   */
  private startAutoRefresh(): void {
    interval(30000) // 30 secondes
      .pipe(
        startWith(0),
        switchMap(() => {
          return this.jwtAuthService.getCurrentUser().pipe(
            switchMap(user => {
              if (user?.id) {
                const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
                return this.getNombreNotificationsNonLues(userId);
              }
              return [];
            })
          );
        })
      )
      .subscribe();
  }

  /**
   * Récupère toutes les notifications de l'utilisateur connecté
   */
  getNotificationsByUser(userId: number): Observable<Notification[]> {
    const headers = this.getHeaders();
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}`, { headers }).pipe(
      tap(notifications => {
        // Convertir les dates string en Date si nécessaire
        const normalized = notifications.map(n => ({
          ...n,
          dateCreation: typeof n.dateCreation === 'string' ? n.dateCreation : new Date(n.dateCreation).toISOString(),
          dateLecture: n.dateLecture ? (typeof n.dateLecture === 'string' ? n.dateLecture : new Date(n.dateLecture).toISOString()) : undefined
        }));
        this.notificationsSubject.next(normalized);
        this.updateUnreadCount(normalized);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les notifications non lues de l'utilisateur connecté
   */
  getNotificationsNonLuesByUser(userId: number): Observable<Notification[]> {
    const headers = this.getHeaders();
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}/non-lues`, { headers }).pipe(
      tap(notifications => {
        const normalized = notifications.map(n => ({
          ...n,
          dateCreation: typeof n.dateCreation === 'string' ? n.dateCreation : new Date(n.dateCreation).toISOString(),
          dateLecture: n.dateLecture ? (typeof n.dateLecture === 'string' ? n.dateLecture : new Date(n.dateLecture).toISOString()) : undefined
        }));
        this.updateUnreadCount(normalized);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère le nombre de notifications non lues
   */
  getNombreNotificationsNonLues(userId: number): Observable<number> {
    const headers = this.getHeaders();
    return this.http.get<number>(`${this.apiUrl}/user/${userId}/count/non-lues`, { headers }).pipe(
      tap(count => this.unreadCountSubject.next(count)),
      catchError(this.handleError)
    );
  }

  /**
   * Marque une notification comme lue
   */
  marquerLue(notificationId: number): Observable<Notification> {
    const headers = this.getHeaders();
    return this.http.post<Notification>(`${this.apiUrl}/${notificationId}/marquer-lue`, {}, { headers }).pipe(
      tap(() => {
        const notifications = this.notificationsSubject.value;
        const index = notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          notifications[index].statut = StatutNotification.LUE;
          notifications[index].dateLecture = new Date().toISOString();
          this.notificationsSubject.next(notifications);
          this.updateUnreadCount(notifications);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Marque toutes les notifications comme lues
   */
  marquerToutesLues(userId: number): Observable<number> {
    const headers = this.getHeaders();
    return this.http.post<number>(`${this.apiUrl}/user/${userId}/marquer-toutes-lues`, {}, { headers }).pipe(
      tap(() => {
        const notifications = this.notificationsSubject.value.map(n => ({
          ...n,
          statut: StatutNotification.LUE,
          dateLecture: new Date().toISOString()
        }));
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount(notifications);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Crée une notification manuelle
   */
  createNotification(request: CreateNotificationRequest): Observable<Notification> {
    const headers = this.getHeaders();
    return this.http.post<Notification>(`${this.apiUrl}`, request, { headers }).pipe(
      tap(notification => {
        const notifications = this.notificationsSubject.value;
        this.notificationsSubject.next([notification, ...notifications]);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Envoie une notification à plusieurs utilisateurs (Chefs/SuperAdmin)
   */
  envoyerNotificationMultiples(request: SendNotificationMultipleRequest): Observable<SendNotificationResponse> {
    const headers = this.getHeaders();
    
    // Log détaillé de la requête avant envoi
    console.log('🔍 NotificationCompleteService.envoyerNotificationMultiples');
    console.log('📤 URL:', `${this.apiUrl}/envoyer-multiples`);
    console.log('📤 Headers:', {
      'Content-Type': headers.get('Content-Type'),
      'Authorization': headers.get('Authorization') ? 'Bearer ***' : 'none'
    });
    console.log('📤 Request body (raw):', request);
    console.log('📤 Request body (JSON):', JSON.stringify(request, null, 2));
    console.log('📤 userIds type:', Array.isArray(request.userIds) ? 'array' : typeof request.userIds);
    console.log('📤 userIds values:', request.userIds);
    console.log('📤 userIds types:', request.userIds.map(id => typeof id));
    
    return this.http.post<SendNotificationResponse>(`${this.apiUrl}/envoyer-multiples`, request, { headers }).pipe(
      tap(response => {
        console.log('✅ NotificationCompleteService - Réponse reçue:', response);
      }),
      catchError(error => {
        console.error('❌ NotificationCompleteService - Erreur détaillée:', {
          status: error?.status,
          statusText: error?.statusText,
          error: error?.error,
          errorString: error?.error ? JSON.stringify(error.error) : 'undefined',
          message: error?.message,
          url: error?.url,
          fullError: error
        });
        
        // Essayer d'extraire le message d'erreur du backend
        if (error?.error) {
          if (typeof error.error === 'string') {
            console.error('❌ Message d\'erreur (string):', error.error);
          } else if (error.error.message) {
            console.error('❌ Message d\'erreur (message):', error.error.message);
          } else {
            console.error('❌ Erreur complète (object):', JSON.stringify(error.error, null, 2));
          }
        }
        
        return this.handleError(error);
      })
    );
  }

  /**
   * Envoie une notification à tous les agents d'un chef
   */
  envoyerNotificationAAgentsChef(chefId: number, request: SendNotificationToAgentsRequest): Observable<SendNotificationResponse> {
    const headers = this.getHeaders();
    return this.http.post<SendNotificationResponse>(`${this.apiUrl}/chef/${chefId}/agents`, request, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Envoie une notification à tous les utilisateurs (SuperAdmin uniquement)
   */
  envoyerNotificationATous(request: SendNotificationToAgentsRequest): Observable<SendNotificationResponse> {
    const headers = this.getHeaders();
    return this.http.post<SendNotificationResponse>(`${this.apiUrl}/envoyer-tous`, request, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les notifications par type
   */
  getNotificationsByType(userId: number, type: TypeNotification): Observable<Notification[]> {
    const headers = this.getHeaders();
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}/type/${type}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Supprime une notification
   */
  supprimerNotification(notificationId: number): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`, { headers }).pipe(
      tap(() => {
        // Retirer la notification de la liste locale
        const notifications = this.notificationsSubject.value;
        const filtered = notifications.filter(n => n.id !== notificationId);
        this.notificationsSubject.next(filtered);
        this.updateUnreadCount(filtered);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les notifications récentes
   */
  getNotificationsRecent(userId: number, dateDebut: Date): Observable<Notification[]> {
    const headers = this.getHeaders();
    const params = new HttpParams().set('dateDebut', dateDebut.toISOString());
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}/recentes`, { headers, params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour le compteur de notifications non lues
   */
  private updateUnreadCount(notifications: Notification[]): void {
    const count = notifications.filter(n => n.statut === StatutNotification.NON_LUE).length;
    this.unreadCountSubject.next(count);
  }

  /**
   * Obtient l'icône pour un type de notification
   */
  getIconForType(type: TypeNotification): string {
    const iconMap: { [key: string]: string } = {
      'DOSSIER_CREE': 'folder',
      'DOSSIER_VALIDE': 'check_circle',
      'DOSSIER_AFFECTE': 'assignment',
      'DOSSIER_CLOTURE': 'archive',
      'ENQUETE_CREE': 'search',
      'ENQUETE_VALIDE': 'check_circle',
      'ACTION_AMIABLE_CREE': 'gavel',
      'AUDIENCE_PROCHAINE': 'event',
      'AUDIENCE_CREE': 'event',
      'TACHE_URGENTE': 'warning',
      'TACHE_COMPLETEE': 'check_circle',
      'UTILISATEUR_CREE': 'person_add',
      'DOCUMENT_HUISSIER_CREE': 'description',
      'DOCUMENT_HUISSIER_EXPIRE': 'error',
      'ACTION_HUISSIER_PERFORMED': 'gavel',
      'NOTIFICATION_CHEF_VERS_AGENT': 'supervisor_account',
      'NOTIFICATION_SUPERADMIN_VERS_CHEF': 'admin_panel_settings',
      'NOTIFICATION_SUPERADMIN_VERS_AGENT': 'admin_panel_settings'
    };
    return iconMap[type] || 'notifications';
  }

  /**
   * Obtient la couleur pour un type de notification
   */
  getColorForType(type: TypeNotification): string {
    if (type.includes('EXPIRE') || type.includes('REJETE') || type === 'DELAY_EXPIRED') {
      return 'warn';
    }
    if (type.includes('URGENTE') || type === 'DELAY_WARNING') {
      return 'accent';
    }
    if (type.includes('VALIDE') || type.includes('COMPLETEE')) {
      return 'primary';
    }
    return '';
  }

  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur dans NotificationCompleteService:', error);
    let errorMessage = 'Une erreur inconnue est survenue.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Le backend retourne maintenant {"error": "message explicite"}
      // Chercher dans error.error.error (format backend) ou error.error.message (format alternatif)
      if (error.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.error) {
          // Format backend: {"error": "message explicite"}
          errorMessage = error.error.error;
        } else if (error.error.message) {
          // Format alternatif: {"message": "message explicite"}
          errorMessage = error.error.message;
        } else {
          errorMessage = `Code d'erreur: ${error.status}\nMessage: ${error.message || 'Erreur inconnue'}`;
        }
      } else {
        errorMessage = `Code d'erreur: ${error.status}\nMessage: ${error.message || 'Erreur inconnue'}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}

