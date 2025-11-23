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
    statut: 'NON_LUE'
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
    this.notificationService.getNotifications(mockUserId).subscribe({
      next: (notifications: Notification[]) => {
        this.notifications = notifications;
        this.notificationsNonLues = notifications.filter(n => n.statut === 'NON_LUE');
        this.countNonLues = this.notificationsNonLues.length;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    });
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
    // Plus de données mockées - utiliser les vraies données de l'API
    // Cette méthode peut être supprimée si les vraies données sont disponibles
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
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        this.updateNotificationsList();
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression de la notification:', error);
      }
    });
  }

  private updateNotificationsList(): void {
    this.notificationsNonLues = this.notifications.filter(n => n.statut === 'NON_LUE');
    this.countNonLues = this.notificationsNonLues.length;
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      [TypeNotification.DOSSIER_CREE]: 'fas fa-file-plus',
      [TypeNotification.DOSSIER_VALIDE]: 'fas fa-check-circle',
      [TypeNotification.DOSSIER_REJETE]: 'fas fa-times-circle',
      [TypeNotification.AUDIENCE_CREE]: 'fas fa-gavel',
      [TypeNotification.AUDIENCE_PROCHAINE]: 'fas fa-calendar-alt',
      [TypeNotification.ACTION_AMIABLE_CREE]: 'fas fa-handshake',
      [TypeNotification.TACHE_AFFECTEE]: 'fas fa-tasks',
      [TypeNotification.TACHE_COMPLETEE]: 'fas fa-check',
      [TypeNotification.TRAITEMENT_DOSSIER]: 'fas fa-cog',
      [TypeNotification.TACHE_URGENTE]: 'fas fa-exclamation-triangle',
      [TypeNotification.RAPPEL]: 'fas fa-bell',
      [TypeNotification.INFO]: 'fas fa-info-circle',
      [TypeNotification.NOTIFICATION_MANUELLE]: 'fas fa-envelope'
    };
    return icons[type] || 'fas fa-bell';
  }

  getNotificationClass(type: string): string {
    const classes: { [key: string]: string } = {
      [TypeNotification.DOSSIER_CREE]: 'notification-info',
      [TypeNotification.DOSSIER_VALIDE]: 'notification-success',
      [TypeNotification.DOSSIER_REJETE]: 'notification-danger',
      [TypeNotification.AUDIENCE_CREE]: 'notification-info',
      [TypeNotification.AUDIENCE_PROCHAINE]: 'notification-warning',
      [TypeNotification.ACTION_AMIABLE_CREE]: 'notification-info',
      [TypeNotification.TACHE_AFFECTEE]: 'notification-warning',
      [TypeNotification.TACHE_COMPLETEE]: 'notification-success',
      [TypeNotification.TRAITEMENT_DOSSIER]: 'notification-info',
      [TypeNotification.TACHE_URGENTE]: 'notification-danger',
      [TypeNotification.RAPPEL]: 'notification-warning',
      [TypeNotification.INFO]: 'notification-info',
      [TypeNotification.NOTIFICATION_MANUELLE]: 'notification-info'
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
        type: this.newNotification.type || TypeNotification.NOTIFICATION_MANUELLE,
        titre: this.newNotification.titre || '',
        message: this.newNotification.message || ''
      };

      this.notificationService.createNotification(notificationRequest).subscribe({
        next: () => {
          this.showCreateNotification = false;
          this.newNotification = {
            titre: '',
            message: '',
            type: TypeNotification.RAPPEL,
            statut: 'NON_LUE'
          };
          this.loadNotifications();
        },
        error: (error: any) => {
          console.error('Erreur lors de la création de la notification:', error);
        }
      });
    }
  }

  closeCreateNotification(): void {
    this.showCreateNotification = false;
    this.newNotification = {
      titre: '',
      message: '',
      type: TypeNotification.RAPPEL,
      statut: 'NON_LUE'
    };
  }
}
