import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, interval } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { JwtAuthService } from './jwt-auth.service';

export interface Notification {
  id: number;
  utilisateur: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  type: string; // TypeNotification enum
  titre: string;
  message: string;
  statut: 'NON_LUE' | 'LUE';
  dateCreation: string; // ISO 8601
  dateLecture?: string; // ISO 8601
  entiteId?: number;
  entiteType?: string; // TypeEntite enum
  lienAction?: string;
}

export enum TypeNotification {
  DOSSIER_CREE = 'DOSSIER_CREE',
  DOSSIER_AFFECTE = 'DOSSIER_AFFECTE',
  DOSSIER_VALIDE = 'DOSSIER_VALIDE',
  DOSSIER_REJETE = 'DOSSIER_REJETE',
  ACTION_AMIABLE_CREE = 'ACTION_AMIABLE_CREE',
  AUDIENCE_PROCHAINE = 'AUDIENCE_PROCHAINE',
  AUDIENCE_CREE = 'AUDIENCE_CREE',
  TACHE_AFFECTEE = 'TACHE_AFFECTEE',
  TACHE_COMPLETEE = 'TACHE_COMPLETEE',
  TRAITEMENT_DOSSIER = 'TRAITEMENT_DOSSIER',
  NOTIFICATION_MANUELLE = 'NOTIFICATION_MANUELLE',
  TACHE_URGENTE = 'TACHE_URGENTE',
  RAPPEL = 'RAPPEL',
  INFO = 'INFO'
}

export enum StatutNotification {
  NON_LUE = 'NON_LUE',
  LUE = 'LUE'
}

export interface NotificationRequest {
  userIds?: number[];
  destinataireId?: number;
  type: string;
  titre: string;
  message: string;
  entiteId?: number;
  entiteType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/api/notifications`;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private refreshInterval = 30000; // 30 secondes

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private jwtAuthService: JwtAuthService
  ) {
    this.startAutoRefresh();
  }

  /**
   * Démarrer le rafraîchissement automatique des notifications
   */
  private startAutoRefresh(): void {
    interval(this.refreshInterval)
      .pipe(
        switchMap(() => {
          return this.jwtAuthService.getCurrentUser().pipe(
            switchMap(user => {
              if (user?.id) {
                return this.getNotificationsNonLues(parseInt(user.id));
              }
              return [];
            })
          );
        })
      )
      .subscribe();
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  getNotifications(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/user/${userId}`)
      .pipe(
        tap(notifications => {
          this.notificationsSubject.next(notifications);
          const unreadCount = notifications.filter(n => n.statut === 'NON_LUE').length;
          this.unreadCountSubject.next(unreadCount);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer les notifications non lues
   */
  getNotificationsNonLues(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/user/${userId}/non-lues`)
      .pipe(
        tap(notifications => {
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = [...currentNotifications];
          notifications.forEach(notif => {
            const index = updatedNotifications.findIndex(n => n.id === notif.id);
            if (index >= 0) {
              updatedNotifications[index] = notif;
            } else {
              updatedNotifications.push(notif);
            }
          });
          this.notificationsSubject.next(updatedNotifications);
          this.unreadCountSubject.next(notifications.length);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer le nombre de notifications non lues
   */
  getNombreNotificationsNonLues(userId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/user/${userId}/count/non-lues`)
      .pipe(
        tap(count => this.unreadCountSubject.next(count)),
        catchError(this.handleError)
      );
  }

  /**
   * Marquer une notification comme lue
   */
  marquerLue(notificationId: number): Observable<Notification> {
    return this.http.put<Notification>(`${this.baseUrl}/${notificationId}/marquer-lue`, {})
      .pipe(
        tap(() => {
          const notifications = this.notificationsSubject.value;
          const updatedNotifications = notifications.map(n => 
            n.id === notificationId 
              ? { ...n, statut: 'LUE' as const, dateLecture: new Date().toISOString() }
              : n
          );
          this.notificationsSubject.next(updatedNotifications);
          const unreadCount = updatedNotifications.filter(n => n.statut === 'NON_LUE').length;
          this.unreadCountSubject.next(unreadCount);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  marquerToutesLues(userId: number): Observable<{ count: number }> {
    return this.http.put<{ count: number }>(`${this.baseUrl}/user/${userId}/marquer-toutes-lues`, {})
      .pipe(
        tap(() => {
          const notifications = this.notificationsSubject.value;
          const updatedNotifications = notifications.map(n => ({
            ...n,
            statut: 'LUE' as const,
            dateLecture: new Date().toISOString()
          }));
          this.notificationsSubject.next(updatedNotifications);
          this.unreadCountSubject.next(0);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Envoyer une notification à plusieurs utilisateurs (Chef)
   */
  envoyerNotificationMultiples(data: NotificationRequest): Observable<{ count: number }> {
    return this.http.post<{ count: number }>(`${this.baseUrl}/envoyer-multiples`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Envoyer une notification à tous les agents d'un chef
   */
  envoyerNotificationAAgentsChef(chefId: number, data: Omit<NotificationRequest, 'userIds'>): Observable<{ count: number }> {
    return this.http.post<{ count: number }>(`${this.baseUrl}/chef/${chefId}/agents`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Envoyer une notification à tous les utilisateurs (Super Admin)
   */
  envoyerNotificationATous(data: Omit<NotificationRequest, 'userIds'>): Observable<{ count: number }> {
    return this.http.post<{ count: number }>(`${this.baseUrl}/envoyer-tous`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les notifications actuelles
   */
  getCurrentNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Obtenir le compteur actuel de notifications non lues
   */
  getCurrentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Créer une notification (pour compatibilité avec l'ancien code)
   */
  createNotification(notification: NotificationRequest): Observable<Notification> {
    if (notification.destinataireId) {
      // Envoyer à un seul utilisateur
      return this.envoyerNotificationMultiples({
        userIds: [notification.destinataireId],
        type: notification.type,
        titre: notification.titre,
        message: notification.message,
        entiteId: notification.entiteId,
        entiteType: notification.entiteType
      }).pipe(
        map(() => ({
          id: 0,
          utilisateur: { id: notification.destinataireId!, nom: '', prenom: '', email: '' },
          type: notification.type,
          titre: notification.titre,
          message: notification.message,
          statut: 'NON_LUE' as const,
          dateCreation: new Date().toISOString(),
          entiteId: notification.entiteId,
          entiteType: notification.entiteType
        }))
      );
    } else if (notification.userIds && notification.userIds.length > 0) {
      return this.envoyerNotificationMultiples(notification).pipe(
        map(() => ({
          id: 0,
          utilisateur: { id: notification.userIds![0], nom: '', prenom: '', email: '' },
          type: notification.type,
          titre: notification.titre,
          message: notification.message,
          statut: 'NON_LUE' as const,
          dateCreation: new Date().toISOString(),
          entiteId: notification.entiteId,
          entiteType: notification.entiteType
        }))
      );
    }
    return throwError(() => new Error('destinataireId ou userIds requis'));
  }

  /**
   * Supprimer une notification (pour compatibilité avec l'ancien code)
   */
  deleteNotification(notificationId: number): Observable<void> {
    // Le backend ne supporte peut-être pas la suppression, retourner un Observable vide
    console.warn('deleteNotification n\'est pas implémenté côté backend');
    return new Observable(observer => {
      observer.next();
      observer.complete();
    });
  }

  /**
   * Gestion des erreurs
   */
  private handleError = (error: any): Observable<never> => {
    console.error('Erreur dans NotificationService:', error);
    return throwError(() => error);
  };
}
