import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FinanceService } from '../../../core/services/finance.service';
import { ToastService } from '../../../core/services/toast.service';
import { PhaseAmiableDTO, ActionAmiableDTO, StatutTarif, PhaseFrais, TarifDossierRequest } from '../../../shared/models/finance.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-validation-tarifs-amiable',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTableModule, MatInputModule, MatFormFieldModule],
  template: `
    <div class="phase-amiable">
      <h3>Phase Amiable</h3>
      <table mat-table [dataSource]="actionsAmiables" class="mat-elevation-z2">
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>Type</th>
          <td mat-cell *matCellDef="let action">{{ getTypeActionLabel(action.type) }}</td>
        </ng-container>
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let action">{{ action.date | date:'dd/MM/yyyy' }}</td>
        </ng-container>
        <ng-container matColumnDef="occurrences">
          <th mat-header-cell *matHeaderCellDef>Occurrences</th>
          <td mat-cell *matCellDef="let action">{{ action.occurrences }}</td>
        </ng-container>
        <ng-container matColumnDef="coutUnitaire">
          <th mat-header-cell *matHeaderCellDef>Coût unitaire (TND)</th>
          <td mat-cell *matCellDef="let action">
            <input type="number" 
                   [(ngModel)]="action.coutUnitaire"
                   min="0"
                   step="0.01"
                   class="form-control-sm"
                   [readonly]="action.tarifExistant?.statut === 'VALIDE'">
          </td>
        </ng-container>
        <ng-container matColumnDef="montantTotal">
          <th mat-header-cell *matHeaderCellDef>Montant total</th>
          <td mat-cell *matCellDef="let action">
            <strong>{{ calculerMontantTotal(action) }} TND</strong>
          </td>
        </ng-container>
        <ng-container matColumnDef="statut">
          <th mat-header-cell *matHeaderCellDef>Statut</th>
          <td mat-cell *matCellDef="let action">
            <span class="statut-badge" [ngClass]="getStatutClass(action.tarifExistant?.statut || action.statut)">
              {{ action.tarifExistant?.statut || action.statut }}
            </span>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let action">
            <button *ngIf="!action.tarifExistant" 
                    mat-raised-button
                    color="primary"
                    (click)="enregistrerTarif(action)"
                    [disabled]="isLoading || !action.coutUnitaire">
              Enregistrer
            </button>
            <button *ngIf="action.tarifExistant?.statut === 'EN_ATTENTE_VALIDATION'" 
                    mat-raised-button
                    color="primary"
                    (click)="validerTarif(action.tarifExistant)"
                    [disabled]="isLoading">
              Valider
            </button>
            <button *ngIf="action.tarifExistant?.statut === 'EN_ATTENTE_VALIDATION'" 
                    mat-raised-button
                    color="warn"
                    (click)="ouvrirModalRejet(action.tarifExistant)"
                    [disabled]="isLoading">
              Rejeter
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .phase-amiable {
      padding: 24px;
      h3 {
        margin-top: 0;
        color: #333;
        border-bottom: 2px solid #1976d2;
        padding-bottom: 8px;
        margin-bottom: 16px;
      }
      table {
        width: 100%;
        .form-control-sm {
          width: 100px;
          padding: 4px 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .statut-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          &.statut-valide { background-color: #4caf50; color: white; }
          &.statut-attente { background-color: #ff9800; color: white; }
        }
      }
    }
  `]
})
export class ValidationTarifsAmiableComponent implements OnInit, OnDestroy {
  @Input() dossierId!: number;
  @Input() traitements?: PhaseAmiableDTO;
  @Output() tarifValide = new EventEmitter<void>();

  actionsAmiables: ActionAmiableDTO[] = [];
  displayedColumns = ['type', 'date', 'occurrences', 'coutUnitaire', 'montantTotal', 'statut', 'actions'];
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private financeService: FinanceService,
    private toastService: ToastService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    if (this.traitements) {
      this.actionsAmiables = (this.traitements.actions || []).map(action => {
        // Le backend retourne maintenant coutUnitaire selon la priorité :
        // 1. Si tarif existe : tarif.getCoutUnitaire() (BigDecimal -> number)
        // 2. Sinon, si action.getCoutUnitaire() != null && > 0 : BigDecimal.valueOf(action.getCoutUnitaire()) -> number
        // 3. Sinon : null (le chef devra saisir)
        // Le backend fait déjà la conversion Double -> BigDecimal, et le service fait BigDecimal -> number
        // On s'assure juste que le type est correct pour l'affichage
        if (action.coutUnitaire != null) {
          // Convertir en number si nécessaire
          action.coutUnitaire = typeof action.coutUnitaire === 'string' 
            ? parseFloat(action.coutUnitaire) 
            : Number(action.coutUnitaire);
        } else if (action.tarifExistant?.coutUnitaire) {
          // Fallback : utiliser celui du tarif si l'action n'en a pas
          action.coutUnitaire = typeof action.tarifExistant.coutUnitaire === 'string'
            ? parseFloat(action.tarifExistant.coutUnitaire)
            : Number(action.tarifExistant.coutUnitaire);
        }
        return action;
      });
      console.log('✅ Actions amiables chargées avec coûts unitaires (backend priorité appliquée):', this.actionsAmiables);
    }
  }

  getTypeActionLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'APPEL_TELEPHONIQUE': 'Appel téléphonique',
      'APPEL': 'Appel',
      'EMAIL': 'Email',
      'LETTRE': 'Lettre',
      'RELANCE': 'Relance',
      'VISITE': 'Visite'
    };
    return labels[type] || type;
  }

  calculerMontantTotal(action: ActionAmiableDTO): number {
    // Utiliser le coût unitaire de l'action ou celui du tarif existant
    const coutUnitaire = action.coutUnitaire || action.tarifExistant?.coutUnitaire || 0;
    return coutUnitaire * (action.occurrences || 1);
  }

  enregistrerTarif(action: ActionAmiableDTO): void {
    if (!action.coutUnitaire || action.coutUnitaire <= 0) {
      this.toastService.warning('Veuillez saisir un coût unitaire valide');
      return;
    }

    this.isLoading = true;
    const tarifRequest: TarifDossierRequest = {
      phase: PhaseFrais.AMIABLE,
      categorie: 'ACTION_AMIABLE',
      typeElement: action.type,
      coutUnitaire: action.coutUnitaire,
      quantite: action.occurrences,
      elementId: action.id
    };

    this.financeService.ajouterTarif(this.dossierId, tarifRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifDto) => {
          // Mettre à jour l'action avec le tarif créé
          action.tarifExistant = tarifDto;
          action.statut = tarifDto.statut;
          this.toastService.success('Tarif enregistré. Vous pouvez maintenant le valider.');
          // Ne pas émettre tarifValide ici pour rester dans la même interface
          // L'utilisateur peut maintenant valider le tarif immédiatement
          this.isLoading = false;
        },
        error: (error) => {
          this.toastService.error(error.message || 'Erreur');
          this.isLoading = false;
        }
      });
  }

  validerTarif(tarif: any): void {
    this.isLoading = true;
    this.financeService.validerTarif(tarif.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifDto) => {
          // Mettre à jour toutes les actions avec le tarif validé
          this.actionsAmiables.forEach(a => {
            if (a.tarifExistant?.id === tarif.id) {
              a.tarifExistant = tarifDto;
              a.statut = tarifDto.statut;
            }
          });
          this.toastService.success('Tarif validé avec succès');
          // Émettre l'événement seulement après validation pour mettre à jour les totaux
          this.tarifValide.emit();
          this.isLoading = false;
        },
        error: (error) => {
          this.toastService.error(error.message || 'Erreur');
          this.isLoading = false;
        }
      });
  }

  ouvrirModalRejet(tarif: any): void {
    const commentaire = prompt('Commentaire de rejet :');
    if (commentaire) {
      this.rejeterTarif(tarif, commentaire);
    }
  }

  rejeterTarif(tarif: any, commentaire: string): void {
    this.isLoading = true;
    this.financeService.rejeterTarif(tarif.id, commentaire)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifDto) => {
          this.actionsAmiables.forEach(a => {
            if (a.tarifExistant?.id === tarif.id) {
              a.tarifExistant = tarifDto;
            }
          });
          this.toastService.success('Tarif rejeté');
          this.tarifValide.emit();
          this.isLoading = false;
        },
        error: (error) => {
          this.toastService.error(error.message || 'Erreur');
          this.isLoading = false;
        }
      });
  }

  getStatutClass(statut: string): string {
    return statut === StatutTarif.VALIDE ? 'statut-valide' : 'statut-attente';
  }
}

