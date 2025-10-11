import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CreancierApiService } from '../../core/services/creancier-api.service';
import { CreancierApi, CreancierRequest } from '../../shared/models/creancier-api.model';
import { AuthService } from '../../core/services/auth.service';
import { JwtAuthService } from '../../core/services/jwt-auth.service';
import { Role } from '../../shared/models/enums.model';

@Component({
  selector: 'app-creancier-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './creancier-gestion.component.html',
  styleUrls: ['./creancier-gestion.component.scss']
})
export class CreancierGestionComponent implements OnInit {
  creanciers: CreancierApi[] = [];
  filteredCreanciers: CreancierApi[] = [];
  creancierForm: FormGroup;
  isEditMode = false;
  editingCreancierId: number | null = null;
  searchTerm = '';
  currentUser: any;
  showForm = false; // Nouvelle variable pour contrôler l'affichage du formulaire

  constructor(
    private creancierApiService: CreancierApiService,
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService
  ) {
    this.creancierForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.authenticateAndLoadCreanciers();
  }

  authenticateAndLoadCreanciers(): void {
    // Vérifier si on a déjà un token
    if (this.jwtAuthService.isAuthenticated()) {
      console.log('Token JWT déjà disponible');
      this.loadCreanciers();
    } else {
      // Essayer de se connecter automatiquement
      console.log('Tentative de connexion automatique...');
      this.jwtAuthService.loginDev().subscribe({
        next: (response) => {
          console.log('Connexion réussie:', response);
          this.loadCreanciers();
        },
        error: (error) => {
          console.error('Échec de la connexion automatique:', error);
          console.log('Utilisation du mode développement avec données mock');
          this.loadCreanciers();
        }
      });
    }
  }

  initializeForm(): FormGroup {
    return this.fb.group({
      codeCreancier: ['', [Validators.required, Validators.minLength(2)]],
      codeCreance: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      adresse: ['', [Validators.required, Validators.minLength(5)]],
      ville: [''],
      codePostal: [''],
      fax: ['']
    });
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  loadCreanciers(): void {
    this.creancierApiService.getAllCreanciers().subscribe({
      next: (creanciers) => {
        console.log('Créanciers chargés depuis l\'API:', creanciers);
        this.creanciers = creanciers;
        this.filteredCreanciers = creanciers;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des créanciers:', error);
        // Afficher un message d'erreur à l'utilisateur
        alert('Erreur lors du chargement des créanciers. Vérifiez la connexion au backend.');
        this.creanciers = [];
        this.filteredCreanciers = [];
      }
    });
  }


  onSubmit(): void {
    if (this.creancierForm.valid) {
      const formValue = this.creancierForm.value;
      
      if (this.isEditMode && this.editingCreancierId) {
        this.updateCreancier(this.editingCreancierId, formValue);
      } else {
        this.createCreancier(formValue);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  createCreancier(creancierData: any): void {
    const creancierRequest: CreancierRequest = {
      codeCreancier: creancierData.codeCreancier,
      codeCreance: creancierData.codeCreance,
      nom: creancierData.nom,
      prenom: creancierData.prenom,
      email: creancierData.email,
      telephone: creancierData.telephone,
      adresse: creancierData.adresse,
      ville: creancierData.ville,
      codePostal: creancierData.codePostal,
      fax: creancierData.fax || ''
    };

    this.creancierApiService.createCreancier(creancierRequest).subscribe({
      next: (newCreancier) => {
        console.log('Créancier créé avec succès:', newCreancier);
        this.hideForm();
        alert('Créancier créé avec succès !');
        // Recharger la liste depuis le backend pour s'assurer d'avoir les données à jour
        this.loadCreanciers();
      },
      error: (error) => {
        console.error('Erreur lors de la création du créancier:', error);
        // Ne pas ajouter localement: afficher l'erreur pour corriger l'appel API
        alert('Echec de création du créancier (voir console pour détails)');
      }
    });
  }

  updateCreancier(id: number, creancierData: any): void {
    const creancierRequest: CreancierRequest = {
      codeCreancier: creancierData.codeCreancier,
      codeCreance: creancierData.codeCreance,
      nom: creancierData.nom,
      prenom: creancierData.prenom,
      email: creancierData.email,
      telephone: creancierData.telephone,
      adresse: creancierData.adresse,
      ville: creancierData.ville,
      codePostal: creancierData.codePostal
    };

    this.creancierApiService.updateCreancier(id, creancierRequest).subscribe({
      next: (updatedCreancier) => {
        const index = this.creanciers.findIndex(c => c.id === id);
        if (index !== -1) {
          this.creanciers[index] = updatedCreancier;
          this.filteredCreanciers = [...this.creanciers];
        }
        this.hideForm();
        console.log('Créancier mis à jour avec succès:', updatedCreancier);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du créancier:', error);
        // En cas d'erreur, mettre à jour localement pour le développement
        const index = this.creanciers.findIndex(c => c.id === id);
        if (index !== -1) {
          this.creanciers[index] = { ...this.creanciers[index], ...creancierData };
          this.filteredCreanciers = [...this.creanciers];
        }
        this.hideForm();
      }
    });
  }

  deleteCreancier(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce créancier ?')) {
      this.creancierApiService.deleteCreancier(id).subscribe({
        next: () => {
          this.creanciers = this.creanciers.filter(c => c.id !== id);
          this.filteredCreanciers = [...this.creanciers];
          console.log('Créancier supprimé avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du créancier:', error);
          // En cas d'erreur, supprimer localement pour le développement
          this.creanciers = this.creanciers.filter(c => c.id !== id);
          this.filteredCreanciers = [...this.creanciers];
        }
      });
    }
  }

  editCreancier(creancier: CreancierApi): void {
    this.showForm = true;
    this.isEditMode = true;
    this.editingCreancierId = creancier.id;
    this.creancierForm.patchValue({
      codeCreancier: creancier.codeCreancier,
      codeCreance: creancier.codeCreance,
      nom: creancier.nom,
      prenom: creancier.prenom,
      email: creancier.email,
      telephone: creancier.telephone,
      adresse: creancier.adresse,
      ville: creancier.ville,
      codePostal: creancier.codePostal
    });
  }

  resetForm(): void {
    this.creancierForm.reset();
    this.isEditMode = false;
    this.editingCreancierId = null;
    this.showForm = false;
  }

  showCreateForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.editingCreancierId = null;
    this.creancierForm.reset();
  }

  hideForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingCreancierId = null;
    this.creancierForm.reset();
  }

  searchCreanciers(): void {
    if (this.searchTerm.trim()) {
      this.creancierApiService.searchCreanciers(this.searchTerm).subscribe({
        next: (creanciers) => {
          this.filteredCreanciers = creanciers;
        },
        error: (error) => {
          console.error('Erreur lors de la recherche:', error);
          // Fallback avec recherche locale
          this.filteredCreanciers = this.creanciers.filter(creancier =>
            creancier.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            creancier.prenom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            creancier.email.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        }
      });
    } else {
      this.filteredCreanciers = [...this.creanciers];
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredCreanciers = [...this.creanciers];
  }

  markFormGroupTouched(): void {
    Object.keys(this.creancierForm.controls).forEach(key => {
      const control = this.creancierForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters pour les contrôles du formulaire
  get codeCreancierControl() { return this.creancierForm.get('codeCreancier'); }
  get codeCreanceControl() { return this.creancierForm.get('codeCreance'); }
  get nomControl() { return this.creancierForm.get('nom'); }
  get prenomControl() { return this.creancierForm.get('prenom'); }
  get emailControl() { return this.creancierForm.get('email'); }
  get telephoneControl() { return this.creancierForm.get('telephone'); }
  get adresseControl() { return this.creancierForm.get('adresse'); }
}
