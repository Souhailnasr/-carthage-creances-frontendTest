import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification, TypeNotification, StatutNotification } from '../../../core/services/notification.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss']
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  selectedFilter: 'all' | 'unread' | 'read' = 'all';
  selectedType: 'all' | TypeNotification = 'all';
  isLoading: boolean = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadNotifications(): void {
    this.isLoading = true;
    // Mock user ID pour les tests
    const mockUserId = 1;
    this.notificationService.getNotificationsByUser(mockUserId).subscribe(
      notifications => {
        this.notifications = notifications;
        this.applyFilters();
        this.isLoading = false;
      },
      error => {
        console.error('Erreur lors du chargement des notifications', error);
        this.isLoading = false;
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

  applyFilters(): void {
    this.filteredNotifications = this.notifications.filter(notification => {
      const matchesStatus = this.selectedFilter === 'all' ||
        (this.selectedFilter === 'unread' && notification.statut === StatutNotification.NON_LUE) ||
        (this.selectedFilter === 'read' && notification.statut === StatutNotification.LUE);

      const matchesType = this.selectedType === 'all' || notification.type === this.selectedType;

      return matchesStatus && matchesType;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onTypeChange(): void {
    this.applyFilters();
  }

  markAsRead(notification: Notification): void {
    if (notification.statut === StatutNotification.NON_LUE) {
      this.notificationService.marquerLue(notification.id).subscribe(
        () => {
          notification.statut = StatutNotification.LUE;
          notification.dateLecture = new Date().toISOString();
          this.applyFilters();
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
    this.applyFilters();
  }

  deleteNotification(notification: Notification): void {
    this.notificationService.deleteNotification(notification.id).subscribe(
      () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        this.applyFilters();
      }
    );
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

  getUnreadCount(): number {
    return this.notifications.filter(n => n.statut === StatutNotification.NON_LUE).length;
  }

  getTypeOptions(): Array<{value: string, label: string}> {
    return [
      { value: 'all', label: 'Tous les types' },
      { value: TypeNotification.DOSSIER_CREE, label: 'Dossier créé' },
      { value: TypeNotification.DOSSIER_VALIDE, label: 'Dossier validé' },
      { value: TypeNotification.DOSSIER_REJETE, label: 'Dossier rejeté' },
      { value: TypeNotification.DOSSIER_EN_ATTENTE, label: 'Dossier en attente' },
      { value: TypeNotification.ENQUETE_CREE, label: 'Enquête créée' },
      { value: TypeNotification.ENQUETE_VALIDE, label: 'Enquête validée' },
      { value: TypeNotification.ENQUETE_REJETE, label: 'Enquête rejetée' },
      { value: TypeNotification.ENQUETE_EN_ATTENTE, label: 'Enquête en attente' },
      { value: TypeNotification.TACHE_URGENTE, label: 'Tâche urgente' },
      { value: TypeNotification.RAPPEL, label: 'Rappel' },
      { value: TypeNotification.INFO, label: 'Information' }
    ];
  }
}
