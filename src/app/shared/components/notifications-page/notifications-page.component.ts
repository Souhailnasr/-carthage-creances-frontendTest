import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotificationCompleteService } from '../../../core/services/notification-complete.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { Notification, TypeNotification, StatutNotification } from '../../../shared/models/notification-complete.model';
import { Subject, takeUntil, interval } from 'rxjs';

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
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationCompleteService,
    private jwtAuthService: JwtAuthService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          if (user?.id) {
            const userId = typeof user.id === 'string' ? parseInt(user.id) : Number(user.id);
            this.notificationService.getNotificationsByUser(userId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (notifications: Notification[]) => {
                  this.notifications = notifications || [];
                  this.applyFilters();
                  this.isLoading = false;
                },
                error: (error: any) => {
                  console.error('Erreur lors du chargement des notifications', error);
                  this.notifications = [];
                  this.applyFilters();
                  this.isLoading = false;
                }
              });
          } else {
            console.warn('⚠️ Utilisateur non connecté');
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'utilisateur:', error);
          this.isLoading = false;
        }
      });
  }

  startPolling(): void {
    // Polling toutes les 30 secondes pour les nouvelles notifications
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadNotifications();
      });
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

  getUnreadCount(): number {
    return this.notifications.filter(n => n.statut === StatutNotification.NON_LUE).length;
  }

  getTotalCount(): number {
    return this.notifications.length;
  }

  getReadCount(): number {
    return this.notifications.filter(n => n.statut === StatutNotification.LUE).length;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onTypeChange(): void {
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
            this.applyFilters();
            // Recharger le compteur
            this.loadNotifications();
          },
          error: (error: any) => {
            console.error('Erreur lors du marquage comme lue:', error);
          }
        });
    }
  }

  markAllAsRead(): void {
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          if (user?.id) {
            const userId = typeof user.id === 'string' ? parseInt(user.id) : Number(user.id);
            this.notificationService.marquerToutesLues(userId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.notifications.forEach(notification => {
                    notification.statut = StatutNotification.LUE;
                    notification.dateLecture = new Date().toISOString();
                  });
                  this.applyFilters();
                  // Recharger les notifications
                  this.loadNotifications();
                },
                error: (error: any) => {
                  console.error('Erreur lors du marquage de toutes les notifications:', error);
                }
              });
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'utilisateur:', error);
        }
      });
  }

  deleteNotification(notification: Notification): void {
    if (!notification.id) {
      console.warn('⚠️ Impossible de supprimer la notification: ID manquant');
      return;
    }

    // Demander confirmation avant suppression
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      return;
    }

    this.notificationService.supprimerNotification(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Retirer la notification de la liste locale après confirmation du backend
          this.notifications = this.notifications.filter(n => n.id !== notification.id);
          this.applyFilters();
          console.log('✅ Notification supprimée avec succès');
        },
        error: (error: any) => {
          console.error('❌ Erreur lors de la suppression de la notification:', error);
          // Afficher un message d'erreur à l'utilisateur
          alert('Erreur lors de la suppression de la notification. Veuillez réessayer.');
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

  formatDate(dateInput: string | Date): string {
    // Convertir en Date si c'est une string
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
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
