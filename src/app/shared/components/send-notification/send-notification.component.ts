import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotificationService, TypeNotification, NotificationRequest } from '../../../core/services/notification.service';
import { UtilisateurService, Utilisateur } from '../../../core/services/utilisateur.service';

@Component({
  selector: 'app-send-notification',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './send-notification.component.html',
  styleUrls: ['./send-notification.component.scss']
})
export class SendNotificationComponent implements OnInit {
  notificationForm: FormGroup;
  users: Utilisateur[] = [];
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  showSuccess: boolean = false;

  typeOptions = [
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

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private utilisateurService: UtilisateurService
  ) {
    this.notificationForm = this.fb.group({
      destinataireId: ['', [Validators.required]],
      type: [TypeNotification.INFO, [Validators.required]],
      titre: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      lienAction: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.utilisateurService.getAllUtilisateurs().subscribe(
      users => {
        this.users = users;
        this.isLoading = false;
      },
      error => {
        console.error('Erreur lors du chargement des utilisateurs', error);
        this.isLoading = false;
      }
    );
  }

  onSubmit(): void {
    if (this.notificationForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const notificationRequest: NotificationRequest = {
        destinataireId: this.notificationForm.value.destinataireId,
        type: this.notificationForm.value.type,
        titre: this.notificationForm.value.titre,
        message: this.notificationForm.value.message
      };

      this.notificationService.createNotification(notificationRequest).subscribe({
        next: () => {
          this.showSuccess = true;
          this.notificationForm.reset();
          this.notificationForm.patchValue({
            type: TypeNotification.INFO
          });
          this.isSubmitting = false;
          
          // Masquer le message de succès après 3 secondes
          setTimeout(() => {
            this.showSuccess = false;
          }, 3000);
        },
        error: (error: any) => {
          console.error('Erreur lors de l\'envoi de la notification', error);
          this.isSubmitting = false;
          alert('Erreur lors de l\'envoi de la notification');
        }
      });
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

  getUserDisplayName(user: Utilisateur): string {
    return `${user.prenom} ${user.nom} (${user.email})`;
  }

  getTypeIcon(type: string): string {
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
}
