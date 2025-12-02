import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FinanceService } from '../../../core/services/finance.service';
import { ToastService } from '../../../core/services/toast.service';
import { 
  PhaseEnqueteDTO, 
  TraitementPossibleDTO,
  TarifDossierRequest,
  StatutTarif,
  PhaseFrais
} from '../../../shared/models/finance.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-validation-tarifs-enquete',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDialogModule
  ],
  templateUrl: './validation-tarifs-enquete.component.html',
  styleUrls: ['./validation-tarifs-enquete.component.scss']
})
export class ValidationTarifsEnqueteComponent implements OnInit, OnDestroy {
  @Input() dossierId!: number;
  @Input() traitements?: PhaseEnqueteDTO;
  @Output() tarifValide = new EventEmitter<void>();

  enquetePrecontentieuse: any;
  traitementsPossibles: TraitementPossibleDTO[] = [];
  totalPhaseEnquete = 0;
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private financeService: FinanceService,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (this.traitements) {
      this.enquetePrecontentieuse = this.traitements.enquetePrecontentieuse;
      this.traitementsPossibles = this.traitements.traitementsPossibles.map(t => ({
        ...t,
        selected: false,
        coutUnitaire: t.tarifExistant?.coutUnitaire || 0,
        quantite: t.tarifExistant?.quantite || 1,
        commentaire: t.tarifExistant?.commentaire || ''
      }));
      this.calculerTotal();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTraitementToggle(traitement: TraitementPossibleDTO, checked: boolean): void {
    traitement.selected = checked;
    if (!checked) {
      traitement.coutUnitaire = 0;
      traitement.quantite = 1;
      traitement.commentaire = '';
    }
  }

  ajouterTarif(traitement: TraitementPossibleDTO): void {
    if (!traitement.coutUnitaire || traitement.coutUnitaire <= 0) {
      this.toastService.warning('Veuillez saisir un coût unitaire valide');
      return;
    }

    this.isLoading = true;
    const tarifRequest: TarifDossierRequest = {
      phase: PhaseFrais.ENQUETE,
      categorie: traitement.type,
      typeElement: traitement.libelle,
      coutUnitaire: traitement.coutUnitaire,
      quantite: traitement.quantite || 1,
      commentaire: traitement.commentaire
    };

    this.financeService.ajouterTarif(this.dossierId, tarifRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifDto) => {
          traitement.tarifExistant = tarifDto;
          traitement.statut = tarifDto.statut;
          traitement.selected = false;
          this.toastService.success('Tarif ajouté avec succès');
          this.calculerTotal();
          this.tarifValide.emit();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout du tarif:', error);
          this.toastService.error(error.message || 'Erreur lors de l\'ajout du tarif');
          this.isLoading = false;
        }
      });
  }

  validerTarifFixe(traitement: any): void {
    if (!traitement.tarifExistant) {
      // Créer le tarif fixe s'il n'existe pas
      const tarifRequest: TarifDossierRequest = {
        phase: PhaseFrais.ENQUETE,
        categorie: 'ENQUETE_PRECONTENTIEUSE',
        typeElement: 'Enquête Précontentieuse',
        coutUnitaire: traitement.fraisFixe || 300,
        quantite: 1,
        commentaire: 'Frais fixe selon annexe'
      };

      this.financeService.ajouterTarif(this.dossierId, tarifRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (tarifDto) => {
            traitement.tarifExistant = tarifDto;
            this.validerTarif(tarifDto);
          },
          error: (error) => {
            this.toastService.error(error.message || 'Erreur lors de la création du tarif');
          }
        });
    } else {
      this.validerTarif(traitement.tarifExistant);
    }
  }

  validerTarif(tarif: any): void {
    this.isLoading = true;
    this.financeService.validerTarif(tarif.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifDto) => {
          // Mettre à jour le tarif dans les traitements
          if (this.enquetePrecontentieuse?.tarifExistant?.id === tarif.id) {
            this.enquetePrecontentieuse.tarifExistant = tarifDto;
            this.enquetePrecontentieuse.statut = tarifDto.statut;
          }
          this.traitementsPossibles.forEach(t => {
            if (t.tarifExistant?.id === tarif.id) {
              t.tarifExistant = tarifDto;
              t.statut = tarifDto.statut;
            }
          });
          this.toastService.success('Tarif validé avec succès');
          this.calculerTotal();
          this.tarifValide.emit();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la validation du tarif:', error);
          this.toastService.error(error.message || 'Erreur lors de la validation du tarif');
          this.isLoading = false;
        }
      });
  }

  ouvrirModalRejet(tarif: any): void {
    const commentaire = prompt('Veuillez saisir un commentaire de rejet :');
    if (commentaire && commentaire.trim()) {
      this.rejeterTarif(tarif, commentaire.trim());
    }
  }

  rejeterTarif(tarif: any, commentaire: string): void {
    this.isLoading = true;
    this.financeService.rejeterTarif(tarif.id, commentaire)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifDto) => {
          // Mettre à jour le tarif dans les traitements
          if (this.enquetePrecontentieuse?.tarifExistant?.id === tarif.id) {
            this.enquetePrecontentieuse.tarifExistant = tarifDto;
            this.enquetePrecontentieuse.statut = tarifDto.statut;
          }
          this.traitementsPossibles.forEach(t => {
            if (t.tarifExistant?.id === tarif.id) {
              t.tarifExistant = tarifDto;
              t.statut = tarifDto.statut;
            }
          });
          this.toastService.success('Tarif rejeté');
          this.calculerTotal();
          this.tarifValide.emit();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du rejet du tarif:', error);
          this.toastService.error(error.message || 'Erreur lors du rejet du tarif');
          this.isLoading = false;
        }
      });
  }

  calculerTotal(): void {
    let total = 0;

    // Frais fixe enquête précontentieuse
    if (this.enquetePrecontentieuse?.tarifExistant?.statut === StatutTarif.VALIDE) {
      total += this.enquetePrecontentieuse.fraisFixe || 300;
    }

    // Traitements additionnels
    this.traitementsPossibles.forEach(t => {
      if (t.tarifExistant?.statut === StatutTarif.VALIDE) {
        total += t.tarifExistant.montantTotal || 0;
      }
    });

    this.totalPhaseEnquete = total;
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case StatutTarif.VALIDE:
        return 'statut-valide';
      case StatutTarif.EN_ATTENTE_VALIDATION:
        return 'statut-attente';
      case StatutTarif.REJETE:
        return 'statut-rejete';
      default:
        return 'statut-attente';
    }
  }
}

