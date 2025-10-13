import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChefAmiableService } from '../../services/chef-amiable.service';
import { Tache, User, StatutTache } from '../../../shared/models';

@Component({
  selector: 'app-taches',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './taches.component.html',
  styleUrls: ['./taches.component.scss']
})
export class TachesComponent implements OnInit {
  taches: Tache[] = [];
  agents: User[] = [];
  showAddForm: boolean = false;
  tacheForm: FormGroup;
  isSubmitting: boolean = false;

  // Options pour les priorités
  priorites = [
    { value: 'FAIBLE', label: 'Faible' },
    { value: 'MOYENNE', label: 'Moyenne' },
    { value: 'ELEVEE', label: 'Élevée' }
  ];

  // Options pour les statuts
  statuts = [
    { value: StatutTache.EN_ATTENTE, label: 'En Attente' },
    { value: StatutTache.EN_COURS, label: 'En Cours' },
    { value: StatutTache.TERMINEE, label: 'Terminée' },
    { value: StatutTache.ANNULEE, label: 'Annulée' }
  ];

  constructor(
    private chefAmiableService: ChefAmiableService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.tacheForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      agentId: ['', [Validators.required]],
      priorite: ['MOYENNE', [Validators.required]],
      dateEcheance: ['', [Validators.required]],
      dossierId: ['']
    });
  }

  ngOnInit(): void {
    this.loadTaches();
    this.loadAgents();
  }

  loadTaches(): void {
    this.chefAmiableService.getTaches().subscribe(taches => {
      this.taches = taches;
    });
  }

  loadAgents(): void {
    this.chefAmiableService.getAgentsAmiable().subscribe(agents => {
      this.agents = agents;
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.tacheForm.reset();
      this.tacheForm.patchValue({ priorite: 'MOYENNE' });
    }
  }

  onSubmit(): void {
    if (this.tacheForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const tacheData = {
        titre: this.tacheForm.value.titre,
        description: this.tacheForm.value.description,
        agentId: this.tacheForm.value.agentId,
        priorite: this.tacheForm.value.priorite,
        dateEcheance: this.tacheForm.value.dateEcheance ? new Date(this.tacheForm.value.dateEcheance) : undefined,
        dossierId: this.tacheForm.value.dossierId || undefined
      };

      this.chefAmiableService.creerTache(tacheData).subscribe({
        next: (nouvelleTache) => {
          this.taches.push(nouvelleTache);
          this.tacheForm.reset();
          this.tacheForm.patchValue({ priorite: 'MOYENNE' });
          this.showAddForm = false;
          this.isSubmitting = false;
          alert('Tâche créée avec succès !');
        },
        error: (error) => {
          console.error('Erreur lors de la création de la tâche:', error);
          this.isSubmitting = false;
          alert('Erreur lors de la création de la tâche');
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.tacheForm.controls).forEach(key => {
      const control = this.tacheForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.tacheForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName} est requis`;
      }
      if (control.errors['minlength']) {
        return `${fieldName} doit contenir au moins ${control.errors['minlength'].requiredLength} caractères`;
      }
    }
    return '';
  }

  getStatutClass(statut: StatutTache): string {
    switch (statut) {
      case StatutTache.EN_ATTENTE:
        return 'statut-attente';
      case StatutTache.EN_COURS:
        return 'statut-cours';
      case StatutTache.TERMINEE:
        return 'statut-terminee';
      case StatutTache.ANNULEE:
        return 'statut-annulee';
      default:
        return '';
    }
  }

  getStatutText(statut: StatutTache): string {
    const statutOption = this.statuts.find(s => s.value === statut);
    return statutOption ? statutOption.label : statut;
  }

  getPrioriteClass(priorite: string): string {
    switch (priorite) {
      case 'FAIBLE':
        return 'priorite-faible';
      case 'MOYENNE':
        return 'priorite-moyenne';
      case 'ELEVEE':
        return 'priorite-elevee';
      default:
        return '';
    }
  }

  getPrioriteText(priorite: string): string {
    const prioriteOption = this.priorites.find(p => p.value === priorite);
    return prioriteOption ? prioriteOption.label : priorite;
  }

  getAgentName(agentId: string): string {
    const agent = this.agents.find(a => a.id === agentId);
    return agent ? agent.getFullName() : 'Agent inconnu';
  }

  getTachesFiltrees(statut?: string): Tache[] {
    if (statut) {
      return this.taches.filter(t => t.statut === statut);
    }
    return this.taches;
  }

  getTachesEnRetard(): Tache[] {
    return this.taches.filter(t => t.isEnRetard());
  }

  // Méthode pour détecter si on est dans le contexte Chef Juridique
  isJuridiqueContext(): boolean {
    return this.router.url.includes('/juridique/');
  }
}
