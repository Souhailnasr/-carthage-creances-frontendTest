import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { AgentAmiableService } from '../../../core/services/agent-amiable.service';
import { ActionRecouvrementService, ActionRecouvrement, TypeAction, ReponseDebiteur } from '../../../core/services/action-recouvrement.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { User } from '../../../shared/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-agent-amiable-actions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './agent-amiable-actions.component.html',
  styleUrls: ['./agent-amiable-actions.component.scss']
})
export class AgentAmiableActionsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  currentUserId: number | null = null;
  actions: ActionRecouvrement[] = [];
  loading = false;
  showForm = false;
  actionForm!: FormGroup;
  editingAction: ActionRecouvrement | null = null;
  selectedDossierId: number | null = null;
  
  typeActions = Object.values(TypeAction);
  reponses = Object.values(ReponseDebiteur);
  
  displayedColumns: string[] = ['type', 'dateAction', 'nbOccurrences', 'reponseDebiteur', 'dossier', 'actions'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private agentAmiableService: AgentAmiableService,
    private actionService: ActionRecouvrementService,
    private jwtAuthService: JwtAuthService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.route.queryParams.subscribe(params => {
      if (params['dossierId']) {
        this.selectedDossierId = parseInt(params['dossierId']);
        this.loadActions();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.actionForm = this.fb.group({
      type: ['', Validators.required],
      dateAction: [new Date(), Validators.required],
      nbOccurrences: [1, [Validators.required, Validators.min(1)]],
      reponseDebiteur: [null],
      coutUnitaire: [0, [Validators.min(0)]],
      dossierId: [null, Validators.required]
    });
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.currentUserId = user?.id ? parseInt(user.id) : null;
        this.loadActions();
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
      }
    });
  }

  loadActions(): void {
    if (!this.selectedDossierId) {
      // Charger toutes les actions de l'agent
      // Pour l'instant, on attend un dossierId
      return;
    }
    
    this.loading = true;
    this.actionService.getActionsByDossier(this.selectedDossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (actions) => {
        this.actions = this.applyActionPermissions(actions);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des actions:', error);
        this.toastService.error('Erreur lors du chargement des actions');
        this.loading = false;
      }
    });
  }

  showCreateForm(dossierId?: number): void {
    this.editingAction = null;
    this.showForm = true;
    if (dossierId) {
      this.selectedDossierId = dossierId;
      this.actionForm.patchValue({ dossierId });
    } else if (this.selectedDossierId) {
      this.actionForm.patchValue({ dossierId: this.selectedDossierId });
    }
  }

  showEditForm(action: ActionRecouvrement): void {
    if (!this.canManageAction(action)) {
      this.toastService.warning('Vous ne pouvez modifier que vos propres actions.');
      return;
    }
    this.editingAction = action;
    this.showForm = true;
    this.actionForm.patchValue({
      type: action.type,
      dateAction: new Date(action.dateAction),
      nbOccurrences: action.nbOccurrences,
      reponseDebiteur: action.reponseDebiteur,
      coutUnitaire: action.coutUnitaire || 0,
      dossierId: action.dossier.id
    });
    this.selectedDossierId = action.dossier.id;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingAction = null;
    this.initForm();
  }

  onSubmit(): void {
    if (this.actionForm.invalid) {
      this.actionForm.markAllAsTouched();
      return;
    }

    const formValue = this.actionForm.value;
    const dossierId = formValue.dossierId || this.selectedDossierId;
    
    if (!dossierId) {
      this.toastService.error('Veuillez sélectionner un dossier');
      return;
    }

    const actionData: Partial<ActionRecouvrement> = {
      type: formValue.type,
      dateAction: formValue.dateAction,
      nbOccurrences: formValue.nbOccurrences,
      reponseDebiteur: formValue.reponseDebiteur,
      coutUnitaire: formValue.coutUnitaire,
      agentId: this.currentUserId || undefined
    };

    if (this.editingAction && this.editingAction.id) {
      if (!this.canManageAction(this.editingAction)) {
        this.toastService.warning('Vous ne pouvez modifier que vos propres actions.');
        return;
      }
      // Modifier
      this.actionService.updateAction(this.editingAction.id, actionData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.toastService.success('Action modifiée avec succès');
          this.cancelForm();
          this.loadActions();
        },
        error: (error) => {
          console.error('❌ Erreur lors de la modification:', error);
          this.toastService.error('Erreur lors de la modification de l\'action');
        }
      });
    } else {
      // Créer
      this.actionService.createAction(dossierId, actionData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.toastService.success('Action créée avec succès');
          this.cancelForm();
          this.loadActions();
        },
        error: (error) => {
          console.error('❌ Erreur lors de la création:', error);
          this.toastService.error('Erreur lors de la création de l\'action');
        }
      });
    }
  }

  deleteAction(action: ActionRecouvrement): void {
    if (!action.id) return;
    if (!this.canManageAction(action)) {
      this.toastService.warning('Vous ne pouvez supprimer que vos propres actions.');
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette action ?`)) {
      this.actionService.deleteAction(action.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.toastService.success('Action supprimée avec succès');
          this.loadActions();
        },
        error: (error) => {
          console.error('❌ Erreur lors de la suppression:', error);
          this.toastService.error('Erreur lors de la suppression de l\'action');
        }
      });
    }
  }

  getTypeLabel(type: TypeAction): string {
    const labels: { [key: string]: string } = {
      'APPEL': 'Appel',
      'EMAIL': 'Email',
      'VISITE': 'Visite',
      'LETTRE': 'Lettre',
      'AUTRE': 'Autre'
    };
    return labels[type] || type;
  }

  getReponseLabel(reponse: ReponseDebiteur | null): string {
    if (!reponse) return 'En attente';
    const labels: { [key: string]: string } = {
      'POSITIVE': 'Positive',
      'NEGATIVE': 'Négative',
      'EN_ATTENTE': 'En attente'
    };
    return labels[reponse] || reponse;
  }

  canManageAction(action: ActionRecouvrement): boolean {
    if (!this.currentUserId) {
      return false;
    }
    return (action.agentId ?? action.creePar?.id ?? null) === this.currentUserId;
  }

  getActionOwnerLabel(action: ActionRecouvrement): string {
    if (action.agentNom) {
      return action.agentNom;
    }
    if (action.creePar) {
      return `${action.creePar.prenom || ''} ${action.creePar.nom || ''}`.trim();
    }
    return 'Chef / Système';
  }

  private applyActionPermissions(actions: ActionRecouvrement[]): ActionRecouvrement[] {
    const userId = this.currentUserId;
    return actions.map(action => {
      const rawOwnerId = action.agentId ?? action.creePar?.id;
      const normalizedOwnerId = rawOwnerId !== undefined && rawOwnerId !== null ? Number(rawOwnerId) : undefined;
      const ownerName = action.agentNom ?? (
        action.creePar ? `${action.creePar.prenom || ''} ${action.creePar.nom || ''}`.trim() : undefined
      );

      return {
        ...action,
        agentId: normalizedOwnerId,
        agentNom: ownerName,
        editable: !!userId && normalizedOwnerId === userId
      };
    });
  }
}

