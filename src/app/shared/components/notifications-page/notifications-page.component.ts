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
    this.notificationService.getNotifications(mockUserId).subscribe({
      next: (notifications: Notification[]) => {
        this.notifications = notifications;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des notifications', error);
        this.isLoading = false;
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

  applyFilters(): void {
    this.filteredNotifications = this.notifications.filter(notification => {
      const matchesStatus = this.selectedFilter === 'all' ||
        (this.selectedFilter === 'unread' && notification.statut === 'NON_LUE') ||
        (this.selectedFilter === 'read' && notification.statut === 'LUE');

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
    if (notification.statut === 'NON_LUE') {
      this.notificationService.marquerLue(notification.id).subscribe({
        next: () => {
          notification.statut = 'LUE';
          notification.dateLecture = new Date().toISOString();
          this.applyFilters();
        },
        error: (error: any) => {
          console.error('Erreur lors du marquage comme lue:', error);
        }
      });
    }
  }

  markAllAsRead(): void {
    const mockUserId = 1;
    this.notificationService.marquerToutesLues(mockUserId).subscribe({
      next: () => {
        this.notifications.forEach(notification => {
          notification.statut = 'LUE';
          notification.dateLecture = new Date().toISOString();
        });
        this.applyFilters();
      },
      error: (error: any) => {
        console.error('Erreur lors du marquage de toutes les notifications:', error);
      }
    });
  }

  deleteNotification(notification: Notification): void {
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        this.applyFilters();
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression:', error);
      }
    });
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

  getUnreadCount(): number {
    return this.notifications.filter(n => n.statut === 'NON_LUE').length;
  }

  getTypeOptions(): Array<{value: string, label: string}> {
    return [
      { value: 'all', label: 'Tous les types' },
      { value: TypeNotification.DOSSIER_CREE, label: 'Dossier créé' },
      { value: TypeNotification.DOSSIER_VALIDE, label: 'Dossier validé' },
      { value: TypeNotification.DOSSIER_REJETE, label: 'Dossier rejeté' },
      { value: TypeNotification.AUDIENCE_CREE, label: 'Audience créée' },
      { value: TypeNotification.AUDIENCE_PROCHAINE, label: 'Audience prochaine' },
      { value: TypeNotification.ACTION_AMIABLE_CREE, label: 'Action amiable créée' },
      { value: TypeNotification.TACHE_AFFECTEE, label: 'Tâche affectée' },
      { value: TypeNotification.TACHE_COMPLETEE, label: 'Tâche complétée' },
      { value: TypeNotification.TRAITEMENT_DOSSIER, label: 'Traitement dossier' },
      { value: TypeNotification.TACHE_URGENTE, label: 'Tâche urgente' },
      { value: TypeNotification.RAPPEL, label: 'Rappel' },
      { value: TypeNotification.INFO, label: 'Information' },
      { value: TypeNotification.NOTIFICATION_MANUELLE, label: 'Notification manuelle' }
    ];
  }
}
