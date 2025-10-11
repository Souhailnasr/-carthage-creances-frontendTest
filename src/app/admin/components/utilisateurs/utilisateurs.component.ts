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
  selectedDepartment: string = '';
  selectedStatus: string = ''; // 'all', 'active', 'inactive'
  sortBy: string = 'name'; // 'name', 'role', 'department', 'email', 'date'
  sortOrder: string = 'asc'; // 'asc', 'desc'
  showCreateForm: boolean = false;
  showAdvancedFilters: boolean = false;
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
      role: ['AGENT_DOSSIER', Validators.required]
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
          if (this.currentUser && (this.currentUser.role === 'CHEF_DEPARTEMENT_DOSSIER' || this.currentUser.roleUtilisateur === 'CHEF_DEPARTEMENT_DOSSIER')) {
            filteredUsers = utilisateurs.filter(user => 
              (user.roleUtilisateur || user.role) === 'AGENT_DOSSIER'
            );
            console.log('🔒 Filtre Chef Dossier appliqué - Utilisateurs filtrés:', filteredUsers.length);
          } else {
            console.log('👑 Utilisateur avec accès complet - Tous les utilisateurs affichés');
          }
          
          this.utilisateurs = filteredUsers;
          this.filteredUtilisateurs = [...filteredUsers];
          this.applyFilters(); // Appliquer les filtres et le tri
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
    this.applyFilters();
  }

  onSearchTypeChange(): void {
    // Réinitialiser la recherche quand le type change
    this.onSearch();
  }

  onRoleFilterChange(): void {
    this.applyFilters();
  }

  onDepartmentFilterChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applySorting();
  }

  onSortOrderChange(): void {
    this.applySorting();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedDepartment = '';
    this.selectedStatus = '';
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.utilisateurs];

    // Filtre par rôle
    if (this.selectedRole) {
      filtered = filtered.filter(utilisateur =>
        (utilisateur.roleUtilisateur || utilisateur.role) === this.selectedRole
      );
    }

    // Filtre par département
    if (this.selectedDepartment) {
      filtered = filtered.filter(utilisateur =>
        utilisateur.departement === this.selectedDepartment
      );
    }

    // Filtre par statut
    if (this.selectedStatus) {
      filtered = filtered.filter(utilisateur => {
        if (this.selectedStatus === 'active') {
          return utilisateur.actif === true;
        } else if (this.selectedStatus === 'inactive') {
          return utilisateur.actif === false;
        }
        return true;
      });
    }

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
          case 'all':
          default:
            return `${utilisateur.prenom} ${utilisateur.nom}`.toLowerCase().includes(searchLower) ||
                   utilisateur.email.toLowerCase().includes(searchLower) ||
                   (utilisateur.roleUtilisateur || utilisateur.role || '').toLowerCase().includes(searchLower) ||
                   (utilisateur.departement || '').toLowerCase().includes(searchLower);
        }
      });
    }

    this.filteredUtilisateurs = filtered;
    this.applySorting();
  }

  applySorting(): void {
    if (!this.filteredUtilisateurs.length) return;

    this.filteredUtilisateurs.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          comparison = `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'role':
          comparison = (a.roleUtilisateur || a.role || '').localeCompare(b.roleUtilisateur || b.role || '');
          break;
        case 'department':
          // Grouper par chef de département, puis par agents
          const aRole = a.roleUtilisateur || a.role || '';
          const bRole = b.roleUtilisateur || b.role || '';
          
          // Les chefs viennent en premier
          const aIsChef = aRole.includes('CHEF');
          const bIsChef = bRole.includes('CHEF');
          
          if (aIsChef && !bIsChef) {
            comparison = -1;
          } else if (!aIsChef && bIsChef) {
            comparison = 1;
          } else {
            // Si les deux sont des chefs ou des agents, trier par nom
            comparison = `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`);
          }
          break;
        case 'date':
          const aDate = new Date(a.dateCreation || 0);
          const bDate = new Date(b.dateCreation || 0);
          comparison = aDate.getTime() - bDate.getTime();
          break;
        case 'status':
          // Actifs en premier
          if (a.actif && !b.actif) comparison = -1;
          else if (!a.actif && b.actif) comparison = 1;
          else comparison = 0;
          break;
        default:
          comparison = 0;
      }
      
      // Appliquer l'ordre de tri (ascendant ou descendant)
      return this.sortOrder === 'desc' ? -comparison : comparison;
    });
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
    
    // En mode édition, rendre le mot de passe optionnel
    this.userForm = this.fb.group({
      nom: [utilisateur.nom, Validators.required],
      prenom: [utilisateur.prenom, Validators.required],
      email: [utilisateur.email, [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.minLength(6)]], // Optionnel en mode édition
      confirmPassword: ['', []], // Optionnel en mode édition
      role: [utilisateur.roleUtilisateur || utilisateur.role, Validators.required]
    }, { validators: this.passwordMatchValidator });
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
      actif: true,
      departement: this.getDepartmentFromRole(formValue.role)
    };
    
    if (this.isEditMode && this.editingUser) {
      // Mise à jour - ne pas envoyer le mot de passe s'il est vide
      const updateRequest: UtilisateurRequest = {
        nom: formValue.nom,
        prenom: formValue.prenom,
        email: formValue.email,
        roleUtilisateur: formValue.role,
        actif: this.editingUser.actif,
        departement: this.getDepartmentFromRole(formValue.role)
      };
      
      // Ajouter le mot de passe seulement s'il a été modifié
      if (formValue.motDePasse && formValue.motDePasse.trim() !== '') {
        updateRequest.motDePasse = formValue.motDePasse;
      }
      
      console.log('🔄 Mise à jour utilisateur:', updateRequest);
      
      this.utilisateurService.updateUtilisateur(this.editingUser.id!, updateRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Utilisateur mis à jour avec succès.');
            this.cancelForm();
            this.loadUsers(); // Recharger la liste
          },
          error: (error) => {
            console.error('❌ Erreur lors de la mise à jour:', error);
            this.toastService.error(`Erreur lors de la mise à jour: ${error.message}`);
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
      'CHEF_DEPARTEMENT_DOSSIER': 'Chef Département Dossier',
      'AGENT_DOSSIER': 'Agent de Dossier',
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': 'Chef Département Recouvrement Juridique',
      'AGENT_RECOUVREMENT_JURIDIQUE': 'Agent Recouvrement Juridique',
      'CHEF_DEPARTEMENT_FINANCE': 'Chef Département Finance',
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
    if (this.currentUser && (this.currentUser.role === 'CHEF_DEPARTEMENT_DOSSIER' || this.currentUser.roleUtilisateur === 'CHEF_DEPARTEMENT_DOSSIER')) {
      return ['AGENT_DOSSIER'];
    }
    
    // Pour le Super Admin, tous les rôles sont disponibles
    if (this.currentUser && (this.currentUser.role === 'SUPER_ADMIN' || this.currentUser.roleUtilisateur === 'SUPER_ADMIN')) {
      return [
        'SUPER_ADMIN',
        'CHEF_DEPARTEMENT_DOSSIER',
        'AGENT_DOSSIER',
        'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE',
        'AGENT_RECOUVREMENT_JURIDIQUE',
        'CHEF_DEPARTEMENT_FINANCE',
        'AGENT_FINANCE',
        'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE',
        'AGENT_RECOUVREMENT_AMIABLE'
      ];
    }
    
    // Pour les autres rôles, tous les rôles sont disponibles par défaut
    return [
      'SUPER_ADMIN',
      'CHEF_DEPARTEMENT_DOSSIER',
      'AGENT_DOSSIER',
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE',
      'AGENT_RECOUVREMENT_JURIDIQUE',
      'CHEF_DEPARTEMENT_FINANCE',
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
      case 'department':
        return 'Rechercher par département...';
      case 'all':
      default:
        return 'Rechercher par nom, email, rôle ou département...';
    }
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.searchTerm.trim()) count++;
    if (this.selectedRole) count++;
    if (this.selectedDepartment) count++;
    if (this.selectedStatus) count++;
    return count;
  }

  getFilteredUsersCount(): number {
    return this.filteredUtilisateurs.length;
  }

  getAvailableDepartments(): string[] {
    const departments = new Set<string>();
    this.utilisateurs.forEach(user => {
      if (user.departement) {
        departments.add(user.departement);
      }
    });
    return ['', ...Array.from(departments).sort()]; // Ajouter une option vide pour "Tous les départements"
  }

  getDepartmentDisplayName(department: string): string {
    if (!department) return 'Tous les départements';
    
    const departmentNames: { [key: string]: string } = {
      'DOSSIER': 'Département Dossier',
      'JURIDIQUE': 'Département Juridique',
      'FINANCE': 'Département Finance',
      'RECOUVREMENT_AMIABLE': 'Département Recouvrement Amiable'
    };

    return departmentNames[department] || department;
  }

  getDepartmentFromRole(role: string): string {
    const roleToDepartment: { [key: string]: string } = {
      'SUPER_ADMIN': 'ADMIN',
      'CHEF_DEPARTEMENT_DOSSIER': 'DOSSIER',
      'AGENT_DOSSIER': 'DOSSIER',
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': 'JURIDIQUE',
      'AGENT_RECOUVREMENT_JURIDIQUE': 'JURIDIQUE',
      'CHEF_DEPARTEMENT_FINANCE': 'FINANCE',
      'AGENT_FINANCE': 'FINANCE',
      'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE': 'RECOUVREMENT_AMIABLE',
      'AGENT_RECOUVREMENT_AMIABLE': 'RECOUVREMENT_AMIABLE'
    };

    return roleToDepartment[role] || 'ADMIN';
  }
}