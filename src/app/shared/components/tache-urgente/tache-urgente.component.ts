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
  newTache: Partial<TacheUrgente> = {
    titre: '',
    description: '',
    type: 'ENQUETE',
    priorite: 'MOYENNE',
    statut: 'EN_COURS',
    dateEcheance: new Date()
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
    if (this.currentUser?.role === 'AGENT_DOSSIER') {
      this.tacheUrgenteService.getTachesByAgent(parseInt(this.currentUser.id)).subscribe(
        taches => {
          this.taches = taches;
          this.applyFilters();
        }
      );
    } else {
      this.tacheUrgenteService.getAllTachesUrgentes().subscribe(
        taches => {
          this.taches = taches;
          this.applyFilters();
        }
      );
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
        tache.agentNom.toLowerCase().includes(this.searchTerm.toLowerCase())
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
    this.tacheUrgenteService.marquerTerminee(tache.id).subscribe(
      () => {
        tache.statut = 'TERMINEE';
        tache.dateCloture = new Date();
        this.applyFilters();
      }
    );
  }

  getPrioriteClass(priorite: string): string {
    switch (priorite) {
      case 'TRES_URGENTE': return 'priorite-tres-urgente';
      case 'ELEVEE': return 'priorite-elevee';
      case 'MOYENNE': return 'priorite-moyenne';
      case 'FAIBLE': return 'priorite-faible';
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
    if (this.newTache.titre && this.newTache.description) {
      const selectedAgent = this.availableAgents.find(a => a.id === this.newTache.agentId);
      const tache: TacheUrgente = {
        id: Date.now(),
        titre: this.newTache.titre!,
        description: this.newTache.description!,
        type: this.newTache.type!,
        priorite: this.newTache.priorite!,
        statut: 'EN_COURS',
        dateCreation: new Date(),
        dateEcheance: new Date(this.newTache.dateEcheance!),
        agentId: this.newTache.agentId || this.currentUser.id,
        agentNom: selectedAgent ? `${selectedAgent.prenom} ${selectedAgent.nom}` : this.currentUser.getFullName()
      };

      this.taches.unshift(tache);
      this.applyFilters();
      this.showCreateTache = false;
      this.resetNewTache();
    }
  }

  cancelCreateTache(): void {
    this.showCreateTache = false;
    this.resetNewTache();
  }

  private resetNewTache(): void {
    this.newTache = {
      titre: '',
      description: '',
      type: 'ENQUETE',
      priorite: 'MOYENNE',
      statut: 'EN_COURS',
      dateEcheance: new Date()
    };
  }
}
