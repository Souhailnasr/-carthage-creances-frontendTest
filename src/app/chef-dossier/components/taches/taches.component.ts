import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TacheUrgenteService, TacheUrgente } from '../../../core/services/tache-urgente.service';
import { NotificationService, TypeNotification } from '../../../core/services/notification.service';
import { interval, Subscription } from 'rxjs';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';

@Component({
  selector: 'app-taches',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NotificationComponent],
  templateUrl: './taches.component.html',
  styleUrls: ['./taches.component.scss']
})
export class TachesComponent implements OnInit, OnDestroy {
  taches: TacheUrgente[] = [];
  tachesFiltrees: TacheUrgente[] = [];
  searchTerm = '';
  selectedStatut = 'TOUS';
  selectedPriorite = 'TOUS';
  currentUser: any;
  showCreateTache = false;
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

  // Performance par agent (KPIs)
  agentPerformance: Array<{
    id: number;
    nom: string;
    prenom: string;
    role: string;
    dossiersTraites: number;
    dossiersClotures: number;
    tauxReussite: number;
    montantRecupere: number;
    performance: 'excellent' | 'bon' | 'moyen' | 'faible';
  }> = [];

  constructor(
    private tacheUrgenteService: TacheUrgenteService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadTaches();
    this.loadAvailableAgents();
    this.startPolling();
    this.loadAgentPerformance();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadAgentPerformance(): void {
    const allAgentPerformance: Array<{
      id: number;
      nom: string;
      prenom: string;
      role: string;
      dossiersTraites: number;
      dossiersClotures: number;
      tauxReussite: number;
      montantRecupere: number;
      performance: 'excellent' | 'bon' | 'moyen' | 'faible';
    }> = [
      { id: 1, nom: 'Ben Salah', prenom: 'Leila', role: 'Agent de Dossier', dossiersTraites: 35, dossiersClotures: 22, tauxReussite: 62.9, montantRecupere: 82000, performance: 'excellent' },
      { id: 2, nom: 'Mansouri', prenom: 'Omar', role: 'Agent de Dossier', dossiersTraites: 28, dossiersClotures: 17, tauxReussite: 60.7, montantRecupere: 61000, performance: 'bon' },
      { id: 3, nom: 'Hammami', prenom: 'Sonia', role: 'Agent de Dossier', dossiersTraites: 22, dossiersClotures: 12, tauxReussite: 54.5, montantRecupere: 38000, performance: 'moyen' },
      { id: 4, nom: 'Ben Ammar', prenom: 'Ali', role: 'Agent de Dossier', dossiersTraites: 18, dossiersClotures: 8, tauxReussite: 44.4, montantRecupere: 25000, performance: 'faible' }
    ];
    this.agentPerformance = allAgentPerformance;
  }

  getPerformanceClass(perf: 'excellent' | 'bon' | 'moyen' | 'faible'): string {
    switch (perf) {
      case 'excellent': return 'perf-excellent';
      case 'bon': return 'perf-bon';
      case 'moyen': return 'perf-moyen';
      case 'faible': return 'perf-faible';
      default: return '';
    }
  }

  loadTaches(): void {
    // Pour le Chef Dossier, charger toutes les tâches
    this.tacheUrgenteService.getTachesByAgent(parseInt(this.currentUser.id)).subscribe(
      taches => {
        this.taches = taches;
        this.applyFilters();
      }
    );
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

  startPolling(): void {
    this.subscription = interval(30000).subscribe(() => this.loadTaches());
  }

  applyFilters(): void {
    let filtered = this.taches;

    if (this.searchTerm) {
      filtered = filtered.filter(tache =>
        tache.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        tache.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        tache.agentNom.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.selectedStatut !== 'TOUS') {
      filtered = filtered.filter(tache => tache.statut === this.selectedStatut);
    }

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

  createTache(): void {
    if (this.newTache.titre && this.newTache.description && this.newTache.agentId) {
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
        agentId: this.newTache.agentId,
        agentNom: `${selectedAgent.prenom} ${selectedAgent.nom}`
      };

      this.taches.unshift(tache);
      this.applyFilters();
      this.showCreateTache = false;
      this.resetNewTache();

      // Créer une notification pour l'agent assigné
      this.createNotificationForAgent(selectedAgent, tache);
    }
  }

  private createNotificationForAgent(agent: any, tache: TacheUrgente): void {
    const notification = {
      destinataireId: agent.id,
      type: TypeNotification.TACHE_URGENTE,
      titre: 'Nouvelle tâche assignée',
      message: `Une nouvelle tâche "${tache.titre}" vous a été assignée par ${this.currentUser.getFullName()}`
    };

    this.notificationService.createNotification(notification).subscribe();
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

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_COURS': return 'statut-en-cours';
      case 'TERMINEE': return 'statut-terminee';
      case 'EN_ATTENTE': return 'statut-en-attente';
      case 'ANNULEE': return 'statut-annulee';
      default: return '';
    }
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

  getPrioriteLabel(priorite: string): string {
    switch (priorite) {
      case 'TRES_URGENTE': return 'Très Urgente';
      case 'ELEVEE': return 'Élevée';
      case 'MOYENNE': return 'Moyenne';
      case 'FAIBLE': return 'Faible';
      default: return '';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'ENQUETE': return 'fas fa-search';
      case 'RELANCE': return 'fas fa-phone-alt';
      case 'DOSSIER': return 'fas fa-folder';
      case 'AUDIENCE': return 'fas fa-gavel';
      case 'ACTION': return 'fas fa-fist-raised';
      default: return 'fas fa-tasks';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'ENQUETE': return 'Enquête';
      case 'RELANCE': return 'Relance';
      case 'DOSSIER': return 'Dossier';
      case 'AUDIENCE': return 'Audience';
      case 'ACTION': return 'Action';
      default: return 'Tâche';
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

  getTachesFiltrees(statut: string): TacheUrgente[] {
    return this.taches.filter(tache => tache.statut === statut);
  }

  getTachesEnRetard(): TacheUrgente[] {
    return this.taches.filter(tache => this.isEnRetard(tache));
  }
}
