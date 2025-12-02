import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { FactureService } from '../../../core/services/facture.service';
import { PaiementService } from '../../../core/services/paiement.service';
import { Facture, FactureStatut } from '../../../shared/models/finance.models';
import { Paiement } from '../../../shared/models/finance.models';

interface FactureAvecPaiements {
  facture: Facture;
  paiements: Paiement[];
  totalPaye: number;
  soldeRestant: number;
}

@Component({
  selector: 'app-paiements-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './paiements-list.component.html',
  styleUrls: ['./paiements-list.component.scss']
})
export class PaiementsListComponent implements OnInit, OnDestroy {
  facturesAvecPaiements: FactureAvecPaiements[] = [];
  loading = false;
  
  displayedColumns: string[] = ['numeroFacture', 'dossierId', 'montantTTC', 'totalPaye', 'soldeRestant', 'statut', 'actions'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private factureService: FactureService,
    private paiementService: PaiementService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadFacturesAvecPaiements();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFacturesAvecPaiements(): void {
    this.loading = true;
    
    this.factureService.getAllFactures().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (factures) => {
        // Charger les paiements pour chaque facture
        const observables = factures.map(facture => 
          this.paiementService.getPaiementsByFacture(facture.id!).pipe(
            takeUntil(this.destroy$)
          )
        );

        if (observables.length === 0) {
          this.facturesAvecPaiements = [];
          this.loading = false;
          return;
        }

        forkJoin(observables).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (paiementsArrays) => {
            this.facturesAvecPaiements = factures.map((facture, index) => {
              const paiements = paiementsArrays[index] || [];
              const totalPaye = paiements
                .filter(p => p.statut === 'VALIDE')
                .reduce((sum, p) => sum + (p.montant || 0), 0);
              const soldeRestant = Math.max(0, facture.montantTTC - totalPaye);

              return {
                facture,
                paiements,
                totalPaye,
                soldeRestant
              };
            });
            this.loading = false;
          },
          error: (err) => {
            console.error('❌ Erreur lors du chargement des paiements:', err);
            this.snackBar.open('Erreur lors du chargement des paiements', 'Fermer', { duration: 3000 });
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des factures:', err);
        this.snackBar.open('Erreur lors du chargement des factures', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  getStatutLabel(statut: FactureStatut): string {
    const labels: { [key: string]: string } = {
      'BROUILLON': 'Brouillon',
      'EMISE': 'Émise',
      'PAYEE': 'Payée',
      'EN_RETARD': 'En Retard',
      'ANNULEE': 'Annulée'
    };
    return labels[statut] || statut;
  }

  getStatutColor(statut: FactureStatut): string {
    const colors: { [key: string]: string } = {
      'BROUILLON': 'warn',
      'EMISE': 'primary',
      'PAYEE': 'accent',
      'EN_RETARD': 'warn',
      'ANNULEE': ''
    };
    return colors[statut] || '';
  }

  gererPaiements(factureId: number): void {
    // Navigation vers la gestion des paiements pour cette facture
    window.location.href = `/finance/paiements/facture/${factureId}`;
  }
}

