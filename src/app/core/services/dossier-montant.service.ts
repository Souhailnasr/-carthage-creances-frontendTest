import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Dossier, MontantDossierDTO } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class DossierMontantService {
  constructor(private api: ApiService) {}

  updateMontants(dossierId: number, dto: MontantDossierDTO): Observable<Dossier> {
    return this.api.put<Dossier>(`/dossiers/${dossierId}/montant`, dto);
  }
}


