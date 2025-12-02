import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  DetailFacture as DetailFactureModel, 
  Finance,
  TarifDossierDTO,
  TarifDossierRequest,
  TraitementsDossierDTO,
  ValidationEtatDTO,
  FactureDetailDTO,
  PhaseFrais
} from '../../shared/models/finance.models';

// DetailFacture est maintenant importé de finance.models.ts

export interface StatistiquesCouts {
  totalFraisCreation: number;
  totalFraisGestion: number;
  totalActionsAmiable: number;
  totalActionsJuridique: number;
  totalAvocat: number;
  totalHuissier: number;
  grandTotal: number;
  // Nouvelles statistiques
  tauxReussiteRecouvrement?: number; // Taux de réussite de recouvrement (%)
  nombreDossiersEnquete?: number; // Nombre de dossiers en phase d'enquête
  nombreDossiersAmiable?: number; // Nombre de dossiers en phase amiable
  nombreDossiersJuridique?: number; // Nombre de dossiers en phase juridique
  nombreDossiersTotal?: number; // Nombre total de dossiers
  nombreDossiersClotures?: number; // Nombre de dossiers clôturés
  montantTotalRecouvre?: number; // Montant total récupéré
  montantTotalEnCours?: number; // Montant total en cours
  nombreFacturesEmises?: number; // Nombre de factures émises
  nombreFacturesPayees?: number; // Nombre de factures payées
  montantFacturesEnAttente?: number; // Montant des factures en attente
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
      map((finance: any) => {
        // ✅ Le backend retourne maintenant directement dossierId et numeroDossier
        // Plus besoin de mapping complexe, juste convertir les dates
        
        return {
          ...finance,
          // dossierId et numeroDossier sont déjà présents dans la réponse du backend
          dateOperation: finance.dateOperation ? new Date(finance.dateOperation) : new Date(),
          dateFacturation: finance.dateFacturation ? new Date(finance.dateFacturation) : undefined
        } as Finance;
      }),
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
  getDetailFacture(dossierId: number): Observable<DetailFactureModel> {
    return this.http.get<DetailFactureModel>(`${this.apiUrl}/dossier/${dossierId}/detail-facture`).pipe(
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
   * Statistiques étendues avec informations sur les dossiers par phase
   * Cette méthode combine les statistiques de coûts avec les statistiques de dossiers
   */
  getStatistiquesEtendues(): Observable<StatistiquesCouts> {
    // Récupérer les statistiques de coûts de base
    return this.getStatistiquesCouts().pipe(
      map((stats) => {
        // Les statistiques étendues seront calculées côté client
        // ou fournies par le backend si l'endpoint est disponible
        // Pour l'instant, on retourne les stats de base avec des valeurs par défaut
        return {
          ...stats,
          tauxReussiteRecouvrement: 0,
          nombreDossiersEnquete: 0,
          nombreDossiersAmiable: 0,
          nombreDossiersJuridique: 0,
          nombreDossiersTotal: 0,
          nombreDossiersClotures: 0,
          montantTotalRecouvre: 0,
          montantTotalEnCours: 0,
          nombreFacturesEmises: 0,
          nombreFacturesPayees: 0,
          montantFacturesEnAttente: 0
        };
      }),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des statistiques étendues:', error);
        // Retourner des statistiques vides en cas d'erreur
        const emptyStats: StatistiquesCouts = {
          totalFraisCreation: 0,
          totalFraisGestion: 0,
          totalActionsAmiable: 0,
          totalActionsJuridique: 0,
          totalAvocat: 0,
          totalHuissier: 0,
          grandTotal: 0,
          tauxReussiteRecouvrement: 0,
          nombreDossiersEnquete: 0,
          nombreDossiersAmiable: 0,
          nombreDossiersJuridique: 0,
          nombreDossiersTotal: 0,
          nombreDossiersClotures: 0,
          montantTotalRecouvre: 0,
          montantTotalEnCours: 0,
          nombreFacturesEmises: 0,
          nombreFacturesPayees: 0,
          montantFacturesEnAttente: 0
        };
        return throwError(() => new Error('Erreur lors de la récupération des statistiques étendues'));
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
        content: page.content.map((finance: any) => {
          // ✅ Le backend retourne maintenant directement dossierId et numeroDossier dans le DTO
          // Plus besoin de mapping complexe, juste convertir les dates
          
          // Debug: Log si dossierId est manquant (devrait être rare maintenant)
          if (!finance.dossierId && finance.id) {
            console.warn('⚠️ Finance sans dossierId:', {
              financeId: finance.id,
              rawData: finance
            });
          }
          
          return {
            ...finance,
            // dossierId et numeroDossier sont déjà présents dans la réponse du backend
            dateOperation: finance.dateOperation ? new Date(finance.dateOperation) : new Date(),
            dateFacturation: finance.dateFacturation ? new Date(finance.dateFacturation) : undefined
          } as Finance;
        })
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
      map(finances => finances.map((finance: any) => {
        // ✅ Le backend retourne maintenant directement dossierId et numeroDossier
        // Plus besoin de mapping complexe, juste convertir les dates
        
        return {
          ...finance,
          // dossierId et numeroDossier sont déjà présents dans la réponse du backend
          dateOperation: finance.dateOperation ? new Date(finance.dateOperation) : new Date(),
          dateFacturation: finance.dateFacturation ? new Date(finance.dateFacturation) : undefined
        } as Finance;
      })),
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

  // ========== NOUVELLES MÉTHODES POUR GESTION TARIFS DOSSIER ==========

  /**
   * GET /api/finances/dossier/{dossierId}/traitements
   * Récupérer tous les traitements d'un dossier organisés par phase
   */
  getTraitementsDossier(dossierId: number): Observable<TraitementsDossierDTO> {
    return this.http.get<TraitementsDossierDTO>(`${this.apiUrl}/dossier/${dossierId}/traitements`).pipe(
      map(traitements => {
        // Convertir les dates string en Date objects
        if (traitements.phaseCreation?.traitements) {
          traitements.phaseCreation.traitements = traitements.phaseCreation.traitements.map(t => ({
            ...t,
            date: typeof t.date === 'string' ? new Date(t.date) : t.date
          }));
        }
        if (traitements.phaseEnquete?.enquetePrecontentieuse) {
          const ep = traitements.phaseEnquete.enquetePrecontentieuse;
          ep.date = typeof ep.date === 'string' ? new Date(ep.date) : ep.date;
        }
        if (traitements.phaseAmiable?.actions) {
          traitements.phaseAmiable.actions = traitements.phaseAmiable.actions.map(a => {
            // Le backend retourne maintenant coutUnitaire selon la priorité :
            // 1. Si tarif existe : tarif.getCoutUnitaire() (BigDecimal)
            // 2. Sinon, si action.getCoutUnitaire() != null && > 0 : BigDecimal.valueOf(action.getCoutUnitaire())
            // 3. Sinon : null
            // Le backend fait déjà la conversion Double -> BigDecimal
            // On s'assure juste que la conversion BigDecimal -> number est correcte
            if (a.coutUnitaire != null) {
              // Convertir en number si c'est un string ou autre type
              a.coutUnitaire = typeof a.coutUnitaire === 'string' ? parseFloat(a.coutUnitaire) : Number(a.coutUnitaire);
            } else if (a.tarifExistant?.coutUnitaire) {
              // Fallback : utiliser celui du tarif si l'action n'en a pas
              a.coutUnitaire = typeof a.tarifExistant.coutUnitaire === 'string' 
                ? parseFloat(a.tarifExistant.coutUnitaire) 
                : Number(a.tarifExistant.coutUnitaire);
            }
            return {
              ...a,
              date: typeof a.date === 'string' ? new Date(a.date) : a.date
            };
          });
        }
        if (traitements.phaseJuridique?.documentsHuissier) {
          traitements.phaseJuridique.documentsHuissier = traitements.phaseJuridique.documentsHuissier.map(d => ({
            ...d,
            date: typeof d.date === 'string' ? new Date(d.date) : d.date
          }));
        }
        if (traitements.phaseJuridique?.actionsHuissier) {
          traitements.phaseJuridique.actionsHuissier = traitements.phaseJuridique.actionsHuissier.map(a => ({
            ...a,
            date: typeof a.date === 'string' ? new Date(a.date) : a.date
          }));
        }
        if (traitements.phaseJuridique?.audiences) {
          traitements.phaseJuridique.audiences = traitements.phaseJuridique.audiences.map(a => ({
            ...a,
            date: typeof a.date === 'string' ? new Date(a.date) : a.date
          }));
        }
        return traitements;
      }),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des traitements:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la récupération des traitements';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * POST /api/finances/dossier/{dossierId}/tarifs
   * Ajouter un tarif pour un traitement
   */
  ajouterTarif(dossierId: number, tarif: TarifDossierRequest): Observable<TarifDossierDTO> {
    // Mapper elementId vers le bon champ selon la phase et la catégorie
    const requestBody: any = {
      phase: tarif.phase,
      categorie: tarif.categorie,
      typeElement: tarif.typeElement,
      coutUnitaire: tarif.coutUnitaire,
      quantite: tarif.quantite || 1,
      commentaire: tarif.commentaire
    };

    // Mapper elementId vers le champ spécifique attendu par le backend
    if (tarif.elementId) {
      if (tarif.phase === PhaseFrais.AMIABLE && tarif.categorie === 'ACTION_AMIABLE') {
        requestBody.actionId = tarif.elementId;
      } else if (tarif.phase === PhaseFrais.JURIDIQUE) {
        if (tarif.categorie === 'DOCUMENT_HUISSIER') {
          requestBody.documentHuissierId = tarif.elementId;
        } else if (tarif.categorie === 'ACTION_HUISSIER') {
          requestBody.actionHuissierId = tarif.elementId;
        } else if (tarif.categorie === 'AUDIENCE' || tarif.categorie === 'HONORAIRES_AVOCAT') {
          // Les honoraires d'avocat sont aussi liés à l'audience
          requestBody.audienceId = tarif.elementId;
        }
      } else if (tarif.phase === PhaseFrais.ENQUETE && tarif.categorie === 'ENQUETE_PRECONTENTIEUSE') {
        requestBody.enqueteId = tarif.elementId;
      }
    }

    return this.http.post<TarifDossierDTO>(`${this.apiUrl}/dossier/${dossierId}/tarifs`, requestBody).pipe(
      map(tarifDto => ({
        ...tarifDto,
        dateCreation: tarifDto.dateCreation ? new Date(tarifDto.dateCreation) : undefined,
        dateValidation: tarifDto.dateValidation ? new Date(tarifDto.dateValidation) : undefined
      })),
      catchError((error) => {
        console.error('❌ Erreur lors de l\'ajout du tarif:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de l\'ajout du tarif';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * POST /api/finances/tarifs/{tarifId}/valider
   * Valider un tarif
   */
  validerTarif(tarifId: number, commentaire?: string): Observable<TarifDossierDTO> {
    const body = commentaire ? { commentaire } : {};
    return this.http.post<TarifDossierDTO>(`${this.apiUrl}/tarifs/${tarifId}/valider`, body).pipe(
      map(tarifDto => ({
        ...tarifDto,
        dateCreation: tarifDto.dateCreation ? new Date(tarifDto.dateCreation) : undefined,
        dateValidation: tarifDto.dateValidation ? new Date(tarifDto.dateValidation) : undefined
      })),
      catchError((error) => {
        console.error('❌ Erreur lors de la validation du tarif:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la validation du tarif';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * POST /api/finances/tarifs/{tarifId}/rejeter
   * Rejeter un tarif
   */
  rejeterTarif(tarifId: number, commentaire: string): Observable<TarifDossierDTO> {
    return this.http.post<TarifDossierDTO>(`${this.apiUrl}/tarifs/${tarifId}/rejeter`, { commentaire }).pipe(
      map(tarifDto => ({
        ...tarifDto,
        dateCreation: tarifDto.dateCreation ? new Date(tarifDto.dateCreation) : undefined,
        dateValidation: tarifDto.dateValidation ? new Date(tarifDto.dateValidation) : undefined
      })),
      catchError((error) => {
        console.error('❌ Erreur lors du rejet du tarif:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors du rejet du tarif';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * GET /api/finances/dossier/{dossierId}/validation-etat
   * Récupérer l'état de validation des tarifs
   */
  getValidationEtat(dossierId: number): Observable<ValidationEtatDTO> {
    return this.http.get<ValidationEtatDTO>(`${this.apiUrl}/dossier/${dossierId}/validation-etat`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération de l\'état de validation:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la récupération de l\'état de validation';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * POST /api/finances/dossier/{dossierId}/generer-facture
   * Générer une facture avec calcul automatique
   */
  genererFacture(dossierId: number): Observable<FactureDetailDTO> {
    return this.http.post<FactureDetailDTO>(`${this.apiUrl}/dossier/${dossierId}/generer-facture`, {}).pipe(
      map(response => {
        console.log('📊 Réponse backend complète:', response);
        
        // Vérifier que la réponse contient bien la structure attendue
        if (!response) {
          throw new Error('Réponse vide du serveur');
        }
        
        // Si la réponse est directement une Facture (ancien format)
        if (response.facture === undefined && (response as any).id) {
          console.warn('⚠️ Format de réponse différent détecté, conversion...');
          const facture = response as any;
          return {
            facture: {
              id: facture.id,
              numeroFacture: facture.numeroFacture || facture.numero || `FAC-${facture.id}`,
              dateEmission: facture.dateEmission ? (typeof facture.dateEmission === 'string' ? new Date(facture.dateEmission) : facture.dateEmission) : new Date(),
              dateEcheance: facture.dateEcheance ? (typeof facture.dateEcheance === 'string' ? new Date(facture.dateEcheance) : facture.dateEcheance) : undefined,
              statut: facture.statut || 'EMISE',
              montantHT: facture.montantHT || facture.montant || 0,
              montantTTC: facture.montantTTC || facture.montantTotal || 0
            },
            detail: response.detail || {
              fraisCreation: 0,
              fraisEnquete: 0,
              fraisAmiable: 0,
              fraisJuridique: 0,
              commissionsAmiable: 0,
              commissionsJuridique: 0,
              totalHT: facture.montantHT || facture.montant || 0,
              tva: 0,
              totalTTC: facture.montantTTC || facture.montantTotal || 0
            }
          } as FactureDetailDTO;
        }
        
        // Format normal avec facture et detail
        if (!response.facture) {
          console.error('❌ Structure de réponse invalide:', response);
          throw new Error('La réponse du serveur ne contient pas la propriété "facture"');
        }
        
        return {
          ...response,
          facture: {
            ...response.facture,
            dateEmission: response.facture.dateEmission 
              ? (typeof response.facture.dateEmission === 'string' 
                ? new Date(response.facture.dateEmission) 
                : response.facture.dateEmission)
              : new Date(),
            dateEcheance: response.facture.dateEcheance 
              ? (typeof response.facture.dateEcheance === 'string' 
                ? new Date(response.facture.dateEcheance) 
                : response.facture.dateEcheance)
              : undefined
          }
        };
      }),
      catchError((error) => {
        console.error('❌ Erreur lors de la génération de la facture:', error);
        console.error('❌ Détails de l\'erreur:', error.error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la génération de la facture';
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}

