import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificationCompleteService } from '../../../core/services/notification-complete.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

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
    private notificationService: NotificationCompleteService,
    private jwtAuthService: JwtAuthService
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
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          if (user?.id) {
            const userId = typeof user.id === 'string' ? parseInt(user.id) : Number(user.id);
            this.notificationService.getNombreNotificationsNonLues(userId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (count) => {
                  this.unreadCount = count;
                },
                error: (error) => {
                  console.error('Erreur lors du chargement du compteur de notifications:', error);
                  this.unreadCount = 0;
                }
              });
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'utilisateur:', error);
        }
      });
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
