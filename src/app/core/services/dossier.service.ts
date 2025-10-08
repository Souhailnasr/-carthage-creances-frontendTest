import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { DossierApiService } from './dossier-api.service';
import { AuthService } from './auth.service';
import { 
  DossierApi,
  DossiersResponse,
  DossierStatus,
  Urgence
} from '../../shared/models/dossier-api.model';

export interface DossierStats {
  totalDossiers: number;
  dossiersEnCours: number;
  dossiersValides: number;
  dossiersCreesCeMois: number;
  dossiersAssignes?: number; // pour agent
  dossiersCreesParAgent?: number; // pour agent
}

@Injectable({ providedIn: 'root' })
export class DossierService {
  private dossiersAllSubject = new BehaviorSubject<DossierApi[]>([]);
  private dossiersEnAttenteSubject = new BehaviorSubject<DossierApi[]>([]);
  private dossiersAssignesSubject = new BehaviorSubject<DossierApi[]>([]);
  private dossiersCreesParAgentSubject = new BehaviorSubject<DossierApi[]>([]);
  private statsSubject = new BehaviorSubject<DossierStats>({
    totalDossiers: 0,
    dossiersEnCours: 0,
    dossiersValides: 0,
    dossiersCreesCeMois: 0
  });

  dossiersAll$ = this.dossiersAllSubject.asObservable();
  dossiersEnAttente$ = this.dossiersEnAttenteSubject.asObservable();
  dossiersAssignes$ = this.dossiersAssignesSubject.asObservable();
  dossiersCreesParAgent$ = this.dossiersCreesParAgentSubject.asObservable();
  stats$ = this.statsSubject.asObservable();

  constructor(
    private dossierApi: DossierApiService,
    private auth: AuthService
  ) {}

  // Chargements
  loadAll(): Observable<DossierApi[]> {
    return this.dossierApi.getAllDossiers().pipe(
      tap(list => this.dossiersAllSubject.next(list))
    );
  }

  loadEnAttente(): Observable<DossierApi[]> {
    return this.dossierApi.getDossiersEnAttente().pipe(
      tap(list => this.dossiersEnAttenteSubject.next(list))
    );
  }

  loadAssignesEtCreesAgent(): Observable<{ assignes: DossierApi[]; crees: DossierApi[] }> {
    const user = this.auth.getCurrentUser();
    if (!user?.id) {
      return of({ assignes: [], crees: [] });
    }
    const agentId = parseInt(user.id);
    return forkJoin({
      assignes: this.dossierApi.getDossiersByAgent(agentId),
      crees: this.dossierApi.getDossiersCreesByAgent(agentId)
    }).pipe(
      tap(({ assignes, crees }) => {
        this.dossiersAssignesSubject.next(assignes);
        this.dossiersCreesParAgentSubject.next(crees);
      })
    );
  }

  refreshStats(): Observable<DossierStats> {
    const user = this.auth.getCurrentUser();
    const agentId = user?.id ? parseInt(user.id) : undefined;

    const common$ = forkJoin({
      totalDossiers: this.dossierApi.countTotalDossiers(),
      dossiersEnCours: this.dossierApi.countDossiersEnCours(),
      dossiersValides: this.dossierApi.countDossiersValides(),
      dossiersCreesCeMois: this.dossierApi.countDossiersCreesCeMois()
    });

    const agent$ = agentId
      ? forkJoin({
          dossiersAssignes: this.dossierApi.countDossiersByAgent(agentId),
          dossiersCreesParAgent: this.dossierApi.countDossiersCreesByAgent(agentId)
        })
      : of({ dossiersAssignes: 0, dossiersCreesParAgent: 0 });

    return forkJoin({ common: common$, agent: agent$ }).pipe(
      map(({ common, agent }) => ({ ...common, ...agent } as DossierStats)),
      tap(s => this.statsSubject.next(s))
    );
  }

  // Workflow
  validate(dossierId: number, chefId: number): Observable<DossierApi> {
    return this.dossierApi.validateDossier(dossierId, chefId).pipe(
      tap(() => {
        this.onDataChanged();
      })
    );
  }

  reject(dossierId: number, commentaire: string): Observable<DossierApi> {
    return this.dossierApi.rejectDossier(dossierId, commentaire).pipe(
      tap(() => {
        this.onDataChanged();
      })
    );
  }

  // Fichiers
  uploadPdf(dossierId: number, type: 'contratSigne' | 'pouvoir', file: File): Observable<DossierApi> {
    return this.dossierApi.uploadPdf(dossierId, type, file).pipe(
      tap(() => this.onDataChanged())
    );
  }

  deletePdf(dossierId: number, type: 'contratSigne' | 'pouvoir'): Observable<DossierApi> {
    return this.dossierApi.deletePdf(dossierId, type).pipe(
      tap(() => this.onDataChanged())
    );
  }

  // Recherche avancée
  searchAdvanced(params: {
    numero?: string;
    titre?: string;
    description?: string;
    agentId?: number;
    creancierId?: number;
    debiteurId?: number;
    minMontant?: number;
    maxMontant?: number;
    urgence?: Urgence;
    dateCreationDebut?: string;
    dateCreationFin?: string;
    dateClotureDebut?: string;
    dateClotureFin?: string;
    statut?: DossierStatus | string;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<DossiersResponse> {
    return this.dossierApi.searchAdvanced(params).pipe(
      tap(res => {
        // Mettre à jour la liste principale pour synchroniser l'affichage
        this.dossiersAllSubject.next(res.data || []);
      })
    );
  }

  // Utilitaires
  private onDataChanged(): void {
    // Recharger les listes clés et les stats
    this.loadEnAttente().subscribe();
    this.loadAssignesEtCreesAgent().subscribe();
    this.refreshStats().subscribe();
  }
}


