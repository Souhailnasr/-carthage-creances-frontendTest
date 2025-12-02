import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FinanceService } from '../../../core/services/finance.service';
import { ToastService } from '../../../core/services/toast.service';
import { PhaseJuridiqueDTO, StatutTarif, PhaseFrais, TarifDossierRequest } from '../../../shared/models/finance.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-validation-tarifs-juridique',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule
  ],
  template: `
    <div class="phase-juridique">
      <h3>Phase Juridique</h3>
      <mat-tab-group>
        <mat-tab label="Documents Huissier">
          <table mat-table [dataSource]="documentsHuissier" class="mat-elevation-z2">
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let doc">{{ doc.type }}</td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let doc">{{ doc.date | date:'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="coutUnitaire">
              <th mat-header-cell *matHeaderCellDef>Coût unitaire</th>
              <td mat-cell *matCellDef="let doc">
                <input type="number" [(ngModel)]="doc.coutUnitaire" min="0" step="0.01" 
                       [readonly]="doc.tarifExistant?.statut === 'VALIDE'">
              </td>
            </ng-container>
            <ng-container matColumnDef="statut">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let doc">
                <span class="statut-badge" [ngClass]="getStatutClass(doc.tarifExistant?.statut || doc.statut)">
                  {{ doc.tarifExistant?.statut || doc.statut }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let doc">
                <button *ngIf="!doc.tarifExistant" mat-raised-button color="primary" 
                        (click)="enregistrerTarifDocument(doc)">Enregistrer</button>
                <button *ngIf="doc.tarifExistant?.statut === 'EN_ATTENTE_VALIDATION'" 
                        mat-raised-button color="primary" (click)="validerTarif(doc.tarifExistant)">Valider</button>
                <button *ngIf="doc.tarifExistant?.statut === 'EN_ATTENTE_VALIDATION'" 
                        mat-raised-button color="warn" (click)="rejeterTarif(doc.tarifExistant)">Rejeter</button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="docColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: docColumns;"></tr>
          </table>
        </mat-tab>
        <mat-tab label="Actions Huissier">
          <table mat-table [dataSource]="actionsHuissier" class="mat-elevation-z2">
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let action">{{ action.type }}</td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let action">{{ action.date | date:'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="coutUnitaire">
              <th mat-header-cell *matHeaderCellDef>Coût unitaire</th>
              <td mat-cell *matCellDef="let action">
                <input type="number" [(ngModel)]="action.coutUnitaire" min="0" step="0.01"
                       [readonly]="action.tarifExistant?.statut === 'VALIDE'">
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
                <button *ngIf="!action.tarifExistant" mat-raised-button color="primary" 
                        (click)="enregistrerTarifAction(action)">Enregistrer</button>
                <button *ngIf="action.tarifExistant?.statut === 'EN_ATTENTE_VALIDATION'" 
                        mat-raised-button color="primary" (click)="validerTarif(action.tarifExistant)">Valider</button>
                <button *ngIf="action.tarifExistant?.statut === 'EN_ATTENTE_VALIDATION'" 
                        mat-raised-button color="warn" (click)="rejeterTarif(action.tarifExistant)">Rejeter</button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="actionColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: actionColumns;"></tr>
          </table>
        </mat-tab>
        <mat-tab label="Audiences">
          <table mat-table [dataSource]="audiences" class="mat-elevation-z2">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let aud">{{ aud.date | date:'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let aud">{{ aud.type }}</td>
            </ng-container>
            <ng-container matColumnDef="avocat">
              <th mat-header-cell *matHeaderCellDef>Avocat</th>
              <td mat-cell *matCellDef="let aud">{{ aud.avocatNom || 'N/A' }}</td>
            </ng-container>
            <ng-container matColumnDef="coutAudience">
              <th mat-header-cell *matHeaderCellDef>Coût audience</th>
              <td mat-cell *matCellDef="let aud">
                <input type="number" [(ngModel)]="aud.coutAudience" min="0" step="0.01"
                       [readonly]="aud.tarifAudience?.statut === 'VALIDE'">
              </td>
            </ng-container>
            <ng-container matColumnDef="coutAvocat">
              <th mat-header-cell *matHeaderCellDef>Honoraires avocat</th>
              <td mat-cell *matCellDef="let aud">
                <input type="number" [(ngModel)]="aud.coutAvocat" min="0" step="0.01"
                       [readonly]="aud.tarifAvocat?.statut === 'VALIDE'">
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let aud">
                <button *ngIf="!aud.tarifAudience" mat-raised-button color="primary" 
                        (click)="enregistrerTarifAudience(aud)">Enregistrer</button>
                <button *ngIf="aud.tarifAudience?.statut === 'EN_ATTENTE_VALIDATION'" 
                        mat-raised-button color="primary" (click)="validerTarif(aud.tarifAudience)">Valider</button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="audienceColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: audienceColumns;"></tr>
          </table>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .phase-juridique {
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
        margin-top: 16px;
        input {
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
export class ValidationTarifsJuridiqueComponent implements OnInit, OnDestroy {
  @Input() dossierId!: number;
  @Input() traitements?: PhaseJuridiqueDTO;
  @Output() tarifValide = new EventEmitter<void>();

  documentsHuissier: any[] = [];
  actionsHuissier: any[] = [];
  audiences: any[] = [];
  docColumns = ['type', 'date', 'coutUnitaire', 'statut', 'actions'];
  actionColumns = ['type', 'date', 'coutUnitaire', 'statut', 'actions'];
  audienceColumns = ['date', 'type', 'avocat', 'coutAudience', 'coutAvocat', 'actions'];
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
      this.documentsHuissier = this.traitements.documentsHuissier || [];
      this.actionsHuissier = this.traitements.actionsHuissier || [];
      this.audiences = this.traitements.audiences || [];
    }
  }

  enregistrerTarifDocument(doc: any): void {
    if (!doc.coutUnitaire || doc.coutUnitaire <= 0) {
      this.toastService.warning('Veuillez saisir un coût unitaire valide');
      return;
    }
    this.isLoading = true;
    const tarifRequest: TarifDossierRequest = {
      phase: PhaseFrais.JURIDIQUE,
      categorie: 'DOCUMENT_HUISSIER',
      typeElement: doc.type,
      coutUnitaire: doc.coutUnitaire,
      quantite: 1,
      elementId: doc.id
    };
    this.financeService.ajouterTarif(this.dossierId, tarifRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifDto) => {
          doc.tarifExistant = tarifDto;
          this.toastService.success('Tarif enregistré. Vous pouvez maintenant le valider.');
          // Ne pas émettre tarifValide ici pour rester dans la même interface
          this.isLoading = false;
        },
        error: (error) => {
          this.toastService.error(error.message || 'Erreur');
          this.isLoading = false;
        }
      });
  }

  enregistrerTarifAction(action: any): void {
    if (!action.coutUnitaire || action.coutUnitaire <= 0) {
      this.toastService.warning('Veuillez saisir un coût unitaire valide');
      return;
    }
    this.isLoading = true;
    const tarifRequest: TarifDossierRequest = {
      phase: PhaseFrais.JURIDIQUE,
      categorie: 'ACTION_HUISSIER',
      typeElement: action.type,
      coutUnitaire: action.coutUnitaire,
      quantite: 1,
      elementId: action.id
    };
    this.financeService.ajouterTarif(this.dossierId, tarifRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifDto) => {
          action.tarifExistant = tarifDto;
          this.toastService.success('Tarif enregistré. Vous pouvez maintenant le valider.');
          // Ne pas émettre tarifValide ici pour rester dans la même interface
          this.isLoading = false;
        },
        error: (error) => {
          this.toastService.error(error.message || 'Erreur');
          this.isLoading = false;
        }
      });
  }

  enregistrerTarifAudience(aud: any): void {
    if (!aud.coutAudience || aud.coutAudience <= 0) {
      this.toastService.warning('Veuillez saisir un coût d\'audience valide');
      return;
    }
    this.isLoading = true;
    // Créer tarif pour l'audience
    const tarifAudience: TarifDossierRequest = {
      phase: PhaseFrais.JURIDIQUE,
      categorie: 'AUDIENCE',
      typeElement: aud.type,
      coutUnitaire: aud.coutAudience,
      quantite: 1,
      elementId: aud.id
    };
    this.financeService.ajouterTarif(this.dossierId, tarifAudience)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifDto) => {
          aud.tarifAudience = tarifDto;
          // Si avocat, créer aussi le tarif avocat
          if (aud.avocatId && aud.coutAvocat && aud.coutAvocat > 0) {
            const tarifAvocat: TarifDossierRequest = {
              phase: PhaseFrais.JURIDIQUE,
              categorie: 'HONORAIRES_AVOCAT',
              typeElement: 'Honoraires Avocat',
              coutUnitaire: aud.coutAvocat,
              quantite: 1,
              elementId: aud.id
            };
            this.financeService.ajouterTarif(this.dossierId, tarifAvocat)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (tarifAvocatDto) => {
                  aud.tarifAvocat = tarifAvocatDto;
                  this.toastService.success('Tarifs enregistrés. Vous pouvez maintenant les valider.');
                  // Ne pas émettre tarifValide ici pour rester dans la même interface
                  this.isLoading = false;
                },
                error: () => {
                  this.toastService.success('Tarif audience enregistré. Vous pouvez maintenant le valider.');
                  // Ne pas émettre tarifValide ici pour rester dans la même interface
                  this.isLoading = false;
                }
              });
          } else {
            this.toastService.success('Tarif enregistré. Vous pouvez maintenant le valider.');
            // Ne pas émettre tarifValide ici pour rester dans la même interface
            this.isLoading = false;
          }
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

  rejeterTarif(tarif: any): void {
    const commentaire = prompt('Commentaire de rejet :');
    if (!commentaire) return;
    this.isLoading = true;
    this.financeService.rejeterTarif(tarif.id, commentaire)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
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

