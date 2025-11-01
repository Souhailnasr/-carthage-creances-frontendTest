import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models';

@Component({
  selector: 'app-profil-chef-amiable',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profil-chef-amiable.component.html',
  styleUrls: ['./profil-chef-amiable.component.scss']
})
export class ProfilChefAmiableComponent implements OnInit {
  currentUser: User | null = null;
  profilForm: FormGroup;
  isEditing: boolean = false;
  showSuccessMessage: boolean = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.profilForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.loadUserData();
    }
  }

  loadUserData(): void {
    if (this.currentUser) {
      this.profilForm.patchValue({
        nom: this.currentUser.nom,
        prenom: this.currentUser.prenom,
        email: this.currentUser.email,
        role: this.getRoleDisplayName()
      });
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.loadUserData(); // Recharger les données originales
    }
  }

  onSubmit(): void {
    if (this.profilForm.valid && this.currentUser) {
      // Simuler la mise à jour du profil
      const formData = this.profilForm.value;
      
      // Mettre à jour l'utilisateur local
      this.currentUser.nom = formData.nom;
      this.currentUser.prenom = formData.prenom;
      this.currentUser.email = formData.email;

      // Sauvegarder dans le service d'authentification (simulation)
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      this.isEditing = false;
      this.showSuccessMessage = true;
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
    }
  }

  getInitials(): string {
    if (this.currentUser) {
      return `${this.currentUser.prenom.charAt(0)}${this.currentUser.nom.charAt(0)}`.toUpperCase();
    }
    return 'U';
  }

  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    
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

    return roleNames[this.currentUser.roleUtilisateur] || this.currentUser.roleUtilisateur || '';
  }

  getFieldError(fieldName: string): string {
    const field = this.profilForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName} est requis`;
      }
      if (field.errors['email']) {
        return 'Format d\'email invalide';
      }
      if (field.errors['minlength']) {
        return `${fieldName} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      }
      if (field.errors['pattern']) {
        return 'Format invalide';
      }
    }
    return '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  getDaysSinceHire(): number {
    // Simulation - retourner un nombre fixe pour la démo
    return 365;
  }
}
