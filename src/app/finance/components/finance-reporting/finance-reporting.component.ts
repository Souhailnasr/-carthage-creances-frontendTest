import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChefFinanceService } from '../../../core/services/chef-finance.service';
import { saveAs } from 'file-saver';
import { FinanceReportType, FinanceReportRequest, FinanceReportHistoryItem } from '../../models/finance-feature.interfaces';

@Component({
  selector: 'app-finance-reporting',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './finance-reporting.component.html',
  styleUrls: ['./finance-reporting.component.scss']
})
export class FinanceReportingComponent implements OnInit, OnDestroy {
  reportForm: FormGroup;
  reportPreview: any = null;
  reportHistory: FinanceReportHistoryItem[] = [];
  loading = false;
  generating = false;
  
  reportTypes: { value: FinanceReportType; label: string }[] = [
    { value: 'MENSUEL', label: 'Mensuel' },
    { value: 'PAR_CLIENT', label: 'Par Client' },
    { value: 'PAR_AGENT', label: 'Par Agent' },
    { value: 'PAR_SECTEUR', label: 'Par Secteur' }
  ];
  
  displayedColumns: string[] = ['type', 'start', 'end', 'utilisateur', 'createdAt', 'actions'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private financeService: ChefFinanceService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.reportForm = this.fb.group({
      type: ['MENSUEL', Validators.required],
      start: ['', Validators.required],
      end: ['', Validators.required],
      filtreClientId: [''],
      filtreAgentId: [''],
      filtreSecteur: ['']
    });
  }

  ngOnInit(): void {
    this.loadReportHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  generatePreview(): void {
    if (this.reportForm.invalid) return;

    this.loading = true;
    const formValue = this.reportForm.value;
    
    this.financeService.getStatsByDateRange(formValue.start, formValue.end).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.reportPreview = {
          table: [],
          chartSerie: stats.evolutionMensuelle
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors de la génération de l\'aperçu', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  exportPdf(): void {
    // TODO: Implémenter export PDF si disponible
    this.snackBar.open('Export PDF non disponible pour le moment', 'Fermer', { duration: 3000 });
  }

  exportExcel(): void {
    this.generating = true;
    const formValue = this.reportForm.value;
    const params = {
      typeRapport: formValue.type,
      startDate: formValue.start,
      endDate: formValue.end,
      ...(formValue.filtreClientId && { filtreClientId: formValue.filtreClientId }),
      ...(formValue.filtreAgentId && { filtreAgentId: formValue.filtreAgentId }),
      ...(formValue.filtreSecteur && { filtreSecteur: formValue.filtreSecteur })
    };
    
    this.financeService.exportRapportExcel(
      params.typeRapport,
      params.startDate,
      params.endDate,
      params
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        const filename = `rapport_${params.typeRapport}_${params.startDate}_${params.endDate}.xlsx`;
        saveAs(blob, filename);
        this.generating = false;
        this.snackBar.open('Excel exporté avec succès', 'Fermer', { duration: 3000 });
        this.loadReportHistory();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors de l\'export Excel', 'Fermer', { duration: 3000 });
        this.generating = false;
      }
    });
  }

  loadReportHistory(): void {
    // TODO: Implémenter historique si disponible
    this.reportHistory = [];
  }

  private buildReportParams(): any {
    const formValue = this.reportForm.value;
    const params: any = {
      type: formValue.type,
      start: formValue.start,
      end: formValue.end
    };
    
    if (formValue.filtreClientId) params.filtreClientId = formValue.filtreClientId;
    if (formValue.filtreAgentId) params.filtreAgentId = formValue.filtreAgentId;
    if (formValue.filtreSecteur) params.filtreSecteur = formValue.filtreSecteur;
    
    return params;
  }

  downloadReport(url: string): void {
    window.open(url, '_blank');
  }
}

