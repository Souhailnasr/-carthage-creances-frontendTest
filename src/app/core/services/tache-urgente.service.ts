import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TacheUrgente {
  id: number;
  titre: string;
  description: string;
  type: string;
  priorite: string;
  statut: string;
  dateCreation: Date;
  dateEcheance: Date;
  agentId: number;
  agentNom: string;
  dossierId?: number;
  dossierTitre?: string;
  creancierNom?: string;
  debiteurNom?: string;
  montant?: number;
  dateCloture?: Date;
  commentaires?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TacheUrgenteService {
  private apiUrl = 'http://localhost:8089/carthage-creance/api/taches-urgentes';

  constructor(private http: HttpClient) {}

  getAllTachesUrgentes(): Observable<TacheUrgente[]> {
    return this.http.get<TacheUrgente[]>(this.apiUrl);
  }

  getTacheUrgenteById(id: number): Observable<TacheUrgente> {
    return this.http.get<TacheUrgente>(`${this.apiUrl}/${id}`);
  }

  getTachesByAgent(agentId: number): Observable<TacheUrgente[]> {
    return this.http.get<TacheUrgente[]>(`${this.apiUrl}/agent/${agentId}`);
  }

  getTachesByStatut(statut: string): Observable<TacheUrgente[]> {
    return this.http.get<TacheUrgente[]>(`${this.apiUrl}/statut/${statut}`);
  }

  getTachesByPriorite(priorite: string): Observable<TacheUrgente[]> {
    return this.http.get<TacheUrgente[]>(`${this.apiUrl}/priorite/${priorite}`);
  }

  getTachesEnRetard(): Observable<TacheUrgente[]> {
    return this.http.get<TacheUrgente[]>(`${this.apiUrl}/en-retard`);
  }

  createTacheUrgente(tache: Partial<TacheUrgente>): Observable<TacheUrgente> {
    return this.http.post<TacheUrgente>(this.apiUrl, tache);
  }

  updateTacheUrgente(id: number, tache: Partial<TacheUrgente>): Observable<TacheUrgente> {
    return this.http.put<TacheUrgente>(`${this.apiUrl}/${id}`, tache);
  }

  deleteTacheUrgente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  marquerTerminee(id: number): Observable<TacheUrgente> {
    return this.http.post<TacheUrgente>(`${this.apiUrl}/${id}/terminer`, {});
  }

  getStatistiquesTaches(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statistiques`);
  }
}
