import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
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
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { PaiementService } from '../../../core/services/paiement.service';
import { FactureService } from '../../../core/services/facture.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { Paiement, StatutPaiement, ModePaiement, Facture } from '../../../shared/models/finance.models';

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
  facture: Facture | null = null;
  dossierId?: number;
  totalPaiements = 0;
  montantRestant = 0;
  estEntierementPayee = false;
  peutCloturer = false;
  showForm = false;
  loading = false;
  
  paiementForm: FormGroup;
  
  displayedColumns: string[] = ['datePaiement', 'montant', 'modePaiement', 'reference', 'statut', 'actions'];
  modesPaiement = Object.values(ModePaiement);
  statuts = Object.values(StatutPaiement);
  
  private destroy$ = new Subject<void>();

  constructor(
    private paiementService: PaiementService,
    private factureService: FactureService,
    private dossierApiService: DossierApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private dialog: MatDialog
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
        this.loadSoldeFacture(); // ✅ Utiliser la nouvelle méthode optimisée
        this.loadPaiements();
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
        // Recalculer le total manuellement après chargement
        this.calculerTotalManuel();
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

  /**
   * Charger le solde de la facture (remplace loadFacture + loadTotal)
   * Utilise le nouvel endpoint backend qui retourne toutes les infos en une seule requête
   */
  loadSoldeFacture(): void {
    if (!this.factureId) return;

    this.factureService.getSoldeFacture(this.factureId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (solde) => {
        // Mettre à jour toutes les propriétés en une seule fois
        this.totalPaiements = solde.totalPaiementsValides;
        this.montantRestant = solde.soldeRestant;
        this.estEntierementPayee = solde.estEntierementPayee;
        
        // Charger la facture pour obtenir les autres infos (numéro, statut, dossierId, etc.)
        this.loadFacture();
        
        // Vérifier si le dossier peut être clôturé
        this.verifierPeutCloturer();
      },
      error: (err) => {
        console.warn('⚠️ Endpoint /solde non disponible, utilisation des méthodes existantes');
        // Fallback : utiliser les méthodes existantes
        this.loadFacture();
        this.loadTotal();
      }
    });
  }

  /**
   * Charger la facture pour obtenir le montant TTC et le dossierId
   */
  loadFacture(): void {
    if (!this.factureId) return;

    this.factureService.getFactureById(this.factureId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (facture) => {
        this.facture = facture;
        this.dossierId = facture.dossierId;
        // Si le solde n'a pas été chargé, calculer le montant restant
        if (this.totalPaiements === 0 && this.montantRestant === 0) {
          this.calculerMontantRestant();
        }
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement de la facture:', err);
        this.snackBar.open('Erreur lors du chargement de la facture', 'Fermer', { duration: 3000 });
      }
    });
  }

  /**
   * Charger le total des paiements validés
   */
  loadTotal(): void {
    if (!this.factureId) return;

    this.paiementService.calculerTotalPaiementsByFacture(this.factureId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (total) => {
        this.totalPaiements = total;
        this.calculerMontantRestant();
        this.verifierPeutCloturer();
      },
      error: (err) => {
        console.error('❌ Erreur lors du calcul:', err);
        // Calculer manuellement depuis les paiements chargés
        this.calculerTotalManuel();
      }
    });
  }

  /**
   * Calculer le total manuellement depuis les paiements chargés
   */
  private calculerTotalManuel(): void {
    this.totalPaiements = this.paiements
      .filter(p => p.statut === StatutPaiement.VALIDE)
      .reduce((sum, p) => sum + (p.montant || 0), 0);
    this.calculerMontantRestant();
    this.verifierPeutCloturer();
  }

  /**
   * Calculer le montant restant à payer
   */
  calculerMontantRestant(): void {
    if (!this.facture) {
      this.montantRestant = 0;
      this.estEntierementPayee = false;
      return;
    }

    this.montantRestant = Math.max(0, this.facture.montantTTC - this.totalPaiements);
    this.estEntierementPayee = this.montantRestant <= 0;
  }

  /**
   * Vérifier si le dossier peut être clôturé
   */
  verifierPeutCloturer(): void {
    this.peutCloturer = this.estEntierementPayee 
      && this.facture?.statut === 'PAYEE' 
      && !!this.dossierId;
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

    this.loading = true;
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
        // Recharger le solde pour mettre à jour les informations
        if (this.factureId) {
          this.loadSoldeFacture();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors de la création', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  validerPaiement(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir valider ce paiement ?')) return;

    this.loading = true;
    this.paiementService.validerPaiement(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Paiement validé avec succès', 'Fermer', { duration: 3000 });
        this.loadPaiements();
        // Recharger le solde pour vérifier le nouveau statut
        if (this.factureId) {
          this.loadSoldeFacture();
        }
        // Vérifier si le dossier peut être clôturé après validation
        if (this.dossierId) {
          setTimeout(() => this.verifierPeutCloturerDossier(), 1000);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors de la validation', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  refuserPaiement(id: number): void {
    const motif = prompt('Motif du refus :');
    if (!motif || motif.trim() === '') {
      this.snackBar.open('Le motif est obligatoire', 'Fermer', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.paiementService.refuserPaiement(id, motif).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Paiement refusé', 'Fermer', { duration: 3000 });
        this.loadPaiements();
        // Recharger le solde pour mettre à jour les informations
        if (this.factureId) {
          this.loadSoldeFacture();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.snackBar.open('Erreur lors du refus', 'Fermer', { duration: 3000 });
        this.loading = false;
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

  /**
   * Clôturer et archiver le dossier
   */
  cloturerEtArchiverDossier(): void {
    if (!this.dossierId) {
      this.snackBar.open('Dossier ID manquant', 'Fermer', { duration: 3000 });
      return;
    }

    const message = `Êtes-vous sûr de vouloir clôturer et archiver le dossier #${this.dossierId} ?\n\n` +
      `Cette action est irréversible et le dossier sera archivé.`;
    
    if (!confirm(message)) return;

    this.loading = true;
    // Appel backend pour clôturer et archiver
    this.dossierApiService.cloturerEtArchiverDossier(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.snackBar.open('Dossier clôturé et archivé avec succès', 'Fermer', { duration: 5000 });
        // Rediriger vers la liste des dossiers ou le dashboard
        this.router.navigate(['/finance/mes-dossiers']);
      },
      error: (err) => {
        console.error('❌ Erreur lors de la clôture:', err);
        const errorMessage = err.error?.message || err.message || 'Erreur lors de la clôture du dossier';
        this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  /**
   * Vérifier si le dossier peut être clôturé (méthode appelée après chargement)
   */
  verifierPeutCloturerDossier(): void {
    if (!this.dossierId) {
      this.peutCloturer = false;
      return;
    }

    // Appel backend pour vérifier les préconditions
    this.dossierApiService.peutEtreCloture(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.peutCloturer = response.peutEtreCloture || false;
        // Si le backend confirme, utiliser ses données
        if (response.montantTTC !== undefined && response.totalPaiementsValides !== undefined) {
          this.totalPaiements = response.totalPaiementsValides;
          this.montantRestant = response.soldeRestant || 0;
          this.estEntierementPayee = response.peutEtreCloture;
        }
      },
      error: (err) => {
        console.warn('⚠️ Endpoint backend non disponible, utilisation de la logique locale');
        // En cas d'erreur (endpoint non implémenté), utiliser la logique locale
        this.verifierPeutCloturer();
      }
    });
  }
}

