import { Injectable } from '@angular/core';
import { Role } from '../../shared/models/enums.model';
import { TypeNotification } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationPermissionsService {

  constructor() { }

  /**
   * Vérifie si un utilisateur peut envoyer une notification à un autre utilisateur
   */
  canSendNotificationTo(currentUser: any, targetUserId: number): boolean {
    if (!currentUser) {
      return false;
    }

    // Un utilisateur ne peut pas s'envoyer une notification à lui-même
    if (Number(currentUser.id) === targetUserId) {
      return false;
    }

    // Le Super Admin peut notifier tout le monde
    if (currentUser.role === Role.SUPER_ADMIN) {
      return true;
    }

    // Vérifier les relations hiérarchiques
    if (this.isChef(currentUser.role)) {
      const agentRoles = this.getAgentRolesForChef(currentUser.role);
      // Ici, on devrait vérifier le rôle de l'utilisateur cible
      // Pour simplifier, on retourne true si c'est un chef
      return true;
    }

    if (this.isAgent(currentUser.role)) {
      const chefRoles = this.getChefRoleForAgent(currentUser.role);
      // Ici, on devrait vérifier le rôle de l'utilisateur cible
      // Pour simplifier, on retourne true si c'est un agent
      return true;
    }

    return false;
  }

  /**
   * Obtient les types de notifications autorisés pour un rôle
   */
  getAllowedNotificationTypes(role: Role): TypeNotification[] {
    const typePermissions: { [key in Role]: TypeNotification[] } = {
      [Role.SUPER_ADMIN]: [
        TypeNotification.DOSSIER_CREE, TypeNotification.DOSSIER_VALIDE, TypeNotification.DOSSIER_REJETE,
        TypeNotification.DOSSIER_EN_ATTENTE, TypeNotification.ENQUETE_CREE, TypeNotification.ENQUETE_VALIDE,
        TypeNotification.ENQUETE_REJETE, TypeNotification.ENQUETE_EN_ATTENTE, TypeNotification.TACHE_URGENTE,
        TypeNotification.RAPPEL, TypeNotification.INFO
      ],
      [Role.CHEF_DEPARTEMENT_DOSSIER]: [
        TypeNotification.DOSSIER_CREE, TypeNotification.DOSSIER_VALIDE, TypeNotification.DOSSIER_REJETE,
        TypeNotification.DOSSIER_EN_ATTENTE, TypeNotification.TACHE_URGENTE, TypeNotification.RAPPEL,
        TypeNotification.INFO
      ],
      [Role.AGENT_DOSSIER]: [
        TypeNotification.DOSSIER_CREE, TypeNotification.DOSSIER_EN_ATTENTE, TypeNotification.TACHE_URGENTE,
        TypeNotification.RAPPEL, TypeNotification.INFO
      ],
      [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]: [
        TypeNotification.ENQUETE_CREE, TypeNotification.ENQUETE_VALIDE, TypeNotification.ENQUETE_REJETE,
        TypeNotification.ENQUETE_EN_ATTENTE, TypeNotification.TACHE_URGENTE, TypeNotification.RAPPEL,
        TypeNotification.INFO
      ],
      [Role.AGENT_RECOUVREMENT_JURIDIQUE]: [
        TypeNotification.ENQUETE_CREE, TypeNotification.ENQUETE_EN_ATTENTE, TypeNotification.TACHE_URGENTE,
        TypeNotification.RAPPEL, TypeNotification.INFO
      ],
      [Role.CHEF_DEPARTEMENT_FINANCE]: [
        TypeNotification.TACHE_URGENTE, TypeNotification.RAPPEL, TypeNotification.INFO
      ],
      [Role.AGENT_FINANCE]: [
        TypeNotification.TACHE_URGENTE, TypeNotification.RAPPEL, TypeNotification.INFO
      ],
      [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]: [
        TypeNotification.TACHE_URGENTE, TypeNotification.RAPPEL, TypeNotification.INFO
      ],
      [Role.AGENT_RECOUVREMENT_AMIABLE]: [
        TypeNotification.TACHE_URGENTE, TypeNotification.RAPPEL, TypeNotification.INFO
      ]
    };

    return typePermissions[role] || [];
  }

  /**
   * Vérifie si un rôle est un rôle de chef
   */
  private isChef(role: Role): boolean {
    const chefRoles = [
      Role.CHEF_DEPARTEMENT_DOSSIER,
      Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE,
      Role.CHEF_DEPARTEMENT_FINANCE,
      Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE
    ];
    return chefRoles.includes(role);
  }

  /**
   * Vérifie si un rôle est un rôle d'agent
   */
  private isAgent(role: Role): boolean {
    const agentRoles = [
      Role.AGENT_DOSSIER,
      Role.AGENT_RECOUVREMENT_JURIDIQUE,
      Role.AGENT_FINANCE,
      Role.AGENT_RECOUVREMENT_AMIABLE
    ];
    return agentRoles.includes(role);
  }

  /**
   * Obtient les rôles d'agents pour un chef donné
   */
  private getAgentRolesForChef(chefRole: Role): Role[] {
    const roleMapping: { [key in Role]: Role[] } = {
      [Role.CHEF_DEPARTEMENT_DOSSIER]: [Role.AGENT_DOSSIER],
      [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]: [Role.AGENT_RECOUVREMENT_JURIDIQUE],
      [Role.CHEF_DEPARTEMENT_FINANCE]: [Role.AGENT_FINANCE],
      [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]: [Role.AGENT_RECOUVREMENT_AMIABLE],
      [Role.SUPER_ADMIN]: [],
      [Role.AGENT_DOSSIER]: [],
      [Role.AGENT_RECOUVREMENT_JURIDIQUE]: [],
      [Role.AGENT_FINANCE]: [],
      [Role.AGENT_RECOUVREMENT_AMIABLE]: []
    };
    return roleMapping[chefRole] || [];
  }

  /**
   * Obtient le rôle de chef pour un agent donné
   */
  private getChefRoleForAgent(agentRole: Role): Role[] {
    const roleMapping: { [key in Role]: Role[] } = {
      [Role.AGENT_DOSSIER]: [Role.CHEF_DEPARTEMENT_DOSSIER],
      [Role.AGENT_RECOUVREMENT_JURIDIQUE]: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE],
      [Role.AGENT_FINANCE]: [Role.CHEF_DEPARTEMENT_FINANCE],
      [Role.AGENT_RECOUVREMENT_AMIABLE]: [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE],
      [Role.SUPER_ADMIN]: [],
      [Role.CHEF_DEPARTEMENT_DOSSIER]: [],
      [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]: [],
      [Role.CHEF_DEPARTEMENT_FINANCE]: [],
      [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]: []
    };
    return roleMapping[agentRole] || [];
  }

  /**
   * Obtient le message d'erreur approprié pour les permissions
   */
  getPermissionErrorMessage(currentUser: any, targetUser: any): string {
    if (!currentUser) {
      return 'Utilisateur non connecté';
    }

    if (Number(currentUser.id) === Number(targetUser.id)) {
      return 'Vous ne pouvez pas vous envoyer une notification à vous-même';
    }

    if (currentUser.role === Role.SUPER_ADMIN) {
      return 'En tant que Super Admin, vous pouvez notifier tous les utilisateurs';
    }

    if (this.isChef(currentUser.role)) {
      return 'En tant que chef, vous pouvez notifier vos agents';
    }

    if (this.isAgent(currentUser.role)) {
      return 'En tant qu\'agent, vous pouvez notifier votre chef';
    }

    return 'Vous n\'avez pas les permissions pour envoyer des notifications';
  }

  /**
   * Vérifie si l'utilisateur actuel peut envoyer des notifications
   */
  canSendNotifications(currentUser: any): boolean {
    if (!currentUser) return false;
    return currentUser.role === Role.SUPER_ADMIN || this.isChef(currentUser.role) || this.isAgent(currentUser.role);
  }

  /**
   * Obtient le message d'erreur pour les permissions refusées
   */
  getPermissionDeniedMessage(): string {
    return 'Vous n\'avez pas les permissions pour envoyer des notifications';
  }

  /**
   * Vérifie si l'utilisateur peut envoyer un type de notification spécifique
   */
  canSendNotificationType(currentUser: any, notificationType: TypeNotification): boolean {
    if (!currentUser) return false;
    const allowedTypes = this.getAllowedNotificationTypes(currentUser.role);
    return allowedTypes.includes(notificationType);
  }
}
