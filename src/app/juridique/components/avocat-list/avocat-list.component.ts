import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { Avocat } from '../../models/avocat.model';
import { AvocatService } from '../../services/avocat.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-avocat-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  templateUrl: './avocat-list.component.html',
  styleUrls: ['./avocat-list.component.scss']
})
export class AvocatListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Table data
  dataSource = new MatTableDataSource<Avocat>([]);
  selection = new SelectionModel<Avocat>(true, []);
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

  // Search and filters
  searchForm: FormGroup;
  searchTerm: string = '';
  selectedSpecialty: string = '';
  showOnlyActive: boolean = false;
  
  // Pagination
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  totalElements = 0;
  currentPage = 0;

  // Loading states
  isLoading: boolean = false;
  isSearching: boolean = false;

  // Available specialties for filter
  specialties: string[] = [
    'Droit civil',
    'Droit commercial',
    'Droit pénal',
    'Droit du travail',
    'Droit fiscal',
    'Droit immobilier',
    'Droit de la famille',
    'Droit des affaires',
    'Droit administratif',
    'Droit international'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private avocatService: AvocatService,
    private toastService: ToastService,
    private fb: FormBuilder,
    @Inject(MatDialog) private dialog: MatDialog
  ) {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      specialty: [''],
      showOnlyActive: [false]
    });
  }

  ngOnInit(): void {
    this.setupSearchForm();
    this.loadAvocats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private setupSearchForm(): void {
    // Debounced search
    this.searchForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.searchTerm = value;
        this.performSearch();
      });

    // Specialty filter
    this.searchForm.get('specialty')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.selectedSpecialty = value;
        this.performSearch();
      });

    // Active filter
    this.searchForm.get('showOnlyActive')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.showOnlyActive = value;
        this.performSearch();
      });
  }

  loadAvocats(): void {
    this.isLoading = true;
    this.avocatService.getAllAvocats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avocats) => {
          this.dataSource.data = avocats;
          this.totalElements = avocats.length;
          this.isLoading = false;
          console.log('✅ Avocats chargés:', avocats.length);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des avocats:', error);
          this.toastService.error('Erreur lors du chargement des avocats');
          this.isLoading = false;
        }
      });
  }

  performSearch(): void {
    this.isSearching = true;
    
    const filters = {
      searchTerm: this.searchTerm,
      specialty: this.selectedSpecialty,
      name: '',
      firstName: '',
      email: '',
      phone: ''
    };

    // Si on a un terme de recherche, on l'utilise pour la recherche globale
    if (this.searchTerm.trim()) {
      filters.searchTerm = this.searchTerm.trim();
    }

    // Si on a une spécialité sélectionnée
    if (this.selectedSpecialty) {
      filters.specialty = this.selectedSpecialty;
    }

    this.avocatService.advancedSearch(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avocats) => {
          let filteredAvocats = avocats;
          
          // Filtre pour les avocats actifs uniquement
          if (this.showOnlyActive) {
            filteredAvocats = avocats.filter(avocat => avocat.actif);
          }

          this.dataSource.data = filteredAvocats;
          this.totalElements = filteredAvocats.length;
          this.isSearching = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors de la recherche:', error);
          this.toastService.error('Erreur lors de la recherche');
          this.isSearching = false;
        }
      });
  }

  clearSearch(): void {
    this.searchForm.patchValue({
      searchTerm: '',
      specialty: '',
      showOnlyActive: false
    });
    this.loadAvocats();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    // La pagination est gérée côté client avec MatTable
  }

  // Selection helpers used by the template
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows && numRows > 0;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.dataSource.data);
    }
  }

  deleteAvocat(avocat: Avocat): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmer la suppression',
        message: `Êtes-vous sûr de vouloir supprimer l'avocat ${avocat.prenom} ${avocat.nom} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.avocatService.deleteAvocat(avocat.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.toastService.success('Avocat supprimé avec succès');
              this.loadAvocats();
            },
            error: (error) => {
              console.error('❌ Erreur lors de la suppression:', error);
              this.toastService.error('Erreur lors de la suppression de l\'avocat');
            }
          });
      }
    });
  }

  // Statut non géré par le backend — action désactivée

  getAvocatInitials(avocat: Avocat): string {
    return `${avocat.prenom.charAt(0)}${avocat.nom.charAt(0)}`.toUpperCase();
  }

  getAvocatFullName(avocat: Avocat): string {
    return `${avocat.prenom} ${avocat.nom}`;
  }

  getStatusColor(actif: boolean): string {
    return actif ? 'primary' : 'warn';
  }

  getStatusText(actif: boolean): string {
    return actif ? 'Actif' : 'Inactif';
  }

  exportToCSV(): void {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `avocats_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private generateCSV(): string {
    const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Spécialité', 'Numéro Ordre', 'Statut'];
    const rows = this.dataSource.data.map((avocat: Avocat) => [
      avocat.nom,
      avocat.prenom,
      avocat.email,
      avocat.telephone || '',
      avocat.specialite || '',
      avocat.numeroOrdre || '',
      avocat.actif ? 'Actif' : 'Inactif'
    ]);

    return [headers, ...rows].map((row: (string | null)[]) => 
      row.map((field: string | null) => `"${field ?? ''}"`).join(',')
    ).join('\n');
  }
}
