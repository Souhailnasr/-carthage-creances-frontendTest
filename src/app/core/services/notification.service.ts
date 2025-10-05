import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Notification {
  id: number;
  utilisateurId: number;
  type: string;
  titre: string;
  message: string;
  statut: string;
  dateCreation: Date;
  dateLecture?: Date;
  entiteId?: number;
  entiteType?: string;
  lienAction?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8089/carthage-creance/api/notifications';
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNotificationsByUser(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}`)
      .pipe(tap(notifications => this.notificationsSubject.next(notifications)));
  }

  getNotificationsNonLues(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}/non-lues`);
  }

  marquerLue(id: number): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/${id}/marquer-lue`, {});
  }

  marquerToutesLues(userId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/user/${userId}/marquer-toutes-lues`, {});
  }

  countNotificationsNonLues(userId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/non-lues/user/${userId}`);
  }

  createNotification(notification: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>(this.apiUrl, notification);
  }

  addNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...currentNotifications]);
  }
}
