import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { UtilisateurService, Utilisateur, UtilisateurRequest } from '../../../services/utilisateur.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../models';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss']
})
export class ProfilComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  utilisateurComplet: Utilisateur | null = null;
  isEditing: boolean = false;
  
  // Formulaires
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  // État de chargement
  isUpdatingProfile = false;
  isChangingPassword = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private utilisateurService: UtilisateurService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.initForms();
  }
  
  initForms(): void {
    // Formulaire de profil
    this.profileForm = this.fb.group({
      prenom: ['', [Validators.required]],
      nom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      adresse: ['']
    });
    
    // Formulaire de mot de passe
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
  
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserData(): void {
    // Récupérer l'ID utilisateur depuis JwtAuthService
    const userId = this.jwtAuthService.getCurrentUserId();
    
    if (userId) {
      // Charger directement les informations complètes depuis l'API
      this.utilisateurService.getUtilisateurById(userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (utilisateur) => {
            this.utilisateurComplet = utilisateur;
            console.log('✅ Informations utilisateur complètes chargées:', utilisateur);
            
            // Créer un objet User à partir de Utilisateur pour compatibilité
            this.currentUser = new User({
              id: utilisateur.id?.toString() || '',
              nom: utilisateur.nom || '',
              prenom: utilisateur.prenom || '',
              email: utilisateur.email || '',
              roleUtilisateur: utilisateur.roleUtilisateur as any,
              actif: utilisateur.actif || true
            });
            
            // Remplir le formulaire avec les données
            this.profileForm.patchValue({
              prenom: utilisateur.prenom || '',
              nom: utilisateur.nom || '',
              email: utilisateur.email || '',
              adresse: utilisateur.adresse || ''
            });
          },
          error: (error) => {
            console.error('❌ Erreur lors du chargement des informations utilisateur:', error);
            // Fallback : charger depuis JwtAuthService
            firstValueFrom(this.jwtAuthService.getCurrentUser())
              .then(user => {
                this.currentUser = user;
              })
              .catch(err => {
                console.error('❌ Erreur lors de la récupération de l\'utilisateur:', err);
                this.currentUser = this.authService.getCurrentUser();
              });
          }
        });
    } else {
      // Fallback : charger depuis JwtAuthService
      firstValueFrom(this.jwtAuthService.getCurrentUser())
        .then(user => {
          this.currentUser = user;
        })
        .catch(error => {
          console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
          this.currentUser = this.authService.getCurrentUser();
        });
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Réinitialiser le formulaire avec les valeurs actuelles
      this.profileForm.patchValue({
        prenom: this.getPrenom(),
        nom: this.getNom(),
        email: this.getEmail(),
        adresse: this.getAdresse()
      });
    }
  }
  
  onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }
    
    if (!this.utilisateurComplet?.id) {
      this.toastService.error('Erreur: Impossible d\'identifier l\'utilisateur.');
      return;
    }
    
    this.isUpdatingProfile = true;
    
    const formValue = this.profileForm.value;
    
    // Construire l'objet de mise à jour selon la documentation
    // Ne pas inclure motDePasse car on ne modifie que les informations personnelles
    const updateData: UtilisateurRequest = {
      nom: formValue.nom,
      prenom: formValue.prenom,
      email: formValue.email,
      adresse: formValue.adresse || undefined,
      actif: this.utilisateurComplet.actif,
      roleUtilisateur: this.utilisateurComplet.roleUtilisateur || undefined
      // motDePasse n'est pas inclus car on ne change pas le mot de passe ici
    };
    
    this.utilisateurService.updateUtilisateur(this.utilisateurComplet.id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          this.utilisateurComplet = updatedUser;
          this.toastService.success('Profil mis à jour avec succès.');
          this.isEditing = false;
          this.isUpdatingProfile = false;
          // Recharger les données pour avoir les dernières informations
          this.loadUserData();
        },
        error: (error) => {
          console.error('❌ Erreur lors de la mise à jour du profil:', error);
          // Gérer les différents types d'erreurs selon la documentation
          let errorMessage = 'Erreur lors de la mise à jour du profil';
          
          if (error.status === 400) {
            // Erreur de validation (ex: email déjà utilisé)
            errorMessage = error.error?.message || error.error || 'Erreur de validation';
          } else if (error.status === 404) {
            errorMessage = 'Utilisateur non trouvé';
          } else if (error.status === 500) {
            errorMessage = error.error?.message || 'Erreur serveur lors de la mise à jour';
          } else {
            errorMessage = error.error?.message || error.message || errorMessage;
          }
          
          this.toastService.error(errorMessage);
          this.isUpdatingProfile = false;
        }
      });
  }
  
  onCancelProfile(): void {
    this.isEditing = false;
    this.profileForm.patchValue({
      prenom: this.getPrenom(),
      nom: this.getNom(),
      email: this.getEmail(),
      adresse: this.getAdresse()
    });
  }
  
  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      if (this.passwordForm.errors?.['passwordMismatch']) {
        this.toastService.error('Les mots de passe ne correspondent pas.');
      } else {
        this.toastService.error('Veuillez remplir tous les champs requis.');
      }
      return;
    }
    
    if (!this.utilisateurComplet?.id) {
      this.toastService.error('Erreur: Impossible d\'identifier l\'utilisateur.');
      return;
    }
    
    this.isChangingPassword = true;
    
    const formValue = this.passwordForm.value;
    
    // Utiliser PUT /api/users/{id} avec le champ motDePasse selon la documentation
    // Le backend mettra à jour le mot de passe si le champ est fourni et non vide
    const updateData: UtilisateurRequest = {
      nom: this.utilisateurComplet.nom,
      prenom: this.utilisateurComplet.prenom,
      email: this.utilisateurComplet.email,
      adresse: this.utilisateurComplet.adresse,
      actif: this.utilisateurComplet.actif,
      roleUtilisateur: this.utilisateurComplet.roleUtilisateur || undefined,
      motDePasse: formValue.newPassword // Le nouveau mot de passe
    };
    
    this.utilisateurService.updateUtilisateur(this.utilisateurComplet.id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          this.toastService.success('Mot de passe modifié avec succès.');
          this.passwordForm.reset();
          this.isChangingPassword = false;
          // Optionnel : recharger les données utilisateur
          this.loadUserData();
        },
        error: (error) => {
          console.error('❌ Erreur lors du changement de mot de passe:', error);
          const errorMessage = error.error?.message || 
                              error.error || 
                              error.message || 
                              'Erreur lors du changement de mot de passe';
          this.toastService.error(errorMessage);
          this.isChangingPassword = false;
        }
      });
  }
  
  onCancelPassword(): void {
    this.passwordForm.reset();
  }

  getRoleDisplayName(): string {
    // Utiliser utilisateurComplet si disponible, sinon currentUser
    const role = this.utilisateurComplet?.roleUtilisateur || 
                 this.currentUser?.roleUtilisateur || 
                 '';
    
    if (!role) return '';
    
    const roleNames: { [key: string]: string } = {
      'SUPER_ADMIN': 'Super Administrateur',
      'CHEF_DEPARTEMENT_DOSSIER': 'Chef Département Dossier',
      'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE': 'Chef Département Recouvrement Amiable',
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': 'Chef Département Recouvrement Juridique',
      'CHEF_DEPARTEMENT_FINANCE': 'Chef Département Finance',
      'AGENT_DOSSIER': 'Agent Dossier',
      'AGENT_RECOUVREMENT_AMIABLE': 'Agent Recouvrement Amiable',
      'AGENT_RECOUVREMENT_JURIDIQUE': 'Agent Recouvrement Juridique',
      'AGENT_FINANCE': 'Agent Finance'
    };

    // Normaliser le rôle (peut être string ou enum)
    const roleStr = typeof role === 'string' ? role : String(role);
    return roleNames[roleStr] || roleStr;
  }

  getRoleClass(): string {
    const role = this.utilisateurComplet?.roleUtilisateur || 
                 this.currentUser?.roleUtilisateur;
    if (!role) return 'user-role';
    const roleStr = typeof role === 'string' ? role : String(role);
    const normalizedRole = roleStr.toLowerCase().replace(/_/g, '-');
    return `user-role role-${normalizedRole}`;
  }

  getInitials(): string {
    const prenom = this.utilisateurComplet?.prenom || this.currentUser?.prenom || '';
    const nom = this.utilisateurComplet?.nom || this.currentUser?.nom || '';
    if (prenom && nom) {
      return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
    }
    return 'U';
  }

  getFullName(): string {
    if (this.utilisateurComplet) {
      return `${this.utilisateurComplet.prenom || ''} ${this.utilisateurComplet.nom || ''}`.trim();
    }
    if (this.currentUser) {
      // Vérifier si getFullName existe (méthode de la classe User)
      if (typeof this.currentUser.getFullName === 'function') {
        return this.currentUser.getFullName();
      }
      // Sinon, construire manuellement
      return `${this.currentUser.prenom || ''} ${this.currentUser.nom || ''}`.trim();
    }
    return '';
  }

  getPrenom(): string {
    return this.utilisateurComplet?.prenom || this.currentUser?.prenom || '';
  }

  getNom(): string {
    return this.utilisateurComplet?.nom || this.currentUser?.nom || '';
  }

  getEmail(): string {
    return this.utilisateurComplet?.email || this.currentUser?.email || '';
  }

  getAdresse(): string {
    return this.utilisateurComplet?.adresse || '';
  }
}
