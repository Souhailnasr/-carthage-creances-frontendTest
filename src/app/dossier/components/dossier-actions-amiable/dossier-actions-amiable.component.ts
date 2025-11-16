import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { ActionRecouvrementService, ActionRecouvrement, TypeAction, ReponseDebiteur, StatistiquesActions } from '../../../core/services/action-recouvrement.service';
import { ActionDialogAmiableComponent } from '../action-dialog-amiable/action-dialog-amiable.component';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

@Component({
  selector: 'app-dossier-actions-amiable',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './dossier-actions-amiable.component.html',
  styleUrls: ['./dossier-actions-amiable.component.scss']
})
export class DossierActionsAmiableComponent implements OnInit, OnDestroy {
  @Input() dossierId!: number;
  
  actions: ActionRecouvrement[] = [];
  statistiques: StatistiquesActions = {
    total: 0,
    positives: 0,
    negatives: 0,
    sansReponse: 0,
    parType: {},
    dernieresActions: []
  };
  
  displayedColumns: string[] = ['dateAction', 'type', 'nbOccurrences', 'reponseDebiteur', 'actions'];
  filteredActions: ActionRecouvrement[] = [];
  selectedTypeFilter: TypeAction | '' = '';
  selectedReponseFilter: ReponseDebiteur | '' = '';
  loading = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private actionService: ActionRecouvrementService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private jwtAuthService: JwtAuthService
  ) {}

  ngOnInit(): void {
    // Vérifier l'authentification
    if (!this.jwtAuthService.isUserLoggedIn()) {
      this.snackBar.open('Vous devez être connecté pour accéder à cette page', 'Fermer', { duration: 3000 });
      return;
    }
    
    this.loadActions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadActions(): void {
    if (!this.dossierId) {
      console.error('❌ dossierId non défini');
      return;
    }
    
    this.loading = true;
    this.actionService.getActionsByDossier(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (actions) => {
        this.actions = actions;
        this.filteredActions = actions;
        this.loadStatistiques();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des actions:', err);
        this.snackBar.open('Erreur lors du chargement des actions', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadStatistiques(): void {
    this.actionService.getStatistiquesActions(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.statistiques = stats;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des statistiques:', err);
      }
    });
  }

  addAction(): void {
    const dialogRef = this.dialog.open(ActionDialogAmiableComponent, {
      width: '500px',
      data: { dossierId: this.dossierId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadActions();
      }
    });
  }

  editAction(action: ActionRecouvrement): void {
    const dialogRef = this.dialog.open(ActionDialogAmiableComponent, {
      width: '500px',
      data: { dossierId: this.dossierId, action }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadActions();
      }
    });
  }

  deleteAction(actionId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) {
      this.actionService.deleteAction(actionId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.snackBar.open('Action supprimée avec succès', 'Fermer', { duration: 3000 });
          this.loadActions();
        },
        error: (err) => {
          console.error('❌ Erreur lors de la suppression:', err);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  filterByType(type: TypeAction | ''): void {
    this.selectedTypeFilter = type;
    this.applyFilters();
  }

  filterByReponse(reponse: ReponseDebiteur | ''): void {
    this.selectedReponseFilter = reponse;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredActions = this.actions.filter(action => {
      const typeMatch = !this.selectedTypeFilter || action.type === this.selectedTypeFilter;
      const reponseMatch = !this.selectedReponseFilter || action.reponseDebiteur === this.selectedReponseFilter;
      return typeMatch && reponseMatch;
    });
  }

  getTypeLabel(type: TypeAction): string {
    const labels: { [key: string]: string } = {
      'APPEL': 'appel(s)',
      'EMAIL': 'email(s)',
      'VISITE': 'visite(s)',
      'LETTRE': 'lettre(s)',
      'AUTRE': 'action(s)'
    };
    return labels[type] || 'action(s)';
  }

  getReponseClass(reponse: ReponseDebiteur | null): string {
    if (!reponse) return 'neutral';
    return reponse === ReponseDebiteur.POSITIVE ? 'positive' : 'negative';
  }
}

