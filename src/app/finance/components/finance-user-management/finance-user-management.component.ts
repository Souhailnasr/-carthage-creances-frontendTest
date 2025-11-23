import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { User, Role } from '../../../shared/models';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { ToastService } from '../../../core/services/toast.service';
import { UtilisateurService, Utilisateur, UtilisateurRequest, AuthenticationResponse } from '../../../core/services/utilisateur.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

@Component({
  selector: 'app-finance-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FormInputComponent],
  templateUrl: './finance-user-management.component.html',
  styleUrls: ['./finance-user-management.component.scss']
})
export class FinanceUserManagementComponent implements OnInit, OnDestroy {
  utilisateurs: Utilisateur[] = [];
  filteredUtilisateurs: Utilisateur[] = [];
  searchTerm: string = '';
  searchType: string = 'all';
  selectedRole: string = '';
  selectedActivity: string = '';
  showCreateForm: boolean = false;
  userForm!: FormGroup;
  isEditMode: boolean = false;
  editingUser: Utilisateur | null = null;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoading: boolean = false;
  currentUser: any;
  private destroy$ = new Subject<void>();

  get nomControl(): FormControl { return this.userForm.get('nom') as FormControl; }
  get prenomControl(): FormControl { return this.userForm.get('prenom') as FormControl; }
  get emailControl(): FormControl { return this.userForm.get('email') as FormControl; }
  get motDePasseControl(): FormControl { return this.userForm.get('motDePasse') as FormControl; }
  get confirmPasswordControl(): FormControl { return this.userForm.get('confirmPassword') as FormControl; }
  get roleControl(): FormControl { return this.userForm.get('role') as FormControl; }

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private utilisateurService: UtilisateurService,
    private jwtAuthService: JwtAuthService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentUser(); // loadUsers() sera appelé depuis loadCurrentUser() une fois l'utilisateur chargé
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          console.log('👤 Utilisateur connecté chargé:', this.currentUser);
          // Recharger les utilisateurs une fois que l'utilisateur actuel est chargé
          this.loadUsers();
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
        }
      });
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
      role: [Role.AGENT_FINANCE, Validators.required] // Par défaut, seul AGENT_FINANCE peut être créé
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
    // Ne pas charger si l'utilisateur actuel n'est pas encore disponible
    if (!this.currentUser) {
      console.log('⏳ Attente du chargement de l\'utilisateur actuel...');
      return;
    }

    this.isLoading = true;
    this.utilisateurService.getAllUtilisateurs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (utilisateurs) => {
          // Filtrer uniquement les agents financiers pour le chef financier
          let filteredUsers = utilisateurs;
          
          const userRole = this.currentUser?.roleUtilisateur || this.currentUser?.role || '';
          if (this.currentUser && (
            userRole === Role.CHEF_DEPARTEMENT_FINANCE || 
            userRole === 'CHEF_DEPARTEMENT_FINANCE'
          )) {
            filteredUsers = utilisateurs.filter(user => {
              const userRoleToCheck = user.roleUtilisateur || user.role || '';
              return userRoleToCheck === Role.AGENT_FINANCE || userRoleToCheck === 'AGENT_FINANCE';
            });
            console.log('🔒 Filtre Chef Finance appliqué - Agents financiers:', filteredUsers.length);
            console.log('👤 Utilisateur connecté:', this.currentUser);
            console.log('🔍 Rôle de l\'utilisateur connecté:', userRole);
          } else {
            console.log('👑 Utilisateur avec accès complet - Tous les utilisateurs affichés');
            console.log('👤 Utilisateur connecté:', this.currentUser);
            console.log('🔍 Rôle de l\'utilisateur connecté:', userRole);
          }
          
          this.utilisateurs = filteredUsers;
          this.filteredUtilisateurs = [...filteredUsers];
          this.applyAllFilters();
          this.isLoading = false;
          console.log('✅ Utilisateurs chargés:', filteredUsers);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des utilisateurs:', error);
          this.toastService.error('Erreur lors du chargement des utilisateurs');
          this.isLoading = false;
        }
      });
  }

  onSearch(): void {
    this.applyAllFilters();
  }

  onSearchTypeChange(): void {
    this.onSearch();
  }

  onRoleFilterChange(): void {
    this.applyAllFilters();
  }

  onActivityFilterChange(): void {
    this.applyAllFilters();
  }

  applyAllFilters(): void {
    let filtered = [...this.utilisateurs];

    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(utilisateur => {
        switch (this.searchType) {
          case 'name':
            return (utilisateur.nom || '').toLowerCase().includes(searchLower) ||
                   (utilisateur.prenom || '').toLowerCase().includes(searchLower);
          case 'email':
            return (utilisateur.email || '').toLowerCase().includes(searchLower);
          case 'role':
            return (utilisateur.roleUtilisateur || utilisateur.role || '').toLowerCase().includes(searchLower);
          default:
            return (utilisateur.nom || '').toLowerCase().includes(searchLower) ||
                   (utilisateur.prenom || '').toLowerCase().includes(searchLower) ||
                   (utilisateur.email || '').toLowerCase().includes(searchLower) ||
                   (utilisateur.roleUtilisateur || utilisateur.role || '').toLowerCase().includes(searchLower);
        }
      });
    }

    if (this.selectedRole) {
      filtered = filtered.filter(u => (u.roleUtilisateur || u.role) === this.selectedRole);
    }

    if (this.selectedActivity) {
      filtered = filtered.filter(u => 
        this.selectedActivity === 'active' ? u.actif : !u.actif
      );
    }

    this.filteredUtilisateurs = filtered;
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.searchType = 'all';
    this.selectedRole = '';
    this.selectedActivity = '';
    this.applyAllFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedRole || this.selectedActivity);
  }

  getSearchPlaceholder(): string {
    switch (this.searchType) {
      case 'name': return 'Rechercher par nom/prénom...';
      case 'email': return 'Rechercher par email...';
      case 'role': return 'Rechercher par rôle...';
      default: return 'Rechercher par nom, email ou rôle...';
    }
  }

  getAvailableRoles(): string[] {
    // Le chef financier ne peut créer que des agents financiers
    return [Role.AGENT_FINANCE];
  }

  getAvailableRolesForFilter(): string[] {
    return [Role.AGENT_FINANCE];
  }

  getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      [Role.AGENT_FINANCE]: 'Agent Finance',
      [Role.CHEF_DEPARTEMENT_FINANCE]: 'Chef Département Finance'
    };
    return roleNames[role] || role;
  }

  getUserInitials(utilisateur: Utilisateur): string {
    const nom = utilisateur.nom?.charAt(0).toUpperCase() || '';
    const prenom = utilisateur.prenom?.charAt(0).toUpperCase() || '';
    return nom + prenom;
  }

  showCreateUserForm(): void {
    this.showCreateForm = true;
    this.isEditMode = false;
    this.editingUser = null;
    this.initializeForm();
  }

  showEditUserForm(utilisateur: Utilisateur): void {
    this.showCreateForm = true;
    this.isEditMode = true;
    this.editingUser = utilisateur;
    
    this.userForm = this.fb.group({
      nom: [utilisateur.nom, Validators.required],
      prenom: [utilisateur.prenom, Validators.required],
      email: [utilisateur.email, [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.minLength(6)]],
      confirmPassword: ['', []],
      role: [utilisateur.roleUtilisateur || utilisateur.role || Role.AGENT_FINANCE, Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.isEditMode = false;
    this.editingUser = null;
    this.initializeForm();
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }

    const formValue = this.userForm.value;
    const utilisateurRequest: UtilisateurRequest = {
      nom: formValue.nom,
      prenom: formValue.prenom,
      email: formValue.email,
      roleUtilisateur: formValue.role,
      motDePasse: formValue.motDePasse,
      actif: true
    };
    
    if (this.isEditMode && this.editingUser) {
      const updateRequest: UtilisateurRequest = {
        nom: formValue.nom,
        prenom: formValue.prenom,
        email: formValue.email,
        roleUtilisateur: formValue.role,
        actif: this.editingUser.actif
      };
      
      if (formValue.motDePasse && formValue.motDePasse.trim() !== '') {
        updateRequest.motDePasse = formValue.motDePasse;
      }
      
      this.utilisateurService.updateUtilisateur(this.editingUser.id!, updateRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Agent financier mis à jour avec succès.');
            this.cancelForm();
            this.loadUsers();
          },
          error: (error) => {
            console.error('❌ Erreur lors de la mise à jour:', error);
            this.toastService.error(`Erreur lors de la mise à jour: ${error.message}`);
          }
        });
    } else {
      this.utilisateurService.createUtilisateur(utilisateurRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.errors && response.errors.length > 0) {
              this.toastService.error('Erreurs de validation: ' + response.errors.join(', '));
            } else {
              this.toastService.success('Agent financier créé avec succès.');
              this.cancelForm();
              this.loadUsers();
            }
          },
          error: (error) => {
            console.error('❌ Erreur lors de la création:', error);
            let errorMessage = 'Erreur lors de la création de l\'agent financier';
            if (error.message) {
              errorMessage = error.message;
            }
            this.toastService.error(errorMessage);
          }
        });
    }
  }

  deleteUser(utilisateur: Utilisateur): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'agent financier ${utilisateur.nom} ${utilisateur.prenom} ?`)) {
      this.utilisateurService.deleteUtilisateur(utilisateur.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Agent financier supprimé avec succès.');
            this.loadUsers();
          },
          error: (error) => {
            console.error('❌ Erreur lors de la suppression:', error);
            this.toastService.error('Erreur lors de la suppression de l\'agent financier');
          }
        });
    }
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

