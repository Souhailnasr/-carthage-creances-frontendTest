import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TarifCatalogueService } from '../../../core/services/tarif-catalogue.service';
import { TarifCatalogue, PhaseFrais } from '../../../shared/models/finance.models';

@Component({
  selector: 'app-tarif-catalogue',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './tarif-catalogue.component.html',
  styleUrls: ['./tarif-catalogue.component.scss']
})
export class TarifCatalogueComponent implements OnInit, OnDestroy {
  tarifs: TarifCatalogue[] = [];
  loading = false;
  showForm = false;
  editingTarif: TarifCatalogue | null = null;
  
  tarifForm: FormGroup;
  simulationForm: FormGroup;
  simulationResult: { coutTotal: number } | null = null;
  
  displayedColumns: string[] = ['phase', 'categorie', 'tarif', 'devise', 'dateEffet', 'dateFin', 'actif', 'actions'];
  
  private destroy$ = new Subject<void>();

  phases = Object.values(PhaseFrais);

  constructor(
    private tarifService: TarifCatalogueService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.tarifForm = this.fb.group({
      phase: ['', Validators.required],
      categorie: ['', Validators.required],
      tarif: [0, [Validators.required, Validators.min(0)]],
      devise: ['TND', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['']
    });

    this.simulationForm = this.fb.group({
      phase: ['', Validators.required],
      categorie: ['', Validators.required],
      occurrences: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadTarifs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTarifs(): void {
    this.loading = true;
    this.tarifService.getAllTarifs().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (tarifs) => {
        this.tarifs = tarifs;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement:', err);
        this.snackBar.open('Erreur lors du chargement des tarifs', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  openForm(tarif?: TarifCatalogue): void {
    this.editingTarif = tarif || null;
    if (tarif) {
      this.tarifForm.patchValue({
        phase: tarif.phase,
        categorie: tarif.categorie,
        tarif: tarif.tarifUnitaire,
        devise: tarif.devise,
        dateDebut: tarif.dateDebut,
        dateFin: tarif.dateFin
      });
    } else {
      this.tarifForm.reset({
        devise: 'TND'
      });
    }
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingTarif = null;
    this.tarifForm.reset({ devise: 'TND' });
  }

  saveTarif(): void {
    if (this.tarifForm.invalid) return;

    const formValue = this.tarifForm.value;
    const tarifData: Partial<TarifCatalogue> = {
      phase: formValue.phase,
      categorie: formValue.categorie,
      tarifUnitaire: formValue.tarif,
      devise: formValue.devise,
      dateDebut: formValue.dateDebut,
      dateFin: formValue.dateFin || undefined,
      actif: true
    };

    const operation = this.editingTarif && this.editingTarif.id
      ? this.tarifService.updateTarif(this.editingTarif.id, tarifData)
      : this.tarifService.createTarif(tarifData);

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open(
          this.editingTarif ? 'Tarif modifié avec succès' : 'Tarif créé avec succès',
          'Fermer',
          { duration: 3000 }
        );
        this.closeForm();
        this.loadTarifs();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
      }
    });
  }

  deleteTarif(tarifId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) return;

    this.tarifService.deleteTarif(tarifId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Tarif supprimé avec succès', 'Fermer', { duration: 3000 });
        this.loadTarifs();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
      }
    });
  }

  desactiverTarif(tarifId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir désactiver ce tarif ?')) return;

    this.tarifService.desactiverTarif(tarifId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Tarif désactivé avec succès', 'Fermer', { duration: 3000 });
        this.loadTarifs();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors de la désactivation', 'Fermer', { duration: 3000 });
      }
    });
  }

  voirHistorique(tarifId: number): void {
    this.tarifService.getHistoriqueTarif(tarifId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (historique) => {
        console.log('Historique:', historique);
        // Afficher dans un modal ou dialog
        this.snackBar.open(`Historique chargé (${historique.length} versions)`, 'Fermer', { duration: 3000 });
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors du chargement de l\'historique', 'Fermer', { duration: 3000 });
      }
    });
  }

  simulerCout(): void {
    if (this.simulationForm.invalid) return;

    const formValue = this.simulationForm.value;
    // Calcul simple côté client
    const tarif = this.tarifs.find(t => 
      t.phase === formValue.phase && 
      t.categorie === formValue.categorie && 
      t.actif
    );
    
    if (tarif) {
      this.simulationResult = {
        coutTotal: tarif.tarifUnitaire * formValue.occurrences
      };
    } else {
      this.snackBar.open('Tarif non trouvé pour cette phase et catégorie', 'Fermer', { duration: 3000 });
    }
  }
}



