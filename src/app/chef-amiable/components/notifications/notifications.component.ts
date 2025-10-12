import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChefAmiableService } from '../../services/chef-amiable.service';
import { ChefAmiableNotification } from '../../../shared/models';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notifications: ChefAmiableNotification[] = [];
  filteredNotifications: ChefAmiableNotification[] = [];
  selectedFilter: 'all' | 'unread' | 'read' = 'all';
  selectedType: 'all' | 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' = 'all';
  showAddForm: boolean = false;
  notificationForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private chefAmiableService: ChefAmiableService,
    private fb: FormBuilder
  ) {
    this.notificationForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      type: ['INFO', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.chefAmiableService.getNotifications().subscribe(notifications => {
      this.notifications = notifications;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    this.filteredNotifications = this.notifications.filter(notification => {
      const matchesStatus = this.selectedFilter === 'all' || 
        (this.selectedFilter === 'unread' && !notification.lu) ||
        (this.selectedFilter === 'read' && notification.lu);
      
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

  marquerCommeLu(notification: ChefAmiableNotification): void {
    notification.lu = true;
    this.applyFilters();
  }

  marquerToutesCommeLues(): void {
    this.notifications.forEach(notification => {
      notification.lu = true;
    });
    this.applyFilters();
  }

  supprimerNotification(notification: ChefAmiableNotification): void {
    const index = this.notifications.indexOf(notification);
    if (index > -1) {
      this.notifications.splice(index, 1);
      this.applyFilters();
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'INFO':
        return 'fa-info-circle';
      case 'WARNING':
        return 'fa-exclamation-triangle';
      case 'SUCCESS':
        return 'fa-check-circle';
      case 'ERROR':
        return 'fa-times-circle';
      default:
        return 'fa-bell';
    }
  }

  getTypeClass(type: string): string {
    return `type-${type.toLowerCase()}`;
  }

  getNotificationsNonLues(): number {
    return this.notifications.filter(n => !n.lu).length;
  }

  getNotificationsParType(type: string): number {
    return this.notifications.filter(n => n.type === type).length;
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.notificationForm.reset();
    }
  }

  onSubmit(): void {
    if (this.notificationForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const notificationData = {
        titre: this.notificationForm.value.titre,
        message: this.notificationForm.value.message,
        type: this.notificationForm.value.type,
        lu: false,
        dateCreation: new Date(),
        userId: 'chef-1' // ID du chef amiable actuel
      };

      // Créer une nouvelle notification
      const nouvelleNotification = new ChefAmiableNotification(notificationData);
      this.notifications.unshift(nouvelleNotification);
      
      this.notificationForm.reset();
      this.showAddForm = false;
      this.isSubmitting = false;
      this.applyFilters();
      
      alert('Notification créée avec succès !');
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.notificationForm.controls).forEach(key => {
      const control = this.notificationForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.notificationForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName} est requis`;
      }
      if (control.errors['minlength']) {
        return `${fieldName} doit contenir au moins ${control.errors['minlength'].requiredLength} caractères`;
      }
    }
    return '';
  }
}
