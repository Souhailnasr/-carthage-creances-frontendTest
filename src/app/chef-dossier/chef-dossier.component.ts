import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { TacheUrgenteService } from '../core/services/tache-urgente.service';
import { NotificationService } from '../core/services/notification.service';
import { NotificationComponent } from '../shared/components/notification/notification.component';
import { TacheUrgenteComponent } from '../shared/components/tache-urgente/tache-urgente.component';
import { DossierApiService } from '../core/services/dossier-api.service';
import { DossierService } from '../core/services/dossier.service';
import { User } from '../shared/models';

@Component({
  selector: 'app-chef-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationComponent, TacheUrgenteComponent],
  templateUrl: './chef-dossier.component.html',
  styleUrls: ['./chef-dossier.component.scss']
})
export class ChefDossierComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();
  
  statistiques: any = {
    totalDossiers: 0,
    dossiersEnCours: 0,
    dossiersValides: 0,
    dossiersRejetes: 0,
    agentsActifs: 0,
    tachesUrgentes: 0,
    notificationsNonLues: 0
  };
  
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
    private notificationService: NotificationService,
    private dossierApiService: DossierApiService,
    private dossierService: DossierService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadStatistiques();
    this.loadTachesUrgentes();
    this.loadNotifications();
    this.loadAgentPerformance();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatistiques(): void {
    // Charger les vraies statistiques depuis l'API
    this.dossierApiService.stats('CHEF')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: any) => {
          console.log('✅ Statistiques chargées:', stats);
          this.statistiques = {
            totalDossiers: stats.totalDossiers || 0,
            dossiersEnCours: stats.dossiersEnCours || 0,
            dossiersValides: stats.dossiersValides || 0,
            dossiersRejetes: stats.dossiersRejetes || 0,
            agentsActifs: stats.agentsActifs || 0,
            tachesUrgentes: this.tachesUrgentes.length,
            notificationsNonLues: this.notifications.filter(n => !n.lu).length
          };
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du chargement des statistiques:', error);
          // En cas d'erreur, utiliser le service de dossier
          this.dossierService.refreshStats()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (stats: any) => {
                this.statistiques = {
                  totalDossiers: stats.totalDossiers || 0,
                  dossiersEnCours: stats.dossiersEnCours || 0,
                  dossiersValides: stats.dossiersValides || 0,
                  dossiersRejetes: stats.dossiersRejetes || 0,
                  agentsActifs: stats.agentsActifs || 0,
                  tachesUrgentes: this.tachesUrgentes.length,
                  notificationsNonLues: this.notifications.filter(n => !n.lu).length
                };
              },
              error: (err: any) => {
                console.error('❌ Erreur lors du chargement des statistiques (fallback):', err);
                // Garder les valeurs par défaut (0)
              }
            });
        }
      });
  }

  loadAgentPerformance(): void {
    // Pour l'instant, on garde une liste vide car il n'y a pas encore d'API pour les performances
    // TODO: Implémenter l'API pour récupérer les performances des agents
    this.agentPerformance = [];
    
    // Si une API existe plus tard, l'utiliser ici :
    // this.dossierApiService.getAgentPerformance()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (performance: any[]) => {
    //       this.agentPerformance = performance.map(p => ({
    //         id: p.agentId,
    //         nom: p.nom,
    //         prenom: p.prenom,
    //         role: p.role,
    //         dossiersTraites: p.dossiersTraites,
    //         dossiersClotures: p.dossiersClotures,
    //         tauxReussite: p.tauxReussite,
    //         montantRecupere: p.montantRecupere,
    //         performance: this.calculatePerformance(p.tauxReussite)
    //       }));
    //     },
    //     error: (error: any) => {
    //       console.error('❌ Erreur lors du chargement des performances:', error);
    //     }
    //   });
  }

  private calculatePerformance(tauxReussite: number): 'excellent' | 'bon' | 'moyen' | 'faible' {
    if (tauxReussite >= 80) return 'excellent';
    if (tauxReussite >= 60) return 'bon';
    if (tauxReussite >= 40) return 'moyen';
    return 'faible';
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
