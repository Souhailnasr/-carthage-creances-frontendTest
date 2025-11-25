import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { NotificationHuissier } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class NotificationHuissierService {
  constructor(private api: ApiService) {}

  getNotificationsByDossier(dossierId: number): Observable<NotificationHuissier[]> {
    return this.api.get<NotificationHuissier[]>('/notifications', { dossierId });
  }

  acknowledgeNotification(notificationId: number, userId: number): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/notifications/${notificationId}/ack`, { userId });
  }
}


