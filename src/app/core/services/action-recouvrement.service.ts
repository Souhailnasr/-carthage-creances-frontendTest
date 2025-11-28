import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DossierApiService } from './dossier-api.service';
import { DossierApi } from '../../shared/models/dossier-api.model';

export enum TypeAction {
  APPEL = 'APPEL',
  EMAIL = 'EMAIL',
  VISITE = 'VISITE',
  LETTRE = 'LETTRE',
  AUTRE = 'AUTRE'
}

export enum ReponseDebiteur {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  EN_ATTENTE = 'EN_ATTENTE'
}

export interface ActionRecouvrement {
  id?: number;
  type: TypeAction;
  reponseDebiteur: ReponseDebiteur | null;
  dateAction: Date | string;
  nbOccurrences: number;
  coutUnitaire?: number;
  dossier: { id: number };
  agentId?: number;
  agentNom?: string;
  creePar?: {
    id?: number;
    nom?: string;
    prenom?: string;
  };
  editable?: boolean;
}

export interface StatistiquesActions {
  total: number;
  positives: number;
  negatives: number;
  sansReponse: number;
  parType: { [key: string]: number };
  dernieresActions: ActionRecouvrement[];
}

@Injectable({
  providedIn: 'root'
})
export class ActionRecouvrementService {
  private apiUrl = `${environment.apiUrl}/api/actions`
  
  constructor(
    private http: HttpClient,
    private dossierApiService: DossierApiService
  ) {}

  /**
   * Récupérer toutes les actions d'un dossier (sans coûts)
   */
  getActionsByDossier(dossierId: number): Observable<ActionRecouvrement[]> {
    return this.http.get<ActionRecouvrement[]>(`${this.apiUrl}/dossier/${dossierId}`).pipe(
      map(actions => actions.map(action => {
        const resolvedAgentId =
          action.agentId ??
          (action as any)?.agent?.id ??
          (action as any)?.createdBy?.id ??
          (action as any)?.creePar?.id ??
          (action as any)?.agentResponsable?.id;

        const resolvedAgentNom =
          action.agentNom ??
          (action as any)?.agent?.nom ??
          (action as any)?.createdBy?.nom ??
          ((action as any)?.creePar ? `${(action as any)?.creePar?.prenom || ''} ${(action as any)?.creePar?.nom || ''}`.trim() : undefined) ??
          (action as any)?.agentResponsable?.nom;

        return {
          ...action,
          agentId: resolvedAgentId ? Number(resolvedAgentId) : undefined,
          agentNom: resolvedAgentNom,
          creePar: (action as any)?.creePar,
          dateAction: new Date(action.dateAction)
        };
      })),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des actions:', error);
        return throwError(() => new Error('Erreur lors de la récupération des actions'));
      })
    );
  }

  /**
   * Créer une action (sans coût unitaire)
   */
  createAction(dossierId: number, action: Partial<ActionRecouvrement>): Observable<ActionRecouvrement> {
    // Validation des champs requis
    if (!dossierId || dossierId <= 0) {
      return throwError(() => new Error('Le dossierId est requis et doit être un nombre positif'));
    }
    
    if (!action.type) {
      return throwError(() => new Error('Le type d\'action est requis'));
    }
    
    if (!action.dateAction) {
      return throwError(() => new Error('La date de l\'action est requise'));
    }
    
    if (action.nbOccurrences === undefined || action.nbOccurrences === null || action.nbOccurrences < 1) {
      return throwError(() => new Error('Le nombre d\'occurrences est requis et doit être au moins 1'));
    }
    
    // Préparer le payload en nettoyant les données
    const payload: any = {};
    
    // Construire le payload avec les champs requis selon l'entité backend
    // Propriétés connues: "reponseDebiteur", "type", "id", "nbOccurrences", "dateAction", "coutUnitaire"
    payload.type = action.type;
    
    // Formater la date correctement (YYYY-MM-DD)
    let dateFormatted: string;
    if (action.dateAction instanceof Date) {
      dateFormatted = action.dateAction.toISOString().split('T')[0];
    } else if (typeof action.dateAction === 'string') {
      // Si c'est déjà une string, vérifier le format
      if (action.dateAction.includes('T')) {
        dateFormatted = action.dateAction.split('T')[0];
      } else if (action.dateAction.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateFormatted = action.dateAction;
      } else {
        // Essayer de parser la date
        const parsedDate = new Date(action.dateAction);
        if (isNaN(parsedDate.getTime())) {
          return throwError(() => new Error('Format de date invalide'));
        }
        dateFormatted = parsedDate.toISOString().split('T')[0];
      }
    } else {
      return throwError(() => new Error('Format de date invalide'));
    }
    payload.dateAction = dateFormatted;
    
    // Valider et formater nbOccurrences
    payload.nbOccurrences = Number(action.nbOccurrences);
    if (isNaN(payload.nbOccurrences) || payload.nbOccurrences < 1) {
      return throwError(() => new Error('Le nombre d\'occurrences doit être un nombre positif'));
    }
    
    // Valider et formater coutUnitaire
    payload.coutUnitaire = action.coutUnitaire !== undefined && action.coutUnitaire !== null 
      ? Number(action.coutUnitaire) 
      : 0;
    if (isNaN(payload.coutUnitaire)) {
      payload.coutUnitaire = 0;
    }
    
    // Ajouter reponseDebiteur seulement s'il n'est pas null/undefined
    // Certains backends rejettent les champs null explicites
    if (action.reponseDebiteur !== null && action.reponseDebiteur !== undefined) {
      payload.reponseDebiteur = action.reponseDebiteur;
    }
    
    // Le backend attend dossierId directement (pas d'objet dossier)
    payload.dossierId = Number(dossierId);
    if (isNaN(payload.dossierId) || payload.dossierId <= 0) {
      return throwError(() => new Error('Le dossierId doit être un nombre positif'));
    }
    
    // NE PAS envoyer agentId - le backend ne le reconnaît pas dans ActionRequestDTO
    // Le backend déduit probablement l'agent depuis le contexte d'authentification

    // S'assurer qu'on n'envoie pas de champs undefined ou null
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });
    
    console.log('📤 Envoi de la requête POST à:', this.apiUrl);
    console.log('📦 Payload nettoyé:', JSON.stringify(payload, null, 2));
    console.log('🔍 Détails du payload:', {
      type: typeof payload.type,
      dateAction: typeof payload.dateAction,
      nbOccurrences: typeof payload.nbOccurrences,
      coutUnitaire: typeof payload.coutUnitaire,
      reponseDebiteur: payload.reponseDebiteur ? typeof payload.reponseDebiteur : 'null/undefined',
      dossierId: typeof payload.dossierId,
      dossierIdValue: payload.dossierId
    });
    console.log('🔍 Validation du payload:', {
      typePresent: !!payload.type,
      dateActionPresent: !!payload.dateAction,
      nbOccurrencesPresent: payload.nbOccurrences !== undefined && payload.nbOccurrences !== null,
      coutUnitairePresent: payload.coutUnitaire !== undefined && payload.coutUnitaire !== null,
      dossierIdPresent: !!payload.dossierId,
      dossierIdValid: typeof dossierId === 'number' && dossierId > 0
    });
    
    return this.http.post<ActionRecouvrement>(this.apiUrl, payload, { 
      observe: 'response' // Pour avoir accès à la réponse complète
    }).pipe(
      map(response => {
        console.log('✅ Réponse reçue du backend:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers.keys(),
          body: response.body
        });
        const action = response.body!;
        return {
          ...action,
          dateAction: new Date(action.dateAction)
        };
      }),
      catchError((error) => {
        console.error('❌ Erreur lors de la création de l\'action:', error);
        console.error('❌ Erreur complète:', {
          name: error.name,
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          ok: error.ok,
          headers: error.headers ? error.headers.keys() : 'N/A',
          error: error.error,
          errorType: typeof error.error,
          errorString: error.error ? JSON.stringify(error.error) : 'null/undefined'
        });
        
        // Gestion spécifique des erreurs
        if (error.status === 400) {
          // Le backend peut retourner une erreur 400 sans body
          // Dans ce cas, on essaie de donner un message utile
          let errorMessage = 'Données invalides (400 Bad Request)';
          
          if (error.error) {
            if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.error) {
              errorMessage = error.error.error;
            } else if (error.error.errors) {
              errorMessage = 'Erreurs de validation: ' + JSON.stringify(error.error.errors);
            }
          }
          
          console.error('❌ Erreur 400 - Message:', errorMessage);
          console.error('❌ Payload envoyé:', JSON.stringify(payload, null, 2));
          
          // Suggérer des solutions possibles
          console.warn('💡 Suggestions de débogage:');
          console.warn('   1. Vérifier que tous les champs requis sont présents');
          console.warn('   2. Vérifier le format de la date (attendu: YYYY-MM-DD)');
          console.warn('   3. Vérifier que le dossierId existe dans la base de données');
          console.warn('   4. Vérifier les logs du backend pour plus de détails');
        }
        
        const finalErrorMessage = error.error?.message || 
                                  error.error?.error || 
                                  (error.status === 400 ? 'Données invalides. Vérifiez les champs requis.' : error.message) || 
                                  'Erreur lors de la création de l\'action';
        return throwError(() => new Error(finalErrorMessage));
      })
    );
  }

  /**
   * Créer une action avec mise à jour du montant recouvré (si réponse positive)
   */
  createActionWithMontant(
    dossierId: number, 
    action: Partial<ActionRecouvrement>, 
    montantRecouvre?: number
  ): Observable<{ action: ActionRecouvrement; dossier: DossierApi | null; montantUpdated: boolean; error?: any }> {
    // Étape 1 : Créer l'action
    return this.createAction(dossierId, action).pipe(
      switchMap((createdAction: ActionRecouvrement) => {
        // Étape 2 : Si réponse positive et montant fourni, mettre à jour le montant
        if (action.reponseDebiteur === ReponseDebiteur.POSITIVE && montantRecouvre != null && montantRecouvre > 0) {
          if (!this.dossierApiService) {
            console.error('❌ DossierApiService non injecté');
            return of({
              action: createdAction,
              dossier: null,
              montantUpdated: false,
              error: new Error('DossierApiService non disponible')
            });
          }
          return this.dossierApiService.updateMontantRecouvre(dossierId, montantRecouvre).pipe(
            map((updatedDossier: DossierApi) => {
              return {
                action: createdAction,
                dossier: updatedDossier,
                montantUpdated: true
              };
            }),
            catchError((error) => {
              // Si la mise à jour du montant échoue, retourner quand même l'action créée
              console.error('❌ Erreur lors de la mise à jour du montant:', error);
              return of({
                action: createdAction,
                dossier: null,
                montantUpdated: false,
                error: error
              });
            })
          );
        } else {
          // Pas de mise à jour de montant nécessaire
          return of({
            action: createdAction,
            dossier: null,
            montantUpdated: false
          });
        }
      }),
      catchError((error) => {
        console.error('❌ Erreur lors de la création de l\'action:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Modifier une action
   */
  updateAction(actionId: number, action: Partial<ActionRecouvrement>): Observable<ActionRecouvrement> {
    return this.http.put<ActionRecouvrement>(`${this.apiUrl}/${actionId}`, action).pipe(
      map(action => ({
        ...action,
        dateAction: new Date(action.dateAction)
      })),
      catchError((error) => {
        console.error('❌ Erreur lors de la modification de l\'action:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la modification de l\'action';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Supprimer une action
   */
  deleteAction(actionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${actionId}`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la suppression de l\'action:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la suppression de l\'action';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Filtrer par type
   */
  getActionsByType(dossierId: number, type: TypeAction): Observable<ActionRecouvrement[]> {
    return this.http.get<ActionRecouvrement[]>(`${this.apiUrl}/type/${type}/dossier/${dossierId}`).pipe(
      map(actions => actions.map(action => ({
        ...action,
        dateAction: new Date(action.dateAction)
      }))),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des actions par type:', error);
        return throwError(() => new Error('Erreur lors de la récupération des actions par type'));
      })
    );
  }

  /**
   * Filtrer par réponse
   */
  getActionsByReponse(dossierId: number, reponse: ReponseDebiteur): Observable<ActionRecouvrement[]> {
    return this.http.get<ActionRecouvrement[]>(`${this.apiUrl}/dossier/${dossierId}/reponse/${reponse}`).pipe(
      map(actions => actions.map(action => ({
        ...action,
        dateAction: new Date(action.dateAction)
      }))),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des actions par réponse:', error);
        return throwError(() => new Error('Erreur lors de la récupération des actions par réponse'));
      })
    );
  }

  /**
   * Calculer les statistiques
   */
  getStatistiquesActions(dossierId: number): Observable<StatistiquesActions> {
    return this.getActionsByDossier(dossierId).pipe(
      map(actions => {
        const stats: StatistiquesActions = {
          total: actions.length,
          positives: actions.filter(a => a.reponseDebiteur === ReponseDebiteur.POSITIVE).length,
          negatives: actions.filter(a => a.reponseDebiteur === ReponseDebiteur.NEGATIVE).length,
          sansReponse: actions.filter(a => !a.reponseDebiteur || a.reponseDebiteur === ReponseDebiteur.EN_ATTENTE).length,
          parType: {},
          dernieresActions: actions
            .sort((a, b) => {
              const dateA = new Date(a.dateAction).getTime();
              const dateB = new Date(b.dateAction).getTime();
              return dateB - dateA; // Plus récentes en premier
            })
            .slice(0, 5) // Les 5 dernières actions
        };
        
        actions.forEach(action => {
          stats.parType[action.type] = (stats.parType[action.type] || 0) + 1;
        });
        
        return stats;
      }),
      catchError((error) => {
        console.error('❌ Erreur lors du calcul des statistiques:', error);
        // Retourner des statistiques vides en cas d'erreur
        return throwError(() => new Error('Erreur lors du calcul des statistiques'));
      })
    );
  }
}

