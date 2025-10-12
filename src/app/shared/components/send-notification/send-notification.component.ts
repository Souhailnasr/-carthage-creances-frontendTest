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
    { value: TypeNotification.DOSSIER_EN_ATTENTE, label: 'Dossier en attente' },
    { value: TypeNotification.ENQUETE_CREE, label: 'Enquête créée' },
    { value: TypeNotification.ENQUETE_VALIDE, label: 'Enquête validée' },
    { value: TypeNotification.ENQUETE_REJETE, label: 'Enquête rejetée' },
    { value: TypeNotification.ENQUETE_EN_ATTENTE, label: 'Enquête en attente' },
    { value: TypeNotification.TACHE_URGENTE, label: 'Tâche urgente' },
    { value: TypeNotification.RAPPEL, label: 'Rappel' },
    { value: TypeNotification.INFO, label: 'Information' }
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
        message: this.notificationForm.value.message,
        lienAction: this.notificationForm.value.lienAction || undefined
      };

      this.notificationService.createNotification(notificationRequest).subscribe(
        () => {
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
        error => {
          console.error('Erreur lors de l\'envoi de la notification', error);
          this.isSubmitting = false;
          alert('Erreur lors de l\'envoi de la notification');
        }
      );
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

  getTypeIcon(type: TypeNotification): string {
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
}
