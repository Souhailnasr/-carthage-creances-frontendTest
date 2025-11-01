import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChefAmiableService } from '../../services/chef-amiable.service';
import { User, Role } from '../../../shared/models';

@Component({
  selector: 'app-gestion-utilisateurs',
  templateUrl: './gestion-utilisateurs.component.html',
  styleUrls: ['./gestion-utilisateurs.component.scss']
})
export class GestionUtilisateursComponent implements OnInit {
  agents: User[] = [];
  filteredAgents: User[] = [];
  showAddForm: boolean = false;
  agentForm: FormGroup;
  isSubmitting: boolean = false;

  // Filtres et recherche
  searchTerm: string = '';
  searchType: string = 'Tout';
  selectedRole: string = 'Tous les rôles';
  selectedStatus: string = 'Tous les statuts';
  selectedDepartment: string = 'Tous les départements';

  // Options pour les filtres
  searchTypes = [
    { value: 'Tout', label: 'Tout' },
    { value: 'Nom', label: 'Nom' },
    { value: 'Email', label: 'Email' },
    { value: 'Rôle', label: 'Rôle' }
  ];

  roles = [
    { value: 'Tous les rôles', label: 'Tous les rôles' },
    { value: 'AGENT_RECOUVREMENT_AMIABLE', label: 'Agent Recouvrement Amiable' }
  ];

  statuses = [
    { value: 'Tous les statuts', label: 'Tous les statuts' },
    { value: 'Actif', label: 'Actif' },
    { value: 'Inactif', label: 'Inactif' }
  ];

  departments = [
    { value: 'Tous les départements', label: 'Tous les départements' },
    { value: 'Recouvrement Amiable', label: 'Recouvrement Amiable' }
  ];

  constructor(
    private chefAmiableService: ChefAmiableService,
    private fb: FormBuilder
  ) {
    this.agentForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmerMotDePasse: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.chefAmiableService.getAgentsAmiable().subscribe(agents => {
      this.agents = agents;
      this.applyFilters();
    });
  }

  // Validateur pour la confirmation du mot de passe
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('motDePasse');
    const confirmPassword = form.get('confirmerMotDePasse');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // Méthodes de recherche et filtrage
  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredAgents = this.agents.filter(agent => {
      // Filtre par terme de recherche
      const matchesSearch = this.searchTerm === '' || this.matchesSearchTerm(agent);
      
      // Filtre par rôle
      const matchesRole = this.selectedRole === 'Tous les rôles' || 
        agent.roleUtilisateur === this.selectedRole;
      
      // Filtre par statut
      const matchesStatus = this.selectedStatus === 'Tous les statuts' || 
        (this.selectedStatus === 'Actif' && agent.actif) ||
        (this.selectedStatus === 'Inactif' && !agent.actif);
      
      // Filtre par département
      const matchesDepartment = this.selectedDepartment === 'Tous les départements' || 
        this.selectedDepartment === 'Recouvrement Amiable';
      
      return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
    });
  }

  private matchesSearchTerm(agent: User): boolean {
    const term = this.searchTerm.toLowerCase();
    
    switch (this.searchType) {
      case 'Nom':
        return agent.nom.toLowerCase().includes(term) || 
               agent.prenom.toLowerCase().includes(term);
      case 'Email':
        return agent.email.toLowerCase().includes(term);
      case 'Rôle':
        return agent.roleUtilisateur.toLowerCase().includes(term);
      default: // 'Tout'
        return agent.nom.toLowerCase().includes(term) ||
               agent.prenom.toLowerCase().includes(term) ||
               agent.email.toLowerCase().includes(term) ||
               agent.roleUtilisateur.toLowerCase().includes(term);
    }
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.searchType = 'Tout';
    this.selectedRole = 'Tous les rôles';
    this.selectedStatus = 'Tous les statuts';
    this.selectedDepartment = 'Tous les départements';
    this.applyFilters();
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.agentForm.reset();
    }
  }

  onSubmit(): void {
    if (this.agentForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const agentData = {
        nom: this.agentForm.value.nom,
        prenom: this.agentForm.value.prenom,
        email: this.agentForm.value.email,
        motDePasse: this.agentForm.value.motDePasse
      };

      this.chefAmiableService.creerAgent(agentData).subscribe({
        next: (nouvelAgent) => {
          this.agents.push(nouvelAgent);
          this.applyFilters();
          this.agentForm.reset();
          this.showAddForm = false;
          this.isSubmitting = false;
          alert('Agent créé avec succès !');
        },
        error: (error) => {
          console.error('Erreur lors de la création de l\'agent:', error);
          this.isSubmitting = false;
          alert('Erreur lors de la création de l\'agent');
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.agentForm.controls).forEach(key => {
      const control = this.agentForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.agentForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName} est requis`;
      }
      if (control.errors['email']) {
        return 'Format d\'email invalide';
      }
      if (control.errors['minlength']) {
        return `${fieldName} doit contenir au moins ${control.errors['minlength'].requiredLength} caractères`;
      }
      if (control.errors['passwordMismatch']) {
        return 'Les mots de passe ne correspondent pas';
      }
    }
    return '';
  }

  getStatusClass(actif: boolean): string {
    return actif ? 'status-active' : 'status-inactive';
  }

  getStatusText(actif: boolean): string {
    return actif ? 'Actif' : 'Inactif';
  }

  getAgentsActifs(): number {
    return this.agents.filter(a => a.actif).length;
  }

  getAgentsInactifs(): number {
    return this.agents.filter(a => !a.actif).length;
  }
}
