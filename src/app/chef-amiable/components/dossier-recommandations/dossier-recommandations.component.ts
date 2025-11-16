import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { ActionRecouvrementService, StatistiquesActions, ReponseDebiteur } from '../../../core/services/action-recouvrement.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

@Component({
  selector: 'app-dossier-recommandations',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './dossier-recommandations.component.html',
  styleUrls: ['./dossier-recommandations.component.scss']
})
export class DossierRecommandationsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() dossierId!: number;
  
  statistiques: StatistiquesActions | null = null;
  recommandationFinance = false;
  recommandationJuridique = false;
  pourcentagePositif = 0;
  loading = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private actionService: ActionRecouvrementService,
    private dossierApiService: DossierApiService,
    private router: Router,
    private snackBar: MatSnackBar,
    private jwtAuthService: JwtAuthService
  ) {}

  ngOnInit(): void {
    if (!this.jwtAuthService.isUserLoggedIn()) {
      this.snackBar.open('Vous devez être connecté', 'Fermer', { duration: 3000 });
      return;
    }
    
    if (this.dossierId) {
      this.loadRecommandations();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dossierId'] && this.dossierId && !changes['dossierId'].firstChange) {
      this.loadRecommandations();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRecommandations(): void {
    if (!this.dossierId) return;
    
    this.loading = true;
    this.actionService.getStatistiquesActions(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.statistiques = stats;
        this.analyserRecommandations(stats);
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des recommandations:', err);
        this.loading = false;
      }
    });
  }

  analyserRecommandations(stats: StatistiquesActions): void {
    const totalAvecReponse = stats.positives + stats.negatives;
    
    if (totalAvecReponse > 0) {
      this.pourcentagePositif = (stats.positives / totalAvecReponse) * 100;
    }

    // Recommandation Finance : 2+ réponses positives récentes (30 derniers jours)
    const actionsPositivesRecentes = stats.dernieresActions
      .filter(a => a.reponseDebiteur === ReponseDebiteur.POSITIVE)
      .filter(a => {
        const dateAction = new Date(a.dateAction);
        const joursDepuis = (Date.now() - dateAction.getTime()) / (1000 * 60 * 60 * 24);
        return joursDepuis <= 30;
      });

    this.recommandationFinance = actionsPositivesRecentes.length >= 2;

    // Recommandation Juridique : 3+ réponses négatives OU aucune réponse après 5 actions
    this.recommandationJuridique = 
      stats.negatives >= 3 || 
      (stats.total >= 5 && stats.sansReponse >= 3);
  }

  passerAuFinance(): void {
    if (confirm('Êtes-vous sûr de vouloir passer ce dossier au Finance ?')) {
      // TODO: Implémenter l'API pour passer au finance
      this.snackBar.open('Fonctionnalité à implémenter : Passage au Finance', 'Fermer', { duration: 3000 });
    }
  }

  passerAuJuridique(): void {
    if (confirm('Êtes-vous sûr de vouloir passer ce dossier au Recouvrement Juridique ?')) {
      if (this.dossierId) {
        this.loading = true;
        this.dossierApiService.affecterAuRecouvrementJuridique(this.dossierId).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.snackBar.open('Dossier affecté au recouvrement juridique avec succès', 'Fermer', { duration: 3000 });
            this.router.navigate(['/chef-amiable/gestion-actions']);
          },
          error: (err) => {
            console.error('❌ Erreur lors de l\'affectation au juridique:', err);
            const errorMessage = err.error?.message || err.message || 'Erreur lors de l\'affectation au juridique';
            this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
            this.loading = false;
          }
        });
      }
    }
  }
}



