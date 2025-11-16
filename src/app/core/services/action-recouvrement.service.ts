import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/api/actions`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les actions d'un dossier (sans coûts)
   */
  getActionsByDossier(dossierId: number): Observable<ActionRecouvrement[]> {
    return this.http.get<ActionRecouvrement[]>(`${this.apiUrl}/dossier/${dossierId}`).pipe(
      map(actions => actions.map(action => ({
        ...action,
        dateAction: new Date(action.dateAction)
      }))),
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
    // Préparer le payload en nettoyant les données
    const payload: any = {};
    
    // Construire le payload avec les champs requis selon l'entité backend
    // Propriétés connues: "reponseDebiteur", "type", "id", "nbOccurrences", "dateAction", "coutUnitaire"
    payload.type = action.type;
    payload.dateAction = action.dateAction;
    payload.nbOccurrences = action.nbOccurrences;
    
    // Envoyer coutUnitaire (vient du formulaire)
    payload.coutUnitaire = action.coutUnitaire !== undefined && action.coutUnitaire !== null ? action.coutUnitaire : 0;
    
    // Ajouter reponseDebiteur seulement s'il n'est pas null/undefined
    // Certains backends rejettent les champs null explicites
    if (action.reponseDebiteur !== null && action.reponseDebiteur !== undefined) {
      payload.reponseDebiteur = action.reponseDebiteur;
    }
    
    // Le backend attend dossierId directement (pas d'objet dossier)
    payload.dossierId = dossierId;
    
    // Supprimer dossier si présent (on utilise dossierId à la place)
    if (payload.dossier) {
      delete payload.dossier;
    }
    
    // S'assurer qu'on n'envoie pas de champs undefined
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
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

