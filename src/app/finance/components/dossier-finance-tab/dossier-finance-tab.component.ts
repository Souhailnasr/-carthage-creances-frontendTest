import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { ChefFinanceService, FluxFrais, Facture } from '../../../core/services/chef-finance.service';
import { saveAs } from 'file-saver';
import {
  DossierFinanceTabData,
  DossierFraisRow,
  FraisStatut
} from '../../models/finance-feature.interfaces';

@Component({
  selector: 'app-dossier-finance-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './dossier-finance-tab.component.html',
  styleUrls: ['./dossier-finance-tab.component.scss']
})
export class DossierFinanceTabComponent implements OnInit, OnDestroy {
  @Input() dossierId?: number;
  
  data: DossierFinanceTabData | null = null;
  loading = false;
  
  displayedColumns: string[] = ['phase', 'categorie', 'quantite', 'tarifUnitaire', 'montant', 'statut', 'justificatif', 'actions'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private financeService: ChefFinanceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.dossierId || this.route.snapshot.params['id'];
    if (id) {
      this.loadDossierFinance(Number(id));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDossierFinance(dossierId: number): void {
    this.loading = true;
    forkJoin({
      frais: this.financeService.getFraisByDossier(dossierId),
      factures: this.financeService.getFacturesByDossier(dossierId),
      stats: this.financeService.getDossierStats(dossierId)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ frais, factures, stats }) => {
        // Transformer les données
        this.data = {
          frais: frais.map(f => ({
            id: f.id,
            phase: f.phase,
            categorie: f.categorie,
            quantite: f.quantite,
            tarifUnitaire: f.tarifUnitaire,
            montant: f.montant,
            statut: f.statut as any,
            justificatifUrl: f.justificatifUrl,
            demandeur: f.agent || f.demandeur,
            creeLe: f.dateAction || f.creeLe || new Date().toISOString()
          })),
          synthese: this.calculatePhaseSummary(frais, stats?.montantDu || 0),
          montantDu: stats?.montantDu || 0,
          ratioFraisMontantDu: stats?.ratioFrais || 0,
          factures: factures.map(f => ({
            factureId: f.id,
            periode: `${f.dateGeneration || ''} - ${f.dateEcheance || ''}`,
            montant: f.montantTotal,
            statut: f.statut as any,
            urlPdf: f.urlPdf,
            creeLe: f.dateGeneration || new Date().toISOString()
          }))
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement:', err);
        this.snackBar.open('Erreur lors du chargement des données', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private calculatePhaseSummary(frais: FluxFrais[], montantDu: number): any[] {
    const phaseMap = new Map<string, number>();
    frais.forEach(f => {
      const current = phaseMap.get(f.phase) || 0;
      phaseMap.set(f.phase, current + f.montant);
    });
    
    return Array.from(phaseMap.entries()).map(([phase, total]) => ({
      phase,
      total,
      ratioVsDu: montantDu > 0 ? total / montantDu : 0,
      color: this.getRatioColor(total / montantDu) as any
    }));
  }

  validerFrais(fraisId: number): void {
    this.financeService.validerFrais(fraisId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Frais validé avec succès', 'Fermer', { duration: 3000 });
        if (this.dossierId) {
          this.loadDossierFinance(this.dossierId);
        }
      },
      error: (err) => {
        console.error('❌ Erreur lors de la validation:', err);
        this.snackBar.open('Erreur lors de la validation', 'Fermer', { duration: 3000 });
      }
    });
  }

  rejeterFrais(fraisId: number): void {
    const commentaire = prompt('Veuillez saisir un commentaire de rejet:');
    if (!commentaire) return;

    this.financeService.rejeterFrais(fraisId, commentaire).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Frais rejeté', 'Fermer', { duration: 3000 });
        if (this.dossierId) {
          this.loadDossierFinance(this.dossierId);
        }
      },
      error: (err) => {
        console.error('❌ Erreur lors du rejet:', err);
        this.snackBar.open('Erreur lors du rejet', 'Fermer', { duration: 3000 });
      }
    });
  }

  genererFacture(): void {
    if (!this.dossierId) return;
    
    this.financeService.genererFactureAutomatique(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (facture) => {
        this.snackBar.open('Facture générée avec succès', 'Fermer', { duration: 3000 });
        if (this.dossierId) {
          this.loadDossierFinance(this.dossierId);
        }
      },
      error: (err) => {
        console.error('❌ Erreur lors de la génération:', err);
        this.snackBar.open('Erreur lors de la génération de la facture', 'Fermer', { duration: 3000 });
      }
    });
  }

  downloadFacturePDF(factureId: number): void {
    this.financeService.downloadFacturePDF(factureId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob: Blob) => {
        const filename = `facture_${factureId}.pdf`;
        saveAs(blob, filename);
        this.snackBar.open('Facture téléchargée avec succès', 'Fermer', { duration: 3000 });
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors du téléchargement', 'Fermer', { duration: 3000 });
      }
    });
  }

  downloadJustificatif(url: string): void {
    window.open(url, '_blank');
  }

  getStatutColor(statut: FraisStatut): string {
    const colors: Record<FraisStatut, string> = {
      EN_ATTENTE: 'warn',
      VALIDE: 'primary',
      REJETE: 'accent'
    };
    return colors[statut] || 'primary';
  }

  getRatioColor(ratio: number): string {
    if (ratio < 0.2) return 'success';
    if (ratio < 0.4) return 'warning';
    return 'danger';
  }

  // Exposer Math pour le template
  Math = Math;
}

