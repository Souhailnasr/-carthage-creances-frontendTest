import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Notification, TypeNotification, StatutNotification } from '../../models/notification.model';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.scss']
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isOpen: boolean = false;
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.subscribeToNotifications();
    this.subscribeToUnreadCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-dropdown')) {
      this.isOpen = false;
    }
  }

  private loadNotifications(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.isLoading = true;
      this.notificationService.getNotificationsByUser(currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (notifications) => {
            this.notifications = notifications.slice(0, 5); // Afficher seulement les 5 dernières
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement des notifications:', error);
            this.isLoading = false;
          }
        });
    }
  }

  private subscribeToNotifications(): void {
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications.slice(0, 5);
      });
  }

  private subscribeToUnreadCount(): void {
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadNotifications();
    }
  }

  markAsRead(notification: Notification): void {
    if (notification.statut === StatutNotification.NON_LUE && notification.id) {
      this.notificationService.marquerLue(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            notification.statut = StatutNotification.LUE;
            notification.dateLecture = new Date().toISOString();
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
      this.notificationService.marquerToutesLues(currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (count) => {
            console.log(`${count} notifications marquées comme lues`);
            this.loadNotifications();
          },
          error: (error) => {
            console.error('Erreur lors du marquage de toutes les notifications:', error);
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

  hasUnreadNotifications(): boolean {
    return this.unreadCount > 0;
  }

  getDisplayCount(): string {
    if (this.unreadCount === 0) return '';
    if (this.unreadCount > 99) return '99+';
    return this.unreadCount.toString();
  }
}
