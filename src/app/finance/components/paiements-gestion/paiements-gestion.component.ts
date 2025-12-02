import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PaiementService } from '../../../core/services/paiement.service';
import { Paiement, StatutPaiement, ModePaiement } from '../../../shared/models/finance.models';

@Component({
  selector: 'app-paiements-gestion',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './paiements-gestion.component.html',
  styleUrls: ['./paiements-gestion.component.scss']
})
export class PaiementsGestionComponent implements OnInit, OnDestroy {
  paiements: Paiement[] = [];
  factureId?: number;
  totalPaiements = 0;
  showForm = false;
  
  paiementForm: FormGroup;
  
  displayedColumns: string[] = ['datePaiement', 'montant', 'modePaiement', 'reference', 'statut', 'actions'];
  modesPaiement = Object.values(ModePaiement);
  statuts = Object.values(StatutPaiement);
  
  private destroy$ = new Subject<void>();

  constructor(
    private paiementService: PaiementService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.paiementForm = this.fb.group({
      datePaiement: [new Date(), Validators.required],
      montant: [0, [Validators.required, Validators.min(0.01)]],
      modePaiement: [ModePaiement.VIREMENT, Validators.required],
      reference: [''],
      commentaire: ['']
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.factureId = params['factureId'] ? +params['factureId'] : undefined;
      if (this.factureId) {
        this.loadPaiements();
        this.loadTotal();
      } else {
        this.loadAllPaiements();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPaiements(): void {
    if (!this.factureId) return;

    this.paiementService.getPaiementsByFacture(this.factureId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (paiements) => {
        this.paiements = paiements;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement:', err);
        this.snackBar.open('Erreur lors du chargement des paiements', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadAllPaiements(): void {
    this.paiementService.getAllPaiements().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (paiements) => {
        this.paiements = paiements;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement:', err);
        this.snackBar.open('Erreur lors du chargement des paiements', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadTotal(): void {
    if (!this.factureId) return;

    this.paiementService.calculerTotalPaiementsByFacture(this.factureId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (total) => {
        this.totalPaiements = total;
      },
      error: (err) => {
        console.error('❌ Erreur lors du calcul:', err);
      }
    });
  }

  openForm(): void {
    this.paiementForm.reset({
      datePaiement: new Date(),
      montant: 0,
      modePaiement: ModePaiement.VIREMENT,
      reference: '',
      commentaire: ''
    });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.paiementForm.reset();
  }

  createPaiement(): void {
    if (this.paiementForm.invalid || !this.factureId) return;

    const formValue = this.paiementForm.value;
    const paiementData: Partial<Paiement> = {
      factureId: this.factureId,
      datePaiement: formValue.datePaiement,
      montant: formValue.montant,
      modePaiement: formValue.modePaiement,
      reference: formValue.reference || undefined,
      commentaire: formValue.commentaire || undefined,
      statut: StatutPaiement.EN_ATTENTE
    };

    this.paiementService.createPaiement(paiementData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Paiement créé avec succès', 'Fermer', { duration: 3000 });
        this.closeForm();
        this.loadPaiements();
        this.loadTotal();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors de la création', 'Fermer', { duration: 3000 });
      }
    });
  }

  validerPaiement(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir valider ce paiement ?')) return;

    this.paiementService.validerPaiement(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Paiement validé avec succès', 'Fermer', { duration: 3000 });
        this.loadPaiements();
        this.loadTotal();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors de la validation', 'Fermer', { duration: 3000 });
      }
    });
  }

  refuserPaiement(id: number): void {
    const motif = prompt('Motif du refus :');
    if (!motif || motif.trim() === '') {
      this.snackBar.open('Le motif est obligatoire', 'Fermer', { duration: 3000 });
      return;
    }

    this.paiementService.refuserPaiement(id, motif).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Paiement refusé', 'Fermer', { duration: 3000 });
        this.loadPaiements();
        this.loadTotal();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors du refus', 'Fermer', { duration: 3000 });
      }
    });
  }

  getModePaiementLabel(mode: ModePaiement): string {
    const labels: { [key: string]: string } = {
      'VIREMENT': 'Virement',
      'CHEQUE': 'Chèque',
      'ESPECES': 'Espèces',
      'TRAITE': 'Traite',
      'AUTRE': 'Autre'
    };
    return labels[mode] || mode;
  }

  getStatutLabel(statut: StatutPaiement): string {
    const labels: { [key: string]: string } = {
      'EN_ATTENTE': 'En Attente',
      'VALIDE': 'Validé',
      'REFUSE': 'Refusé'
    };
    return labels[statut] || statut;
  }

  getStatutColor(statut: StatutPaiement): string {
    const colors: { [key: string]: string } = {
      'EN_ATTENTE': 'warn',
      'VALIDE': 'accent',
      'REFUSE': ''
    };
    return colors[statut] || '';
  }
}

