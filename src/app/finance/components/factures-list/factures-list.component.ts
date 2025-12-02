import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { FactureService } from '../../../core/services/facture.service';
import { Facture, FactureStatut } from '../../../shared/models/finance.models';

@Component({
  selector: 'app-factures-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './factures-list.component.html',
  styleUrls: ['./factures-list.component.scss']
})
export class FacturesListComponent implements OnInit, OnDestroy {
  factures: Facture[] = [];
  filterStatut?: FactureStatut;
  loading = false;
  
  displayedColumns: string[] = ['numeroFacture', 'dossierId', 'montantTTC', 'dateEmission', 'dateEcheance', 'statut', 'actions'];
  statuts = Object.values(FactureStatut);
  
  private destroy$ = new Subject<void>();

  constructor(
    private factureService: FactureService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadFactures();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFactures(): void {
    this.loading = true;
    
    const observable = this.filterStatut
      ? this.factureService.getFacturesByStatut(this.filterStatut)
      : this.factureService.getAllFactures();

    observable.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (factures) => {
        // Vérifier si toutes les factures ont un dossierId (cas d'erreur)
        const facturesSansDossierId = factures.filter(f => !f.dossierId);
        if (facturesSansDossierId.length > 0) {
          console.warn('⚠️ Certaines factures n\'ont pas de dossierId:', facturesSansDossierId);
        }
        this.factures = factures;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement:', err);
        this.snackBar.open('Erreur lors du chargement des factures', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onStatutFilterChange(statut: FactureStatut | ''): void {
    this.filterStatut = statut || undefined;
    this.loadFactures();
  }

  finaliserFacture(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir finaliser cette facture ?')) return;

    this.factureService.finaliserFacture(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Facture finalisée avec succès', 'Fermer', { duration: 3000 });
        this.loadFactures();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors de la finalisation', 'Fermer', { duration: 3000 });
      }
    });
  }

  envoyerFacture(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir envoyer cette facture ?')) return;

    this.factureService.envoyerFacture(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Facture envoyée avec succès', 'Fermer', { duration: 3000 });
        this.loadFactures();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors de l\'envoi', 'Fermer', { duration: 3000 });
      }
    });
  }

  relancerFacture(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir relancer cette facture ?')) return;

    this.factureService.relancerFacture(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Relance envoyée avec succès', 'Fermer', { duration: 3000 });
        this.loadFactures();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors de la relance', 'Fermer', { duration: 3000 });
      }
    });
  }

  downloadPdf(id: number): void {
    this.factureService.downloadPdfFacture(id);
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
}

