import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Dossier, ActionAmiableDTO } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ActionAmiableService {
  constructor(private api: ApiService) {}

  enregistrerActionAmiable(dossierId: number, montantRecouvre: number): Observable<Dossier> {
    const payload: ActionAmiableDTO = { montantRecouvre };
    return this.api.post<Dossier>(`/dossiers/${dossierId}/amiable`, payload);
  }
}


