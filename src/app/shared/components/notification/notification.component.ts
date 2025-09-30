import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
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
    type: 'RAPPEL',
    statut: 'NON_LUE'
  };
  private subscription: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadNotifications(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.notificationService.getNotificationsByUser(parseInt(currentUser.id)).subscribe(
        notifications => {
          this.notifications = notifications;
          this.notificationsNonLues = notifications.filter(n => n.statut === 'NON_LUE');
          this.countNonLues = this.notificationsNonLues.length;
        }
      );
    }
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
    this.notificationService.marquerLue(notification.id).subscribe(
      () => {
        notification.statut = 'LUE';
        notification.dateLecture = new Date();
        this.countNonLues--;
      }
    );
  }

  marquerToutesLues(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.notificationService.marquerToutesLues(parseInt(currentUser.id)).subscribe(
        () => {
          this.notifications.forEach(n => {
            n.statut = 'LUE';
            n.dateLecture = new Date();
          });
          this.countNonLues = 0;
        }
      );
    }
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
        utilisateurId: this.authService.getCurrentUser()?.id ? parseInt(this.authService.getCurrentUser()!.id) : 0,
        type: this.newNotification.type || 'RAPPEL',
        titre: this.newNotification.titre,
        message: this.newNotification.message,
        statut: 'NON_LUE',
        dateCreation: new Date()
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
      type: 'RAPPEL',
      statut: 'NON_LUE'
    };
  }
}
