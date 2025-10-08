import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-juridique-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './juridique-profile.component.html',
  styleUrls: ['./juridique-profile.component.scss']
})
export class JuridiqueProfileComponent implements OnInit {
  profileForm!: FormGroup;
  currentUser: User | null = null;
  isEditing = false;
  showPasswordForm = false;
  passwordForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeForms();
  }

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      nom: [this.currentUser?.nom || '', [Validators.required, Validators.minLength(2)]],
      prenom: [this.currentUser?.prenom || '', [Validators.required, Validators.minLength(2)]],
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword?.hasError('passwordMismatch')) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.initializeForms(); // Reset form
    }
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.passwordForm.reset();
    }
  }

  onSaveProfile(): void {
    if (this.profileForm.valid) {
      const formData = this.profileForm.value;
      
      // Simuler la mise à jour du profil
      this.toastService.success('Profil mis à jour avec succès !');
      this.isEditing = false;
      
      // Ici vous pourriez appeler un service pour mettre à jour le profil
      // this.authService.updateProfile(formData).subscribe(...)
    } else {
      this.toastService.error('Veuillez corriger les erreurs du formulaire.');
      this.profileForm.markAllAsTouched();
    }
  }

  onChangePassword(): void {
    if (this.passwordForm.valid) {
      const { currentPassword, newPassword } = this.passwordForm.value;
      
      // Simuler le changement de mot de passe
      this.toastService.success('Mot de passe modifié avec succès !');
      this.showPasswordForm = false;
      this.passwordForm.reset();
      
      // Ici vous pourriez appeler un service pour changer le mot de passe
      // this.authService.changePassword(currentPassword, newPassword).subscribe(...)
    } else {
      this.toastService.error('Veuillez corriger les erreurs du formulaire.');
      this.passwordForm.markAllAsTouched();
    }
  }

  getInitials(): string {
    if (this.currentUser) {
      return `${this.currentUser.prenom.charAt(0)}${this.currentUser.nom.charAt(0)}`.toUpperCase();
    }
    return 'CJ';
  }

  getFullName(): string {
    if (this.currentUser) {
      return `${this.currentUser.prenom} ${this.currentUser.nom}`;
    }
    return 'Chef Juridique';
  }
}
