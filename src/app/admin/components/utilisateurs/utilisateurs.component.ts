import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { User, Role } from '../../../shared/models';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { ToastService } from '../../../core/services/toast.service';
import { UtilisateurService, Utilisateur, UtilisateurRequest } from '../../../core/services/utilisateur.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FormInputComponent],
  templateUrl: './utilisateurs.component.html',
  styleUrls: ['./utilisateurs.component.scss']
})
export class UtilisateursComponent implements OnInit, OnDestroy {
  utilisateurs: Utilisateur[] = [];
  filteredUtilisateurs: Utilisateur[] = [];
  searchTerm: string = '';
  searchType: string = 'all'; // 'all', 'name', 'email', 'role'
  selectedRole: string = '';
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
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeForm();
    this.loadUsers();
    console.log('🔧 UtilisateursComponent initialisé avec filtres avancés');
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
          if (this.currentUser && this.currentUser.role === 'CHEF_DOSSIER') {
            filteredUsers = utilisateurs.filter(user => 
              (user.roleUtilisateur || user.role) === 'AGENT_DOSSIER'
            );
            console.log('🔒 Filtre Chef Dossier appliqué - Utilisateurs filtrés:', filteredUsers.length);
          } else {
            console.log('👑 Utilisateur avec accès complet - Tous les utilisateurs affichés');
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
    if (!this.searchTerm.trim()) {
      this.filteredUtilisateurs = [...this.utilisateurs];
    } else {
      this.filteredUtilisateurs = this.utilisateurs.filter(utilisateur => {
        const searchLower = this.searchTerm.toLowerCase();
        
        switch (this.searchType) {
          case 'name':
            return `${utilisateur.prenom} ${utilisateur.nom}`.toLowerCase().includes(searchLower);
          case 'email':
            return utilisateur.email.toLowerCase().includes(searchLower);
          case 'role':
            return (utilisateur.roleUtilisateur || utilisateur.role || '').toLowerCase().includes(searchLower);
          case 'all':
          default:
            return `${utilisateur.prenom} ${utilisateur.nom}`.toLowerCase().includes(searchLower) ||
                   utilisateur.email.toLowerCase().includes(searchLower) ||
                   (utilisateur.roleUtilisateur || utilisateur.role || '').toLowerCase().includes(searchLower);
        }
      });
    }
  }

  onSearchTypeChange(): void {
    // Réinitialiser la recherche quand le type change
    this.onSearch();
  }

  onRoleFilterChange(): void {
    if (!this.selectedRole) {
      this.filteredUtilisateurs = [...this.utilisateurs];
    } else {
      this.filteredUtilisateurs = this.utilisateurs.filter(utilisateur =>
        (utilisateur.roleUtilisateur || utilisateur.role) === this.selectedRole
      );
    }
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
          next: () => {
            this.toastService.success('Utilisateur créé avec succès.');
            this.cancelForm();
            this.loadUsers(); // Recharger la liste
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
      'CHEF_DOSSIER': 'Chef de Dossier',
      'AGENT_DOSSIER': 'Agent de Dossier',
      'CHEF_JURIDIQUE': 'Chef Juridique',
      'AGENT_JURIDIQUE': 'Agent Juridique',
      'CHEF_FINANCE': 'Chef Finance',
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
    if (this.currentUser && this.currentUser.role === 'CHEF_DOSSIER') {
      return ['AGENT_DOSSIER'];
    }
    
    // Pour les autres rôles (Super Admin, etc.), tous les rôles sont disponibles
    return [
      'SUPER_ADMIN',
      'CHEF_DOSSIER',
      'AGENT_DOSSIER',
      'CHEF_JURIDIQUE',
      'AGENT_JURIDIQUE',
      'CHEF_FINANCE',
      'AGENT_FINANCE',
      'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE',
      'AGENT_RECOUVREMENT_AMIABLE'
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
      case 'all':
      default:
        return 'Rechercher par nom, email ou rôle...';
    }
  }
}