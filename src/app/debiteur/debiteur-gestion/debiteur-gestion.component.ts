import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DebiteurApiService } from '../../core/services/debiteur-api.service';
import { DebiteurApi, DebiteurRequest } from '../../shared/models/debiteur-api.model';
import { AuthService } from '../../core/services/auth.service';
import { JwtAuthService } from '../../core/services/jwt-auth.service';
import { Role } from '../../shared/models/enums.model';

@Component({
  selector: 'app-debiteur-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './debiteur-gestion.component.html',
  styleUrls: ['./debiteur-gestion.component.scss']
})
export class DebiteurGestionComponent implements OnInit {
  debiteurs: DebiteurApi[] = [];
  filteredDebiteurs: DebiteurApi[] = [];
  debiteurForm: FormGroup;
  isEditMode = false;
  editingDebiteurId: number | null = null;
  searchTerm = '';
  currentUser: any;
  showForm = false; // Nouvelle variable pour contrôler l'affichage du formulaire
  
  // Types de débiteur
  debiteurTypes = [
    { value: 'PERSONNE_PHYSIQUE', label: 'Personne Physique' },
    { value: 'PERSONNE_MORALE', label: 'Personne Morale' }
  ];

  constructor(
    private debiteurApiService: DebiteurApiService,
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService
  ) {
    this.debiteurForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.authenticateAndLoadDebiteurs();
    
    // Écouter les changements de type de débiteur
    this.debiteurForm.get('typeDebiteur')?.valueChanges.subscribe(type => {
      this.onTypeChange(type);
    });
  }

  authenticateAndLoadDebiteurs(): void {
    // Vérifier si on a déjà un token
    if (this.jwtAuthService.isAuthenticated()) {
      console.log('Token JWT déjà disponible');
      this.loadDebiteurs();
    } else {
      // Essayer de se connecter automatiquement
      console.log('Tentative de connexion automatique...');
      this.jwtAuthService.loginDev().subscribe({
        next: (response) => {
          console.log('Connexion réussie:', response);
          this.loadDebiteurs();
        },
        error: (error) => {
          console.error('Échec de la connexion automatique:', error);
          console.log('Utilisation du mode développement avec données mock');
          this.loadDebiteurs();
        }
      });
    }
  }

  initializeForm(): FormGroup {
    return this.fb.group({
      typeDebiteur: ['PERSONNE_PHYSIQUE', [Validators.required]],
      codeCreance: [''],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      fax: [''],
      adresse: ['', [Validators.required, Validators.minLength(5)]],
      adresseElue: [''],
      ville: [''],
      codePostal: ['']
    });
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  loadDebiteurs(): void {
    this.debiteurApiService.getAllDebiteurs().subscribe({
      next: (debiteurs) => {
        console.log('Débiteurs chargés depuis l\'API:', debiteurs);
        this.debiteurs = debiteurs;
        this.filteredDebiteurs = debiteurs;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des débiteurs:', error);
        // Afficher un message d'erreur à l'utilisateur
        alert('Erreur lors du chargement des débiteurs. Vérifiez la connexion au backend.');
        this.debiteurs = [];
        this.filteredDebiteurs = [];
      }
    });
  }


  onSubmit(): void {
    if (this.debiteurForm.valid) {
      const formValue = this.debiteurForm.value;
      
      if (this.isEditMode && this.editingDebiteurId) {
        this.updateDebiteur(this.editingDebiteurId, formValue);
      } else {
        this.createDebiteur(formValue);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  createDebiteur(debiteurData: any): void {
    const debiteurRequest: DebiteurRequest = {
      typeDebiteur: debiteurData.typeDebiteur,
      codeCreance: debiteurData.codeCreance,
      nom: debiteurData.nom,
      prenom: debiteurData.prenom,
      email: debiteurData.email,
      telephone: debiteurData.telephone,
      fax: debiteurData.fax,
      adresse: debiteurData.adresse,
      adresseElue: debiteurData.adresseElue,
      ville: debiteurData.ville,
      codePostal: debiteurData.codePostal
    };

    this.debiteurApiService.createDebiteur(debiteurRequest).subscribe({
      next: (newDebiteur) => {
        console.log('Débiteur créé avec succès:', newDebiteur);
        this.hideForm();
        alert('Débiteur créé avec succès !');
        // Recharger la liste depuis le backend pour s'assurer d'avoir les données à jour
        this.loadDebiteurs();
      },
      error: (error) => {
        console.error('Erreur lors de la création du débiteur:', error);
        // Ne pas ajouter localement: afficher l'erreur pour corriger l'appel API
        alert('Echec de création du débiteur (voir console pour détails)');
      }
    });
  }

  updateDebiteur(id: number, debiteurData: any): void {
    const debiteurRequest: DebiteurRequest = {
      typeDebiteur: debiteurData.typeDebiteur,
      codeCreance: debiteurData.codeCreance,
      nom: debiteurData.nom,
      prenom: debiteurData.prenom,
      email: debiteurData.email,
      telephone: debiteurData.telephone,
      fax: debiteurData.fax,
      adresse: debiteurData.adresse,
      adresseElue: debiteurData.adresseElue,
      ville: debiteurData.ville,
      codePostal: debiteurData.codePostal
    };

    this.debiteurApiService.updateDebiteur(id, debiteurRequest).subscribe({
      next: (updatedDebiteur) => {
        const index = this.debiteurs.findIndex(d => d.id === id);
        if (index !== -1) {
          this.debiteurs[index] = updatedDebiteur;
          this.filteredDebiteurs = [...this.debiteurs];
        }
        this.hideForm();
        console.log('Débiteur mis à jour avec succès:', updatedDebiteur);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du débiteur:', error);
        // En cas d'erreur, mettre à jour localement pour le développement
        const index = this.debiteurs.findIndex(d => d.id === id);
        if (index !== -1) {
          this.debiteurs[index] = { ...this.debiteurs[index], ...debiteurData };
          this.filteredDebiteurs = [...this.debiteurs];
        }
        this.hideForm();
      }
    });
  }

  deleteDebiteur(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce débiteur ?')) {
      this.debiteurApiService.deleteDebiteur(id).subscribe({
        next: () => {
          this.debiteurs = this.debiteurs.filter(d => d.id !== id);
          this.filteredDebiteurs = [...this.debiteurs];
          console.log('Débiteur supprimé avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du débiteur:', error);
          // En cas d'erreur, supprimer localement pour le développement
          this.debiteurs = this.debiteurs.filter(d => d.id !== id);
          this.filteredDebiteurs = [...this.debiteurs];
        }
      });
    }
  }

  editDebiteur(debiteur: DebiteurApi): void {
    this.showForm = true;
    this.isEditMode = true;
    this.editingDebiteurId = debiteur.id;
    this.debiteurForm.patchValue({
      typeDebiteur: debiteur.typeDebiteur || 'PERSONNE_PHYSIQUE',
      codeCreance: debiteur.codeCreance,
      nom: debiteur.nom,
      prenom: debiteur.prenom,
      email: debiteur.email,
      telephone: debiteur.telephone,
      fax: debiteur.fax,
      adresse: debiteur.adresse,
      adresseElue: debiteur.adresseElue,
      ville: debiteur.ville,
      codePostal: debiteur.codePostal
    });
  }

  resetForm(): void {
    this.debiteurForm.reset();
    this.isEditMode = false;
    this.editingDebiteurId = null;
    this.showForm = false;
  }

  showCreateForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.editingDebiteurId = null;
    this.debiteurForm.reset();
  }

  hideForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingDebiteurId = null;
    this.debiteurForm.reset();
  }

  searchDebiteurs(): void {
    if (this.searchTerm.trim()) {
      this.debiteurApiService.searchDebiteurs(this.searchTerm).subscribe({
        next: (debiteurs) => {
          this.filteredDebiteurs = debiteurs;
        },
        error: (error) => {
          console.error('Erreur lors de la recherche:', error);
          // Fallback avec recherche locale
          this.filteredDebiteurs = this.debiteurs.filter(debiteur =>
            debiteur.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            (debiteur.prenom && debiteur.prenom.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
            debiteur.email.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        }
      });
    } else {
      this.filteredDebiteurs = [...this.debiteurs];
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredDebiteurs = [...this.debiteurs];
  }

  markFormGroupTouched(): void {
    Object.keys(this.debiteurForm.controls).forEach(key => {
      const control = this.debiteurForm.get(key);
      control?.markAsTouched();
    });
  }

  onTypeChange(type: string): void {
    const prenomControl = this.debiteurForm.get('prenom');
    
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
    return this.debiteurForm.get('typeDebiteur')?.value === 'PERSONNE_PHYSIQUE';
  }

  isPersonneMorale(): boolean {
    return this.debiteurForm.get('typeDebiteur')?.value === 'PERSONNE_MORALE';
  }

  // Getters pour les contrôles du formulaire
  get typeDebiteurControl() { return this.debiteurForm.get('typeDebiteur'); }
  get nomControl() { return this.debiteurForm.get('nom'); }
  get prenomControl() { return this.debiteurForm.get('prenom'); }
  get emailControl() { return this.debiteurForm.get('email'); }
  get telephoneControl() { return this.debiteurForm.get('telephone'); }
  get faxControl() { return this.debiteurForm.get('fax'); }
  get adresseControl() { return this.debiteurForm.get('adresse'); }
}
