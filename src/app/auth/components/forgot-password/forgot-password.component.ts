import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PasswordResetService } from '../../../core/services/password-reset.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  forgotPasswordForm!: FormGroup;
  isLoading = false;
  emailSent = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get f() {
    return this.forgotPasswordForm.controls;
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      this.snackBar.open('Veuillez corriger les erreurs du formulaire.', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading = true;
    const email = this.forgotPasswordForm.get('email')?.value;

    this.passwordResetService.requestPasswordReset(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.emailSent = true;
          
          // Afficher le message de confirmation (même si l'email n'existe pas, pour la sécurité)
          this.snackBar.open(
            'Si cet email existe, un lien de réinitialisation vous a été envoyé.',
            'Fermer',
            {
              duration: 5000,
              panelClass: ['success-snackbar']
            }
          );
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Erreur lors de la demande de réinitialisation:', error);
          
          // Afficher le message même en cas d'erreur (pour la sécurité)
          this.emailSent = true;
          this.snackBar.open(
            'Si cet email existe, un lien de réinitialisation vous a été envoyé.',
            'Fermer',
            {
              duration: 5000,
              panelClass: ['info-snackbar']
            }
          );
        }
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}

