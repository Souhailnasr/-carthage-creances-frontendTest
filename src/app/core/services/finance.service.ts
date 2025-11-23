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

  // ========== NOUVEAUX ENDPOINTS POUR LES PROMPTS ==========

  /**
   * GET /api/finances/statistiques - Dashboard Chef Financier (Prompt 2)
   */
  getFinanceDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statistiques`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération du dashboard:', error);
        return throwError(() => new Error('Erreur lors de la récupération du dashboard'));
      })
    );
  }

  /**
   * GET /api/finances/alerts - Alertes financières (Prompt 2)
   */
  getFinanceAlerts(filters?: any): Observable<any[]> {
    const params = filters ? new HttpParams({ fromObject: filters }) : new HttpParams();
    return this.http.get<any[]>(`${this.apiUrl}/alerts`, { params }).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des alertes:', error);
        return throwError(() => new Error('Erreur lors de la récupération des alertes'));
      })
    );
  }

  /**
   * GET /api/finances/roi-agents - ROI par agent (Prompt 2)
   */
  getRoiAgents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/roi-agents`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération du ROI agents:', error);
        return throwError(() => new Error('Erreur lors de la récupération du ROI agents'));
      })
    );
  }

  /**
   * GET /api/frais/dossier/{id} - Frais par dossier (Prompt 3)
   */
  getDossierFrais(dossierId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/frais/dossier/${dossierId}`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des frais:', error);
        return throwError(() => new Error('Erreur lors de la récupération des frais'));
      })
    );
  }

  /**
   * POST /api/factures/dossier/{id} - Générer facture (Prompt 3)
   */
  generateFacture(dossierId: number): Observable<Blob> {
    return this.http.post(`${environment.apiUrl}/api/factures/dossier/${dossierId}`, {}, {
      responseType: 'blob'
    }).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la génération de la facture:', error);
        return throwError(() => new Error('Erreur lors de la génération de la facture'));
      })
    );
  }

  /**
   * GET /api/frais/en-attente - Frais en attente de validation (Prompt 4)
   */
  getPendingFrais(filters?: any): Observable<any> {
    const params = filters ? new HttpParams({ fromObject: filters }) : new HttpParams();
    return this.http.get<any>(`${environment.apiUrl}/api/frais/en-attente`, { params }).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des frais en attente:', error);
        return throwError(() => new Error('Erreur lors de la récupération des frais en attente'));
      })
    );
  }

  /**
   * PUT /api/frais/{id}/valider - Valider un frais (Prompt 4)
   */
  validerFrais(fraisId: number): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/api/frais/${fraisId}/valider`, {}).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la validation du frais:', error);
        return throwError(() => new Error('Erreur lors de la validation du frais'));
      })
    );
  }

  /**
   * PUT /api/frais/{id}/rejeter - Rejeter un frais (Prompt 4)
   */
  rejeterFrais(fraisId: number, commentaire: string): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/api/frais/${fraisId}/rejeter`, { commentaire }).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors du rejet du frais:', error);
        return throwError(() => new Error('Erreur lors du rejet du frais'));
      })
    );
  }

  /**
   * GET /api/tarifs - Liste des tarifs (Prompt 5)
   */
  getTarifs(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/tarifs`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des tarifs:', error);
        return throwError(() => new Error('Erreur lors de la récupération des tarifs'));
      })
    );
  }

  /**
   * POST /api/tarifs - Créer un tarif (Prompt 5)
   */
  createTarif(tarif: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/tarifs`, tarif).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la création du tarif:', error);
        return throwError(() => new Error('Erreur lors de la création du tarif'));
      })
    );
  }

  /**
   * PUT /api/tarifs/{id} - Modifier un tarif (Prompt 5)
   */
  updateTarif(tarifId: number, tarif: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/api/tarifs/${tarifId}`, tarif).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la modification du tarif:', error);
        return throwError(() => new Error('Erreur lors de la modification du tarif'));
      })
    );
  }

  /**
   * DELETE /api/tarifs/{id} - Supprimer un tarif (Prompt 5)
   */
  deleteTarif(tarifId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/tarifs/${tarifId}`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la suppression du tarif:', error);
        return throwError(() => new Error('Erreur lors de la suppression du tarif'));
      })
    );
  }

  /**
   * POST /api/tarifs/simuler - Simuler coût (Prompt 5)
   */
  simulerCout(request: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/tarifs/simuler`, request).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la simulation:', error);
        return throwError(() => new Error('Erreur lors de la simulation'));
      })
    );
  }

  /**
   * POST /api/frais/import - Import CSV des frais (Prompt 6)
   */
  importFraisCsv(file: File, mapping: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    return this.http.post<any>(`${environment.apiUrl}/api/frais/import`, formData).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de l\'import:', error);
        return throwError(() => new Error('Erreur lors de l\'import'));
      })
    );
  }

  /**
   * GET /api/finances/reports - Générer rapport (Prompt 7)
   */
  generateReport(params: any): Observable<any> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<any>(`${this.apiUrl}/reports`, { params: httpParams }).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la génération du rapport:', error);
        return throwError(() => new Error('Erreur lors de la génération du rapport'));
      })
    );
  }

  /**
   * GET /api/finances/reports/export/pdf - Export PDF (Prompt 7)
   */
  exportReportPdf(params: any): Observable<Blob> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get(`${this.apiUrl}/reports/export/pdf`, {
      params: httpParams,
      responseType: 'blob'
    }).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de l\'export PDF:', error);
        return throwError(() => new Error('Erreur lors de l\'export PDF'));
      })
    );
  }

  /**
   * GET /api/finances/reports/export/excel - Export Excel (Prompt 7)
   */
  exportReportExcel(params: any): Observable<Blob> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get(`${this.apiUrl}/reports/export/excel`, {
      params: httpParams,
      responseType: 'blob'
    }).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de l\'export Excel:', error);
        return throwError(() => new Error('Erreur lors de l\'export Excel'));
      })
    );
  }

  /**
   * GET /api/finances/reports/history - Historique des rapports (Prompt 7)
   */
  getReportHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/history`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération de l\'historique:', error);
        return throwError(() => new Error('Erreur lors de la récupération de l\'historique'));
      })
    );
  }

  /**
   * GET /api/finances/insights - Suggestions intelligentes (Prompt 8)
   */
  getFinanceInsights(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/insights`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des insights:', error);
        return throwError(() => new Error('Erreur lors de la récupération des insights'));
      })
    );
  }

  /**
   * PUT /api/finances/insights/{id}/traite - Marquer insight comme traité (Prompt 8)
   */
  marquerInsightTraite(insightId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/insights/${insightId}/traite`, {}).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors du marquage:', error);
        return throwError(() => new Error('Erreur lors du marquage'));
      })
    );
  }
}

