import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChefFinanceService } from '../../../core/services/chef-finance.service';
import { FraisImportColumnMapping, FraisImportPreviewRow, FraisImportReport } from '../../models/finance-feature.interfaces';

@Component({
  selector: 'app-frais-import',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatStepperModule,
    FormsModule
  ],
  templateUrl: './frais-import.component.html',
  styleUrls: ['./frais-import.component.scss']
})
export class FraisImportComponent implements OnInit, OnDestroy {
  selectedFile: File | null = null;
  csvHeaders: string[] = [];
  previewRows: FraisImportPreviewRow[] = [];
  mapping: FraisImportColumnMapping = {
    dossierId: '',
    phase: '',
    categorie: '',
    quantite: '',
    tarifUnitaire: '',
    fournisseur: '',
    date: ''
  };
  
  importReport: FraisImportReport | null = null;
  loading = false;
  
  displayedColumns: string[] = ['dossierId', 'phase', 'categorie', 'quantite', 'tarifUnitaire', 'fournisseur', 'date', 'valid', 'erreurs'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private financeService: ChefFinanceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.parseCsv();
    }
  }

  parseCsv(): void {
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      
      if (lines.length > 0) {
        this.csvHeaders = lines[0].split(',').map(h => h.trim());
      }
    };
    reader.readAsText(this.selectedFile);
  }

  validateMapping(): void {
    // Simuler la validation et l'aperçu
    this.loading = true;
    setTimeout(() => {
      // TODO: Appeler l'endpoint de validation du backend
      this.previewRows = [
        {
          dossierId: 1,
          phase: 'AMIABLE',
          categorie: 'APPEL',
          quantite: 2,
          tarifUnitaire: 10.5,
          fournisseur: 'Fournisseur A',
          date: '2025-01-15',
          valid: true
        }
      ];
      this.loading = false;
    }, 1000);
  }

  importFrais(): void {
    if (!this.selectedFile) return;

    this.loading = true;
    this.financeService.importFraisCSV(this.selectedFile).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (report) => {
        this.importReport = {
          totalRows: (report.succes?.length || 0) + (report.erreurs?.length || 0),
          successCount: report.success || (report.succes?.length || 0),
          errorCount: report.errors || (report.erreurs?.length || 0),
          errors: (report.erreurs || []).map((e: any, i: number) => ({
            row: i + 1,
            message: e.message || e.erreur || 'Erreur inconnue'
          }))
        };
        this.loading = false;
        this.snackBar.open('Import terminé', 'Fermer', { duration: 3000 });
      },
      error: (err) => {
        console.error('❌ Erreur lors de l\'import:', err);
        this.snackBar.open('Erreur lors de l\'import', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  reset(): void {
    this.selectedFile = null;
    this.csvHeaders = [];
    this.previewRows = [];
    this.mapping = {
      dossierId: '',
      phase: '',
      categorie: '',
      quantite: '',
      tarifUnitaire: '',
      fournisseur: '',
      date: ''
    };
    this.importReport = null;
  }
}



