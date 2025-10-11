import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, interval } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { Notification, NotificationRequest, NotificationStats, NotificationFilter, TypeNotification, StatutNotification, TypeEntite } from '../../shared/models/notification.model';
import { AuthService } from './auth.service';

// Export pour compatibilité
export { Notification, NotificationRequest, NotificationStats, NotificationFilter, TypeNotification, StatutNotification, TypeEntite };

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
        tap(newNotification => {
          console.log('✅ Notification créée:', newNotification);
          this.refreshNotifications();
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer toutes les notifications
   */
  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/notifications`)
      .pipe(
        tap(notifications => {
          this.notificationsSubject.next(notifications);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer les notifications par utilisateur
   */
  getNotificationsByUser(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/notifications/user/${userId}`)
      .pipe(
        tap(notifications => {
          this.notificationsSubject.next(notifications);
          this.updateUnreadCount(notifications);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer les notifications non lues par utilisateur
   */
  getNotificationsNonLuesByUser(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/notifications/user/${userId}/non-lues`)
      .pipe(
        tap(notifications => {
          this.unreadCountSubject.next(notifications.length);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer les notifications par type et utilisateur
   */
  getNotificationsByType(userId: number, type: TypeNotification): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/notifications/user/${userId}/type/${type}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupérer les notifications récentes
   */
  getNotificationsRecent(userId: number, dateDebut: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/notifications/user/${userId}/recentes?dateDebut=${dateDebut}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupérer les notifications par entité
   */
  getNotificationsByEntite(entiteId: number, entiteType: TypeEntite): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/notifications/entite/${entiteId}/type/${entiteType}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Marquer une notification comme lue
   */
  marquerLue(notificationId: number): Observable<Notification> {
    return this.http.post<Notification>(`${this.baseUrl}/notifications/${notificationId}/marquer-lue`, {})
      .pipe(
        tap(updatedNotification => {
          console.log('✅ Notification marquée comme lue:', updatedNotification);
          this.refreshNotifications();
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Marquer une notification comme non lue
   */
  marquerNonLue(notificationId: number): Observable<Notification> {
    return this.http.post<Notification>(`${this.baseUrl}/notifications/${notificationId}/marquer-non-lue`, {})
      .pipe(
        tap(updatedNotification => {
          console.log('✅ Notification marquée comme non lue:', updatedNotification);
          this.refreshNotifications();
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  marquerToutesLues(userId: number): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/notifications/user/${userId}/marquer-toutes-lues`, {})
      .pipe(
        tap(count => {
          console.log(`✅ ${count} notifications marquées comme lues`);
          this.refreshNotifications();
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
          console.log('✅ Notification supprimée:', notificationId);
          this.refreshNotifications();
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les statistiques des notifications
   */
  getNotificationStats(userId: number): Observable<NotificationStats> {
    return this.http.get<number>(`${this.baseUrl}/notifications/statistiques/user/${userId}`)
      .pipe(
        switchMap(total => 
          this.http.get<number>(`${this.baseUrl}/notifications/statistiques/non-lues/user/${userId}`)
            .pipe(
              map(nonLues => ({
                total,
                nonLues,
                parType: {} as { [key in TypeNotification]: number }
              }))
            )
        ),
        catchError(this.handleError)
      );
  }

  /**
   * Compter les notifications non lues
   */
  countNotificationsNonLues(userId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/notifications/statistiques/non-lues/user/${userId}`)
      .pipe(
        tap(count => this.unreadCountSubject.next(count)),
        catchError(this.handleError)
      );
  }

  /**
   * Envoyer une notification à un utilisateur
   */
  envoyerNotification(userId: number, titre: string, message: string, type: TypeNotification, entiteId?: number, entiteType?: TypeEntite, lienAction?: string): Observable<Notification> {
    const notificationRequest: NotificationRequest = {
      utilisateur: { id: userId },
      type,
      titre,
      message,
      entiteId,
      entiteType,
      lienAction
    };

    return this.createNotification(notificationRequest);
  }

  /**
   * Envoyer une notification de validation de dossier
   */
  envoyerNotificationValidation(userId: number, numeroDossier: string, statut: string, commentaire?: string): Observable<Notification> {
    const titre = `Dossier ${numeroDossier} ${statut}`;
    const message = `Votre dossier ${numeroDossier} a été ${statut.toLowerCase()}${commentaire ? `. Commentaire: ${commentaire}` : ''}`;
    const type = statut.toUpperCase() === 'VALIDÉ' ? TypeNotification.DOSSIER_VALIDE : TypeNotification.DOSSIER_REJETE;

    return this.envoyerNotification(userId, titre, message, type, undefined, TypeEntite.DOSSIER);
  }

  /**
   * Ajouter une notification (méthode de compatibilité)
   */
  addNotification(notification: NotificationRequest): Observable<Notification> {
    return this.createNotification(notification);
  }

  /**
   * Rafraîchir les notifications
   */
  private refreshNotifications(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.getNotificationsByUser(Number(currentUser.id)).subscribe();
    }
  }

  /**
   * Mettre à jour le compteur de notifications non lues
   */
  private updateUnreadCount(notifications: Notification[]): void {
    const unreadCount = notifications.filter(n => n.statut === StatutNotification.NON_LUE).length;
    this.unreadCountSubject.next(unreadCount);
  }

  /**
   * Obtenir le nom d'affichage du type de notification
   */
  getTypeDisplayName(type: TypeNotification): string {
    const typeNames: { [key in TypeNotification]: string } = {
      [TypeNotification.DOSSIER_CREE]: 'Dossier créé',
      [TypeNotification.DOSSIER_VALIDE]: 'Dossier validé',
      [TypeNotification.DOSSIER_REJETE]: 'Dossier rejeté',
      [TypeNotification.DOSSIER_EN_ATTENTE]: 'Dossier en attente',
      [TypeNotification.ENQUETE_CREE]: 'Enquête créée',
      [TypeNotification.ENQUETE_VALIDE]: 'Enquête validée',
      [TypeNotification.ENQUETE_REJETE]: 'Enquête rejetée',
      [TypeNotification.ENQUETE_EN_ATTENTE]: 'Enquête en attente',
      [TypeNotification.TACHE_URGENTE]: 'Tâche urgente',
      [TypeNotification.RAPPEL]: 'Rappel',
      [TypeNotification.INFO]: 'Information'
    };
    return typeNames[type] || type;
  }

  /**
   * Obtenir l'icône du type de notification
   */
  getTypeIcon(type: TypeNotification): string {
    const typeIcons: { [key in TypeNotification]: string } = {
      [TypeNotification.DOSSIER_CREE]: 'fas fa-file-plus',
      [TypeNotification.DOSSIER_VALIDE]: 'fas fa-check-circle',
      [TypeNotification.DOSSIER_REJETE]: 'fas fa-times-circle',
      [TypeNotification.DOSSIER_EN_ATTENTE]: 'fas fa-clock',
      [TypeNotification.ENQUETE_CREE]: 'fas fa-search-plus',
      [TypeNotification.ENQUETE_VALIDE]: 'fas fa-check-circle',
      [TypeNotification.ENQUETE_REJETE]: 'fas fa-times-circle',
      [TypeNotification.ENQUETE_EN_ATTENTE]: 'fas fa-clock',
      [TypeNotification.TACHE_URGENTE]: 'fas fa-exclamation-triangle',
      [TypeNotification.RAPPEL]: 'fas fa-bell',
      [TypeNotification.INFO]: 'fas fa-info-circle'
    };
    return typeIcons[type] || 'fas fa-bell';
  }

  /**
   * Obtenir la couleur du type de notification
   */
  getTypeColor(type: TypeNotification): string {
    const typeColors: { [key in TypeNotification]: string } = {
      [TypeNotification.DOSSIER_CREE]: '#3b82f6',
      [TypeNotification.DOSSIER_VALIDE]: '#10b981',
      [TypeNotification.DOSSIER_REJETE]: '#ef4444',
      [TypeNotification.DOSSIER_EN_ATTENTE]: '#f59e0b',
      [TypeNotification.ENQUETE_CREE]: '#3b82f6',
      [TypeNotification.ENQUETE_VALIDE]: '#10b981',
      [TypeNotification.ENQUETE_REJETE]: '#ef4444',
      [TypeNotification.ENQUETE_EN_ATTENTE]: '#f59e0b',
      [TypeNotification.TACHE_URGENTE]: '#ef4444',
      [TypeNotification.RAPPEL]: '#8b5cf6',
      [TypeNotification.INFO]: '#6b7280'
    };
    return typeColors[type] || '#6b7280';
  }

  /**
   * Gérer les erreurs HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur dans NotificationService:', error);
    console.error('❌ Status:', error.status);
    console.error('❌ StatusText:', error.statusText);
    console.error('❌ URL:', error.url);
    console.error('❌ Error body:', error.error);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur réseau: ${error.error.message}`;
    } else {
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