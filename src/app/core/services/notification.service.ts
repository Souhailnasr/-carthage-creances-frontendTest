import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, interval } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Types pour les notifications
export interface NotificationRequest {
  destinataireId: number;
  type: TypeNotification;
  titre: string;
  message: string;
  lienAction?: string;
  entiteId?: number;
  typeEntite?: TypeEntite;
}

export interface NotificationStats {
  total: number;
  nonLues: number;
  lues: number;
  parType: { [key in TypeNotification]: number };
}

export interface NotificationFilter {
  type?: TypeNotification;
  statut?: StatutNotification;
  dateDebut?: Date;
  dateFin?: Date;
  destinataireId?: number;
  page?: number;
  size?: number;
}

export enum TypeNotification {
  DOSSIER_CREE = 'DOSSIER_CREE',
  DOSSIER_VALIDE = 'DOSSIER_VALIDE',
  DOSSIER_REJETE = 'DOSSIER_REJETE',
  DOSSIER_EN_ATTENTE = 'DOSSIER_EN_ATTENTE',
  ENQUETE_CREE = 'ENQUETE_CREE',
  ENQUETE_VALIDE = 'ENQUETE_VALIDE',
  ENQUETE_REJETE = 'ENQUETE_REJETE',
  ENQUETE_EN_ATTENTE = 'ENQUETE_EN_ATTENTE',
  TACHE_URGENTE = 'TACHE_URGENTE',
  RAPPEL = 'RAPPEL',
  INFO = 'INFO'
}

export enum StatutNotification {
  NON_LUE = 'NON_LUE',
  LUE = 'LUE'
}

export enum TypeEntite {
  DOSSIER = 'DOSSIER',
  ENQUETE = 'ENQUETE',
  TACHE = 'TACHE',
  UTILISATEUR = 'UTILISATEUR'
}

export interface Notification {
  id: number;
  destinataireId: number;
  expediteurId?: number;
  type: TypeNotification;
  titre: string;
  message: string;
  statut: StatutNotification;
  dateCreation: string;
  dateLecture?: string;
  lienAction?: string;
  entiteId?: number;
  typeEntite?: TypeEntite;
  utilisateur?: {
    id: number;
    nom: string;
    prenom: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = 'http://localhost:8089/carthage-creance/api';
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private refreshInterval = 30000; // 30 secondes

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
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
          const currentUser = this.authService.getCurrentUser();
          return currentUser ? this.getNotificationsByUser(Number(currentUser.id)) : [];
        })
      )
      .subscribe();
  }

  /**
   * Créer une nouvelle notification
   */
  createNotification(notification: NotificationRequest): Observable<Notification> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<Notification>(`${this.baseUrl}/notifications`, notification, { headers })
      .pipe(
        tap(() => {
          // Rafraîchir les notifications après création
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            this.getNotificationsByUser(Number(currentUser.id)).subscribe();
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les notifications d'un utilisateur
   */
  getNotificationsByUser(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/notifications/user/${userId}`)
      .pipe(
        tap(notifications => {
          this.notificationsSubject.next(notifications);
          const unreadCount = notifications.filter(n => n.statut === StatutNotification.NON_LUE).length;
          this.unreadCountSubject.next(unreadCount);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les notifications avec filtres
   */
  getNotificationsWithFilter(filter: NotificationFilter): Observable<{ content: Notification[], totalElements: number }> {
    const params = new URLSearchParams();
    
    if (filter.type) params.append('type', filter.type);
    if (filter.statut) params.append('statut', filter.statut);
    if (filter.dateDebut) params.append('dateDebut', filter.dateDebut.toISOString());
    if (filter.dateFin) params.append('dateFin', filter.dateFin.toISOString());
    if (filter.destinataireId) params.append('destinataireId', filter.destinataireId.toString());
    if (filter.page !== undefined) params.append('page', filter.page.toString());
    if (filter.size !== undefined) params.append('size', filter.size.toString());

    return this.http.get<{ content: Notification[], totalElements: number }>(`${this.baseUrl}/notifications?${params}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Marquer une notification comme lue
   */
  marquerLue(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/${notificationId}/marquer-lue`, {})
      .pipe(
        tap(() => {
          // Mettre à jour l'état local
          const notifications = this.notificationsSubject.value;
          const updatedNotifications = notifications.map(n => 
            n.id === notificationId 
              ? { ...n, statut: StatutNotification.LUE, dateLecture: new Date().toISOString() }
              : n
          );
          this.notificationsSubject.next(updatedNotifications);
          
          // Mettre à jour le compteur
          const unreadCount = updatedNotifications.filter(n => n.statut === StatutNotification.NON_LUE).length;
          this.unreadCountSubject.next(unreadCount);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Marquer une notification comme non lue
   */
  marquerNonLue(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/${notificationId}/marquer-non-lue`, {})
      .pipe(
        tap(() => {
          // Mettre à jour l'état local
          const notifications = this.notificationsSubject.value;
          const updatedNotifications = notifications.map(n => 
            n.id === notificationId 
              ? { ...n, statut: StatutNotification.NON_LUE, dateLecture: undefined }
              : n
          );
          this.notificationsSubject.next(updatedNotifications);
          
          // Mettre à jour le compteur
          const unreadCount = updatedNotifications.filter(n => n.statut === StatutNotification.NON_LUE).length;
          this.unreadCountSubject.next(unreadCount);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  marquerToutesLues(userId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/user/${userId}/marquer-toutes-lues`, {})
      .pipe(
        tap(() => {
          // Mettre à jour l'état local
          const notifications = this.notificationsSubject.value;
          const updatedNotifications = notifications.map(n => ({
            ...n,
            statut: StatutNotification.LUE,
            dateLecture: new Date().toISOString()
          }));
          this.notificationsSubject.next(updatedNotifications);
          this.unreadCountSubject.next(0);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer une notification
   */
  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notifications/${notificationId}`)
      .pipe(
        tap(() => {
          // Mettre à jour l'état local
          const notifications = this.notificationsSubject.value;
          const updatedNotifications = notifications.filter(n => n.id !== notificationId);
          this.notificationsSubject.next(updatedNotifications);
          
          // Mettre à jour le compteur
          const unreadCount = updatedNotifications.filter(n => n.statut === StatutNotification.NON_LUE).length;
          this.unreadCountSubject.next(unreadCount);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les statistiques des notifications
   */
  getNotificationStats(userId: number): Observable<NotificationStats> {
    return this.http.get<NotificationStats>(`${this.baseUrl}/notifications/user/${userId}/stats`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  getUnreadCount(userId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/notifications/user/${userId}/unread-count`)
      .pipe(
        tap(count => this.unreadCountSubject.next(count)),
        catchError(this.handleError)
      );
  }

  /**
   * Gestion des erreurs
   */
  private handleError = (error: any): Observable<never> => {
    console.error('Erreur dans NotificationService:', error);
    return throwError(() => error);
  };

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
}
