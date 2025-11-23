import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TacheUrgenteService, TacheUrgente } from '../../../core/services/tache-urgente.service';
import { AuthService } from '../../../core/services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-tache-urgente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tache-urgente.component.html',
  styleUrls: ['./tache-urgente.component.scss']
})
export class TacheUrgenteComponent implements OnInit, OnDestroy {
  taches: TacheUrgente[] = [];
  tachesFiltrees: TacheUrgente[] = [];
  searchTerm = '';
  selectedStatut = 'TOUS';
  selectedPriorite = 'TOUS';
  currentUser: any;
  showCreateTache = false;
  canAssignToAgent = false;
  availableAgents: any[] = [];
  newTache: Partial<TacheUrgente> & { agentId?: number; dateEcheanceDate?: string } = {
    titre: '',
    description: '',
    type: 'ENQUETE',
    priorite: 'MOYENNE',
    statut: 'EN_COURS',
    dateEcheanceDate: undefined
  };
  private subscription: Subscription = new Subscription();

  constructor(
    private tacheUrgenteService: TacheUrgenteService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadTaches();
    this.loadAvailableAgents();
    this.checkCanAssignToAgent();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadTaches(): void {
    if (this.currentUser?.role === 'AGENT_DOSSIER' && this.currentUser?.id) {
      this.tacheUrgenteService.getTachesAgent(parseInt(this.currentUser.id)).subscribe({
        next: (taches: TacheUrgente[]) => {
          this.taches = taches;
          this.applyFilters();
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des tâches:', error);
        }
      });
    } else {
      this.tacheUrgenteService.getAllTaches().subscribe({
        next: (taches: TacheUrgente[]) => {
          this.taches = taches;
          this.applyFilters();
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des tâches:', error);
        }
      });
    }
  }

  startPolling(): void {
    this.subscription = interval(30000).subscribe(() => {
      this.loadTaches();
    });
  }

  applyFilters(): void {
    let filtered = [...this.taches];

    // Filtre par recherche
    if (this.searchTerm) {
      filtered = filtered.filter(tache =>
        tache.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        tache.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (tache.agentNom && tache.agentNom.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (tache.agentAssigné && `${tache.agentAssigné.prenom} ${tache.agentAssigné.nom}`.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // Filtre par statut
    if (this.selectedStatut !== 'TOUS') {
      filtered = filtered.filter(tache => tache.statut === this.selectedStatut);
    }

    // Filtre par priorité
    if (this.selectedPriorite !== 'TOUS') {
      filtered = filtered.filter(tache => tache.priorite === this.selectedPriorite);
    }

    this.tachesFiltrees = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatutChange(): void {
    this.applyFilters();
  }

  onPrioriteChange(): void {
    this.applyFilters();
  }

  marquerTerminee(tache: TacheUrgente): void {
    this.tacheUrgenteService.marquerTerminee(tache.id).subscribe({
      next: (updatedTache: TacheUrgente) => {
        tache.statut = 'TERMINEE';
        tache.dateCompletion = updatedTache.dateCompletion || new Date().toISOString();
        this.applyFilters();
      },
      error: (error: any) => {
        console.error('Erreur lors du marquage comme terminée:', error);
      }
    });
  }

  getPrioriteClass(priorite: string): string {
    switch (priorite) {
      case 'URGENTE': return 'priorite-tres-urgente';
      case 'HAUTE': return 'priorite-elevee';
      case 'MOYENNE': return 'priorite-moyenne';
      case 'BASSE': return 'priorite-faible';
      default: return 'priorite-faible';
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_COURS': return 'statut-en-cours';
      case 'TERMINEE': return 'statut-terminee';
      case 'EN_RETARD': return 'statut-en-retard';
      default: return 'statut-en-cours';
    }
  }

  isEnRetard(tache: TacheUrgente): boolean {
    return new Date(tache.dateEcheance) < new Date() && tache.statut !== 'TERMINEE';
  }

  getDaysUntilEcheance(tache: TacheUrgente): number {
    const today = new Date();
    const echeance = new Date(tache.dateEcheance);
    const diffTime = echeance.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  loadAvailableAgents(): void {
    // Mock data for available agents
    this.availableAgents = [
      { id: 1, nom: 'Ben Salah', prenom: 'Leila' },
      { id: 2, nom: 'Mansouri', prenom: 'Omar' },
      { id: 3, nom: 'Hammami', prenom: 'Sonia' },
      { id: 4, nom: 'Ben Ammar', prenom: 'Ali' },
      { id: 5, nom: 'Khelil', prenom: 'Nadia' }
    ];
  }

  checkCanAssignToAgent(): void {
    // Only Chef Dossier can assign tasks to agents
    this.canAssignToAgent = this.currentUser?.role === 'CHEF_DEPARTEMENT_DOSSIER' || 
                           this.currentUser?.role === 'SUPER_ADMIN';
  }

  createTache(): void {
    if (this.newTache.titre && this.newTache.description && this.newTache.dateEcheanceDate) {
      const selectedAgent = this.availableAgents.find(a => a.id === this.newTache.agentId);
      // Convertir la date du format YYYY-MM-DD (input date) en ISO string
      const dateEcheanceStr = new Date(this.newTache.dateEcheanceDate + 'T00:00:00').toISOString();
      
      const tacheRequest = {
        titre: this.newTache.titre!,
        description: this.newTache.description!,
        type: this.newTache.type!,
        priorite: this.newTache.priorite!,
        dateEcheance: dateEcheanceStr,
        agentAssigné: this.newTache.agentId ? { id: this.newTache.agentId } : undefined,
        chefCreateur: this.currentUser?.id ? { id: parseInt(this.currentUser.id) } : undefined
      };

      this.tacheUrgenteService.createTache(tacheRequest).subscribe({
        next: (tache: TacheUrgente) => {
          this.taches.unshift(tache);
          this.applyFilters();
          this.showCreateTache = false;
          this.resetNewTache();
        },
        error: (error: any) => {
          console.error('Erreur lors de la création de la tâche:', error);
        }
      });
    }
  }

  cancelCreateTache(): void {
    this.showCreateTache = false;
    this.resetNewTache();
  }

  getAgentName(tache: TacheUrgente): string {
    if (tache.agentNom) {
      return tache.agentNom;
    }
    if (tache.agentAssigné) {
      return `${tache.agentAssigné.prenom} ${tache.agentAssigné.nom}`;
    }
    return 'N/A';
  }

  getDossierTitle(tache: TacheUrgente): string {
    if (tache.dossierTitre) {
      return tache.dossierTitre;
    }
    if (tache.dossier) {
      return `Dossier #${tache.dossier.numeroDossier}`;
    }
    return '';
  }

  private resetNewTache(): void {
    this.newTache = {
      titre: '',
      description: '',
      type: 'ENQUETE',
      priorite: 'MOYENNE',
      statut: 'EN_COURS',
      dateEcheanceDate: undefined,
      agentId: undefined
    };
  }
}
