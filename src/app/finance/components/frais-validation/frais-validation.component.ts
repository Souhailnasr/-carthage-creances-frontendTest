import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChefFinanceService, FluxFrais } from '../../../core/services/chef-finance.service';
import {
  PendingFraisItem,
  PendingFraisFilter,
  PendingFraisStats
} from '../../models/finance-feature.interfaces';
import { FraisDetailModalComponent } from './frais-detail-modal.component';

@Component({
  selector: 'app-frais-validation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './frais-validation.component.html',
  styleUrls: ['./frais-validation.component.scss']
})
export class FraisValidationComponent implements OnInit, OnDestroy {
  frais: FluxFrais[] = [];
  stats: PendingFraisStats = { totalFrais: 0, montantTotal: 0 };
  loading = false;
  
  filters: PendingFraisFilter = {};
  
  displayedColumns: string[] = ['dossierId', 'phase', 'categorie', 'montant', 'demandeur', 'creeLe', 'actions'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private financeService: ChefFinanceService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPendingFrais();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPendingFrais(): void {
    this.loading = true;
    this.financeService.getFraisEnAttente().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (frais) => {
        // Appliquer les filtres
        let filtered = frais;
        if (this.filters.phase) {
          filtered = filtered.filter(f => f.phase === this.filters.phase);
        }
        if (this.filters.agentId) {
          // Filtrer par agent si disponible
        }
        if (this.filters.montantMin) {
          filtered = filtered.filter(f => f.montant >= (this.filters.montantMin || 0));
        }
        if (this.filters.montantMax) {
          filtered = filtered.filter(f => f.montant <= (this.filters.montantMax || Infinity));
        }
        
        this.frais = filtered;
        this.stats = {
          totalFrais: this.frais.length,
          montantTotal: this.frais.reduce((sum, f) => sum + f.montant, 0)
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement:', err);
        this.snackBar.open('Erreur lors du chargement des frais', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadPendingFrais();
  }

  clearFilters(): void {
    this.filters = {};
    this.loadPendingFrais();
  }

  voirDetail(frais: FluxFrais): void {
    this.dialog.open(FraisDetailModalComponent, {
      width: '600px',
      data: {
        id: frais.id,
        dossierId: frais.dossierId,
        phase: frais.phase,
        categorie: frais.categorie,
        montant: frais.montant,
        demandeur: frais.agent || frais.demandeur,
        justificationUrl: frais.justificatifUrl,
        creeLe: frais.dateAction || frais.creeLe || new Date().toISOString()
      }
    });
  }

  validerFrais(fraisId: number): void {
    this.financeService.validerFrais(fraisId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Frais validé avec succès', 'Fermer', { duration: 3000 });
        this.loadPendingFrais();
      },
      error: (err) => {
        console.error('❌ Erreur lors de la validation:', err);
        this.snackBar.open('Erreur lors de la validation', 'Fermer', { duration: 3000 });
      }
    });
  }

  rejeterFrais(fraisId: number): void {
    const commentaire = prompt('Veuillez saisir un commentaire de rejet (obligatoire):');
    if (!commentaire || commentaire.trim() === '') {
      this.snackBar.open('Le commentaire est obligatoire', 'Fermer', { duration: 3000 });
      return;
    }

    this.financeService.rejeterFrais(fraisId, commentaire).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Frais rejeté', 'Fermer', { duration: 3000 });
        this.loadPendingFrais();
      },
      error: (err) => {
        console.error('❌ Erreur lors du rejet:', err);
        this.snackBar.open('Erreur lors du rejet', 'Fermer', { duration: 3000 });
      }
    });
  }
}

