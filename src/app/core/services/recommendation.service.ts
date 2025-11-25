import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Recommendation } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  constructor(private api: ApiService) {}

  getRecommendationsByDossier(dossierId: number): Observable<Recommendation[]> {
    return this.api.get<Recommendation[]>('/recommendations', { dossierId });
  }

  acknowledgeRecommendation(recommendationId: number, userId: number): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/recommendations/${recommendationId}/ack`, { userId });
  }
}


