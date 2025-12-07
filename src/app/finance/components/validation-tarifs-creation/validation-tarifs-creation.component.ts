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
          <!-- ✅ NOUVEAU : Badge "Automatique" pour les tarifs créés automatiquement -->
          <span *ngIf="isTarifAutomatique(traitement)" class="badge-automatique">
            <mat-icon>auto_awesome</mat-icon>
            Automatique
          </span>
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
        .badge-automatique {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background-color: #e3f2fd;
          color: #1976d2;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          margin-left: 8px;
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
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

  /**
   * ✅ NOUVEAU : Vérifie si un tarif est automatique (créé automatiquement)
   * Les tarifs automatiques sont :
   * - OUVERTURE_DOSSIER (250 TND) - Phase Création
   * - ENQUETE_PRECONTENTIEUSE (300 TND) - Phase Enquête
   * - AVANCE_RECOUVREMENT_JURIDIQUE (1000 TND) - Phase Juridique
   */
  isTarifAutomatique(traitement: any): boolean {
    // Vérifier si c'est un tarif fixe avec les montants standards
    const fraisFixe = traitement.fraisFixe || traitement.tarifExistant?.coutUnitaire;
    const categorie = traitement.categorie || traitement.tarifExistant?.categorie;
    const type = traitement.type || traitement.tarifExistant?.typeElement;
    
    // Tarifs automatiques selon l'annexe
    return (
      (fraisFixe === 250 && (categorie === 'OUVERTURE_DOSSIER' || type?.includes('Ouverture'))) ||
      (fraisFixe === 300 && (categorie === 'ENQUETE_PRECONTENTIEUSE' || type?.includes('Enquête'))) ||
      (fraisFixe === 1000 && (categorie === 'AVANCE_RECOUVREMENT_JURIDIQUE' || type?.includes('Avance')))
    );
  }

  validerTarifFixe(traitement: any): void {
    this.isLoading = true;
    
    if (!traitement.tarifExistant) {
      // ✅ Pour les frais fixes, créer le tarif avec validation automatique
      const tarifRequest: TarifDossierRequest = {
        phase: PhaseFrais.CREATION,
        categorie: 'OUVERTURE_DOSSIER',
        typeElement: 'Ouverture de dossier',
        coutUnitaire: traitement.fraisFixe || 250,
        quantite: 1,
        commentaire: 'Frais fixe selon annexe - Validation automatique'
      };
      
      this.financeService.ajouterTarif(this.dossierId, tarifRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (tarifDto) => {
            console.log('✅ Tarif créé:', tarifDto);
            traitement.tarifExistant = tarifDto;
            // ✅ Valider automatiquement après création pour les frais fixes
            this.validerTarif(tarifDto);
          },
          error: (error) => {
            console.error('❌ Erreur lors de la création du tarif:', error);
            const errorMessage = error.error?.message || error.error?.error || error.message || '';
            
            // ✅ CORRECTION : Si le tarif existe déjà (erreur "unique result" ou "existe déjà"), 
            // récupérer le tarif existant et le valider
            if (errorMessage.includes('unique result') || 
                errorMessage.includes('existe déjà') || 
                errorMessage.includes('already exists') ||
                errorMessage.includes('Un tarif existe déjà')) {
              console.log('⚠️ Tarif existe déjà, tentative de récupération...');
              // Essayer de récupérer le tarif existant depuis les traitements
              this.financeService.getTraitementsDossier(this.dossierId)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (traitements) => {
                    const tarifExistant = traitements?.phaseCreation?.traitements?.[0]?.tarifExistant;
                    if (tarifExistant) {
                      console.log('✅ Tarif existant trouvé:', tarifExistant);
                      traitement.tarifExistant = tarifExistant;
                      // Valider le tarif existant
                      this.validerTarif(tarifExistant);
                    } else {
                      this.toastService.warning('Un tarif existe déjà pour cette phase. Veuillez recharger la page.');
                      this.isLoading = false;
                    }
                  },
                  error: (err) => {
                    console.error('❌ Erreur lors de la récupération des traitements:', err);
                    this.toastService.warning('Un tarif existe déjà. Veuillez recharger la page pour voir le tarif existant.');
                    this.isLoading = false;
                  }
                });
            } else {
              this.toastService.error(errorMessage || 'Erreur lors de la création du tarif');
              this.isLoading = false;
            }
          }
        });
    } else {
      // Si le tarif existe déjà, juste le valider
      this.validerTarif(traitement.tarifExistant);
    }
  }

  validerTarif(tarif: any): void {
    if (!tarif || !tarif.id) {
      console.error('❌ Tarif invalide pour validation:', tarif);
      this.toastService.error('Tarif invalide');
      return;
    }
    
    this.isLoading = true;
    console.log('📤 Validation du tarif:', tarif.id);
    
    this.financeService.validerTarif(tarif.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifValide) => {
          console.log('✅ Tarif validé avec succès:', tarifValide);
          // Mettre à jour le statut du tarif
          if (tarif) {
            tarif.statut = 'VALIDE';
            if (tarif.tarifExistant) {
              tarif.tarifExistant.statut = 'VALIDE';
            }
          }
          this.toastService.success('Tarif validé avec succès');
          this.tarifValide.emit();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors de la validation du tarif:', error);
          console.error('❌ Détails de l\'erreur:', error.error);
          const errorMessage = error.error?.message || error.error?.error || error.message || 'Erreur lors de la validation du tarif';
          this.toastService.error(errorMessage);
          this.isLoading = false;
        }
      });
  }

  getStatutClass(statut: string): string {
    return statut === StatutTarif.VALIDE ? 'statut-valide' : 'statut-attente';
  }
}

