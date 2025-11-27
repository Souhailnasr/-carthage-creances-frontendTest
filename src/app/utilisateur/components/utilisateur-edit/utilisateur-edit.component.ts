import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { UtilisateurService, Utilisateur, UtilisateurUpdateRequest } from '../../../services/utilisateur.service';

interface DialogData {
  utilisateur: Utilisateur;
}

@Component({
  selector: 'app-utilisateur-edit',
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
  templateUrl: './utilisateur-edit.component.html',
  styleUrls: ['./utilisateur-edit.component.scss']
})
export class UtilisateurEditComponent implements OnInit, OnDestroy {
  utilisateurForm: FormGroup;
  isLoading = false;
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
    private dialogRef: MatDialogRef<UtilisateurEditComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.populateForm();
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
      role: ['', [Validators.required]]
    });
  }

  /**
   * Remplit le formulaire avec les données de l'utilisateur
   */
  populateForm(): void {
    const utilisateur = this.data.utilisateur;
    this.utilisateurForm.patchValue({
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      role: utilisateur.role
    });
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
        if (email && this.utilisateurForm.get('email')?.valid && email !== this.data.utilisateur.email) {
          this.checkEmailExists(email);
        }
      });
  }

  /**
   * Vérifie si l'email existe déjà
   */
  checkEmailExists(email: string): void {
    this.utilisateurService.checkEmailExists(email, this.data.utilisateur.id)
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
      
      const utilisateurUpdateRequest: UtilisateurUpdateRequest = {
        nom: formValue.nom,
        prenom: formValue.prenom,
        email: formValue.email,
        role: formValue.role
      };

      this.utilisateurService.updateUtilisateur(this.data.utilisateur.id, utilisateurUpdateRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (utilisateur) => {
            this.isLoading = false;
            this.dialogRef.close(utilisateur);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Erreur lors de la modification:', error);
            this.snackBar.open('Erreur lors de la modification de l\'utilisateur', 'Fermer', {
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

  /**
   * Vérifie si le formulaire a été modifié
   */
  isFormDirty(): boolean {
    return this.utilisateurForm.dirty;
  }

  /**
   * Vérifie si le formulaire est valide
   */
  isFormValid(): boolean {
    return this.utilisateurForm.valid;
  }

  /**
   * Obtient l'initiale pour l'avatar
   */
  getInitials(nom: string, prenom: string): string {
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
  }

  /**
   * Obtient la couleur de l'avatar basée sur le nom
   */
  getAvatarColor(nom: string): string {
    const colors = [
      '#2196F3', '#4CAF50', '#FF9800', '#F44336', 
      '#9C27B0', '#00BCD4', '#795548', '#607D8B'
    ];
    const index = nom.charCodeAt(0) % colors.length;
    return colors[index];
  }

  /**
   * Obtient l'icône du statut
   */
  getStatutIcon(statut: string): string {
    return statut === 'ACTIF' ? 'check_circle' : 'cancel';
  }

  /**
   * Obtient la classe CSS du statut
   */
  getStatutClass(statut: string): string {
    return statut === 'ACTIF' ? 'statut-actif' : 'statut-inactif';
  }
}
