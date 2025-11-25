import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuditLog } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  constructor(private api: ApiService) {}

  getLogsByDossier(dossierId: number): Observable<AuditLog[]> {
    return this.api.get<AuditLog[]>('/audit-logs', { dossierId });
  }

  getLogsByUser(userId: number): Observable<AuditLog[]> {
    return this.api.get<AuditLog[]>('/audit-logs', { userId });
  }
}


