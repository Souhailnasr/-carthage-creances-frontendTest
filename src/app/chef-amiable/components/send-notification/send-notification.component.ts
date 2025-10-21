import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-send-notification',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './send-notification.component.html',
  styleUrls: ['./send-notification.component.scss']
})
export class SendNotificationComponent {
  notificationForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(private fb: FormBuilder) {
    this.notificationForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      type: ['INFO', [Validators.required]],
      destinataires: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.notificationForm.valid) {
      this.isSubmitting = true;
      // Logique d'envoi de notification
      console.log('Notification envoyée:', this.notificationForm.value);
      setTimeout(() => {
        this.isSubmitting = false;
        this.notificationForm.reset();
        alert('Notification envoyée avec succès !');
      }, 1000);
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.notificationForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return 'Ce champ est requis';
      }
      if (field.errors?.['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
    }
    return null;
  }
}





