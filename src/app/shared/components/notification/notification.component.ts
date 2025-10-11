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
      },
      error => {
        // En cas d'erreur, utiliser des données mockées
        this.loadMockNotifications();
      }
    );
  }

  private loadMockNotifications(): void {
    // Données mockées pour les tests
    this.notifications = [
      {
        id: 1,
        utilisateur: { id: 1, nom: 'Test', prenom: 'User', email: 'test@test.com' },
        type: TypeNotification.DOSSIER_CREE,
        titre: 'Nouveau dossier créé',
        message: 'Un nouveau dossier a été créé et nécessite votre attention.',
        statut: StatutNotification.NON_LUE,
        dateCreation: new Date(Date.now() - 1000 * 60 * 30).toISOString() // Il y a 30 minutes
      },
      {
        id: 2,
        utilisateur: { id: 1, nom: 'Test', prenom: 'User', email: 'test@test.com' },
        type: TypeNotification.TACHE_URGENTE,
        titre: 'Tâche urgente assignée',
        message: 'Une tâche urgente vous a été assignée par votre chef.',
        statut: StatutNotification.NON_LUE,
        dateCreation: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // Il y a 2 heures
      },
      {
        id: 3,
        utilisateur: { id: 1, nom: 'Test', prenom: 'User', email: 'test@test.com' },
        type: TypeNotification.RAPPEL,
        titre: 'Rappel de réunion',
        message: 'N\'oubliez pas la réunion d\'équipe prévue à 14h00.',
        statut: StatutNotification.LUE,
        dateCreation: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // Il y a 4 heures
      }
    ];
    this.notificationsNonLues = this.notifications.filter(n => n.statut === StatutNotification.NON_LUE);
    this.countNonLues = this.notificationsNonLues.length;
  }

  startPolling(): void {
    this.subscription = interval(30000).subscribe(() => {
      this.loadNotifications();
    });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  marquerLue(notification: Notification): void {
    if (notification.id) {
      this.notificationService.marquerLue(notification.id).subscribe(
        () => {
          notification.statut = StatutNotification.LUE;
          notification.dateLecture = new Date().toISOString();
          this.countNonLues--;
        }
      );
    }
  }

  marquerToutesLues(): void {
    const mockUserId = 1;
    this.notificationService.marquerToutesLues(mockUserId).subscribe(
      () => {
        this.notifications.forEach(n => {
          n.statut = StatutNotification.LUE;
          n.dateLecture = new Date().toISOString();
        });
        this.countNonLues = 0;
      }
    );
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'DOSSIER_CREE': return 'fas fa-file-alt';
      case 'DOSSIER_VALIDE': return 'fas fa-check-circle';
      case 'DOSSIER_REJETE': return 'fas fa-times-circle';
      case 'ENQUETE_CREE': return 'fas fa-search';
      case 'ENQUETE_VALIDE': return 'fas fa-check-circle';
      case 'TACHE_URGENTE': return 'fas fa-exclamation-triangle';
      case 'RAPPEL': return 'fas fa-bell';
      default: return 'fas fa-info-circle';
    }
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'DOSSIER_VALIDE': return 'notification-success';
      case 'DOSSIER_REJETE': return 'notification-error';
      case 'TACHE_URGENTE': return 'notification-warning';
      default: return 'notification-info';
    }
  }

  createNotification(): void {
    if (this.newNotification.titre && this.newNotification.message) {
      const notification: Notification = {
        id: Date.now(),
        utilisateur: { id: 1, nom: 'Test', prenom: 'User', email: 'test@test.com' },
        type: this.newNotification.type || TypeNotification.RAPPEL,
        titre: this.newNotification.titre,
        message: this.newNotification.message,
        statut: StatutNotification.NON_LUE,
        dateCreation: new Date().toISOString()
      };

      this.notifications.unshift(notification);
      this.countNonLues++;
      this.showCreateNotification = false;
      this.resetNewNotification();
    }
  }

  cancelCreateNotification(): void {
    this.showCreateNotification = false;
    this.resetNewNotification();
  }

  private resetNewNotification(): void {
    this.newNotification = {
      titre: '',
      message: '',
      type: TypeNotification.RAPPEL,
      statut: StatutNotification.NON_LUE
    };
  }
}
