import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { StatistiqueAmiable, PerformanceAgent, Action, Dossier, Tache, ChefAmiableNotification, User } from '../../shared/models';
import { TypeAction, ReponseDebiteur, StatutTache, Role } from '../../shared/models';
import { UtilisateurService, UtilisateurRequest } from '../../core/services/utilisateur.service';

@Injectable({
  providedIn: 'root'
})
export class ChefAmiableService {

  constructor(private utilisateurService: UtilisateurService) {}

  // Statistiques
  getStatistiques(): Observable<StatistiqueAmiable> {
    const stats = new StatistiqueAmiable({
      totalDossiers: 156,
      dossiersEnCours: 89,
      dossiersClotures: 67,
      tauxReussite: 42.9,
      montantRecupere: 2450000,
      montantEnCours: 1800000,
      actionsEffectuees: 1247,
      actionsReussies: 534,
      coutTotalActions: 125000
    });
    return of(stats);
  }

  // Performances des agents
  getPerformancesAgents(): Observable<PerformanceAgent[]> {
    const performances: PerformanceAgent[] = [
      new PerformanceAgent({
        agentId: '1',
        nomAgent: 'Ahmed Ben Ali',
        dossiersAssignes: 25,
        dossiersClotures: 12,
        tauxReussite: 48.0,
        montantRecupere: 450000,
        actionsEffectuees: 156,
        moyenneTempsTraitement: 15
      }),
      new PerformanceAgent({
        agentId: '2',
        nomAgent: 'Fatma Trabelsi',
        dossiersAssignes: 22,
        dossiersClotures: 15,
        tauxReussite: 68.2,
        montantRecupere: 380000,
        actionsEffectuees: 134,
        moyenneTempsTraitement: 12
      }),
      new PerformanceAgent({
        agentId: '3',
        nomAgent: 'Mohamed Khelil',
        dossiersAssignes: 28,
        dossiersClotures: 18,
        tauxReussite: 64.3,
        montantRecupere: 520000,
        actionsEffectuees: 189,
        moyenneTempsTraitement: 14
      })
    ];
    return of(performances);
  }

  // Dossiers avec actions
  getDossiersAvecActions(): Observable<any[]> {
    const dossiers = [
      {
        numeroDossier: 'DOS-2024-001',
        nomCreancier: 'Entreprise ABC',
        nomDebiteur: 'Société XYZ',
        actions: [
          {
            id: '1',
            type: TypeAction.APPEL,
            dateAction: new Date('2024-01-15'),
            reponseDebiteur: ReponseDebiteur.POSITIVE,
            nbOccurrences: 2,
            coutUnitaire: 15
          },
          {
            id: '2',
            type: TypeAction.EMAIL,
            dateAction: new Date('2024-01-16'),
            reponseDebiteur: ReponseDebiteur.EN_ATTENTE,
            nbOccurrences: 1,
            coutUnitaire: 5
          }
        ]
      },
      {
        numeroDossier: 'DOS-2024-002',
        nomCreancier: 'Compagnie DEF',
        nomDebiteur: 'Groupe GHI',
        actions: [
          {
            id: '3',
            type: TypeAction.VISITE,
            dateAction: new Date('2024-01-17'),
            reponseDebiteur: ReponseDebiteur.NEGATIVE,
            nbOccurrences: 1,
            coutUnitaire: 50
          }
        ]
      }
    ];
    return of(dossiers);
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
          role: Role.AGENT_RECOUVREMENT_AMIABLE,
          actif: utilisateur.actif
        }));
      })
    );
  }

  // Tâches
  getTaches(): Observable<Tache[]> {
    const taches: Tache[] = [
      new Tache({
        id: '1',
        titre: 'Relance dossier DOS-2024-001',
        description: 'Effectuer une relance téléphonique pour le dossier DOS-2024-001',
        dateCreation: new Date('2024-01-15'),
        dateEcheance: new Date('2024-01-20'),
        statut: StatutTache.EN_ATTENTE,
        agentId: '1',
        chefId: 'chef-1',
        dossierId: 'DOS-2024-001',
        priorite: 'ELEVEE'
      }),
      new Tache({
        id: '2',
        titre: 'Visite client DOS-2024-002',
        description: 'Planifier une visite chez le débiteur pour DOS-2024-002',
        dateCreation: new Date('2024-01-16'),
        dateEcheance: new Date('2024-01-22'),
        statut: StatutTache.EN_COURS,
        agentId: '2',
        chefId: 'chef-1',
        dossierId: 'DOS-2024-002',
        priorite: 'MOYENNE'
      })
    ];
    return of(taches);
  }

  // Notifications
  getNotifications(): Observable<ChefAmiableNotification[]> {
    const notifications: ChefAmiableNotification[] = [
      new ChefAmiableNotification({
        id: '1',
        titre: 'Nouveau dossier assigné',
        message: 'Le dossier DOS-2024-003 a été assigné au département amiable',
        dateCreation: new Date('2024-01-18T10:30:00'),
        lu: false,
        type: 'INFO',
        userId: 'chef-1',
        dossierId: 'DOS-2024-003'
      }),
      new ChefAmiableNotification({
        id: '2',
        titre: 'Action terminée',
        message: 'L\'action APPEL pour le dossier DOS-2024-001 a été terminée avec succès',
        dateCreation: new Date('2024-01-18T09:15:00'),
        lu: false,
        type: 'SUCCESS',
        userId: 'chef-1',
        actionId: '1'
      }),
      new ChefAmiableNotification({
        id: '3',
        titre: 'Tâche en retard',
        message: 'La tâche "Relance dossier DOS-2024-001" est en retard',
        dateCreation: new Date('2024-01-17T16:45:00'),
        lu: true,
        type: 'WARNING',
        userId: 'chef-1',
        dossierId: 'DOS-2024-001'
      })
    ];
    return of(notifications);
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
      map((nouvelUtilisateur) => {
        // Convertir l'utilisateur créé en User pour le module chef-amiable
        const user = new User({
          id: nouvelUtilisateur.id?.toString() || '',
          nom: nouvelUtilisateur.nom,
          prenom: nouvelUtilisateur.prenom,
          email: nouvelUtilisateur.email,
          role: Role.AGENT_RECOUVREMENT_AMIABLE,
          actif: nouvelUtilisateur.actif
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
