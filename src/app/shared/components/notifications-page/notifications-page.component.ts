import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Notification, TypeNotification, StatutNotification, NotificationFilter } from '../../models/notification.model';

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
  isLoading: boolean = false;
  hasMore: boolean = true;
  currentPage: number = 0;
  pageSize: number = 20;

  // Filtres
  filter: NotificationFilter = {};
  searchTerm: string = '';
  selectedType: TypeNotification | '' = '';
  selectedStatus: StatutNotification | '' = '';

  // Statistiques
  totalNotifications: number = 0;
  unreadCount: number = 0;

  // Types et statuts pour les filtres
  notificationTypes = Object.values(TypeNotification);
  notificationStatuses = Object.values(StatutNotification);

  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.isLoading = true;
      this.notificationService.getNotificationsByUser(Number(currentUser.id))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (notifications) => {
            this.notifications = notifications;
            this.applyFilters();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement des notifications:', error);
            this.isLoading = false;
          }
        });
    }
  }

  loadStats(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.notificationService.getNotificationStats(Number(currentUser.id))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stats) => {
            this.totalNotifications = stats.total;
            this.unreadCount = stats.nonLues;
          },
          error: (error) => {
            console.error('Erreur lors du chargement des statistiques:', error);
          }
        });
    }
  }

  applyFilters(): void {
    let filtered = [...this.notifications];

    // Filtre par terme de recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.titre.toLowerCase().includes(term) ||
        notification.message.toLowerCase().includes(term)
      );
    }

    // Filtre par type
    if (this.selectedType) {
      filtered = filtered.filter(notification => notification.type === this.selectedType);
    }

    // Filtre par statut
    if (this.selectedStatus) {
      filtered = filtered.filter(notification => notification.statut === this.selectedStatus);
    }

    this.filteredNotifications = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onTypeFilterChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  markAsRead(notification: Notification): void {
    if (notification.statut === StatutNotification.NON_LUE && notification.id) {
      this.notificationService.marquerLue(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            notification.statut = StatutNotification.LUE;
            notification.dateLecture = new Date().toISOString();
            this.loadStats();
          },
          error: (error) => {
            console.error('Erreur lors du marquage de la notification:', error);
          }
        });
    }
  }

  markAsUnread(notification: Notification): void {
    if (notification.statut === StatutNotification.LUE && notification.id) {
      this.notificationService.marquerNonLue(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            notification.statut = StatutNotification.NON_LUE;
            notification.dateLecture = undefined;
            this.loadStats();
          },
          error: (error) => {
            console.error('Erreur lors du marquage de la notification:', error);
          }
        });
    }
  }

  markAllAsRead(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.notificationService.marquerToutesLues(Number(currentUser.id))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (count) => {
            console.log(`${count} notifications marquées comme lues`);
            this.loadNotifications();
            this.loadStats();
          },
          error: (error) => {
            console.error('Erreur lors du marquage de toutes les notifications:', error);
          }
        });
    }
  }

  deleteNotification(notification: Notification): void {
    if (notification.id && confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      this.notificationService.deleteNotification(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notifications = this.notifications.filter(n => n.id !== notification.id);
            this.applyFilters();
            this.loadStats();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression de la notification:', error);
          }
        });
    }
  }

  getTypeIcon(type: TypeNotification): string {
    return this.notificationService.getTypeIcon(type);
  }

  getTypeColor(type: TypeNotification): string {
    return this.notificationService.getTypeColor(type);
  }

  getTypeDisplayName(type: TypeNotification): string {
    return this.notificationService.getTypeDisplayName(type);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'À l\'instant';
    } else if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Il y a ${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.searchTerm) count++;
    if (this.selectedType) count++;
    if (this.selectedStatus) count++;
    return count;
  }
}
