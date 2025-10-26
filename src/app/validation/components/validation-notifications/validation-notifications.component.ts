import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval } from 'rxjs';
import { ValidationDossierService, ValidationDossier } from '../../../core/services/validation-dossier.service';
import { StatutValidation } from '../../../shared/models/validation-dossier.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

export interface ValidationNotification {
  id: number;
  type: 'NOUVELLE_VALIDATION' | 'DOSSIER_VALIDE' | 'DOSSIER_REJETE' | 'VALIDATION_MODIFIEE';
  titre: string;
  message: string;
  validation: ValidationDossier;
  dateCreation: Date;
  lu: boolean;
  priorite: 'FAIBLE' | 'MOYENNE' | 'ELEVEE';
}

@Component({
  selector: 'app-validation-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './validation-notifications.component.html',
  styleUrls: ['./validation-notifications.component.scss']
})
export class ValidationNotificationsComponent implements OnInit, OnDestroy {
  notifications: ValidationNotification[] = [];
  filteredNotifications: ValidationNotification[] = [];
  loading = false;
  error: string | null = null;
  
  // Filtres
  filterType = '';
  filterStatut = '';
  showUnreadOnly = false;
  
  // Pagination
  pageSize = 10;
  currentPage = 0;
  totalPages = 0;
  
  // Enums pour les options
  notificationTypes = [
    { value: '', label: 'Tous les types' },
    { value: 'NOUVELLE_VALIDATION', label: 'Nouvelle validation' },
    { value: 'DOSSIER_VALIDE', label: 'Dossier validé' },
    { value: 'DOSSIER_REJETE', label: 'Dossier rejeté' },
    { value: 'VALIDATION_MODIFIEE', label: 'Validation modifiée' }
  ];
  
  statutOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'EN_ATTENTE', label: 'En Attente' },
    { value: 'VALIDE', label: 'Validé' },
    { value: 'REJETE', label: 'Rejeté' }
  ];
  
  private destroy$ = new Subject<void>();
  private pollingInterval = 30000; // 30 secondes

  constructor(
    private validationService: ValidationDossierService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startPolling(): void {
    // Polling pour les notifications en temps réel
    interval(this.pollingInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadNotifications(true); // Chargement silencieux
      });
  }

  loadNotifications(silent = false): void {
    if (!silent) {
      this.loading = true;
      this.error = null;
    }

    this.validationService.getAllValidationsDossier()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validations) => {
          this.notifications = this.generateNotifications(validations);
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des notifications:', error);
          if (!silent) {
            this.error = 'Erreur lors du chargement des notifications';
            this.loading = false;
          }
        }
      });
  }

  private generateNotifications(validations: ValidationDossier[]): ValidationNotification[] {
    const notifications: ValidationNotification[] = [];
    
    validations.forEach(validation => {
      // Notification pour nouvelle validation
      if (validation.statut === StatutValidation.EN_ATTENTE) {
        notifications.push({
          id: validation.id,
          type: 'NOUVELLE_VALIDATION',
          titre: 'Nouvelle validation en attente',
          message: `Le dossier "${validation.dossier.titre}" est en attente de validation`,
          validation,
          dateCreation: new Date(validation.dateCreation),
          lu: false,
          priorite: 'ELEVEE'
        });
      }
      
      // Notification pour dossier validé
      if (validation.statut === StatutValidation.VALIDE && validation.dateValidation) {
        notifications.push({
          id: validation.id + 1000, // ID unique pour éviter les conflits
          type: 'DOSSIER_VALIDE',
          titre: 'Dossier validé',
          message: `Le dossier "${validation.dossier.titre}" a été validé`,
          validation,
          dateCreation: validation.dateValidation ? new Date(validation.dateValidation) : new Date(),
          lu: false,
          priorite: 'MOYENNE'
        });
      }
      
      // Notification pour dossier rejeté
      if (validation.statut === StatutValidation.REJETE && validation.dateValidation) {
        notifications.push({
          id: validation.id + 2000,
          type: 'DOSSIER_REJETE',
          titre: 'Dossier rejeté',
          message: `Le dossier "${validation.dossier.titre}" a été rejeté`,
          validation,
          dateCreation: validation.dateValidation ? new Date(validation.dateValidation) : new Date(),
          lu: false,
          priorite: 'ELEVEE'
        });
      }
    });
    
    // Trier par date de création (plus récent en premier)
    return notifications.sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }

  applyFilters(): void {
    let filtered = [...this.notifications];
    
    // Filtre par type
    if (this.filterType) {
      filtered = filtered.filter(n => n.type === this.filterType);
    }
    
    // Filtre par statut
    if (this.filterStatut) {
      filtered = filtered.filter(n => n.validation.statut === this.filterStatut);
    }
    
    // Filtre par non lu
    if (this.showUnreadOnly) {
      filtered = filtered.filter(n => !n.lu);
    }
    
    this.filteredNotifications = filtered;
    this.updatePagination();
  }

  clearFilters(): void {
    this.filterType = '';
    this.filterStatut = '';
    this.showUnreadOnly = false;
    this.applyFilters();
  }

  markAsRead(notification: ValidationNotification): void {
    notification.lu = true;
    this.applyFilters();
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.lu = true);
    this.applyFilters();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.lu).length;
  }

  // Actions rapides
  validerDossier(notification: ValidationNotification): void {
    if (notification.validation.statut !== StatutValidation.EN_ATTENTE) {
      this.toastService.showError('Ce dossier ne peut pas être validé');
      return;
    }
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.showError('Utilisateur non connecté');
      return;
    }

    this.validationService.validerDossier(notification.validation.id, parseInt(currentUser.id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Dossier validé avec succès');
          this.loadNotifications();
        },
        error: (error) => {
          console.error('Erreur lors de la validation:', error);
          this.toastService.showError('Erreur lors de la validation');
        }
      });
  }

  rejeterDossier(notification: ValidationNotification): void {
    if (notification.validation.statut !== StatutValidation.EN_ATTENTE) {
      this.toastService.showError('Ce dossier ne peut pas être rejeté');
      return;
    }
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.showError('Utilisateur non connecté');
      return;
    }

    this.validationService.rejeterDossier(notification.validation.id, parseInt(currentUser.id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Dossier rejeté');
          this.loadNotifications();
        },
        error: (error) => {
          console.error('Erreur lors du rejet:', error);
          this.toastService.showError('Erreur lors du rejet');
        }
      });
  }

  // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredNotifications.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages - 1);
  }

  get paginatedNotifications(): ValidationNotification[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredNotifications.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  // Utilitaires
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'NOUVELLE_VALIDATION':
        return 'fas fa-plus-circle';
      case 'DOSSIER_VALIDE':
        return 'fas fa-check-circle';
      case 'DOSSIER_REJETE':
        return 'fas fa-times-circle';
      case 'VALIDATION_MODIFIEE':
        return 'fas fa-edit';
      default:
        return 'fas fa-bell';
    }
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'NOUVELLE_VALIDATION':
        return 'notification-nouvelle';
      case 'DOSSIER_VALIDE':
        return 'notification-valide';
      case 'DOSSIER_REJETE':
        return 'notification-rejete';
      case 'VALIDATION_MODIFIEE':
        return 'notification-modifiee';
      default:
        return 'notification-default';
    }
  }

  getPrioriteClass(priorite: string): string {
    switch (priorite) {
      case 'ELEVEE':
        return 'priorite-elevee';
      case 'MOYENNE':
        return 'priorite-moyenne';
      case 'FAIBLE':
        return 'priorite-faible';
      default:
        return 'priorite-default';
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  canValidate(): boolean {
    return this.authService.canValidateDossiers();
  }
}
