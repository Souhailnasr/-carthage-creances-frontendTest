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
  
  // Types de créancier
  creancierTypes = [
    { value: 'PERSONNE_PHYSIQUE', label: 'Personne Physique' },
    { value: 'PERSONNE_MORALE', label: 'Personne Morale' }
  ];

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
    
    // Écouter les changements de type de créancier
    this.creancierForm.get('typeCreancier')?.valueChanges.subscribe(type => {
      this.onTypeChange(type);
    });
  }

  authenticateAndLoadCreanciers(): void {
    // Vérifier si on a déjà un token
    if (this.jwtAuthService.isUserLoggedIn()) {
      console.log('✅ Token JWT déjà disponible, chargement des créanciers');
      this.loadCreanciers();
    } else {
      console.warn('⚠️ Aucun token JWT disponible. Redirection vers la page de connexion recommandée.');
      // Au lieu de tenter une connexion automatique, charger directement les données
      // Si l'utilisateur n'est pas authentifié, les données ne s'afficheront pas
          this.loadCreanciers();
    }
  }

  initializeForm(): FormGroup {
    return this.fb.group({
      typeCreancier: ['PERSONNE_PHYSIQUE', [Validators.required]],
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
      typeCreancier: creancierData.typeCreancier,
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
      typeCreancier: creancierData.typeCreancier,
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
      typeCreancier: creancier.typeCreancier || 'PERSONNE_PHYSIQUE',
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
            (creancier.prenom && creancier.prenom.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
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

  onTypeChange(type: string): void {
    const prenomControl = this.creancierForm.get('prenom');
    
    if (type === 'PERSONNE_MORALE') {
      // Pour personne morale, supprimer la validation du prénom et vider le champ
      prenomControl?.clearValidators();
      prenomControl?.setValue('');
    } else {
      // Pour personne physique, remettre la validation du prénom
      prenomControl?.setValidators([Validators.required, Validators.minLength(2)]);
    }
    
    prenomControl?.updateValueAndValidity();
  }

  isPersonnePhysique(): boolean {
    return this.creancierForm.get('typeCreancier')?.value === 'PERSONNE_PHYSIQUE';
  }

  isPersonneMorale(): boolean {
    return this.creancierForm.get('typeCreancier')?.value === 'PERSONNE_MORALE';
  }

  // Getters pour les contrôles du formulaire
  get typeCreancierControl() { return this.creancierForm.get('typeCreancier'); }
  get codeCreancierControl() { return this.creancierForm.get('codeCreancier'); }
  get codeCreanceControl() { return this.creancierForm.get('codeCreance'); }
  get nomControl() { return this.creancierForm.get('nom'); }
  get prenomControl() { return this.creancierForm.get('prenom'); }
  get emailControl() { return this.creancierForm.get('email'); }
  get telephoneControl() { return this.creancierForm.get('telephone'); }
  get adresseControl() { return this.creancierForm.get('adresse'); }
}
