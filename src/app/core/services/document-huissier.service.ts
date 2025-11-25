import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DocumentHuissier, DocumentHuissierDTO } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class DocumentHuissierService {
  constructor(private api: ApiService) {}

  createDocument(dto: DocumentHuissierDTO): Observable<DocumentHuissier> {
    return this.api.post<DocumentHuissier>('/huissier/document', dto);
  }

  getDocumentById(id: number): Observable<DocumentHuissier> {
    return this.api.get<DocumentHuissier>(`/huissier/document/${id}`);
  }

  getDocumentsByDossier(dossierId: number): Observable<DocumentHuissier[]> {
    return this.api.get<DocumentHuissier[]>('/huissier/documents', { dossierId });
  }
}


