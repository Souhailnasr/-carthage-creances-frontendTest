import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StatistiqueCompleteService } from '../../../../core/services/statistique-complete.service';
import { DossierApiService } from '../../../../core/services/dossier-api.service';
import { SupervisionService } from '../../../../core/services/supervision.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { DossierApi, Urgence } from '../../../../shared/models/dossier-api.model';
import { StatistiquesGlobales } from '../../../../shared/models/statistique-complete.model';

@Component({
  selector: 'app-supervision-dossiers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule,
    StatCardComponent
  ],
  templateUrl: './supervision-dossiers.component.html',
  styleUrls: ['./supervision-dossiers.component.scss']
})
export class SupervisionDossiersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Statistiques globales (comme SuperAdmin Dashboard)
  statsGlobales: StatistiquesGlobales | null = null;
  dossiersCritiques: DossierApi[] = [];
  dossiersEnRetard: DossierApi[] = [];
  
  // États de chargement
  loadingStats = false;
  loadingCritiques = false;
  loadingRetard = false;
  
  // Filtres
  selectedPhase: string = 'all';
  selectedStatut: string = 'all';

  constructor(
    private statistiqueService: StatistiqueCompleteService,
    private dossierService: DossierApiService,
    private supervisionService: SupervisionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData(): void {
    this.loadingStats = true;
    this.loadingCritiques = true;
    this.loadingRetard = true;

    // ✅ STANDARDISATION : Utiliser getStatistiquesGlobales() comme SuperAdmin Dashboard
    forkJoin({
      globales: this.statistiqueService.getStatistiquesGlobales().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('❌ Erreur lors du chargement des statistiques globales:', error);
          this.snackBar.open('Erreur lors du chargement des statistiques', 'Fermer', { duration: 3000 });
          return of(null);
        })
      ),
      allDossiers: this.dossierService.getAllDossiers(0, 100).pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des dossiers:', error);
          return of({ content: [], totalElements: 0, totalPages: 0 });
        })
      )
    }).subscribe({
      next: (results) => {
        // ✅ Utiliser les statistiques globales comme source principale
        this.statsGlobales = results.globales;
        
        if (results.globales) {
          console.log('✅ Statistiques globales chargées:', results.globales);
        } else {
          console.warn('⚠️ Aucune statistique globale disponible');
        }
        
        // Filtrer les dossiers côté client
        const allDossiers = results.allDossiers.content || [];
        
        // Dossiers critiques : ENCOURSDETRAITEMENT avec score IA élevé ou urgence élevée
        this.dossiersCritiques = allDossiers
          .filter((d: DossierApi) => {
            const isActive = d.dossierStatus === 'ENCOURSDETRAITEMENT' && !d.dateCloture;
            const hasHighRisk = d.riskScore && d.riskScore > 70;
            const urgenceValue = String(d.urgence || '').toUpperCase();
            const isVeryUrgent = urgenceValue === String(Urgence.TRES_URGENT).toUpperCase();
            return isActive && (hasHighRisk || isVeryUrgent);
          })
          .slice(0, 10);
        
        // Dossiers nécessitant attention : ENCOURSDETRAITEMENT non clôturés
        this.dossiersEnRetard = allDossiers
          .filter((d: DossierApi) => 
            d.dossierStatus === 'ENCOURSDETRAITEMENT' && 
            !d.dateCloture
          )
          .slice(0, 10);
        
        this.loadingStats = false;
        this.loadingCritiques = false;
        this.loadingRetard = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des données:', error);
        this.snackBar.open('Erreur lors du chargement des données', 'Fermer', { duration: 3000 });
        this.loadingStats = false;
        this.loadingCritiques = false;
        this.loadingRetard = false;
      }
    });
  }

  formatAmount(amount: number): string {
    if (!amount) return '0,00 TND';
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(amount);
  }

  getStatutClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'EN_COURS': 'statut-en-cours',
      'CLOTURE': 'statut-cloture',
      'EN_ATTENTE_VALIDATION': 'statut-attente',
      'VALIDE': 'statut-valide',
      'REJETE': 'statut-rejete'
    };
    return classes[statut] || 'statut-default';
  }
}

