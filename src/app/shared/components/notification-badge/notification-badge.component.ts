import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-badge.component.html',
  styleUrls: ['./notification-badge.component.scss']
})
export class NotificationBadgeComponent implements OnInit, OnDestroy {
  unreadCount: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUnreadCount();
    this.subscribeToUnreadCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUnreadCount(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.notificationService.countNotificationsNonLues(currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (count) => {
            this.unreadCount = count;
          },
          error: (error) => {
            console.error('Erreur lors du chargement du compteur de notifications:', error);
          }
        });
    }
  }

  private subscribeToUnreadCount(): void {
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
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
