import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { SupervisionService, SupervisionFilters, ReaffectationRequest, CommentaireInterneRequest, ForcerStatutRequest } from '../../../../core/services/supervision.service';
import { ExportService } from '../../../../core/services/export.service';
import { DossierApi } from '../../../../shared/models/dossier-api.model';
import { DossierApiService } from '../../../../core/services/dossier-api.service';

@Component({
  selector: 'app-dossiers-actifs',
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
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './dossiers-actifs.component.html',
  styleUrls: ['./dossiers-actifs.component.scss']
})
export class DossiersActifsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Formulaires
  filtersForm: FormGroup;
  showAdvancedFilters = false;
  
  // Données
  dossiers: DossierApi[] = [];
  selectedDossiers: Set<number> = new Set();
  
  // Pagination
  totalElements = 0;
  pageSize = 50;
  pageIndex = 0;
  
  // États
  loading = false;
  
  // Colonnes du tableau
  displayedColumns: string[] = [
    'select',
    'reference',
    'debiteur',
    'montant',
    'statut',
    'departement',
    'agent',
    'scoreIA',
    'urgence',
    'derniereAction',
    'actions'
  ];
  
  // Options pour les filtres
  statuts = ['EN_ATTENTE_VALIDATION', 'VALIDE', 'EN_COURS', 'CLOTURE'];
  departements = ['DOSSIER', 'AMIABLE', 'JURIDIQUE', 'FINANCE'];
  urgences = ['NORMAL', 'URGENT', 'TRES_URGENT'];
  scoresIA = ['FAIBLE', 'MOYEN', 'ELEVE'];
  
  constructor(
    private fb: FormBuilder,
    private supervisionService: SupervisionService,
    private exportService: ExportService,
    private dossierApiService: DossierApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filtersForm = this.fb.group({
      statut: [[]],
      departement: [[]],
      debiteur: [''],
      montantMin: [''],
      montantMax: [''],
      urgence: [''],
      agentId: [''],
      scoreIA: [''],
      dateCreationDebut: [''],
      dateCreationFin: [''],
      dateDerniereActionDebut: [''],
      dateDerniereActionFin: [''],
      montantRecouvreMin: [''],
      montantRecouvreMax: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadDossiers();
    
    // Debounce sur la recherche débiteur
    this.filtersForm.get('debiteur')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.pageIndex = 0;
      this.loadDossiers();
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadDossiers(): void {
    this.loading = true;
    
    // Utiliser getAllDossiers comme dans gestion-actions.component.ts
    // et filtrer côté client pour les dossiers actifs
    this.dossierApiService.getAllDossiers(this.pageIndex, this.pageSize).pipe(
      takeUntil(this.destroy$),
      map((pageResponse) => {
        // Filtrer pour garder uniquement les dossiers actifs
        // Un dossier est actif si :
        // - dossierStatus === 'ENCOURSDETRAITEMENT' (en cours de traitement)
        // - ET pas de dateCloture
        const filtered = pageResponse.content.filter((dossier: DossierApi) => {
          const isActive = dossier.dossierStatus === 'ENCOURSDETRAITEMENT' && !dossier.dateCloture;
          
          // Appliquer les filtres supplémentaires
          const filters = this.buildFilters();
          
          if (filters.statut && filters.statut.length > 0) {
            if (!filters.statut.includes(dossier.statut || '')) {
              return false;
            }
          }
          
          if (filters.departement && filters.departement.length > 0) {
            if (!filters.departement.includes(dossier.typeRecouvrement || '')) {
              return false;
            }
          }
          
          if (filters.montantMin && dossier.montantCreance && dossier.montantCreance < filters.montantMin) {
            return false;
          }
          
          if (filters.montantMax && dossier.montantCreance && dossier.montantCreance > filters.montantMax) {
            return false;
          }
          
          if (filters.urgence && dossier.urgence !== filters.urgence) {
            return false;
          }
          
          if (filters.scoreIA) {
            const score = dossier.riskScore || 0;
            if (filters.scoreIA === 'FAIBLE' && score >= 40) return false;
            if (filters.scoreIA === 'MOYEN' && (score < 40 || score >= 70)) return false;
            if (filters.scoreIA === 'ELEVE' && score < 70) return false;
          }
          
          if (filters.debiteur) {
            const debiteurNom = `${dossier.debiteur?.nom || ''} ${dossier.debiteur?.prenom || ''}`.toLowerCase();
            if (!debiteurNom.includes(filters.debiteur.toLowerCase())) {
              return false;
            }
          }
          
          return isActive;
        });
        
        return {
          ...pageResponse,
          content: filtered,
          totalElements: filtered.length,
          totalPages: Math.ceil(filtered.length / this.pageSize)
        };
      })
    ).subscribe({
      next: (response) => {
        this.dossiers = response.content;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des dossiers:', error);
        this.snackBar.open('Erreur lors du chargement des dossiers', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }
  
  buildFilters(): SupervisionFilters {
    const formValue = this.filtersForm.value;
    return {
      statut: formValue.statut?.length > 0 ? formValue.statut : undefined,
      departement: formValue.departement?.length > 0 ? formValue.departement : undefined,
      debiteur: formValue.debiteur || undefined,
      montantMin: formValue.montantMin ? Number(formValue.montantMin) : undefined,
      montantMax: formValue.montantMax ? Number(formValue.montantMax) : undefined,
      urgence: formValue.urgence || undefined,
      agentId: formValue.agentId ? Number(formValue.agentId) : undefined,
      scoreIA: formValue.scoreIA || undefined,
      dateCreationDebut: formValue.dateCreationDebut ? this.formatDate(formValue.dateCreationDebut) : undefined,
      dateCreationFin: formValue.dateCreationFin ? this.formatDate(formValue.dateCreationFin) : undefined,
      dateDerniereActionDebut: formValue.dateDerniereActionDebut ? this.formatDate(formValue.dateDerniereActionDebut) : undefined,
      dateDerniereActionFin: formValue.dateDerniereActionFin ? this.formatDate(formValue.dateDerniereActionFin) : undefined,
      montantRecouvreMin: formValue.montantRecouvreMin ? Number(formValue.montantRecouvreMin) : undefined,
      montantRecouvreMax: formValue.montantRecouvreMax ? Number(formValue.montantRecouvreMax) : undefined
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
  
  toggleSelection(dossierId: number): void {
    if (this.selectedDossiers.has(dossierId)) {
      this.selectedDossiers.delete(dossierId);
    } else {
      this.selectedDossiers.add(dossierId);
    }
  }
  
  toggleSelectAll(): void {
    if (this.selectedDossiers.size === this.dossiers.length) {
      this.selectedDossiers.clear();
    } else {
      this.dossiers.forEach(d => this.selectedDossiers.add(d.id!));
    }
  }
  
  isAllSelected(): boolean {
    return this.dossiers.length > 0 && this.selectedDossiers.size === this.dossiers.length;
  }
  
  applyFilters(): void {
    this.pageIndex = 0;
    this.loadDossiers();
  }
  
  resetFilters(): void {
    this.filtersForm.reset({
      statut: [],
      departement: [],
      debiteur: '',
      montantMin: '',
      montantMax: '',
      urgence: '',
      agentId: '',
      scoreIA: '',
      dateCreationDebut: '',
      dateCreationFin: '',
      dateDerniereActionDebut: '',
      dateDerniereActionFin: '',
      montantRecouvreMin: '',
      montantRecouvreMax: ''
    });
    this.pageIndex = 0;
    this.loadDossiers();
  }
  
  voirDetails(dossier: DossierApi): void {
    // TODO: Ouvrir modal avec détails complets
    console.log('Voir détails:', dossier);
  }
  
  ajouterCommentaire(dossier: DossierApi): void {
    // TODO: Ouvrir modal pour ajouter commentaire
    console.log('Ajouter commentaire:', dossier);
  }
  
  modifierCoordonnees(dossier: DossierApi): void {
    // TODO: Ouvrir modal pour modifier coordonnées
    console.log('Modifier coordonnées:', dossier);
  }
  
  reaffecterDepartement(dossier: DossierApi): void {
    // TODO: Ouvrir modal pour réaffecter département
    console.log('Réaffecter département:', dossier);
  }
  
  reaffecterAgent(dossier: DossierApi): void {
    // TODO: Ouvrir modal pour réaffecter agent
    console.log('Réaffecter agent:', dossier);
  }
  
  forcerStatut(dossier: DossierApi): void {
    // TODO: Ouvrir modal pour forcer statut
    console.log('Forcer statut:', dossier);
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
    if (this.selectedDossiers.size === 0) {
      this.snackBar.open('Veuillez sélectionner au moins un dossier', 'Fermer', { duration: 2000 });
      return;
    }
    
    const selectedData = this.dossiers.filter(d => this.selectedDossiers.has(d.id!));
    this.exportService.exportTableauCSV(selectedData, 'dossiers_actifs');
    this.snackBar.open('CSV exporté avec succès', 'Fermer', { duration: 2000 });
  }
  
  getScoreIAClass(score?: number): string {
    if (!score) return '';
    if (score < 40) return 'score-faible';
    if (score < 70) return 'score-moyen';
    return 'score-eleve';
  }
  
  getUrgenceClass(urgence: string): string {
    switch (urgence) {
      case 'TRES_URGENT': return 'urgence-tres-urgent';
      case 'URGENT': return 'urgence-urgent';
      default: return 'urgence-normal';
    }
  }
}

