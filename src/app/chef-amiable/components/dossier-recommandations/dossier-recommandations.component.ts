import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ActionRecouvrementService, StatistiquesActions, ReponseDebiteur } from '../../../core/services/action-recouvrement.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { DossierApi } from '../../../shared/models/dossier-api.model';
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
  dossierApi: DossierApi | null = null;
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
    
    // Charger les statistiques et les données du dossier en parallèle
    forkJoin({
      stats: this.actionService.getStatistiquesActions(this.dossierId),
      dossier: this.dossierApiService.getDossierById(this.dossierId)
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ stats, dossier }) => {
        this.statistiques = stats;
        this.dossierApi = dossier;
        this.analyserRecommandations(stats, dossier);
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des recommandations:', err);
        // Essayer de charger au moins les statistiques
        this.actionService.getStatistiquesActions(this.dossierId).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (stats) => {
            this.statistiques = stats;
            this.analyserRecommandations(stats, null);
            this.loading = false;
          },
          error: (err2) => {
            console.error('❌ Erreur lors du chargement des statistiques:', err2);
            this.loading = false;
          }
        });
      }
    });
  }

  analyserRecommandations(stats: StatistiquesActions, dossier: DossierApi | null): void {
    // Calculer le pourcentage de réponse positive
    const totalAvecReponse = stats.positives + stats.negatives;
    
    if (totalAvecReponse > 0) {
      this.pourcentagePositif = Math.round((stats.positives / totalAvecReponse) * 100);
    } else {
      this.pourcentagePositif = 0;
    }

    // Vérifier qu'on a assez de données pour faire des recommandations
    if (stats.total === 0) {
      this.recommandationFinance = false;
      this.recommandationJuridique = false;
      return;
    }

    // Calculer les montants
    const montantTotal = dossier?.montantCreance || 0;
    const montantRecouvre = this.calculateMontantRecouvre(dossier);
    const montantRestant = montantTotal > 0 ? Math.max(0, montantTotal - montantRecouvre) : null;
    const recouvrementTotal = montantRestant !== null && montantRestant === 0;
    const recouvrementPartiel = montantRestant !== null && montantRestant > 0 && montantRecouvre > 0;

    // NOUVELLE LOGIQUE BASÉE SUR LES MONTANTS
    // Si montant restant > 0 ET recouvrement partiel → Recommandation Juridique
    if (montantRestant !== null && montantRestant > 0 && recouvrementPartiel) {
      this.recommandationJuridique = true;
      this.recommandationFinance = false;
      return;
    }

    // Si montant restant = 0 ET/OU recouvrement total → Recommandation Finance
    if (recouvrementTotal || (montantRestant !== null && montantRestant === 0)) {
      this.recommandationFinance = true;
      this.recommandationJuridique = false;
      return;
    }

    // Fallback : Logique basée sur les statistiques si pas de montants disponibles
    if (montantRestant === null || montantTotal === 0) {
      // Recommandation Finance : 2+ réponses positives récentes (30 derniers jours)
      const actionsPositivesRecentes = stats.dernieresActions
        .filter(a => a && a.reponseDebiteur === ReponseDebiteur.POSITIVE)
        .filter(a => {
          if (!a.dateAction) return false;
          const dateAction = new Date(a.dateAction);
          if (isNaN(dateAction.getTime())) return false;
          const joursDepuis = (Date.now() - dateAction.getTime()) / (1000 * 60 * 60 * 24);
          return joursDepuis <= 30;
        });

      this.recommandationFinance = actionsPositivesRecentes.length >= 2 && this.pourcentagePositif >= 50;

      // Recommandation Juridique : 3+ réponses négatives OU aucune réponse après 5 actions
      this.recommandationJuridique = 
        stats.negatives >= 3 || 
        (stats.total >= 5 && stats.sansReponse >= 3) ||
        (totalAvecReponse > 0 && this.pourcentagePositif < 30);
    } else {
      // Pas de recommandation si on a des montants mais pas de recouvrement
      this.recommandationFinance = false;
      this.recommandationJuridique = false;
    }
  }

  /**
   * Calcule le montant recouvré du dossier (méthode privée)
   */
  private calculateMontantRecouvre(dossier: DossierApi | null): number {
    if (!dossier) return 0;
    // Le backend peut retourner montantRecouvre directement ou via finance
    return (dossier as any).montantRecouvre || 
           (dossier.finance as any)?.montantRecouvre ||
           dossier.finance?.montantRecupere || 
           0;
  }

  /**
   * Récupère le montant recouvré pour l'affichage (méthode publique)
   */
  getMontantRecouvre(): number {
    return this.calculateMontantRecouvre(this.dossierApi);
  }

  /**
   * Récupère le montant restant du dossier
   */
  getMontantRestant(): number | null {
    if (!this.dossierApi) return null;
    const montantTotal = this.dossierApi.montantCreance || 0;
    const montantRecouvre = this.calculateMontantRecouvre(this.dossierApi);
    
    if (montantTotal === 0) return null;
    
    return Math.max(0, montantTotal - montantRecouvre);
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










