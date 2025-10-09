import { Component, OnInit, OnDestroy, AfterViewInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// MatSnackBarModule not needed in standalone components
import { SelectionModel } from '@angular/cdk/collections';
import { debounceTime, distinctUntilChanged, takeUntil, Subject } from 'rxjs';

import { HuissierService } from '../../services/huissier.service';
import { ToastService } from '../../../core/services/toast.service';
import { Huissier } from '../../models/huissier.model';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-huissier-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
  ],
  templateUrl: './huissier-list.component.html',
  styleUrls: ['./huissier-list.component.scss']
})
export class HuissierListComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = [
    'select',
    'nom',
    'prenom',
    'email',
    'telephone',
    'specialite',
    'numeroOrdre',
    'actions'
  ];

  dataSource = new MatTableDataSource<Huissier>([]);
  selection = new SelectionModel<Huissier>(true, []);
  searchForm!: FormGroup;
  isLoading = false;
  totalCount = 0;

  // Specialties for filter
  specialties: string[] = [
    'Signification',
    'Saisie',
    'Expulsion',
    'Recouvrement',
    'Autre'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private huissierService: HuissierService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private router: Router,
    @Inject(MatDialog) private dialog: MatDialog
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupFormValidation();
    this.loadHuissiers();
  }

  ngAfterViewInit(): void {
    // MatTableDataSource setup will be done in loadHuissiers
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      specialty: [''],
      withDossiers: [false],
      withoutDossiers: [false]
    });
  }

  private setupFormValidation(): void {
    // Global search with debounce
    this.searchForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });

    // Specialty filter
    this.searchForm.get('specialty')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });

    // Dossier filters
    this.searchForm.get('withDossiers')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });

    this.searchForm.get('withoutDossiers')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  loadHuissiers(): void {
    this.isLoading = true;
    this.huissierService.getAllHuissiers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (huissiers) => {
          this.dataSource.data = huissiers;
          this.totalCount = huissiers.length;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des huissiers:', error);
          this.toastService.error('Erreur lors du chargement des huissiers');
          this.isLoading = false;
        }
      });
  }

  applyFilters(): void {
    const formValue = this.searchForm.value;
    let filteredData = [...this.dataSource.data];

    // Apply search term filter
    if (formValue.searchTerm) {
      const searchTerm = formValue.searchTerm.toLowerCase();
      filteredData = filteredData.filter(huissier =>
        huissier.nom.toLowerCase().includes(searchTerm) ||
        huissier.prenom.toLowerCase().includes(searchTerm) ||
        huissier.email.toLowerCase().includes(searchTerm) ||
        (huissier.specialite && huissier.specialite.toLowerCase().includes(searchTerm))
      );
    }

    // Apply specialty filter
    if (formValue.specialty) {
      filteredData = filteredData.filter(huissier =>
        huissier.specialite === formValue.specialty
      );
    }

    // Apply dossier filters (these would need backend implementation)
    if (formValue.withDossiers) {
      // This would require backend support
      this.huissierService.getHuissiersWithDossiers()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (huissiers) => {
            this.dataSource.data = huissiers;
            this.totalCount = huissiers.length;
          },
          error: (error) => {
            console.error('❌ Erreur lors du chargement des huissiers avec dossiers:', error);
          }
        });
      return;
    }

    if (formValue.withoutDossiers) {
      // This would require backend support
      this.huissierService.getHuissiersWithoutDossiers()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (huissiers) => {
            this.dataSource.data = huissiers;
            this.totalCount = huissiers.length;
          },
          error: (error) => {
            console.error('❌ Erreur lors du chargement des huissiers sans dossiers:', error);
          }
        });
      return;
    }

    this.dataSource.data = filteredData;
    this.totalCount = filteredData.length;
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.loadHuissiers();
  }

  addHuissier(): void {
    this.router.navigate(['/juridique/huissiers/add']);
  }

  editHuissier(huissier: Huissier): void {
    if (huissier.id) {
      this.router.navigate(['/juridique/huissiers/edit', huissier.id]);
    }
  }

  viewHuissier(huissier: Huissier): void {
    if (huissier.id) {
      this.router.navigate(['/juridique/huissiers', huissier.id]);
    }
  }

  deleteHuissier(huissier: Huissier): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmer la suppression',
        message: `Êtes-vous sûr de vouloir supprimer le huissier ${huissier.prenom} ${huissier.nom} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result && huissier.id) {
        this.isLoading = true;
        this.huissierService.deleteHuissier(huissier.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.toastService.success('Huissier supprimé avec succès');
              this.loadHuissiers();
              this.isLoading = false;
            },
            error: (error) => {
              console.error('❌ Erreur lors de la suppression:', error);
              this.toastService.error('Erreur lors de la suppression du huissier');
              this.isLoading = false;
            }
          });
      }
    });
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows && numRows > 0;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
  }

  // Export functionality
  exportToCSV(): void {
    const data = this.dataSource.data;
    const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Spécialité', 'N° Ordre'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(huissier => [
        huissier.nom,
        huissier.prenom,
        huissier.email,
        huissier.telephone || '',
        huissier.specialite || '',
        huissier.numeroOrdre || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `huissiers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Utility methods
  getStatusColor(actif: boolean): string {
    return actif ? 'primary' : 'warn';
  }

  getStatusText(actif: boolean): string {
    return actif ? 'Actif' : 'Inactif';
  }

  getStatusIcon(actif: boolean): string {
    return actif ? 'check_circle' : 'cancel';
  }
}