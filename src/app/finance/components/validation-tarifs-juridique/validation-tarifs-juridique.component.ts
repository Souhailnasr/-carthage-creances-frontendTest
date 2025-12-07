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
            <ng-container matColumnDef="statut">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let aud">
                <span class="statut-badge" [ngClass]="getStatutClassAudience(aud)">
                  {{ getStatutDisplayValueAudience(aud) }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let aud">
                <div class="action-buttons">
                  <!-- Bouton Enregistrer pour l'audience -->
                  <button *ngIf="!aud.tarifAudience" mat-raised-button color="primary" 
                          (click)="enregistrerTarifAudience(aud)"
                          [disabled]="isLoading">
                    Enregistrer
                  </button>
                  <!-- Bouton Valider pour l'audience -->
                  <button *ngIf="aud.tarifAudience?.statut === 'EN_ATTENTE_VALIDATION'" 
                          mat-raised-button color="primary" 
                          (click)="validerTarifAudience(aud)"
                          [disabled]="isLoading">
                    Valider Audience
                  </button>
                  <!-- Bouton Valider pour les honoraires d'avocat -->
                  <button *ngIf="peutValiderTarifAvocat(aud)" 
                          mat-raised-button color="accent" 
                          (click)="validerTarifAvocat(aud)"
                          [disabled]="isLoading">
                    Valider Honoraires
                  </button>
                  <!-- Indicateur de validation complète -->
                  <span *ngIf="isTarifAudienceValide(aud)" class="valide-indicator">
                    <mat-icon>check_circle</mat-icon>
                    Validé
                  </span>
                </div>
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
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
          min-width: 80px;
          text-align: center;
          &.statut-valide { 
            background-color: #4caf50; 
            color: white; 
          }
          &.statut-attente { 
            background-color: #ff9800; 
            color: white; 
          }
        }
        .valide-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #4caf50;
          font-weight: 500;
          mat-icon {
            color: #4caf50;
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
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
  audienceColumns = ['date', 'type', 'avocat', 'coutAudience', 'coutAvocat', 'statut', 'actions'];
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
      
      // ✅ CORRECTION CRITIQUE : TOUJOURS charger les tarifs depuis la base lors du chargement initial
      // Cela garantit que les tarifs validés sont bien affichés même après un rechargement
      // Charger pour toutes les sections, pas seulement les audiences
      setTimeout(() => {
        if (this.audiences.length > 0) {
          console.log('🔄 Chargement initial des tarifs depuis la base pour les audiences...');
          this.rechargerTarifsDepuisBase();
        }
      }, 500);
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
          console.error('❌ Erreur lors de l\'enregistrement du tarif document:', error);
          // ✅ ALIGNEMENT BACKEND : Gérer les erreurs spécifiques du backend
          const errorMessage = error.error?.message || error.message || '';
          
          if (errorMessage.includes('existe déjà') || 
              errorMessage.includes('already exists') || 
              errorMessage.includes('unique result') ||
              errorMessage.includes('Un tarif existe déjà')) {
            this.toastService.warning('Un tarif pour ce document existe déjà. Vous pouvez modifier le tarif existant.');
          } else if (error.status === 400) {
            this.toastService.error(errorMessage || 'Erreur lors de l\'enregistrement du tarif.');
          } else {
            this.toastService.error(errorMessage || 'Erreur');
          }
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
          console.error('❌ Erreur lors de l\'enregistrement du tarif action:', error);
          // ✅ ALIGNEMENT BACKEND : Gérer les erreurs spécifiques du backend
          const errorMessage = error.error?.message || error.message || '';
          
          if (errorMessage.includes('existe déjà') || 
              errorMessage.includes('already exists') || 
              errorMessage.includes('unique result') ||
              errorMessage.includes('Un tarif existe déjà')) {
            this.toastService.warning('Un tarif pour cette action existe déjà. Vous pouvez modifier le tarif existant.');
          } else if (error.status === 400) {
            this.toastService.error(errorMessage || 'Erreur lors de l\'enregistrement du tarif.');
          } else {
            this.toastService.error(errorMessage || 'Erreur');
          }
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
    // ✅ CORRECTION : Créer tarif pour l'audience avec elementId unique
    const tarifAudience: TarifDossierRequest = {
      phase: PhaseFrais.JURIDIQUE,
      categorie: 'AUDIENCE',
      typeElement: aud.type || 'AUDIENCE',
      coutUnitaire: aud.coutAudience,
      quantite: 1,
      elementId: aud.id // ID de l'audience
    };
    this.financeService.ajouterTarif(this.dossierId, tarifAudience)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifDto) => {
          aud.tarifAudience = tarifDto;
          // ✅ ALIGNEMENT BACKEND : Si avocat, créer le tarif avocat avec avocatId
          // Le backend fait automatiquement le mapping avocatId → audienceId (audience la plus récente)
          // La contrainte d'unicité est (audienceId + categorie), donc pas de doublon possible
          if (aud.avocatId && aud.coutAvocat && aud.coutAvocat > 0) {
            // ✅ Utiliser avocatId pour les honoraires d'avocat (le backend trouvera l'audience automatiquement)
            const tarifAvocat: TarifDossierRequest = {
              phase: PhaseFrais.JURIDIQUE,
              categorie: 'HONORAIRES_AVOCAT',
              typeElement: `Honoraires Avocat - ${aud.avocatNom || 'Avocat'}`,
              coutUnitaire: aud.coutAvocat,
              quantite: 1,
              avocatId: aud.avocatId, // ✅ Utiliser avocatId (le backend fait le mapping vers audienceId)
              commentaire: `Honoraires pour l'avocat ${aud.avocatNom || 'Avocat'} (ID: ${aud.avocatId}) de l'audience #${aud.id}`
            };
            this.financeService.ajouterTarif(this.dossierId, tarifAvocat)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (tarifAvocatDto) => {
                  aud.tarifAvocat = tarifAvocatDto;
                  this.toastService.success('Tarifs enregistrés. Vous pouvez maintenant les valider.');
                  this.isLoading = false;
                },
                error: (error) => {
                  console.error('❌ Erreur lors de la création du tarif avocat:', error);
                  // ✅ ALIGNEMENT BACKEND : Gérer les erreurs spécifiques du backend
                  const errorMessage = error.error?.message || error.message || '';
                  
                  // Erreur : aucun audience trouvée pour l'avocat
                  if (errorMessage.includes('Aucune audience trouvée') || 
                      errorMessage.includes('aucune audience trouvée')) {
                    this.toastService.warning('Aucune audience trouvée pour cet avocat dans ce dossier. Veuillez créer une audience d\'abord.');
                  }
                  // Erreur de doublon (contrainte d'unicité)
                  else if (errorMessage.includes('existe déjà') || 
                           errorMessage.includes('already exists') || 
                           errorMessage.includes('unique result') ||
                           errorMessage.includes('Un tarif existe déjà')) {
                    this.toastService.warning('Un tarif pour cet avocat existe déjà. Vous pouvez modifier le tarif existant au lieu d\'en créer un nouveau.');
                  } else if (error.status === 400) {
                    // Erreur 400 (Bad Request) - message d'erreur du backend
                    this.toastService.warning(`Tarif audience enregistré, mais erreur lors de la création du tarif avocat: ${errorMessage}`);
                  } else {
                    this.toastService.warning('Tarif audience enregistré, mais erreur lors de la création du tarif avocat.');
                  }
                  this.isLoading = false;
                }
              });
          } else {
            this.toastService.success('Tarif enregistré. Vous pouvez maintenant le valider.');
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors de la création du tarif audience:', error);
          // ✅ ALIGNEMENT BACKEND : Gérer les erreurs spécifiques du backend
          const errorMessage = error.error?.message || error.message || '';
          
          // Erreur de doublon (contrainte d'unicité)
          if (errorMessage.includes('existe déjà') || 
              errorMessage.includes('already exists') || 
              errorMessage.includes('unique result') ||
              errorMessage.includes('Un tarif existe déjà')) {
            this.toastService.warning('Un tarif pour cette audience existe déjà. Vous pouvez modifier le tarif existant au lieu d\'en créer un nouveau.');
          } else if (error.status === 400) {
            // Erreur 400 (Bad Request) - message d'erreur du backend
            this.toastService.error(errorMessage || 'Erreur lors de la création du tarif. Vérifiez les données saisies.');
          } else {
            this.toastService.error(errorMessage || 'Erreur lors de la création du tarif');
          }
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
          console.log('✅ Tarif validé avec succès:', tarifDto);
          // Mettre à jour le tarif localement
          if (tarifDto) {
            Object.assign(tarif, tarifDto);
          }
          this.toastService.success('Tarif validé');
          // Recharger les tarifs depuis la base pour s'assurer de la cohérence
          setTimeout(() => {
            this.rechargerTarifsDepuisBase();
            this.tarifValide.emit();
          }, 500);
          this.isLoading = false;
        },
        error: (error) => {
          this.toastService.error(error.message || 'Erreur');
          this.isLoading = false;
        }
      });
  }

  validerTarifAudience(aud: any): void {
    if (!aud.tarifAudience) {
      this.toastService.warning('Aucun tarif audience à valider');
      return;
    }
    console.log('🔍 Validation du tarif audience:', aud.tarifAudience);
    this.isLoading = true;
    this.financeService.validerTarif(aud.tarifAudience.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifDto) => {
          console.log('✅ Tarif audience validé avec succès:', tarifDto);
          // Mettre à jour le tarif audience localement
          aud.tarifAudience = { ...aud.tarifAudience, ...tarifDto };
          this.toastService.success('Tarif audience validé');
          // Recharger les tarifs depuis la base
          setTimeout(() => {
            this.rechargerTarifsDepuisBase();
            this.tarifValide.emit();
          }, 500);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors de la validation du tarif audience:', error);
          this.toastService.error(error.message || 'Erreur lors de la validation');
          this.isLoading = false;
        }
      });
  }

  validerTarifAvocat(aud: any): void {
    if (!aud.tarifAvocat) {
      this.toastService.warning('Aucun tarif honoraires avocat à valider');
      return;
    }
    console.log('🔍 Validation du tarif honoraires avocat:', aud.tarifAvocat);
    this.isLoading = true;
    this.financeService.validerTarif(aud.tarifAvocat.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifDto) => {
          console.log('✅ Tarif honoraires avocat validé avec succès:', tarifDto);
          // Mettre à jour le tarif avocat localement
          aud.tarifAvocat = { ...aud.tarifAvocat, ...tarifDto };
          this.toastService.success('Tarif honoraires avocat validé');
          // Recharger les tarifs depuis la base
          setTimeout(() => {
            this.rechargerTarifsDepuisBase();
            this.tarifValide.emit();
          }, 500);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors de la validation du tarif honoraires avocat:', error);
          this.toastService.error(error.message || 'Erreur lors de la validation');
          this.isLoading = false;
        }
      });
  }

  private rechargerTarifsDepuisBase(): void {
    // ✅ CORRECTION : Recharger les tarifs depuis la base après validation
    // Cela garantit que les tarifs validés sont bien récupérés même si on revient sur l'interface
    console.log('🔄 Rechargement des tarifs depuis la base après validation...');
    
    if (!this.dossierId || this.audiences.length === 0) {
      console.warn('⚠️ Impossible de recharger les tarifs : dossierId ou audiences manquants');
      return;
    }
    
    // Charger les tarifs depuis getTarifs() avec filtrage
    this.financeService.getTarifs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifs) => {
          console.log('✅ Tarifs rechargés depuis la base:', tarifs.length);
          
          // Filtrer les tarifs pour ce dossier et phase JURIDIQUE
          const tarifsJuridiques = tarifs.filter((t: any) => {
            const matches = t.dossierId === this.dossierId && 
                           (t.phase === 'JURIDIQUE' || t.phase === PhaseFrais.JURIDIQUE);
            return matches;
          });
          
          console.log('✅ Tarifs juridiques trouvés:', tarifsJuridiques.length);
          console.log('✅ Détails des tarifs juridiques:', tarifsJuridiques.map(t => ({
            id: t.id,
            categorie: t.categorie,
            elementId: t.elementId,
            audienceId: t.audienceId,
            avocatId: t.avocatId,
            statut: t.statut
          })));
          console.log('✅ Audiences disponibles:', this.audiences.map(a => ({
            id: a.id,
            avocatId: a.avocatId,
            avocatNom: a.avocatNom
          })));
          
          // Mettre à jour les audiences avec les tarifs depuis la base
          const audiencesMisesAJour = this.audiences.map(aud => ({ ...aud }));
          
          tarifsJuridiques.forEach((tarif: any) => {
            // Trouver l'audience correspondante
            const audienceIndex = audiencesMisesAJour.findIndex(a => {
              // Pour les tarifs AUDIENCE, utiliser elementId ou audienceId
              if (tarif.categorie === 'AUDIENCE') {
                const matches = a.id === tarif.elementId || a.id === tarif.audienceId;
                if (matches) {
                  console.log('  ✅ Tarif AUDIENCE trouvé pour audience:', a.id, 'tarifId:', tarif.id);
                }
                return matches;
              }
              // Pour les tarifs HONORAIRES_AVOCAT, utiliser avocatId ou elementId
              if (tarif.categorie === 'HONORAIRES_AVOCAT') {
                // ✅ CORRECTION : Vérifier plusieurs possibilités pour trouver l'audience
                // Le backend peut utiliser avocatId, elementId, ou audienceId selon le contexte
                const matches = (a.avocatId && tarif.avocatId && a.avocatId === tarif.avocatId) || 
                               (a.avocatId && tarif.elementId && a.avocatId === tarif.elementId) ||
                               (a.id && tarif.audienceId && tarif.audienceId === a.id) ||
                               (a.id && tarif.elementId && tarif.elementId === a.id) ||
                               // ✅ CORRECTION : Si le tarif a un avocatId et l'audience a le même avocatId
                               (tarif.avocatId && a.avocatId && tarif.avocatId === a.avocatId);
                if (matches) {
                  console.log('  ✅ Tarif HONORAIRES_AVOCAT trouvé pour audience:', {
                    audienceId: a.id,
                    avocatId: a.avocatId,
                    tarifId: tarif.id,
                    tarifAvocatId: tarif.avocatId,
                    tarifElementId: tarif.elementId,
                    tarifAudienceId: tarif.audienceId,
                    statut: tarif.statut
                  });
                }
                return matches;
              }
              return false;
            });
            
            if (audienceIndex !== -1) {
              const aud = audiencesMisesAJour[audienceIndex];
              
              // Mapper le tarif au format approprié
              const tarifDTO: any = {
                id: tarif.id,
                dossierId: tarif.dossierId,
                phase: tarif.phase,
                categorie: tarif.categorie,
                typeElement: tarif.typeElement,
                coutUnitaire: tarif.coutUnitaire,
                quantite: tarif.quantite,
                statut: tarif.statut,
                dateCreation: tarif.dateCreation,
                dateValidation: tarif.dateValidation
              };
              
              // Associer le tarif à l'audience selon sa catégorie
              if (tarif.categorie === 'AUDIENCE') {
                aud.tarifAudience = tarifDTO;
                aud.coutAudience = tarif.coutUnitaire || aud.coutAudience;
              } else if (tarif.categorie === 'HONORAIRES_AVOCAT') {
                aud.tarifAvocat = tarifDTO;
                aud.coutAvocat = tarif.coutUnitaire || aud.coutAvocat;
              }
              
              console.log('✅ Tarif associé à l\'audience:', {
                audienceId: aud.id,
                tarifId: tarifDTO.id,
                categorie: tarifDTO.categorie,
                statut: tarifDTO.statut,
                isValide: tarifDTO.statut === 'VALIDE' || tarifDTO.statut === StatutTarif.VALIDE
              });
            }
          });
          
          // ✅ CORRECTION : Remplacer le tableau complet pour forcer la détection de changement
          this.audiences = audiencesMisesAJour;
          
          console.log('✅ Audiences mises à jour avec les tarifs depuis la base');
          console.log('✅ Audiences avec tarifs validés:', 
            this.audiences.filter(a => {
              const audienceValide = a.tarifAudience?.statut === 'VALIDE' || a.tarifAudience?.statut === StatutTarif.VALIDE;
              const avocatValide = a.tarifAvocat?.statut === 'VALIDE' || a.tarifAvocat?.statut === StatutTarif.VALIDE;
              return audienceValide && avocatValide;
            }).length
          );
        },
        error: (error) => {
          console.error('❌ Erreur lors du rechargement des tarifs:', error);
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

  getStatutClassAudience(aud: any): string {
    // ✅ CORRECTION : Vérifier le statut combiné de l'audience et des honoraires d'avocat
    const statutAudience = aud.tarifAudience?.statut;
    const statutAvocat = aud.tarifAvocat?.statut;
    
    // Si les deux tarifs existent et sont validés, afficher "VALIDE"
    if (statutAudience && statutAvocat) {
      const isAudienceValide = statutAudience.toUpperCase() === 'VALIDE' || statutAudience === StatutTarif.VALIDE;
      const isAvocatValide = statutAvocat.toUpperCase() === 'VALIDE' || statutAvocat === StatutTarif.VALIDE;
      if (isAudienceValide && isAvocatValide) {
        return 'statut-valide';
      }
      // Si au moins un est en attente, afficher "EN_ATTENTE_VALIDATION"
      if (statutAudience.toUpperCase() === 'EN_ATTENTE_VALIDATION' || 
          statutAvocat.toUpperCase() === 'EN_ATTENTE_VALIDATION') {
        return 'statut-attente';
      }
    }
    
    // Fallback : utiliser le statut de l'audience ou de l'avocat
    const statut = statutAudience || statutAvocat || 'NON_VALIDE';
    return this.getStatutClass(statut);
  }

  getStatutDisplayValueAudience(aud: any): string {
    // ✅ CORRECTION : Afficher le statut combiné de l'audience et des honoraires d'avocat
    const statutAudience = aud.tarifAudience?.statut;
    const statutAvocat = aud.tarifAvocat?.statut;
    
    // Si les deux tarifs existent
    if (statutAudience && statutAvocat) {
      const isAudienceValide = statutAudience.toUpperCase() === 'VALIDE' || statutAudience === StatutTarif.VALIDE;
      const isAvocatValide = statutAvocat.toUpperCase() === 'VALIDE' || statutAvocat === StatutTarif.VALIDE;
      
      // Si les deux sont validés, afficher "VALIDE"
      if (isAudienceValide && isAvocatValide) {
        return 'VALIDE';
      }
      
      // Si au moins un est en attente, afficher "EN_ATTENTE_VALIDATION"
      if (statutAudience.toUpperCase() === 'EN_ATTENTE_VALIDATION' || 
          statutAvocat.toUpperCase() === 'EN_ATTENTE_VALIDATION') {
        return 'EN_ATTENTE_VALIDATION';
      }
      
      // Sinon, afficher le statut de l'audience (priorité)
      return statutAudience;
    }
    
    // Fallback : utiliser le statut de l'audience ou de l'avocat
    const statut = statutAudience || statutAvocat || 'NON_VALIDE';
    if (!statut || statut === 'NON_VALIDE') return 'NON_VALIDE';
    const statutUpper = statut.toUpperCase();
    if (statutUpper === 'VALIDE' || statutUpper === StatutTarif.VALIDE) {
      return 'VALIDE';
    }
    if (statutUpper === 'EN_ATTENTE_VALIDATION') {
      return 'EN_ATTENTE_VALIDATION';
    }
    return statut;
  }

  peutValiderTarifAvocat(aud: any): boolean {
    // ✅ CORRECTION : Vérifier si on peut valider les honoraires d'avocat
    // Le tarif avocat doit exister (même s'il n'est pas encore chargé depuis la base)
    // Si le tarif existe mais n'a pas de statut, on peut le valider
    // Si le tarif existe et a un statut EN_ATTENTE_VALIDATION, on peut le valider
    // Si le tarif existe et est déjà VALIDE, on ne peut plus le valider
    
    // Si pas de tarif avocat du tout, on ne peut pas valider
    if (!aud.tarifAvocat) {
      // ✅ CORRECTION : Vérifier si un tarif avocat existe en base mais n'est pas encore chargé
      // Si on a un avocatId et un coutAvocat, on peut enregistrer puis valider
      if (aud.avocatId && aud.coutAvocat && aud.coutAvocat > 0) {
        // Le tarif n'est pas encore enregistré, donc on ne peut pas le valider directement
        // Mais on peut afficher le bouton si on veut permettre l'enregistrement puis la validation
        return false; // On ne peut pas valider un tarif qui n'existe pas encore
      }
      return false;
    }
    
    // Si le tarif existe mais n'a pas d'id, on ne peut pas le valider
    if (!aud.tarifAvocat.id) {
      return false;
    }
    
    const statut = aud.tarifAvocat.statut;
    if (!statut) {
      // Si pas de statut mais que le tarif existe avec un id, on peut le valider
      return true;
    }
    
    const statutUpper = statut.toUpperCase();
    // Le tarif peut être validé s'il est en attente de validation ou s'il n'est pas encore validé
    return statutUpper === 'EN_ATTENTE_VALIDATION' || 
           statutUpper === StatutTarif.EN_ATTENTE_VALIDATION ||
           (statutUpper !== 'VALIDE' && statutUpper !== StatutTarif.VALIDE);
  }

  isTarifAudienceValide(aud: any): boolean {
    const statutAudience = aud.tarifAudience?.statut;
    const statutAvocat = aud.tarifAvocat?.statut;
    const isAudienceValide = statutAudience && (statutAudience.toUpperCase() === 'VALIDE' || statutAudience === StatutTarif.VALIDE);
    const isAvocatValide = statutAvocat && (statutAvocat.toUpperCase() === 'VALIDE' || statutAvocat === StatutTarif.VALIDE);
    // Les deux tarifs doivent être validés pour afficher "Validé"
    return isAudienceValide && isAvocatValide;
  }
}

