import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FinanceService } from '../../../core/services/finance.service';
import { ToastService } from '../../../core/services/toast.service';
import { PhaseCreationDTO, StatutTarif, PhaseFrais, TarifDossierRequest } from '../../../shared/models/finance.models';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-validation-tarifs-creation',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCheckboxModule],
  template: `
    <div class="phase-creation">
      <h3>Phase Création</h3>
      <div *ngIf="!traitements || !traitements.traitements || traitements.traitements.length === 0" class="no-data">
        <p>Aucun traitement de création trouvé. Le traitement "Ouverture de dossier" (250 TND) sera créé automatiquement.</p>
      </div>
      <div *ngFor="let traitement of traitements?.traitements" class="traitement-item">
        <div class="traitement-info">
          <strong>{{ traitement.type || 'Ouverture de dossier' }}</strong>
          <span class="frais-fixe">{{ traitement.fraisFixe || 250 }} TND (Fixe - Annexé)</span>
        </div>
        <div class="statut-badge" [ngClass]="getStatutClass(traitement.statut || 'EN_ATTENTE_TARIF')">
          {{ traitement.statut === 'VALIDE' ? 'VALIDÉ' : (traitement.statut === 'EN_ATTENTE_VALIDATION' ? 'EN ATTENTE DE VALIDATION' : 'EN ATTENTE DE TARIF') }}
        </div>
        <button *ngIf="(traitement.statut === 'EN_ATTENTE_TARIF' || !traitement.statut) || (traitement.tarifExistant?.statut === 'EN_ATTENTE_VALIDATION')" 
                mat-raised-button
                color="primary"
                (click)="traitement.tarifExistant ? validerTarif(traitement.tarifExistant) : validerTarifFixe(traitement)"
                [disabled]="isLoading">
          <mat-icon>check</mat-icon>
          {{ traitement.tarifExistant ? 'Valider' : 'Créer et Valider' }}
        </button>
        <span *ngIf="traitement.statut === 'VALIDE' || traitement.tarifExistant?.statut === 'VALIDE'" class="valide-badge">
          <mat-icon>check_circle</mat-icon>
          Validé
        </span>
      </div>
    </div>
  `,
  styles: [`
    .phase-creation {
      padding: 24px;
      h3 {
        margin-top: 0;
        color: #333;
        border-bottom: 2px solid #1976d2;
        padding-bottom: 8px;
      }
      .traitement-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background-color: #f5f5f5;
        border-radius: 8px;
        margin-bottom: 16px;
        .traitement-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          strong { color: #333; font-size: 16px; }
          .frais-fixe { color: #666; font-size: 14px; }
        }
        .statut-badge {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          &.statut-valide { background-color: #4caf50; color: white; }
          &.statut-attente { background-color: #ff9800; color: white; }
        }
        .valide-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #4caf50;
          font-weight: 500;
          mat-icon {
            color: #4caf50;
          }
        }
        .no-data {
          padding: 16px;
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
          margin-bottom: 16px;
          p {
            margin: 0;
            color: #856404;
          }
        }
      }
    }
  `]
})
export class ValidationTarifsCreationComponent implements OnDestroy {
  @Input() dossierId!: number;
  @Input() traitements?: PhaseCreationDTO;
  @Output() tarifValide = new EventEmitter<void>();

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

  validerTarifFixe(traitement: any): void {
    if (!traitement.tarifExistant) {
      const tarifRequest: TarifDossierRequest = {
        phase: PhaseFrais.CREATION,
        categorie: 'OUVERTURE_DOSSIER',
        typeElement: 'Ouverture de dossier',
        coutUnitaire: traitement.fraisFixe || 250,
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
          error: (error) => this.toastService.error(error.message || 'Erreur')
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
        next: () => {
          this.toastService.success('Tarif validé');
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

