import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { User, Role } from '../../../shared/models';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { ToastService } from '../../../core/services/toast.service';
import { UtilisateurService, Utilisateur, UtilisateurRequest, AuthenticationResponse } from '../../../core/services/utilisateur.service';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FormInputComponent],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  utilisateurs: Utilisateur[] = [];
  filteredUtilisateurs: Utilisateur[] = [];
  searchTerm: string = '';
  searchType: string = 'all'; // 'all', 'name', 'email', 'role', 'department'
  selectedRole: string = '';
  selectedActivity: string = ''; // 'all', 'active', 'inactive'
  selectedDepartment: string = '';
  showCreateForm: boolean = false;
  userForm!: FormGroup;
  isEditMode: boolean = false;
  editingUser: Utilisateur | null = null;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoading: boolean = false;
  currentUser: any;
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
    private toastService: ToastService,
    private utilisateurService: UtilisateurService,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentUser();
    console.log('🔧 UserManagementComponent initialisé avec filtres avancés');
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
          // Fallback vers AuthService
          this.currentUser = this.authService.getCurrentUser();
          this.loadUsers();
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
    this.isLoading = true;
    this.utilisateurService.getAllUtilisateurs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (utilisateurs) => {
          // Appliquer le filtre par rôle selon l'utilisateur connecté
          let filteredUsers = utilisateurs;
          
          // Si l'utilisateur connecté est un Chef Dossier, ne montrer que les Agents de Dossier
          const userRole = this.currentUser?.roleUtilisateur || (this.currentUser as any)?.role;
          if (this.currentUser && (
            userRole === Role.CHEF_DEPARTEMENT_DOSSIER || 
            userRole === 'CHEF_DEPARTEMENT_DOSSIER' ||
            String(userRole) === String(Role.CHEF_DEPARTEMENT_DOSSIER)
          )) {
            filteredUsers = utilisateurs.filter(user => {
              const userRoleToCheck = user.roleUtilisateur || user.role || '';
              return userRoleToCheck === Role.AGENT_DOSSIER || 
                     userRoleToCheck === 'AGENT_DOSSIER' ||
                     String(userRoleToCheck) === String(Role.AGENT_DOSSIER);
            });
            console.log('🔒 Filtre Chef Dossier appliqué - Agents dossier uniquement:', filteredUsers.length);
            console.log('👤 Utilisateur connecté:', this.currentUser);
            console.log('🔍 Rôle de l\'utilisateur connecté:', userRole);
          } else {
            console.log('👑 Utilisateur avec accès complet - Tous les utilisateurs affichés');
            console.log('👤 Utilisateur connecté:', this.currentUser);
            console.log('🔍 Rôle de l\'utilisateur connecté:', userRole);
          }
          
          this.utilisateurs = filteredUsers;
          this.filteredUtilisateurs = [...filteredUsers];
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
    // Réinitialiser la recherche quand le type change
    this.onSearch();
  }

  onRoleFilterChange(): void {
    this.applyAllFilters();
  }

  onActivityFilterChange(): void {
    this.applyAllFilters();
  }

  onDepartmentFilterChange(): void {
    this.applyAllFilters();
  }

  applyAllFilters(): void {
    let filtered = [...this.utilisateurs];

    // Recherche textuelle
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(utilisateur => {
        switch (this.searchType) {
          case 'name':
            return `${utilisateur.prenom} ${utilisateur.nom}`.toLowerCase().includes(searchLower);
          case 'email':
            return utilisateur.email.toLowerCase().includes(searchLower);
          case 'role':
            return (utilisateur.roleUtilisateur || utilisateur.role || '').toLowerCase().includes(searchLower);
          case 'department':
            return (utilisateur.departement || '').toLowerCase().includes(searchLower);
          case 'phone':
            return (utilisateur.telephone || '').toLowerCase().includes(searchLower);
          case 'all':
          default:
            return `${utilisateur.prenom} ${utilisateur.nom}`.toLowerCase().includes(searchLower) ||
                   utilisateur.email.toLowerCase().includes(searchLower) ||
                   (utilisateur.roleUtilisateur || utilisateur.role || '').toLowerCase().includes(searchLower) ||
                   (utilisateur.departement || '').toLowerCase().includes(searchLower) ||
                   (utilisateur.telephone || '').toLowerCase().includes(searchLower);
        }
      });
    }

    // Filtre par rôle
    if (this.selectedRole) {
      filtered = filtered.filter(utilisateur =>
        (utilisateur.roleUtilisateur || utilisateur.role) === this.selectedRole
      );
    }

    // Filtre par activité
    if (this.selectedActivity) {
      if (this.selectedActivity === 'active') {
        filtered = filtered.filter(utilisateur => utilisateur.actif === true);
      } else if (this.selectedActivity === 'inactive') {
        filtered = filtered.filter(utilisateur => utilisateur.actif === false);
      }
    }

    // Filtre par département
    if (this.selectedDepartment) {
      filtered = filtered.filter(utilisateur =>
        (utilisateur.departement || '').toLowerCase().includes(this.selectedDepartment.toLowerCase())
      );
    }

    this.filteredUtilisateurs = filtered;
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedActivity = '';
    this.selectedDepartment = '';
    this.searchType = 'all';
    this.filteredUtilisateurs = [...this.utilisateurs];
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
    this.userForm.patchValue({
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      motDePasse: '', // Ne pas pré-remplir le mot de passe
      role: utilisateur.roleUtilisateur || utilisateur.role
    });
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
      // Mise à jour
      this.utilisateurService.updateUtilisateur(this.editingUser.id!, utilisateurRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Utilisateur mis à jour avec succès.');
            this.cancelForm();
            this.loadUsers(); // Recharger la liste
          },
          error: (error) => {
            console.error('❌ Erreur lors de la mise à jour:', error);
            this.toastService.error('Erreur lors de la mise à jour de l\'utilisateur');
          }
        });
    } else {
      // Création
      this.utilisateurService.createUtilisateur(utilisateurRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.errors && response.errors.length > 0) {
              // Afficher les erreurs de validation du backend
              this.toastService.error('Erreurs de validation: ' + response.errors.join(', '));
            } else {
              this.toastService.success('Utilisateur créé avec succès.');
              this.cancelForm();
              this.loadUsers(); // Recharger la liste
            }
          },
          error: (error) => {
            console.error('❌ Erreur lors de la création:', error);
            this.toastService.error('Erreur lors de la création de l\'utilisateur');
          }
        });
    }
  }

  deleteUser(utilisateur: Utilisateur): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.utilisateurService.deleteUtilisateur(utilisateur.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Utilisateur supprimé avec succès.');
            this.loadUsers(); // Recharger la liste
          },
          error: (error) => {
            console.error('❌ Erreur lors de la suppression:', error);
            this.toastService.error('Erreur lors de la suppression de l\'utilisateur');
          }
        });
    }
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.isEditMode = false;
    this.editingUser = null;
    this.initializeForm();
  }

  getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'SUPER_ADMIN': 'Super Administrateur',
      'CHEF_DEPARTEMENT_DOSSIER': 'Chef de Dossier',
      'CHEF_DOSSIER': 'Chef de Dossier', // Alias pour compatibilité
      'AGENT_DOSSIER': 'Agent de Dossier',
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': 'Chef Département Recouvrement Juridique',
      'CHEF_JURIDIQUE': 'Chef Juridique', // Alias pour compatibilité
      'AGENT_RECOUVREMENT_JURIDIQUE': 'Agent Recouvrement Juridique',
      'AGENT_JURIDIQUE': 'Agent Juridique', // Alias pour compatibilité
      'CHEF_DEPARTEMENT_FINANCE': 'Chef Département Finance',
      'CHEF_FINANCE': 'Chef Finance', // Alias pour compatibilité
      'AGENT_FINANCE': 'Agent Finance',
      'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE': 'Chef Département Recouvrement Amiable',
      'AGENT_RECOUVREMENT_AMIABLE': 'Agent Recouvrement Amiable'
    };

    return roleNames[role] || role;
  }

  getUserInitials(utilisateur: Utilisateur): string {
    return `${utilisateur.prenom} ${utilisateur.nom}`.split(' ').map(n => n[0]).join('');
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

  getAvailableRoles(): string[] {
    // Si l'utilisateur connecté est un Chef Dossier, ne peut créer que des Agents de Dossier
    const userRole = this.currentUser?.roleUtilisateur || (this.currentUser as any)?.role;
    if (this.currentUser && (
      userRole === Role.CHEF_DEPARTEMENT_DOSSIER || 
      userRole === 'CHEF_DEPARTEMENT_DOSSIER' ||
      String(userRole) === String(Role.CHEF_DEPARTEMENT_DOSSIER)
    )) {
      return [Role.AGENT_DOSSIER];
    }
    
    // Pour les autres rôles (Super Admin, etc.), tous les rôles sont disponibles
    return [
      Role.SUPER_ADMIN,
      Role.CHEF_DEPARTEMENT_DOSSIER,
      Role.AGENT_DOSSIER,
      Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE,
      Role.AGENT_RECOUVREMENT_JURIDIQUE,
      Role.CHEF_DEPARTEMENT_FINANCE,
      Role.AGENT_FINANCE,
      Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE,
      Role.AGENT_RECOUVREMENT_AMIABLE
    ];
  }

  getAvailableRolesForFilter(): string[] {
    // Pour le filtre, on peut filtrer par tous les rôles disponibles
    const roles = this.getAvailableRoles();
    return ['', ...roles]; // Ajouter une option vide pour "Tous les rôles"
  }

  getSearchPlaceholder(): string {
    switch (this.searchType) {
      case 'name':
        return 'Rechercher par nom ou prénom...';
      case 'email':
        return 'Rechercher par email...';
      case 'role':
        return 'Rechercher par rôle...';
      case 'department':
        return 'Rechercher par département...';
      case 'phone':
        return 'Rechercher par téléphone...';
      case 'all':
      default:
        return 'Rechercher par nom, email, rôle, département...';
    }
  }

  getAvailableDepartments(): string[] {
    const departments = new Set<string>();
    this.utilisateurs.forEach(user => {
      if (user.departement) {
        departments.add(user.departement);
      }
    });
    return ['', ...Array.from(departments).sort()];
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedRole || this.selectedActivity || this.selectedDepartment);
  }
}
