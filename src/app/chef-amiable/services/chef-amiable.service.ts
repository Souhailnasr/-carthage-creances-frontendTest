import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { StatistiqueAmiable, PerformanceAgent, Action, Dossier, Tache, ChefAmiableNotification, User } from '../../shared/models';
import { TypeAction, ReponseDebiteur, StatutTache, Role } from '../../shared/models';
import { UtilisateurService, UtilisateurRequest } from '../../core/services/utilisateur.service';
import { DossierApiService } from '../../core/services/dossier-api.service';
import { DossierApi } from '../../shared/models/dossier-api.model';

@Injectable({
  providedIn: 'root'
})
export class ChefAmiableService {

  constructor(
    private utilisateurService: UtilisateurService,
    private dossierApiService: DossierApiService
  ) {}

  // Statistiques - Utilise maintenant les vraies données depuis l'API
  getStatistiques(): Observable<StatistiqueAmiable> {
    // Utiliser le service de statistiques pour récupérer les vraies données
    // Pour l'instant, calculer depuis les dossiers réels
    return this.dossierApiService.getDossiersRecouvrementAmiable(0, 1000).pipe(
      map((page) => {
        const dossiers = page.content;
        const totalDossiers = page.totalElements;
        const dossiersEnCours = dossiers.filter(d => !d.dateCloture && d.dossierStatus !== 'CLOTURE').length;
        const dossiersClotures = dossiers.filter(d => d.dateCloture || d.dossierStatus === 'CLOTURE').length;
        const montantRecupere = dossiers
          .filter(d => d.dateCloture)
          .reduce((sum, d) => sum + (d.montantCreance || 0), 0);
        const montantEnCours = dossiers
          .filter(d => !d.dateCloture)
          .reduce((sum, d) => sum + (d.montantCreance || 0), 0);
        const tauxReussite = totalDossiers > 0 ? (dossiersClotures / totalDossiers) * 100 : 0;
        
        return new StatistiqueAmiable({
          totalDossiers,
          dossiersEnCours,
          dossiersClotures,
          tauxReussite,
          montantRecupere,
          montantEnCours,
          actionsEffectuees: 0, // Sera calculé depuis les actions réelles
          actionsReussies: 0,
          coutTotalActions: 0
        });
      }),
      catchError((error) => {
        console.error('❌ Erreur lors du chargement des statistiques:', error);
        return of(new StatistiqueAmiable());
      })
    );
  }

  // Performances des agents - Utilise maintenant les vraies données depuis l'API
  getPerformancesAgents(): Observable<PerformanceAgent[]> {
    // Utiliser le service de performance pour récupérer les vraies données
    // Pour l'instant, retourner un tableau vide et laisser le composant utiliser PerformanceService
    return of([]);
  }

  // Dossiers avec actions - Utilise maintenant les vraies données
  getDossiersAvecActions(): Observable<DossierApi[]> {
    // Utiliser le service DossierApiService pour charger les vrais dossiers
    return this.dossierApiService.getDossiersRecouvrementAmiable(0, 100).pipe(
      map((page) => {
        // Retourner les dossiers avec leurs actions (si disponibles)
        return page.content.map((dossier: DossierApi) => ({
          ...dossier,
          actions: dossier.actions || []
        }));
      }),
      catchError((error) => {
        console.error('❌ Erreur lors du chargement des dossiers avec actions:', error);
        // Retourner un tableau vide en cas d'erreur
        return of([]);
      })
    );
  }

  // Agents amiable
  getAgentsAmiable(): Observable<User[]> {
    return this.utilisateurService.getUtilisateursByRole('AGENT_RECOUVREMENT_AMIABLE').pipe(
      map((utilisateurs) => {
        return utilisateurs.map(utilisateur => new User({
          id: utilisateur.id?.toString() || '',
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          roleUtilisateur: Role.AGENT_RECOUVREMENT_AMIABLE,
          actif: utilisateur.actif
        }));
      })
    );
  }

  // Tâches - Utilise maintenant les vraies données depuis l'API
  getTaches(): Observable<Tache[]> {
    // Les tâches doivent être récupérées via TacheUrgenteService
    // Retourner un tableau vide et laisser le composant utiliser TacheUrgenteService
    return of([]);
  }

  // Notifications - Utilise maintenant les vraies données depuis l'API
  getNotifications(): Observable<ChefAmiableNotification[]> {
    // Les notifications doivent être récupérées via NotificationService
    // Retourner un tableau vide et laisser le composant utiliser NotificationService
    return of([]);
  }

  // Actions CRUD
  creerAgent(agent: Partial<User>): Observable<User> {
    const agentRequest: UtilisateurRequest = {
      nom: agent.nom || '',
      prenom: agent.prenom || '',
      email: agent.email || '',
      motDePasse: agent.motDePasse || '',
      roleUtilisateur: 'AGENT_RECOUVREMENT_AMIABLE',
      actif: true
    };

    return this.utilisateurService.createUtilisateur(agentRequest).pipe(
      map((response) => {
        // L'AuthenticationResponse ne contient que le token, on doit recharger les données utilisateur
        // Pour l'instant, on retourne un User basé sur les données de la requête
        const user = new User({
          id: Date.now().toString(), // ID temporaire
          nom: agent.nom || '',
          prenom: agent.prenom || '',
          email: agent.email || '',
          roleUtilisateur: Role.AGENT_RECOUVREMENT_AMIABLE,
          actif: true
        });
        return user;
      })
    );
  }

  creerTache(tache: Partial<Tache>): Observable<Tache> {
    const nouvelleTache = new Tache({
      id: Date.now().toString(),
      titre: tache.titre || '',
      description: tache.description || '',
      dateCreation: new Date(),
      dateEcheance: tache.dateEcheance,
      statut: StatutTache.EN_ATTENTE,
      agentId: tache.agentId || '',
      chefId: 'chef-1',
      dossierId: tache.dossierId,
      priorite: tache.priorite || 'MOYENNE'
    });
    return of(nouvelleTache);
  }

  affecterAuJuridique(dossierId: string): Observable<boolean> {
    // Simulation de l'affectation au juridique
    return of(true);
  }

  cloturerDossier(dossierId: string): Observable<boolean> {
    // Simulation de la clôture du dossier
    return of(true);
  }
}
