import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { UtilisateurService, UtilisateurRequest, AuthenticationResponse } from '../../../core/services/utilisateur.service';

@Component({
  selector: 'app-utilisateur-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  providers: [UtilisateurService],
  templateUrl: './utilisateur-create.component.html',
  styleUrls: ['./utilisateur-create.component.scss']
})
export class UtilisateurCreateComponent implements OnInit, OnDestroy {
  utilisateurForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  private destroy$ = new Subject<void>();

  // Options pour les rôles
  roles = [
    { value: 'ADMIN', label: 'Administrateur' },
    { value: 'CHEF_DOSSIER', label: 'Chef de Dossier' },
    { value: 'AGENT_DOSSIER', label: 'Agent de Dossier' },
    { value: 'SUPER_ADMIN', label: 'Super Administrateur' }
  ];

  constructor(
    private fb: FormBuilder,
    private utilisateurService: UtilisateurService,
    private dialogRef: MatDialogRef<UtilisateurCreateComponent>,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupEmailValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise le formulaire avec les validations
   */
  initializeForm(): void {
    this.utilisateurForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmationMotDePasse: ['', [Validators.required]],
      role: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Validateur personnalisé pour vérifier que les mots de passe correspondent
   */
  passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const motDePasse = control.get('motDePasse');
    const confirmationMotDePasse = control.get('confirmationMotDePasse');

    if (motDePasse && confirmationMotDePasse && motDePasse.value !== confirmationMotDePasse.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Configure la validation de l'email avec vérification d'existence
   */
  setupEmailValidation(): void {
    this.utilisateurForm.get('email')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(email => {
        if (email && this.utilisateurForm.get('email')?.valid) {
          this.checkEmailExists(email);
        }
      });
  }

  /**
   * Vérifie si l'email existe déjà
   */
  checkEmailExists(email: string): void {
    this.utilisateurService.checkEmailExists(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exists) => {
          if (exists) {
            this.utilisateurForm.get('email')?.setErrors({ emailExists: true });
          }
        },
        error: (error) => {
          console.error('Erreur lors de la vérification de l\'email:', error);
        }
      });
  }

  /**
   * Soumet le formulaire
   */
  onSubmit(): void {
    if (this.utilisateurForm.valid) {
      this.isLoading = true;
      const formValue = this.utilisateurForm.value;
      
      const utilisateurRequest: UtilisateurRequest = {
        nom: formValue.nom,
        prenom: formValue.prenom,
        email: formValue.email,
        motDePasse: formValue.motDePasse,
        confirmationMotDePasse: formValue.confirmationMotDePasse,
        role: formValue.role
      };

      this.utilisateurService.createUtilisateur(utilisateurRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.errors && response.errors.length > 0) {
              // Afficher les erreurs de validation du backend
              this.snackBar.open('Erreurs de validation: ' + response.errors.join(', '), 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            } else {
              this.snackBar.open('Utilisateur créé avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.dialogRef.close(response);
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Erreur lors de la création:', error);
            this.snackBar.open('Erreur lors de la création de l\'utilisateur', 'Fermer', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Veuillez corriger les erreurs dans le formulaire', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  /**
   * Ferme le dialogue
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Marque tous les champs comme touchés pour afficher les erreurs
   */
  markFormGroupTouched(): void {
    Object.keys(this.utilisateurForm.controls).forEach(key => {
      const control = this.utilisateurForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtient le message d'erreur pour un champ
   */
  getErrorMessage(fieldName: string): string {
    const control = this.utilisateurForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} est requis`;
    }
    
    if (control?.hasError('email')) {
      return 'Format d\'email invalide';
    }
    
    if (control?.hasError('emailExists')) {
      return 'Cet email est déjà utilisé';
    }
    
    if (control?.hasError('minlength')) {
      const requiredLength = control.errors?.['minlength']?.requiredLength;
      return `${this.getFieldLabel(fieldName)} doit contenir au moins ${requiredLength} caractères`;
    }
    
    if (control?.hasError('maxlength')) {
      const requiredLength = control.errors?.['maxlength']?.requiredLength;
      return `${this.getFieldLabel(fieldName)} ne peut pas dépasser ${requiredLength} caractères`;
    }
    
    if (control?.hasError('pattern')) {
      return 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial';
    }
    
    if (this.utilisateurForm.hasError('passwordMismatch')) {
      return 'Les mots de passe ne correspondent pas';
    }
    
    return '';
  }

  /**
   * Obtient le label d'un champ
   */
  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nom: 'Nom',
      prenom: 'Prénom',
      email: 'Email',
      motDePasse: 'Mot de passe',
      confirmationMotDePasse: 'Confirmation du mot de passe',
      role: 'Rôle'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Vérifie si un champ a une erreur
   */
  hasError(fieldName: string): boolean {
    const control = this.utilisateurForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Vérifie si le formulaire a une erreur globale
   */
  hasGlobalError(): boolean {
    return this.utilisateurForm.hasError('passwordMismatch');
  }

  /**
   * Obtient l'icône du rôle
   */
  getRoleIcon(role: string): string {
    const roleIcons: { [key: string]: string } = {
      'ADMIN': 'admin_panel_settings',
      'CHEF_DOSSIER': 'supervisor_account',
      'AGENT_DOSSIER': 'person',
      'SUPER_ADMIN': 'security'
    };
    return roleIcons[role] || 'person';
  }
}
