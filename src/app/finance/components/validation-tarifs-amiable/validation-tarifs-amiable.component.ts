import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FinanceService } from '../../../core/services/finance.service';
import { ToastService } from '../../../core/services/toast.service';
import { ActionRecouvrementService, ActionRecouvrement } from '../../../core/services/action-recouvrement.service';
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
      <div *ngIf="actionsAmiables.length === 0" class="no-actions-message">
        <i class="fas fa-info-circle"></i>
        <p>Aucune action amiable disponible pour ce dossier.</p>
      </div>
      <table mat-table [dataSource]="actionsAmiables" class="mat-elevation-z2" *ngIf="actionsAmiables.length > 0">
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
                   [readonly]="isTarifValide(action)"
                   [placeholder]="action.coutUnitaire ? '' : 'Saisir le coût'">
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
              {{ getStatutDisplayValue(action.tarifExistant?.statut || action.statut) }}
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
            <button *ngIf="peutValiderTarif(action)" 
                    mat-raised-button
                    color="primary"
                    (click)="validerTarif(action.tarifExistant)"
                    [disabled]="isLoading">
              Valider
            </button>
            <button *ngIf="peutValiderTarif(action)" 
                    mat-raised-button
                    color="warn"
                    (click)="ouvrirModalRejet(action.tarifExistant)"
                    [disabled]="isLoading">
              Rejeter
            </button>
            <span *ngIf="isTarifValide(action)" class="valide-indicator">
              <mat-icon>check_circle</mat-icon>
              Validé
            </span>
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
      }
      .no-actions-message {
        padding: 24px;
        text-align: center;
        color: #666;
        i {
          font-size: 48px;
          color: #ccc;
          margin-bottom: 16px;
        }
        p {
          margin: 0;
          font-size: 16px;
        }
      }
    }
  `]
})
export class ValidationTarifsAmiableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() dossierId!: number;
  @Input() traitements?: PhaseAmiableDTO;
  @Output() tarifValide = new EventEmitter<void>();

  actionsAmiables: ActionAmiableDTO[] = [];
  displayedColumns = ['type', 'date', 'occurrences', 'coutUnitaire', 'montantTotal', 'statut', 'actions'];
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private financeService: FinanceService,
    private toastService: ToastService,
    private actionService: ActionRecouvrementService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    // ✅ CORRECTION : Charger les actions depuis traitements en priorité
    // Si traitements n'est pas encore disponible, ngOnChanges sera appelé quand il le sera
    console.log('🔍 ngOnInit - Traitements disponible:', !!this.traitements);
    console.log('🔍 ngOnInit - Actions dans traitements:', this.traitements?.actions?.length || 0);
    
    if (this.traitements) {
      this.loadActionsAmiables();
      // ✅ CORRECTION CRITIQUE : Recharger les tarifs depuis la base après chargement initial
      // Cela garantit que les tarifs validés sont bien affichés même après un rechargement de page
      setTimeout(() => {
        if (this.actionsAmiables.length > 0) {
          console.log('🔄 Rechargement des tarifs depuis la base lors du chargement initial...');
          this.loadTarifsForActions();
        }
      }, 500);
    } else {
      console.log('⏳ Traitements non encore disponible, attente de ngOnChanges...');
      // ✅ Ne pas charger depuis l'API ici, attendre que le parent passe traitements
      this.actionsAmiables = [];
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // ✅ CORRECTION : Réagir aux changements de l'input traitements
    if (changes['traitements']) {
      console.log('🔄 ngOnChanges - Changement détecté dans traitements');
      console.log('🔄 Ancienne valeur:', changes['traitements'].previousValue);
      console.log('🔄 Nouvelle valeur:', changes['traitements'].currentValue);
      console.log('🔄 Phase Amiable - Actions:', changes['traitements'].currentValue?.actions);
      
      // Toujours recharger depuis traitements en priorité (même après validation)
      this.loadActionsAmiables();
      
      // ✅ CORRECTION : Si les actions sont chargées depuis l'API, recharger aussi les tarifs depuis la base
      // Cela garantit que les tarifs validés sont bien récupérés même après un rechargement
      // Attendre un peu pour que loadActionsAmiables() termine
      setTimeout(() => {
        if (this.actionsAmiables.length > 0) {
          console.log('🔄 Rechargement des tarifs depuis la base après changement de traitements...');
          this.loadTarifsForActions();
        }
      }, 500);
    }
  }

  private loadActionsAmiables(): void {
    console.log('📥 loadActionsAmiables - Traitements disponible:', !!this.traitements);
    console.log('📥 loadActionsAmiables - Actions dans traitements:', this.traitements?.actions?.length || 0);
    console.log('📥 loadActionsAmiables - Traitements complet:', this.traitements);
    
    // ✅ CORRECTION CRITIQUE : PhaseAmiableDTO contient directement 'actions'
    // Les actions sont dans traitements.actions (pas traitements.phaseAmiable.actions)
    // ✅ IMPORTANT : Toujours utiliser traitements.actions s'il existe (même vide)
    // Ne PAS charger depuis l'API si traitements est disponible, car le parent va le mettre à jour
    if (this.traitements) {
      // ✅ CORRECTION : Utiliser traitements.actions directement (PhaseAmiableDTO)
      const actions = this.traitements.actions || [];
      console.log('📥 Actions trouvées dans traitements:', actions.length);
      
      // ✅ CORRECTION : Toujours utiliser les actions de traitements, même si vide
      // Le parent va les mettre à jour avec les données du backend
      if (actions.length > 0) {
        // ✅ CORRECTION : Créer une nouvelle copie des actions pour forcer la détection de changement
        this.actionsAmiables = actions.map(action => {
          const actionCopy = { ...action };
          
          // Le backend retourne maintenant coutUnitaire selon la priorité :
          // 1. Si tarif existe : tarif.getCoutUnitaire() (BigDecimal -> number)
          // 2. Sinon, si action.getCoutUnitaire() != null && > 0 : BigDecimal.valueOf(action.getCoutUnitaire()) -> number
          // 3. Sinon : null (le chef devra saisir)
          // Le backend fait déjà la conversion Double -> BigDecimal, et le service fait BigDecimal -> number
          // On s'assure juste que le type est correct pour l'affichage
          if (actionCopy.coutUnitaire != null) {
            // Convertir en number si nécessaire
            actionCopy.coutUnitaire = typeof actionCopy.coutUnitaire === 'string' 
              ? parseFloat(actionCopy.coutUnitaire) 
              : Number(actionCopy.coutUnitaire);
          } else if (actionCopy.tarifExistant?.coutUnitaire) {
            // Fallback : utiliser celui du tarif si l'action n'en a pas
            actionCopy.coutUnitaire = typeof actionCopy.tarifExistant.coutUnitaire === 'string'
              ? parseFloat(actionCopy.tarifExistant.coutUnitaire)
              : Number(actionCopy.tarifExistant.coutUnitaire);
          }
          
          // ✅ CORRECTION : Créer une copie du tarifExistant aussi
          if (actionCopy.tarifExistant) {
            actionCopy.tarifExistant = { ...actionCopy.tarifExistant };
          }
          
          // Log pour déboguer
          const statut = actionCopy.tarifExistant?.statut || actionCopy.statut;
          const isValide = statut && (statut.toUpperCase() === 'VALIDE' || statut === StatutTarif.VALIDE);
          console.log('  📋 Action', actionCopy.id, 'Type:', actionCopy.type);
          console.log('    - Statut action:', actionCopy.statut);
          console.log('    - Tarif existant:', actionCopy.tarifExistant ? 'OUI (ID: ' + actionCopy.tarifExistant.id + ')' : 'NON');
          console.log('    - Statut tarif:', actionCopy.tarifExistant?.statut);
          console.log('    - Statut final:', statut);
          console.log('    - Est validé:', isValide);
          
          return actionCopy;
        });
        
        console.log('✅ Actions amiables chargées depuis traitements (base de données):', this.actionsAmiables.length);
        // ✅ CORRECTION CRITIQUE : TOUJOURS recharger les tarifs depuis la base, même si les actions viennent de traitements
        // Cela garantit que les tarifs validés sont bien récupérés depuis la base de données
        // Attendre un peu pour que les actions soient bien chargées
        setTimeout(() => {
          console.log('🔄 Rechargement des tarifs depuis la base après chargement des actions depuis traitements...');
          this.loadTarifsForActions();
        }, 300);
        console.log('✅ Actions avec tarifs validés:', this.actionsAmiables.filter(a => {
          const statut = a.tarifExistant?.statut || a.statut;
          return statut && (statut.toUpperCase() === 'VALIDE' || statut === StatutTarif.VALIDE);
        }).length);
      } else {
        // traitements existe mais actions est vide ou undefined
        // ✅ CORRECTION CRITIQUE : Le backend ne retourne pas les actions dans traitements.phaseAmiable.actions
        // Il faut charger depuis l'API en fallback, mais en récupérant aussi les tarifs validés
        console.warn('⚠️⚠️⚠️ PROBLÈME : Traitements disponible mais aucune action amiable trouvée. Actions:', actions);
        console.warn('⚠️ Le backend ne retourne PAS les actions dans traitements.phaseAmiable.actions !');
        console.log('📥 Chargement depuis l\'API en fallback...');
        this.actionsAmiables = [];
        // ✅ FALLBACK : Charger depuis l'API si le backend ne retourne pas les actions
        // loadActionsFromAPI() appellera automatiquement loadTarifsForActions() après le chargement
        if (this.dossierId) {
          this.loadActionsFromAPI();
        } else {
          // Si pas de dossierId, essayer quand même de charger les tarifs si on a des actions
          setTimeout(() => {
            if (this.actionsAmiables.length > 0) {
              this.loadTarifsForActions();
            }
          }, 500);
        }
      }
    } else {
      // ✅ FALLBACK : Si traitements n'existe pas du tout, charger directement depuis l'API
      console.warn('⚠️ Traitements non disponible, chargement direct depuis l\'API...');
      if (this.dossierId) {
        this.loadActionsFromAPI();
      } else {
        this.actionsAmiables = [];
        console.warn('⚠️ DossierId non disponible, impossible de charger les actions');
      }
    }
  }

  private loadActionsFromAPI(): void {
    if (!this.dossierId) return;
    
    console.log('📥 Chargement des actions amiable depuis l\'API pour le dossier:', this.dossierId);
    this.actionService.getActionsByDossier(this.dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (actions: ActionRecouvrement[]) => {
          // Filtrer uniquement les actions amiable (APPEL, EMAIL, VISITE, LETTRE, RELANCE)
          const actionsAmiable = actions.filter(a => 
            ['APPEL', 'APPEL_TELEPHONIQUE', 'EMAIL', 'VISITE', 'LETTRE', 'RELANCE'].includes(a.type)
          );
          
          // Convertir ActionRecouvrement en ActionAmiableDTO
          this.actionsAmiables = actionsAmiable.map(action => {
            const actionDTO: ActionAmiableDTO = {
              id: action.id!,
              type: String(action.type), // Convertir enum en string
              date: action.dateAction || new Date(),
              occurrences: action.nbOccurrences || 1,
              coutUnitaire: action.coutUnitaire || undefined,
              tarifExistant: undefined, // Sera chargé depuis les tarifs si nécessaire
              statut: 'NON_VALIDE'
            };
            
            // Convertir coutUnitaire en number si nécessaire
            if (actionDTO.coutUnitaire != null) {
              actionDTO.coutUnitaire = typeof actionDTO.coutUnitaire === 'string' 
                ? parseFloat(actionDTO.coutUnitaire) 
                : Number(actionDTO.coutUnitaire);
            }
            
            return actionDTO;
          });
          
          console.log('✅ Actions amiables chargées depuis l\'API:', this.actionsAmiables);
          console.log('✅ Nombre d\'actions:', this.actionsAmiables.length);
          
          // ✅ CORRECTION CRITIQUE : Charger les tarifs depuis la base pour chaque action
          // Cela garantit que les tarifs validés sont bien récupérés depuis la base de données
          this.loadTarifsForActions();
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des actions:', error);
          this.actionsAmiables = [];
        }
      });
  }

  private loadTarifsForActions(): void {
    // ✅ CORRECTION CRITIQUE : Charger les tarifs validés directement depuis l'API
    // Le backend ne retourne pas les actions dans traitements.phaseAmiable.actions
    // Il faut charger les tarifs individuellement pour chaque action
    console.log('📥 Chargement des tarifs pour les actions...');
    
    if (!this.dossierId || this.actionsAmiables.length === 0) {
      console.warn('⚠️ Impossible de charger les tarifs : dossierId ou actions manquants');
      return;
    }
    
    // ✅ NOUVELLE APPROCHE : Charger les tarifs directement depuis l'endpoint des tarifs
    // Filtrer par dossier et phase AMIABLE côté frontend
    this.financeService.getTarifs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifs) => {
          console.log('✅ Tous les tarifs chargés:', tarifs);
          console.log('✅ Nombre total de tarifs:', tarifs.length);
          
          // Filtrer les tarifs pour ce dossier et phase AMIABLE
          const tarifsAmiables = tarifs.filter((t: any) => {
            const matches = t.dossierId === this.dossierId && 
                           (t.phase === 'AMIABLE' || t.phase === PhaseFrais.AMIABLE) && 
                           (t.categorie === 'ACTION_AMIABLE' || t.categorie?.includes('ACTION'));
            if (matches) {
              console.log('  📋 Tarif amiable trouvé:', { id: t.id, elementId: t.elementId, actionId: t.actionId, statut: t.statut });
            }
            return matches;
          });
          
          console.log('✅ Tarifs amiables pour ce dossier:', tarifsAmiables);
          
          // ✅ CORRECTION : Créer un nouveau tableau pour forcer la détection de changement
          const actionsMisesAJour: ActionAmiableDTO[] = this.actionsAmiables.map(a => ({ ...a }));
          
          // Associer les tarifs aux actions
          tarifsAmiables.forEach((tarif: any) => {
            // ✅ CORRECTION : Le backend peut utiliser actionId ou elementId selon le contexte
            const actionId = tarif.actionId || tarif.elementId;
            console.log('  🔍 Recherche de l\'action pour tarif:', { tarifId: tarif.id, actionId, elementId: tarif.elementId, statut: tarif.statut });
            
            // Trouver l'action correspondante par actionId ou elementId
            const actionIndex = actionsMisesAJour.findIndex(a => a.id === actionId);
            if (actionIndex !== -1) {
              // Mapper le tarif au format TarifDossierDTO
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
              
              // ✅ CORRECTION : Créer une nouvelle référence de l'action pour forcer la détection de changement
              actionsMisesAJour[actionIndex] = {
                ...actionsMisesAJour[actionIndex],
                tarifExistant: tarifDTO,
                statut: tarif.statut || actionsMisesAJour[actionIndex].statut || 'NON_VALIDE',
                coutUnitaire: tarif.coutUnitaire || actionsMisesAJour[actionIndex].coutUnitaire
              };
              
              console.log('✅ Tarif associé à l\'action', actionId, 'Statut:', tarif.statut, 'Validé:', tarif.statut === 'VALIDE');
            } else {
              console.warn('⚠️ Action non trouvée pour le tarif elementId:', tarif.elementId, 'actionId:', tarif.actionId);
            }
          });
          
          // ✅ CORRECTION : Remplacer le tableau complet pour forcer la détection de changement
          this.actionsAmiables = actionsMisesAJour;
          
          console.log('✅ Actions mises à jour avec les tarifs depuis la base');
          console.log('✅ Actions avec tarifs validés:', 
            this.actionsAmiables.filter(a => {
              const statut = a.tarifExistant?.statut || a.statut;
              const isValide = statut && (statut.toUpperCase() === 'VALIDE' || statut === StatutTarif.VALIDE);
              if (isValide) {
                console.log('  ✅ Action', a.id, 'Type:', a.type, 'Statut:', statut);
              }
              return isValide;
            }).length
          );
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des tarifs:', error);
          // ✅ FALLBACK : Essayer avec getTraitementsDossier même si le backend retourne un tableau vide
          this.loadTarifsFromTraitementsFallback();
        }
      });
  }

  private loadTarifsFromTraitementsFallback(): void {
    // ✅ FALLBACK : Essayer de charger depuis getTraitementsDossier
    console.log('📥 Tentative de chargement depuis getTraitementsDossier (fallback)...');
    this.financeService.getTraitementsDossier(this.dossierId, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (traitements) => {
          console.log('✅ Traitements chargés (fallback):', traitements);
          console.log('✅ Phase Amiable - Actions avec tarifs:', traitements.phaseAmiable?.actions);
          
          if (traitements.phaseAmiable?.actions && traitements.phaseAmiable.actions.length > 0) {
            traitements.phaseAmiable.actions.forEach(actionAvecTarif => {
              const actionIndex = this.actionsAmiables.findIndex(a => a.id === actionAvecTarif.id);
              if (actionIndex !== -1) {
                this.actionsAmiables[actionIndex] = {
                  ...this.actionsAmiables[actionIndex],
                  tarifExistant: actionAvecTarif.tarifExistant,
                  statut: actionAvecTarif.tarifExistant?.statut || actionAvecTarif.statut || 'NON_VALIDE',
                  coutUnitaire: actionAvecTarif.coutUnitaire || this.actionsAmiables[actionIndex].coutUnitaire
                };
                console.log('✅ Tarif associé à l\'action (fallback)', actionAvecTarif.id, 'Statut:', this.actionsAmiables[actionIndex].statut);
              }
            });
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des tarifs (fallback):', error);
        }
      });
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
          console.log('✅ Tarif enregistré avec succès:', tarifDto);
          
          // ✅ CORRECTION : Mettre à jour l'action localement avec le tarif créé
          // Cela permet d'afficher immédiatement le bouton "Valider" sans recharger la page
          const actionIndex = this.actionsAmiables.findIndex(a => a.id === action.id);
          if (actionIndex !== -1) {
            // ✅ S'assurer que le tarif a bien un statut EN_ATTENTE_VALIDATION
            const tarifAvecStatut = {
              ...tarifDto,
              statut: tarifDto.statut || 'EN_ATTENTE_VALIDATION'
            };
            
            // ✅ CORRECTION : Créer une nouvelle référence pour forcer la détection de changement
            // Cela garantit que Angular détecte le changement et met à jour l'UI
            const actionMiseAJour: ActionAmiableDTO = {
              ...this.actionsAmiables[actionIndex],
              tarifExistant: tarifAvecStatut,
              statut: tarifAvecStatut.statut,
              // S'assurer que le coutUnitaire vient du tarif
              coutUnitaire: tarifDto.coutUnitaire || this.actionsAmiables[actionIndex].coutUnitaire
            };
            
            // ✅ CORRECTION : Remplacer l'action dans le tableau pour forcer la détection de changement
            this.actionsAmiables = [
              ...this.actionsAmiables.slice(0, actionIndex),
              actionMiseAJour,
              ...this.actionsAmiables.slice(actionIndex + 1)
            ];
            
            console.log('✅ Action mise à jour localement avec le tarif:', actionMiseAJour);
            console.log('✅ Statut du tarif:', actionMiseAJour.tarifExistant?.statut);
            console.log('✅ peutValiderTarif:', this.peutValiderTarif(actionMiseAJour));
            console.log('✅ Bouton "Valider" devrait maintenant être visible');
          } else {
            console.warn('⚠️ Action non trouvée pour mise à jour:', action.id);
          }
          
          // ✅ CORRECTION : Afficher le message de succès
          this.toastService.success('Tarif enregistré avec succès. Vous pouvez maintenant le valider.');
          
          // ✅ CORRECTION : NE PAS émettre tarifValide.emit() ici
          // Cela évite le rechargement et permet de rester sur la même interface
          // L'utilisateur peut maintenant cliquer sur "Valider" immédiatement
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors de l\'enregistrement du tarif:', error);
          this.toastService.error(error.message || 'Erreur lors de l\'enregistrement du tarif');
          this.isLoading = false;
        }
      });
  }

  validerTarif(tarif: any): void {
    console.log('🔍 Validation du tarif:', tarif);
    this.isLoading = true;
    this.financeService.validerTarif(tarif.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifDto) => {
          console.log('✅ Tarif validé avec succès:', tarifDto);
          console.log('✅ Statut du tarif validé:', tarifDto.statut);
          
          // ✅ CORRECTION : Mettre à jour immédiatement l'action avec le tarif validé
          const actionIndex = this.actionsAmiables.findIndex(a => a.tarifExistant?.id === tarif.id);
          if (actionIndex !== -1) {
            // Créer une nouvelle référence pour forcer la détection de changement
            const actionMiseAJour: ActionAmiableDTO = {
              ...this.actionsAmiables[actionIndex],
              tarifExistant: {
                ...tarifDto,
                statut: tarifDto.statut || 'VALIDE'
              },
              statut: tarifDto.statut || 'VALIDE',
              coutUnitaire: tarifDto.coutUnitaire || this.actionsAmiables[actionIndex].coutUnitaire
            };
            
            // Remplacer l'action dans le tableau
            this.actionsAmiables = [
              ...this.actionsAmiables.slice(0, actionIndex),
              actionMiseAJour,
              ...this.actionsAmiables.slice(actionIndex + 1)
            ];
            
            console.log('✅ Action mise à jour localement avec le tarif validé:', actionMiseAJour);
            console.log('✅ Statut après validation:', actionMiseAJour.tarifExistant?.statut);
          }
          
          this.toastService.success('Tarif validé avec succès');
          
          // ✅ CORRECTION CRITIQUE : Recharger les tarifs depuis la base pour s'assurer de la cohérence
          // Cela garantit que même si on revient sur l'interface, les tarifs validés sont bien chargés
          setTimeout(() => {
            this.rechargerTarifsDepuisBase();
            // Émettre l'événement pour que le parent mette à jour les totaux
            this.tarifValide.emit();
          }, 500);
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors de la validation du tarif:', error);
          this.toastService.error(error.message || 'Erreur');
          this.isLoading = false;
        }
      });
  }

  private rechargerTarifsDepuisBase(): void {
    // ✅ CORRECTION CRITIQUE : Recharger les tarifs depuis la base après validation
    // Cela garantit que les tarifs validés sont bien récupérés même si on revient sur l'interface
    console.log('🔄 Rechargement des tarifs depuis la base après validation...');
    
    if (!this.dossierId || this.actionsAmiables.length === 0) {
      console.warn('⚠️ Impossible de recharger les tarifs : dossierId ou actions manquants');
      return;
    }
    
    // Charger les tarifs depuis getTarifs() avec filtrage
    this.financeService.getTarifs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifs) => {
          console.log('✅ Tarifs rechargés depuis la base:', tarifs.length);
          
          // Filtrer les tarifs pour ce dossier et phase AMIABLE
          const tarifsAmiables = tarifs.filter((t: any) => {
            const matches = t.dossierId === this.dossierId && 
                           (t.phase === 'AMIABLE' || t.phase === 'AMiable') && 
                           (t.categorie === 'ACTION_AMIABLE' || t.categorie?.includes('ACTION'));
            return matches;
          });
          
          console.log('✅ Tarifs amiables trouvés:', tarifsAmiables.length);
          
          // ✅ CORRECTION : Créer un nouveau tableau pour forcer la détection de changement
          const actionsMisesAJour: ActionAmiableDTO[] = this.actionsAmiables.map(a => ({ ...a }));
          
          // Mettre à jour les actions avec les tarifs depuis la base
          tarifsAmiables.forEach((tarif: any) => {
            const actionId = tarif.actionId || tarif.elementId;
            const actionIndex = actionsMisesAJour.findIndex(a => a.id === actionId);
            
            if (actionIndex !== -1) {
              // Mapper le tarif au format TarifDossierDTO
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
              
              // ✅ CORRECTION : Créer une nouvelle référence pour forcer la détection de changement
              actionsMisesAJour[actionIndex] = {
                ...actionsMisesAJour[actionIndex],
                tarifExistant: tarifDTO,
                statut: tarif.statut || actionsMisesAJour[actionIndex].statut,
                coutUnitaire: tarif.coutUnitaire || actionsMisesAJour[actionIndex].coutUnitaire
              };
              
              console.log('✅ Action mise à jour avec tarif depuis la base:', {
                actionId: actionsMisesAJour[actionIndex].id,
                tarifId: tarifDTO.id,
                statut: tarifDTO.statut,
                isValide: tarifDTO.statut === 'VALIDE' || tarifDTO.statut === StatutTarif.VALIDE
              });
            } else {
              console.warn('⚠️ Action non trouvée pour le tarif elementId:', tarif.elementId, 'actionId:', tarif.actionId);
            }
          });
          
          // ✅ CORRECTION : Remplacer le tableau complet pour forcer la détection de changement
          this.actionsAmiables = actionsMisesAJour;
          
          console.log('✅ Actions mises à jour avec les tarifs depuis la base');
          console.log('✅ Actions avec tarifs validés:', 
            this.actionsAmiables.filter(a => {
              const statut = a.tarifExistant?.statut || a.statut;
              return statut && (statut.toUpperCase() === 'VALIDE' || statut === StatutTarif.VALIDE);
            }).length
          );
        },
        error: (error) => {
          console.error('❌ Erreur lors du rechargement des tarifs:', error);
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

  getStatutClass(statut: string | undefined): string {
    if (!statut) {
      console.log('⚠️ getStatutClass - Statut vide, retour attente');
      return 'statut-attente';
    }
    const statutUpper = statut.toUpperCase();
    const isValide = statutUpper === 'VALIDE' || statutUpper === StatutTarif.VALIDE;
    console.log('🔍 getStatutClass - Statut:', statut, 'Upper:', statutUpper, 'Est validé:', isValide);
    return isValide ? 'statut-valide' : 'statut-attente';
  }

  getStatutDisplayValue(statut: string | undefined): string {
    if (!statut) return 'NON_VALIDE';
    // ✅ CORRECTION : Afficher exactement comme dans le composant juridique
    // Le composant juridique affiche directement le statut sans transformation
    const statutUpper = statut.toUpperCase();
    if (statutUpper === 'VALIDE' || statutUpper === StatutTarif.VALIDE) {
      return 'VALIDE'; // Badge vert comme dans juridique
    }
    if (statutUpper === 'EN_ATTENTE_VALIDATION') {
      return 'EN_ATTENTE_VALIDATION';
    }
    // Retourner le statut tel quel (comme dans juridique)
    return statut;
  }
  
  isTarifValide(action: ActionAmiableDTO): boolean {
    const statut = action.tarifExistant?.statut || action.statut;
    if (!statut) {
      console.log('⚠️ isTarifValide - Action', action.id, 'pas de statut');
      return false;
    }
    const statutUpper = statut.toUpperCase();
    const isValide = statutUpper === 'VALIDE' || statutUpper === StatutTarif.VALIDE;
    console.log('🔍 isTarifValide - Action', action.id, 'Statut:', statut, 'Est validé:', isValide);
    return isValide;
  }

  peutValiderTarif(action: ActionAmiableDTO): boolean {
    // ✅ CORRECTION : Vérifier si on peut valider le tarif
    // Le tarif doit exister et ne pas être déjà validé
    if (!action.tarifExistant || !action.tarifExistant.id) {
      return false;
    }
    
    // Si le tarif est déjà validé, on ne peut plus le valider
    const statut = action.tarifExistant.statut || action.statut;
    if (!statut) {
      // Si pas de statut mais que le tarif existe, on peut le valider
      return true;
    }
    
    const statutUpper = statut.toUpperCase();
    
    // Le tarif peut être validé s'il n'est pas déjà VALIDE
    // Cela inclut EN_ATTENTE_VALIDATION, NON_VALIDE, ou tout autre statut sauf VALIDE
    const peutValider = statutUpper !== 'VALIDE' && statutUpper !== StatutTarif.VALIDE;
    
    console.log('🔍 peutValiderTarif - Action', action.id, 'Tarif ID:', action.tarifExistant.id, 'Statut:', statut, 'Peut valider:', peutValider);
    
    return peutValider;
  }
}

