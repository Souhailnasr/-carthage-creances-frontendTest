import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupervisionService, ReactivationRequest } from '../../../../core/services/supervision.service';
import { ExportService } from '../../../../core/services/export.service';
import { DossierApi } from '../../../../shared/models/dossier-api.model';
import { DossierApiService } from '../../../../core/services/dossier-api.service';

@Component({
  selector: 'app-dossiers-clotures',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './dossiers-clotures.component.html',
  styleUrls: ['./dossiers-clotures.component.scss']
})
export class DossiersCloturesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Formulaires
  filtersForm: FormGroup;
  
  // Données
  dossiers: DossierApi[] = [];
  
  // Statistiques
  stats = {
    totalClotures: 0,
    tauxRecouvrement: 0,
    montantTotalRecouvre: 0,
    repartitionParMotif: {
      RECOUVRE: 0,
      ABANDONNE: 0,
      LITIGE: 0
    }
  };
  
  // Pagination
  totalElements = 0;
  pageSize = 50;
  pageIndex = 0;
  
  // États
  loading = false;
  loadingStats = false;
  
  // Colonnes du tableau
  displayedColumns: string[] = [
    'reference',
    'debiteur',
    'montantInitial',
    'montantRecouvre',
    'tauxRecouvrement',
    'motifCloture',
    'dateCloture',
    'agentResponsable',
    'dureeTotale',
    'actions'
  ];
  
  // Options pour les filtres
  motifs = ['RECOUVRE', 'ABANDONNE', 'LITIGE', 'AUTRE'];
  
  constructor(
    private fb: FormBuilder,
    private supervisionService: SupervisionService,
    private exportService: ExportService,
    private dossierApiService: DossierApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filtersForm = this.fb.group({
      motif: [[]],
      periodeDebut: [''],
      periodeFin: [''],
      montantMin: [''],
      montantMax: [''],
      departement: [[]]
    });
  }
  
  ngOnInit(): void {
    this.loadStats();
    this.loadDossiers();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadStats(): void {
    this.loadingStats = true;
    // Pour l'instant, calculer depuis les données
    this.dossierApiService.getAllDossiers(0, 1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (page) => {
        const dossiersClotures = page.content.filter(d => d.dateCloture);
        this.stats.totalClotures = dossiersClotures.length;
        const montantTotal = dossiersClotures.reduce((sum, d) => sum + (d.montantCreance || 0), 0);
        this.stats.montantTotalRecouvre = montantTotal;
        this.stats.tauxRecouvrement = montantTotal > 0 ? (montantTotal / montantTotal) * 100 : 0;
        this.loadingStats = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des statistiques:', error);
        this.loadingStats = false;
      }
    });
  }
  
  loadDossiers(): void {
    this.loading = true;
    const filters = this.buildFilters();
    
    this.supervisionService.getDossiersClotures({
      ...filters,
      page: this.pageIndex,
      size: this.pageSize
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.dossiers = response.content;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: (error) => {
        // Fallback: utiliser getAllDossiers et filtrer
        this.dossierApiService.getAllDossiers(this.pageIndex, this.pageSize).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (page) => {
            const filtered = page.content.filter(d => d.dateCloture);
            this.dossiers = filtered;
            this.totalElements = filtered.length;
            this.loading = false;
          },
          error: (err) => {
            console.error('❌ Erreur lors du chargement des dossiers clôturés:', err);
            this.snackBar.open('Erreur lors du chargement des dossiers', 'Fermer', { duration: 3000 });
            this.loading = false;
          }
        });
      }
    });
  }
  
  buildFilters(): any {
    const formValue = this.filtersForm.value;
    return {
      motif: formValue.motif?.length > 0 ? formValue.motif : undefined,
      periodeDebut: formValue.periodeDebut ? this.formatDate(formValue.periodeDebut) : undefined,
      periodeFin: formValue.periodeFin ? this.formatDate(formValue.periodeFin) : undefined,
      montantMin: formValue.montantMin ? Number(formValue.montantMin) : undefined,
      montantMax: formValue.montantMax ? Number(formValue.montantMax) : undefined,
      departement: formValue.departement?.length > 0 ? formValue.departement : undefined
    };
  }
  
  formatDate(date: Date): string {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }
  
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDossiers();
  }
  
  applyFilters(): void {
    this.pageIndex = 0;
    this.loadDossiers();
  }
  
  resetFilters(): void {
    this.filtersForm.reset({
      motif: [],
      periodeDebut: '',
      periodeFin: '',
      montantMin: '',
      montantMax: '',
      departement: []
    });
    this.pageIndex = 0;
    this.loadDossiers();
  }
  
  voirHistorique(dossier: DossierApi): void {
    // TODO: Ouvrir modal avec historique complet
    console.log('Voir historique:', dossier);
  }
  
  reactiverDossier(dossier: DossierApi): void {
    // TODO: Ouvrir modal de réactivation
    console.log('Réactiver dossier:', dossier);
  }
  
  exporterDossierPDF(dossier: DossierApi): void {
    this.exportService.exportDossierPDF(dossier.id!).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        this.exportService.downloadBlob(blob, `DOSSIER-${dossier.numeroDossier}.pdf`);
        this.snackBar.open('PDF exporté avec succès', 'Fermer', { duration: 2000 });
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'export PDF:', error);
        this.snackBar.open('Erreur lors de l\'export PDF', 'Fermer', { duration: 3000 });
      }
    });
  }
  
  exporterSelectionCSV(): void {
    this.exportService.exportTableauCSV(this.dossiers, 'dossiers_clotures');
    this.snackBar.open('CSV exporté avec succès', 'Fermer', { duration: 2000 });
  }
  
  calculerDureeTotale(dossier: DossierApi): number {
    if (!dossier.dateCreation || !dossier.dateCloture) return 0;
    const jours = (new Date(dossier.dateCloture).getTime() - new Date(dossier.dateCreation).getTime()) / (1000 * 60 * 60 * 24);
    return Math.floor(jours);
  }
  
  calculerTauxRecouvrement(dossier: DossierApi): number {
    // Simplifié: utiliser montantCreance comme montant recouvré si clôturé
    // En réalité, il faudrait un champ montantRecouvre dans DossierApi
    return dossier.montantCreance ? 100 : 0;
  }
}

