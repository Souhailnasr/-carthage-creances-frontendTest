import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Finance {
  id?: number;
  devise: string;
  dateOperation: Date | string;
  description: string;
  fraisAvocat?: number;
  fraisHuissier?: number;
  fraisCreationDossier: number;
  fraisGestionDossier: number;
  dureeGestionMois: number;
  coutActionsAmiable: number;
  coutActionsJuridique: number;
  nombreActionsAmiable: number;
  nombreActionsJuridique: number;
  factureFinalisee: boolean;
  dateFacturation?: Date | string;
  dossier: { id: number };
}

export interface DetailFacture {
  fraisCreationDossier: number;
  coutGestionTotal: number;
  coutActionsAmiable: number;
  coutActionsJuridique: number;
  fraisAvocat: number;
  fraisHuissier: number;
  totalFacture: number;
}

export interface StatistiquesCouts {
  totalFraisCreation: number;
  totalFraisGestion: number;
  totalActionsAmiable: number;
  totalActionsJuridique: number;
  totalAvocat: number;
  totalHuissier: number;
  grandTotal: number;
}

export interface ActionFinance {
  id: number;
  type: string;
  reponseDebiteur: string | null;
  dateAction: Date | string;
  nbOccurrences: number;
  coutUnitaire: number;
  totalCout: number;
  dossier: { id: number };
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private apiUrl = `${environment.apiUrl}/api/finances`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer Finance par dossier
   */
  getFinanceByDossier(dossierId: number): Observable<Finance> {
    return this.http.get<Finance>(`${this.apiUrl}/dossier/${dossierId}`).pipe(
      map(finance => ({
        ...finance,
        dateOperation: finance.dateOperation ? new Date(finance.dateOperation) : new Date(),
        dateFacturation: finance.dateFacturation ? new Date(finance.dateFacturation) : undefined
      })),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération de Finance:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la récupération de Finance';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Détail facture complète
   */
  getDetailFacture(dossierId: number): Observable<DetailFacture> {
    return this.http.get<DetailFacture>(`${this.apiUrl}/dossier/${dossierId}/facture`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération du détail facture:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la récupération du détail facture';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Coûts détaillés par dossier
   */
  getCoutsParDossier(dossierId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dossier/${dossierId}/detail`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des coûts:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la récupération des coûts';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Recalculer tous les coûts
   */
  recalculerCouts(dossierId: number): Observable<Finance> {
    return this.http.post<Finance>(`${this.apiUrl}/dossier/${dossierId}/recalculer`, {}).pipe(
      map(finance => ({
        ...finance,
        dateOperation: finance.dateOperation ? new Date(finance.dateOperation) : new Date(),
        dateFacturation: finance.dateFacturation ? new Date(finance.dateFacturation) : undefined
      })),
      catchError((error) => {
        console.error('❌ Erreur lors du recalcul des coûts:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors du recalcul des coûts';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Statistiques globales
   */
  getStatistiquesCouts(): Observable<StatistiquesCouts> {
    return this.http.get<StatistiquesCouts>(`${this.apiUrl}/statistiques`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des statistiques:', error);
        // Retourner des statistiques vides en cas d'erreur
        const emptyStats: StatistiquesCouts = {
          totalFraisCreation: 0,
          totalFraisGestion: 0,
          totalActionsAmiable: 0,
          totalActionsJuridique: 0,
          totalAvocat: 0,
          totalHuissier: 0,
          grandTotal: 0
        };
        return throwError(() => new Error('Erreur lors de la récupération des statistiques'));
      })
    );
  }

  /**
   * Liste paginée des dossiers avec coûts
   */
  getDossiersAvecCouts(page: number = 0, size: number = 10, sort: string = 'dateOperation'): Observable<Page<Finance>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
    return this.http.get<Page<Finance>>(`${this.apiUrl}/dossiers-avec-couts`, { params }).pipe(
      map(page => ({
        ...page,
        content: page.content.map(finance => ({
          ...finance,
          dateOperation: finance.dateOperation ? new Date(finance.dateOperation) : new Date(),
          dateFacturation: finance.dateFacturation ? new Date(finance.dateFacturation) : undefined
        }))
      })),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des dossiers avec coûts:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la récupération des dossiers';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Factures en attente
   */
  getFacturesEnAttente(): Observable<Finance[]> {
    return this.http.get<Finance[]>(`${this.apiUrl}/factures-en-attente`).pipe(
      map(finances => finances.map(finance => ({
        ...finance,
        dateOperation: finance.dateOperation ? new Date(finance.dateOperation) : new Date(),
        dateFacturation: finance.dateFacturation ? new Date(finance.dateFacturation) : undefined
      }))),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des factures en attente:', error);
        return throwError(() => new Error('Erreur lors de la récupération des factures en attente'));
      })
    );
  }

  /**
   * Finaliser une facture
   */
  finaliserFacture(dossierId: number): Observable<Finance> {
    return this.http.put<Finance>(`${this.apiUrl}/dossier/${dossierId}/finaliser-facture`, {}).pipe(
      map(finance => ({
        ...finance,
        dateOperation: finance.dateOperation ? new Date(finance.dateOperation) : new Date(),
        dateFacturation: finance.dateFacturation ? new Date(finance.dateFacturation) : undefined
      })),
      catchError((error) => {
        console.error('❌ Erreur lors de la finalisation de la facture:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la finalisation de la facture';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Actions avec coûts détaillés (pour Finance uniquement)
   */
  getActionsAvecCouts(dossierId: number): Observable<ActionFinance[]> {
    return this.http.get<ActionFinance[]>(`${environment.apiUrl}/api/actions/dossier/${dossierId}`).pipe(
      map(actions => actions.map(action => ({
        ...action,
        dateAction: new Date(action.dateAction)
      }))),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des actions avec coûts:', error);
        return throwError(() => new Error('Erreur lors de la récupération des actions avec coûts'));
      })
    );
  }
}

