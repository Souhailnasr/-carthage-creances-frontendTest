import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ActionHuissier, ActionHuissierDTO } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ActionHuissierService {
  constructor(private api: ApiService) {}

  createAction(dto: ActionHuissierDTO): Observable<ActionHuissier> {
    return this.api.post<ActionHuissier>('/huissier/action', dto);
  }

  getActionById(id: number): Observable<ActionHuissier> {
    return this.api.get<ActionHuissier>(`/huissier/action/${id}`);
  }

  getActionsByDossier(dossierId: number): Observable<ActionHuissier[]> {
    return this.api.get<ActionHuissier[]>('/huissier/actions', { dossierId });
  }
}


