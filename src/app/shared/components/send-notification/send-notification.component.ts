import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationPermissionsService } from '../../../core/services/notification-permissions.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UtilisateurService } from '../../../core/services/utilisateur.service';
import { NotificationRequest, TypeNotification } from '../../models/notification.model';
import { User, Role } from '../../models';

@Component({
  selector: 'app-send-notification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './send-notification.component.html',
  styleUrls: ['./send-notification.component.scss']
})
export class SendNotificationComponent implements OnInit, OnDestroy {
  notificationForm = {
    targetUserId: null as number | null,
    type: '' as TypeNotification | '',
    titre: '',
    message: '',
    lienAction: ''
  };

  availableUsers: User[] = [];
  availableTypes: TypeNotification[] = [];
  isLoading: boolean = false;
  canSendNotifications: boolean = false;
  permissionMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private notificationPermissions: NotificationPermissionsService,
    private authService: AuthService,
    private toastService: ToastService,
    private utilisateurService: UtilisateurService
  ) {}

  ngOnInit(): void {
    this.checkPermissions();
    this.loadAvailableTypes();
    this.loadAvailableUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkPermissions(): void {
    const currentUser = this.authService.getCurrentUser();
    this.canSendNotifications = this.notificationPermissions.canSendNotifications(currentUser);
    this.permissionMessage = this.notificationPermissions.getPermissionDeniedMessage();
  }

  private loadAvailableTypes(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.availableTypes = this.notificationPermissions.getAllowedNotificationTypes(currentUser.role);
    }
  }

  private loadAvailableUsers(): void {
    this.utilisateurService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users: any[]) => {
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            // Filtrer les utilisateurs selon les permissions
            this.availableUsers = users.filter((user: any) => 
              user.id !== currentUser.id && 
              this.notificationPermissions.canSendNotificationTo(currentUser, user.id)
            );
          }
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des utilisateurs:', error);
          this.toastService.error('Erreur lors du chargement des utilisateurs');
        }
      });
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.toastService.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!this.notificationForm.targetUserId) {
      this.toastService.error('Veuillez sélectionner un destinataire');
      return;
    }

    if (!this.notificationForm.type) {
      this.toastService.error('Veuillez sélectionner un type de notification');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.error('Utilisateur non connecté');
      return;
    }

    if (!this.notificationPermissions.canSendNotificationTo(currentUser, this.notificationForm.targetUserId)) {
      this.toastService.error('Vous n\'avez pas la permission d\'envoyer une notification à cet utilisateur');
      return;
    }

    if (!this.notificationPermissions.canSendNotificationType(currentUser, this.notificationForm.type)) {
      this.toastService.error('Vous n\'avez pas la permission d\'envoyer ce type de notification');
      return;
    }

    this.isLoading = true;

    const notificationRequest: NotificationRequest = {
      utilisateur: { id: this.notificationForm.targetUserId },
      type: this.notificationForm.type,
      titre: this.notificationForm.titre,
      message: this.notificationForm.message,
      lienAction: this.notificationForm.lienAction || undefined
    };

    this.notificationService.createNotification(notificationRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notification) => {
          this.toastService.success('Notification envoyée avec succès');
          this.resetForm();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors de l\'envoi de la notification:', error);
          this.toastService.error('Erreur lors de l\'envoi de la notification');
          this.isLoading = false;
        }
      });
  }

  isFormValid(): boolean {
    return !!(
      this.notificationForm.targetUserId &&
      this.notificationForm.type &&
      this.notificationForm.titre.trim() &&
      this.notificationForm.message.trim()
    );
  }

  resetForm(): void {
    this.notificationForm = {
      targetUserId: null,
      type: '',
      titre: '',
      message: '',
      lienAction: ''
    };
  }

  getTypeDisplayName(type: TypeNotification): string {
    return this.notificationService.getTypeDisplayName(type);
  }

  getTypeIcon(type: TypeNotification): string {
    return this.notificationService.getTypeIcon(type);
  }

  getTypeColor(type: TypeNotification): string {
    return this.notificationService.getTypeColor(type);
  }

  getUserDisplayName(user: User): string {
    return `${user.prenom} ${user.nom} (${this.getRoleDisplayName(user.role)})`;
  }

  getTypeDescription(type: TypeNotification): string {
    const descriptions: { [key in TypeNotification]: string } = {
      [TypeNotification.DOSSIER_CREE]: 'Notification lors de la création d\'un nouveau dossier',
      [TypeNotification.DOSSIER_VALIDE]: 'Notification de validation d\'un dossier',
      [TypeNotification.DOSSIER_REJETE]: 'Notification de rejet d\'un dossier',
      [TypeNotification.DOSSIER_EN_ATTENTE]: 'Notification de dossier en attente de traitement',
      [TypeNotification.ENQUETE_CREE]: 'Notification lors de la création d\'une nouvelle enquête',
      [TypeNotification.ENQUETE_VALIDE]: 'Notification de validation d\'une enquête',
      [TypeNotification.ENQUETE_REJETE]: 'Notification de rejet d\'une enquête',
      [TypeNotification.ENQUETE_EN_ATTENTE]: 'Notification d\'enquête en attente de traitement',
      [TypeNotification.TACHE_URGENTE]: 'Notification pour une tâche urgente',
      [TypeNotification.RAPPEL]: 'Notification de rappel',
      [TypeNotification.INFO]: 'Notification d\'information générale'
    };
    return descriptions[type] || 'Description non disponible';
  }

  private getRoleDisplayName(role: Role): string {
    const roleNames: { [key in Role]: string } = {
      [Role.SUPER_ADMIN]: 'Super Admin',
      [Role.CHEF_DEPARTEMENT_DOSSIER]: 'Chef Département Dossier',
      [Role.AGENT_DOSSIER]: 'Agent Dossier',
      [Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE]: 'Chef Département Recouvrement Juridique',
      [Role.AGENT_RECOUVREMENT_JURIDIQUE]: 'Agent Recouvrement Juridique',
      [Role.CHEF_DEPARTEMENT_FINANCE]: 'Chef Département Finance',
      [Role.AGENT_FINANCE]: 'Agent Finance',
      [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]: 'Chef Département Recouvrement Amiable',
      [Role.AGENT_RECOUVREMENT_AMIABLE]: 'Agent Recouvrement Amiable',
    };
    return roleNames[role] || role;
  }
}
