import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PasswordResetService } from '../../../core/services/password-reset.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { PasswordStrengthComponent } from '../../../shared/components/password-strength/password-strength.component';

/**
 * Validateur personnalisé pour vérifier que les mots de passe correspondent
 */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

/**
 * Validateur personnalisé pour la force du mot de passe
 */
function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }

  const hasMinLength = value.length >= 8;
  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

  const isValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

  return isValid ? null : { weakPassword: true };
}

@Component({
  selector: 'app-reset-password',
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
    MatCardModule,
    PasswordStrengthComponent
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetPasswordForm!: FormGroup;
  token: string = '';
  isValidToken = false;
  isLoading = false;
  isValidatingToken = true;
  passwordReset = false;
  showPassword = false;
  showConfirmPassword = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Extraire le token de l'URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      
      if (!this.token) {
        this.snackBar.open('Token manquant dans l\'URL', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isValidatingToken = false;
        return;
      }

      // Valider le token
      this.validateToken();
    });

    // Initialiser le formulaire
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get f() {
    return this.resetPasswordForm.controls;
  }

  get newPassword() {
    return this.resetPasswordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.resetPasswordForm.get('confirmPassword');
  }

  /**
   * Valide le token de réinitialisation
   */
  validateToken(): void {
    this.isValidatingToken = true;

    this.passwordResetService.validateToken(this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isValidatingToken = false;
          this.isValidToken = response.valid;

          if (!response.valid) {
            this.snackBar.open(
              'Le lien de réinitialisation est invalide ou a expiré.',
              'Fermer',
              {
                duration: 5000,
                panelClass: ['error-snackbar']
              }
            );
          }
        },
        error: (error) => {
          this.isValidatingToken = false;
          this.isValidToken = false;
          console.error('❌ Erreur lors de la validation du token:', error);
          
          this.snackBar.open(
            'Le lien de réinitialisation est invalide ou a expiré.',
            'Fermer',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
        }
      });
  }

  /**
   * Soumet le formulaire de réinitialisation
   */
  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      
      if (this.resetPasswordForm.errors?.['passwordMismatch']) {
        this.snackBar.open('Les mots de passe ne correspondent pas', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      } else {
        this.snackBar.open('Veuillez corriger les erreurs du formulaire', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
      return;
    }

    this.isLoading = true;
    const newPassword = this.resetPasswordForm.get('newPassword')?.value;
    const confirmPassword = this.resetPasswordForm.get('confirmPassword')?.value;

    this.passwordResetService.resetPassword(this.token, newPassword, confirmPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.passwordReset = true;

          this.snackBar.open(
            'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
            'Fermer',
            {
              duration: 5000,
              panelClass: ['success-snackbar']
            }
          );

          // Rediriger vers la page de connexion après 3 secondes
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Erreur lors de la réinitialisation:', error);
          
          const errorMessage = error.message || 'Erreur lors de la réinitialisation du mot de passe';
          
          if (errorMessage.includes('PASSWORDS_MISMATCH')) {
            this.snackBar.open('Les mots de passe ne correspondent pas', 'Fermer', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          } else if (errorMessage.includes('TOKEN_INVALID')) {
            this.snackBar.open('Le lien de réinitialisation est invalide ou a expiré', 'Fermer', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          } else {
            this.snackBar.open(errorMessage, 'Fermer', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        }
      });
  }

  /**
   * Renvoie un email de réinitialisation
   */
  resendEmail(): void {
    // Demander l'email à l'utilisateur
    const email = prompt('Veuillez entrer votre adresse email:');
    
    if (!email) {
      return;
    }

    this.isLoading = true;
    this.passwordResetService.resendResetEmail(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open(
            'Si cet email existe, un nouveau lien de réinitialisation vous a été envoyé.',
            'Fermer',
            {
              duration: 5000,
              panelClass: ['success-snackbar']
            }
          );
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Erreur lors du renvoi de l\'email:', error);
          
          // Afficher le message même en cas d'erreur (pour la sécurité)
          this.snackBar.open(
            'Si cet email existe, un nouveau lien de réinitialisation vous a été envoyé.',
            'Fermer',
            {
              duration: 5000,
              panelClass: ['info-snackbar']
            }
          );
        }
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}

