import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChefAmiableService } from '../../../chef-amiable/services/chef-amiable.service';
import { Tache, User, StatutTache } from '../../../shared/models';

@Component({
  selector: 'app-taches-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './taches-dossier.component.html',
  styleUrls: ['./taches-dossier.component.scss']
})
export class TachesDossierComponent implements OnInit {
  taches: Tache[] = [];
  agents: User[] = [];
  showAddForm: boolean = false;
  tacheForm: FormGroup;
  isSubmitting: boolean = false;

  // Options pour les priorités
  priorites = [
    { value: 'FAIBLE', label: 'Faible' },
    { value: 'MOYENNE', label: 'Moyenne' },
    { value: 'ELEVEE', label: 'Élevée' },
    { value: 'TRES_URGENTE', label: 'Très Urgente' }
  ];

  // Options pour les statuts
  statuts = [
    { value: StatutTache.EN_ATTENTE, label: 'En Attente' },
    { value: StatutTache.EN_COURS, label: 'En Cours' },
    { value: StatutTache.TERMINEE, label: 'Terminée' },
    { value: StatutTache.ANNULEE, label: 'Annulée' }
  ];

  constructor(
    @Inject(ChefAmiableService) private chefAmiableService: ChefAmiableService,
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
    this.chefAmiableService.getTaches().subscribe(
      (taches: Tache[]) => {
        this.taches = taches;
      }
    );
  }

  loadAgents(): void {
    // Mock data for agents since getAgents doesn't exist
    this.agents = [
      { id: '1', nom: 'Ben Salah', prenom: 'Leila', email: 'leila@example.com', role: 'AGENT_DOSSIER', actif: true, getFullName: () => 'Leila Ben Salah' } as User,
      { id: '2', nom: 'Mansouri', prenom: 'Omar', email: 'omar@example.com', role: 'AGENT_DOSSIER', actif: true, getFullName: () => 'Omar Mansouri' } as User,
      { id: '3', nom: 'Hammami', prenom: 'Sonia', email: 'sonia@example.com', role: 'AGENT_DOSSIER', actif: true, getFullName: () => 'Sonia Hammami' } as User,
      { id: '4', nom: 'Ben Ammar', prenom: 'Ali', email: 'ali@example.com', role: 'AGENT_DOSSIER', actif: true, getFullName: () => 'Ali Ben Ammar' } as User,
      { id: '5', nom: 'Khelil', prenom: 'Nadia', email: 'nadia@example.com', role: 'AGENT_DOSSIER', actif: true, getFullName: () => 'Nadia Khelil' } as User
    ];
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.tacheForm.reset();
    }
  }

  onSubmit(): void {
    if (this.tacheForm.valid) {
      this.isSubmitting = true;
      const tacheData = this.tacheForm.value;
      
      this.chefAmiableService.creerTache(tacheData).subscribe(
        (newTache: Tache) => {
          this.taches.unshift(newTache);
          this.showAddForm = false;
          this.tacheForm.reset();
          this.isSubmitting = false;
        },
        (error: any) => {
          console.error('Erreur lors de la création de la tâche:', error);
          this.isSubmitting = false;
        }
      );
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.tacheForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return 'Ce champ est requis';
      }
      if (field.errors?.['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
    }
    return null;
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_COURS': return 'statut-en-cours';
      case 'TERMINEE': return 'statut-terminee';
      case 'EN_ATTENTE': return 'statut-en-attente';
      case 'ANNULEE': return 'statut-annulee';
      default: return '';
    }
  }

  getStatutText(statut: string): string {
    const statutObj = this.statuts.find(s => s.value === statut);
    return statutObj ? statutObj.label : statut;
  }

  getPrioriteClass(priorite: string): string {
    switch (priorite) {
      case 'TRES_URGENTE': return 'priorite-tres-urgente';
      case 'ELEVEE': return 'priorite-elevee';
      case 'MOYENNE': return 'priorite-moyenne';
      case 'FAIBLE': return 'priorite-faible';
      default: return '';
    }
  }

  getPrioriteText(priorite: string): string {
    const prioriteObj = this.priorites.find(p => p.value === priorite);
    return prioriteObj ? prioriteObj.label : priorite;
  }

  getAgentName(agentId: string | number): string {
    const agent = this.agents.find(a => a.id === String(agentId));
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
