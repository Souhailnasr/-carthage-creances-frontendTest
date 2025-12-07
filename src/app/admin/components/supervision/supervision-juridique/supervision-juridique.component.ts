import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StatistiqueCompleteService } from '../../../../core/services/statistique-complete.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-supervision-juridique',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StatCardComponent
  ],
  templateUrl: './supervision-juridique.component.html',
  styleUrls: ['./supervision-juridique.component.scss']
})
export class SupervisionJuridiqueComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  statsAudiences: any = null;
  statsDocuments: any = null;
  statsActions: any = null;
  statsRecouvrement: any = null; // ✅ NOUVEAU : Statistiques de recouvrement par phase
  
  loading = false;

  constructor(
    private statistiqueService: StatistiqueCompleteService
  ) {}

  // ✅ NOUVEAU : Méthode pour formater les montants
  formatAmount(amount: number | null | undefined): string {
    const value = amount !== null && amount !== undefined ? amount : 0;
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(value);
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;

    // ✅ NOUVEAU : Utiliser getStatistiquesAudiences() + getStatistiquesGlobales() + getStatistiquesRecouvrementParPhase()
    forkJoin({
      audiences: this.statistiqueService.getStatistiquesAudiences().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des audiences:', error);
          return of(null);
        })
      ),
      globales: this.statistiqueService.getStatistiquesGlobales().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques globales:', error);
          return of(null);
        })
      ),
      recouvrement: this.statistiqueService.getStatistiquesRecouvrementParPhase().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques de recouvrement:', error);
          return of(null);
        })
      )
    }).subscribe({
      next: (results) => {
        this.statsAudiences = results.audiences;
        this.statsRecouvrement = results.recouvrement; // ✅ NOUVEAU : Statistiques de recouvrement par phase
        // Extraire les statistiques documents et actions huissier depuis globales
        if (results.globales) {
          this.statsDocuments = {
            completes: results.globales.documentsHuissierCompletes !== null && results.globales.documentsHuissierCompletes !== undefined ? results.globales.documentsHuissierCompletes : null,
            crees: results.globales.documentsHuissierCrees !== null && results.globales.documentsHuissierCrees !== undefined ? results.globales.documentsHuissierCrees : null
          };
          this.statsActions = {
            completes: results.globales.actionsHuissierCompletes !== null && results.globales.actionsHuissierCompletes !== undefined ? results.globales.actionsHuissierCompletes : null,
            crees: results.globales.actionsHuissierCrees !== null && results.globales.actionsHuissierCrees !== undefined ? results.globales.actionsHuissierCrees : null
          };
        }
        this.loading = false;
        console.log('✅ Statistiques juridiques chargées:', {
          audiences: results.audiences,
          globales: results.globales,
          recouvrement: results.recouvrement
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques juridiques:', error);
        this.loading = false;
      }
    });
  }
}

