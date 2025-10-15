import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { TacheUrgenteService } from '../core/services/tache-urgente.service';
import { NotificationService } from '../core/services/notification.service';
import { NotificationComponent } from '../shared/components/notification/notification.component';
import { TacheUrgenteComponent } from '../shared/components/tache-urgente/tache-urgente.component';

@Component({
  selector: 'app-chef-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationComponent, TacheUrgenteComponent],
  templateUrl: './chef-dossier.component.html',
  styleUrls: ['./chef-dossier.component.scss']
})
export class ChefDossierComponent implements OnInit {
  currentUser: any;
  statistiques: any = {};
  tachesUrgentes: any[] = [];
  notifications: any[] = [];
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
    private authService: AuthService,
    private tacheUrgenteService: TacheUrgenteService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadStatistiques();
    this.loadTachesUrgentes();
    this.loadNotifications();
    this.loadAgentPerformance();
  }

  loadStatistiques(): void {
    // Statistiques globales pour le chef
    this.statistiques = {
      totalDossiers: 156,
      dossiersEnCours: 45,
      dossiersValides: 89,
      dossiersRejetes: 22,
      agentsActifs: 8,
      tachesUrgentes: 12,
      notificationsNonLues: 5
    };
  }

  loadAgentPerformance(): void {
    this.agentPerformance = [
      { id: 1, nom: 'Ben Salah', prenom: 'Leila', role: 'Agent de Dossier', dossiersTraites: 35, dossiersClotures: 22, tauxReussite: 62.9, montantRecupere: 82000, performance: 'excellent' },
      { id: 2, nom: 'Mansouri', prenom: 'Omar', role: 'Agent de Dossier', dossiersTraites: 28, dossiersClotures: 17, tauxReussite: 60.7, montantRecupere: 61000, performance: 'bon' },
      { id: 3, nom: 'Hammami', prenom: 'Sonia', role: 'Agent de Dossier', dossiersTraites: 22, dossiersClotures: 12, tauxReussite: 54.5, montantRecupere: 38000, performance: 'moyen' },
      { id: 4, nom: 'Ben Ammar', prenom: 'Ali', role: 'Agent de Dossier', dossiersTraites: 18, dossiersClotures: 8, tauxReussite: 44.4, montantRecupere: 25000, performance: 'faible' }
    ];
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

  loadTachesUrgentes(): void {
    this.tacheUrgenteService.getAllTachesUrgentes().subscribe(
      taches => {
        this.tachesUrgentes = taches.slice(0, 5); // Afficher les 5 plus récentes
      }
    );
  }

  loadNotifications(): void {
    // Mock notifications pour le moment
    this.notifications = [];
  }

  getRoleDisplayName(role: string): string {
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
    return roleNames[role] || role;
  }
}
