import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { User, Role } from '../../../shared/models';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FormInputComponent],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  showCreateForm: boolean = false;
  userForm!: FormGroup;
  isEditMode: boolean = false;
  editingUser: User | null = null;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  private destroy$ = new Subject<void>();

  // Getters pour les contrôles de formulaire
  get nomControl(): FormControl { return this.userForm.get('nom') as FormControl; }
  get prenomControl(): FormControl { return this.userForm.get('prenom') as FormControl; }
  get emailControl(): FormControl { return this.userForm.get('email') as FormControl; }
  get motDePasseControl(): FormControl { return this.userForm.get('motDePasse') as FormControl; }
  get confirmPasswordControl(): FormControl { return this.userForm.get('confirmPassword') as FormControl; }
  get roleControl(): FormControl { return this.userForm.get('role') as FormControl; }

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm(): void {
    this.userForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: [Role.AGENT_DOSSIER, Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('motDePasse');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword && confirmPassword.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  loadUsers(): void {
    // Simulation de données - dans une vraie app, ceci viendrait d'une API
    this.users = [
      new User({
        id: '1',
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@carthage-creance.tn',
        motDePasse: 'password',
        role: Role.AGENT_DOSSIER,
        actif: true
      }),
      new User({
        id: '2',
        nom: 'Smith',
        prenom: 'Jane',
        email: 'jane.smith@carthage-creance.tn',
        motDePasse: 'password',
        role: Role.AGENT_DOSSIER,
        actif: true
      }),
      new User({
        id: '3',
        nom: 'Johnson',
        prenom: 'Mike',
        email: 'mike.johnson@carthage-creance.tn',
        motDePasse: 'password',
        role: Role.AGENT_DOSSIER,
        actif: true
      })
    ];
    this.filteredUsers = [...this.users];
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      this.filteredUsers = this.users.filter(user =>
        user.getFullName().toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  showCreateUserForm(): void {
    this.showCreateForm = true;
    this.isEditMode = false;
    this.editingUser = null;
    this.initializeForm();
  }

  showEditUserForm(user: User): void {
    this.showCreateForm = true;
    this.isEditMode = true;
    this.editingUser = user;
    this.userForm.patchValue({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      motDePasse: '', // Ne pas pré-remplir le mot de passe
      role: user.role
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }

    const formValue = this.userForm.value;
    
    if (this.isEditMode && this.editingUser) {
      // Mise à jour
      const index = this.users.findIndex(u => u.id === this.editingUser!.id);
      if (index !== -1) {
        this.users[index] = { ...this.users[index], ...formValue };
        this.toastService.success('Utilisateur mis à jour avec succès.');
      }
    } else {
      // Création
      const newUser = new User({
        id: Date.now().toString(),
        ...formValue,
        actif: true
      });
      this.users.push(newUser);
      this.toastService.success('Utilisateur créé avec succès.');
    }

    this.filteredUsers = [...this.users];
    this.cancelForm();
  }

  deleteUser(user: User): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      const index = this.users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        this.users.splice(index, 1);
        this.filteredUsers = [...this.users];
        this.toastService.success('Utilisateur supprimé avec succès.');
      }
    }
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.isEditMode = false;
    this.editingUser = null;
    this.initializeForm();
  }

  getRoleDisplayName(role: Role): string {
    const roleNames: { [key in Role]: string } = {
      [Role.SUPER_ADMIN]: 'Super Administrateur',
      [Role.CHEF_DOSSIER]: 'Chef de Dossier',
      [Role.AGENT_DOSSIER]: 'Agent de Dossier',
      [Role.CHEF_JURIDIQUE]: 'Chef Juridique',
      [Role.AGENT_JURIDIQUE]: 'Agent Juridique',
      [Role.CHEF_FINANCE]: 'Chef Finance',
      [Role.AGENT_FINANCE]: 'Agent Finance',
      [Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE]: 'Chef Département Recouvrement Amiable',
      [Role.AGENT_RECOUVREMENT_AMIABLE]: 'Agent Recouvrement Amiable'
    };

    return roleNames[role] || role;
  }

  getUserInitials(user: User): string {
    return user.getFullName().split(' ').map(n => n[0]).join('');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordFieldType(): string {
    return this.showPassword ? 'text' : 'password';
  }

  getConfirmPasswordFieldType(): string {
    return this.showConfirmPassword ? 'text' : 'password';
  }
}
