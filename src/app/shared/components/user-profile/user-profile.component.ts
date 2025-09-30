import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { User, Role } from '../../models';
import { FormInputComponent } from '../form-input/form-input.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormInputComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  private destroy$ = new Subject<void>();

  // Getters pour les contrôles de formulaire
  get nomControl(): FormControl { return this.profileForm.get('nom') as FormControl; }
  get prenomControl(): FormControl { return this.profileForm.get('prenom') as FormControl; }
  get emailControl(): FormControl { return this.profileForm.get('email') as FormControl; }
  get roleControl(): FormControl { return this.profileForm.get('role') as FormControl; }

  get currentPasswordControl(): FormControl { return this.passwordForm.get('currentPassword') as FormControl; }
  get newPasswordControl(): FormControl { return this.passwordForm.get('newPassword') as FormControl; }
  get confirmPasswordControl(): FormControl { return this.passwordForm.get('confirmPassword') as FormControl; }

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForms(): void {
    this.profileForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: [{ value: '', disabled: true }]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword?.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    
    return null;
  }

  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.profileForm.patchValue({
        nom: this.currentUser.nom,
        prenom: this.currentUser.prenom,
        email: this.currentUser.email,
        role: this.currentUser.role
      });
    }
  }

  onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }

    // Simulation de mise à jour - dans une vraie app, ceci ferait un appel API
    this.toastService.success('Profil mis à jour avec succès.');
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }

    if (this.passwordForm.errors?.['passwordMismatch']) {
      this.toastService.error('Les mots de passe ne correspondent pas.');
      return;
    }

    // Simulation de changement de mot de passe - dans une vraie app, ceci ferait un appel API
    this.toastService.success('Mot de passe modifié avec succès.');
    this.passwordForm.reset();
  }

  getRoleDisplayName(role: Role | string): string {
    const roleNames: { [key: string]: string } = {
      [Role.SUPER_ADMIN]: 'Super Administrateur',
      [Role.CHEF_DOSSIER]: 'Chef de Dossier',
      [Role.AGENT_DOSSIER]: 'Agent de Dossier',
      [Role.CHEF_JURIDIQUE]: 'Chef Juridique',
      [Role.AGENT_JURIDIQUE]: 'Agent Juridique',
      [Role.CHEF_FINANCE]: 'Chef Finance',
      [Role.AGENT_FINANCE]: 'Agent Finance'
    };

    return roleNames[role] || role;
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    return this.currentUser.getFullName().split(' ').map(n => n[0]).join('');
  }
}
