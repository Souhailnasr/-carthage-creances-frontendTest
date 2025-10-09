import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { Avocat } from '../../models/avocat.model';
import { AvocatService } from '../../services/avocat.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-avocat-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatListModule,
    MatDialogModule
  ],
  templateUrl: './avocat-details.component.html',
  styleUrls: ['./avocat-details.component.scss']
})
export class AvocatDetailsComponent implements OnInit, OnDestroy {
  avocat: Avocat | null = null;
  isLoading: boolean = false;
  avocatId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private avocatService: AvocatService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    /** Inject to satisfy Angular compiler in strict mode */
    @Inject(MatDialog) private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAvocatData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAvocatData(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.avocatId = +params['id'];
        this.loadAvocat();
      } else {
        this.router.navigate(['/juridique/avocats']);
      }
    });
  }

  private loadAvocat(): void {
    if (this.avocatId) {
      this.isLoading = true;
      this.avocatService.getAvocatById(this.avocatId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (avocat) => {
            this.avocat = avocat;
            this.isLoading = false;
            console.log('✅ Avocat chargé:', avocat);
          },
          error: (error) => {
            console.error('❌ Erreur lors du chargement de l\'avocat:', error);
            this.toastService.error('Erreur lors du chargement de l\'avocat');
            this.router.navigate(['/juridique/avocats']);
            this.isLoading = false;
          }
        });
    }
  }

  onEdit(): void {
    if (this.avocatId) {
      this.router.navigate(['/juridique/avocats/edit', this.avocatId]);
    }
  }

  onDelete(): void {
    if (!this.avocat) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmer la suppression',
        message: `Êtes-vous sûr de vouloir supprimer l'avocat ${this.avocat.prenom} ${this.avocat.nom} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.deleteAvocat();
      }
    });
  }

  private deleteAvocat(): void {
    if (this.avocatId) {
      this.isLoading = true;
      this.avocatService.deleteAvocat(this.avocatId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Avocat supprimé avec succès');
            this.router.navigate(['/juridique/avocats']);
          },
          error: (error) => {
            console.error('❌ Erreur lors de la suppression:', error);
            this.toastService.error('Erreur lors de la suppression de l\'avocat');
            this.isLoading = false;
          }
        });
    }
  }

  // Changement de statut retiré (non supporté par l'entité backend)

  onBack(): void {
    this.router.navigate(['/juridique/avocats']);
  }

  getAvocatInitials(): string {
    if (!this.avocat) return '';
    return `${this.avocat.prenom.charAt(0)}${this.avocat.nom.charAt(0)}`.toUpperCase();
  }

  getAvocatFullName(): string {
    if (!this.avocat) return '';
    return `${this.avocat.prenom} ${this.avocat.nom}`;
  }

  getStatusColor(): string {
    return this.avocat?.actif ? 'primary' : 'warn';
  }

  getStatusText(): string {
    return this.avocat?.actif ? 'Actif' : 'Inactif';
  }

  getStatusIcon(): string {
    return this.avocat?.actif ? 'check_circle' : 'cancel';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Non renseigné';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  hasContactInfo(): boolean {
    return !!(this.avocat?.email || this.avocat?.telephone);
  }

  hasProfessionalInfo(): boolean {
    return !!(this.avocat?.specialite || this.avocat?.numeroOrdre);
  }
}

