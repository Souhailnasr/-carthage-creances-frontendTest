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
  selector: 'app-supervision-amiable',
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
  templateUrl: './supervision-amiable.component.html',
  styleUrls: ['./supervision-amiable.component.scss']
})
export class SupervisionAmiableComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  statsAmiables: any = null;
  statsRecouvrement: any = null; // ✅ NOUVEAU : Statistiques de recouvrement par phase
  loading = false;

  constructor(
    private statistiqueService: StatistiqueCompleteService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  statsParType: any[] = [];

  // ✅ NOUVEAU : Méthode pour formater les montants
  formatAmount(amount: number | null | undefined): string {
    const value = amount !== null && amount !== undefined ? amount : 0;
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(value);
  }

  loadData(): void {
    this.loading = true;

    // ✅ STANDARDISATION : Utiliser getStatistiquesGlobales() + getStatistiquesActionsAmiables() + getStatistiquesRecouvrementParPhase()
    forkJoin({
      globales: this.statistiqueService.getStatistiquesGlobales().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques globales:', error);
          return of(null);
        })
      ),
      actionsAmiables: this.statistiqueService.getStatistiquesActionsAmiables().pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Erreur lors du chargement des actions amiables:', error);
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
        // Prioriser les statistiques des actions amiables (endpoint spécialisé)
        this.statsAmiables = results.actionsAmiables || results.globales;
        this.statsRecouvrement = results.recouvrement; // ✅ NOUVEAU : Statistiques de recouvrement par phase
        this.statsParType = []; // Ne plus utiliser les stats par type
        this.loading = false;
        console.log('✅ Statistiques amiables chargées (standardisées):', {
          globales: results.globales,
          actionsAmiables: results.actionsAmiables,
          recouvrement: results.recouvrement
        });
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des statistiques amiables:', error);
        this.loading = false;
      }
    });
  }
}

