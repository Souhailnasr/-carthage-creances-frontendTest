import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, Notification, TypeNotification, StatutNotification } from '../../../core/services/notification.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  notificationsNonLues: Notification[] = [];
  countNonLues = 0;
  showDropdown = false;
  showCreateNotification = false;
  newNotification: Partial<Notification> = {
    titre: '',
    message: '',
    type: TypeNotification.RAPPEL,
    statut: StatutNotification.NON_LUE
  };
  private subscription: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.startPolling();
    // Charger les notifications mockées par défaut pour les tests
    this.loadMockNotifications();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadNotifications(): void {
    // Mock user ID pour les tests
    const mockUserId = 1;
    this.notificationService.getNotificationsByUser(mockUserId).subscribe(
      notifications => {
        this.notifications = notifications;
        this.notificationsNonLues = notifications.filter(n => n.statut === StatutNotification.NON_LUE);
        this.countNonLues = this.notificationsNonLues.length;
      }
    );
  }

  startPolling(): void {
    // Polling toutes les 30 secondes pour les nouvelles notifications
    this.subscription.add(
      interval(30000).subscribe(() => {
        this.loadNotifications();
      })
    );
  }

  loadMockNotifications(): void {
    // Données mockées pour les tests
    this.notifications = [
      {
        id: 1,
        destinataireId: 1,
        type: TypeNotification.DOSSIER_CREE,
        titre: 'Nouveau dossier créé',
        message: 'Un nouveau dossier a été créé et nécessite votre attention.',
        statut: StatutNotification.NON_LUE,
        dateCreation: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        lienAction: '/dossiers/123'
      },
      {
        id: 2,
        destinataireId: 1,
        type: TypeNotification.TACHE_URGENTE,
        titre: 'Tâche urgente',
        message: 'Une tâche urgente vous a été assignée.',
        statut: StatutNotification.NON_LUE,
        dateCreation: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        lienAction: '/taches/456'
      },
      {
        id: 3,
        destinataireId: 1,
        type: TypeNotification.RAPPEL,
        titre: 'Rappel',
        message: 'N\'oubliez pas de traiter le dossier en attente.',
        statut: StatutNotification.LUE,
        dateCreation: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        dateLecture: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
      }
    ];

    this.notificationsNonLues = this.notifications.filter(n => n.statut === StatutNotification.NON_LUE);
    this.countNonLues = this.notificationsNonLues.length;
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  markAsRead(notification: Notification): void {
    if (notification.statut === StatutNotification.NON_LUE) {
      this.notificationService.marquerLue(notification.id).subscribe(
        () => {
          notification.statut = StatutNotification.LUE;
          notification.dateLecture = new Date().toISOString();
          this.updateNotificationsList();
        }
      );
    }
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(n => n.statut === StatutNotification.NON_LUE);
    unreadNotifications.forEach(notification => {
      this.notificationService.marquerLue(notification.id).subscribe(
        () => {
          notification.statut = StatutNotification.LUE;
          notification.dateLecture = new Date().toISOString();
        }
      );
    });
    this.updateNotificationsList();
  }

  deleteNotification(notification: Notification): void {
    this.notificationService.deleteNotification(notification.id).subscribe(
      () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        this.updateNotificationsList();
      }
    );
  }

  private updateNotificationsList(): void {
    this.notificationsNonLues = this.notifications.filter(n => n.statut === StatutNotification.NON_LUE);
    this.countNonLues = this.notificationsNonLues.length;
  }

  getNotificationIcon(type: TypeNotification): string {
    const icons: { [key in TypeNotification]: string } = {
      [TypeNotification.DOSSIER_CREE]: 'fas fa-file-plus',
      [TypeNotification.DOSSIER_VALIDE]: 'fas fa-check-circle',
      [TypeNotification.DOSSIER_REJETE]: 'fas fa-times-circle',
      [TypeNotification.DOSSIER_EN_ATTENTE]: 'fas fa-clock',
      [TypeNotification.ENQUETE_CREE]: 'fas fa-search-plus',
      [TypeNotification.ENQUETE_VALIDE]: 'fas fa-check-circle',
      [TypeNotification.ENQUETE_REJETE]: 'fas fa-times-circle',
      [TypeNotification.ENQUETE_EN_ATTENTE]: 'fas fa-clock',
      [TypeNotification.TACHE_URGENTE]: 'fas fa-exclamation-triangle',
      [TypeNotification.RAPPEL]: 'fas fa-bell',
      [TypeNotification.INFO]: 'fas fa-info-circle'
    };
    return icons[type] || 'fas fa-bell';
  }

  getNotificationClass(type: TypeNotification): string {
    const classes: { [key in TypeNotification]: string } = {
      [TypeNotification.DOSSIER_CREE]: 'notification-info',
      [TypeNotification.DOSSIER_VALIDE]: 'notification-success',
      [TypeNotification.DOSSIER_REJETE]: 'notification-danger',
      [TypeNotification.DOSSIER_EN_ATTENTE]: 'notification-warning',
      [TypeNotification.ENQUETE_CREE]: 'notification-info',
      [TypeNotification.ENQUETE_VALIDE]: 'notification-success',
      [TypeNotification.ENQUETE_REJETE]: 'notification-danger',
      [TypeNotification.ENQUETE_EN_ATTENTE]: 'notification-warning',
      [TypeNotification.TACHE_URGENTE]: 'notification-danger',
      [TypeNotification.RAPPEL]: 'notification-warning',
      [TypeNotification.INFO]: 'notification-info'
    };
    return classes[type] || 'notification-info';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "à l'instant";
    if (diffMinutes < 60) return `il y a ${diffMinutes} minutes`;
    if (diffHours < 24) return `il y a ${diffHours} heures`;
    if (diffDays < 30) return `il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  }

  createNotification(): void {
    if (this.newNotification.titre && this.newNotification.message) {
      const notificationRequest = {
        destinataireId: 1, // Mock destinataire
        type: this.newNotification.type as TypeNotification,
        titre: this.newNotification.titre,
        message: this.newNotification.message,
        lienAction: this.newNotification.lienAction
      };

      this.notificationService.createNotification(notificationRequest).subscribe(
        () => {
          this.showCreateNotification = false;
          this.newNotification = {
            titre: '',
            message: '',
            type: TypeNotification.RAPPEL,
            statut: StatutNotification.NON_LUE
          };
          this.loadNotifications();
        }
      );
    }
  }

  closeCreateNotification(): void {
    this.showCreateNotification = false;
    this.newNotification = {
      titre: '',
      message: '',
      type: TypeNotification.RAPPEL,
      statut: StatutNotification.NON_LUE
    };
  }
}
