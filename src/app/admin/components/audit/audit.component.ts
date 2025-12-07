import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuditService, AuditLog, AuditFilters } from '../../../core/services/audit.service';
import { ExportService } from '../../../core/services/export.service';

@Component({
  selector: 'app-audit',
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
    MatTooltipModule
  ],
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss']
})
export class AuditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Formulaires
  filtersForm: FormGroup;
  showAdvancedFilters = false;
  
  // Données
  logs: AuditLog[] = [];
  
  // Pagination
  totalElements = 0;
  pageSize = 50;
  pageIndex = 0;
  
  // États
  loading = false;
  
  // Colonnes du tableau
  displayedColumns: string[] = [
    'dateHeure',
    'utilisateur',
    'typeAction',
    'entite',
    'entiteId',
    'details',
    'ip',
    'actions'
  ];
  
  // Options pour les filtres
  typesAction = [
    'CONNEXION',
    'DECONNEXION',
    'CREATION_DOSSIER',
    'MODIFICATION_DOSSIER',
    'CHANGEMENT_STATUT',
    'REAFFECTATION_DEPARTEMENT',
    'REAFFECTATION_AGENT',
    'CREATION_UTILISATEUR',
    'MODIFICATION_UTILISATEUR',
    'REACTIVATION_DOSSIER',
    'FORCER_STATUT',
    'MODIFICATION_PARAMETRES'
  ];
  
  constructor(
    private fb: FormBuilder,
    private auditService: AuditService,
    private exportService: ExportService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filtersForm = this.fb.group({
      typeAction: [[]],
      utilisateurId: [''],
      dateDebut: [''],
      dateFin: [''],
      entite: [''],
      entiteId: [''],
      ip: [''],
      recherche: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadLogs();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadLogs(): void {
    this.loading = true;
    const filters = this.buildFilters();
    
    this.auditService.getLogs({
      ...filters,
      page: this.pageIndex,
      size: this.pageSize
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.logs = response.content;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des logs:', error);
        // Si endpoint n'existe pas, afficher message
        if (error.status === 404) {
          this.snackBar.open('Module d\'audit non disponible. Les logs seront disponibles après implémentation backend.', 'Fermer', { duration: 5000 });
          this.logs = [];
          this.totalElements = 0;
        } else {
          this.snackBar.open('Erreur lors du chargement des logs', 'Fermer', { duration: 3000 });
        }
        this.loading = false;
      }
    });
  }
  
  buildFilters(): AuditFilters {
    const formValue = this.filtersForm.value;
    return {
      typeAction: formValue.typeAction?.length > 0 ? formValue.typeAction : undefined,
      utilisateurId: formValue.utilisateurId ? Number(formValue.utilisateurId) : undefined,
      dateDebut: formValue.dateDebut ? this.formatDate(formValue.dateDebut) : undefined,
      dateFin: formValue.dateFin ? this.formatDate(formValue.dateFin) : undefined,
      entite: formValue.entite || undefined,
      entiteId: formValue.entiteId ? Number(formValue.entiteId) : undefined,
      ip: formValue.ip || undefined,
      recherche: formValue.recherche || undefined
    };
  }
  
  formatDate(date: Date): string {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }
  
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadLogs();
  }
  
  applyFilters(): void {
    this.pageIndex = 0;
    this.loadLogs();
  }
  
  resetFilters(): void {
    this.filtersForm.reset({
      typeAction: [],
      utilisateurId: '',
      dateDebut: '',
      dateFin: '',
      entite: '',
      entiteId: '',
      ip: '',
      recherche: ''
    });
    this.pageIndex = 0;
    this.loadLogs();
  }
  
  voirDetails(log: AuditLog): void {
    // TODO: Ouvrir modal avec détails complets (avant/après)
    console.log('Voir détails log:', log);
    this.snackBar.open('Détails du log: ' + log.details, 'Fermer', { duration: 5000 });
  }
  
  exporterCSV(): void {
    const filters = this.buildFilters();
    this.auditService.exportLogsCSV(filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        this.exportService.downloadBlob(blob, `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        this.snackBar.open('CSV exporté avec succès', 'Fermer', { duration: 2000 });
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'export CSV:', error);
        this.snackBar.open('Erreur lors de l\'export CSV', 'Fermer', { duration: 3000 });
      }
    });
  }
}

