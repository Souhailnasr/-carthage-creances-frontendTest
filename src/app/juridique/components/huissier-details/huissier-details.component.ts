import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// MatSnackBarModule not needed in standalone components
import { takeUntil, Subject } from 'rxjs';

import { HuissierService } from '../../services/huissier.service';
import { ToastService } from '../../../core/services/toast.service';
import { Huissier } from '../../models/huissier.model';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-huissier-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatDialogModule,
  ],
  templateUrl: './huissier-details.component.html',
  styleUrls: ['./huissier-details.component.scss']
})
export class HuissierDetailsComponent implements OnInit, OnDestroy {
  huissier: Huissier | null = null;
  huissierId: number | null = null;
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private huissierService: HuissierService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(MatDialog) private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.huissierId = +id;
        this.loadHuissier(+id);
      } else {
        this.router.navigate(['/juridique/huissiers']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadHuissier(id: number): void {
    this.isLoading = true;
    this.huissierService.getHuissierById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (huissier) => {
          this.huissier = huissier;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement du huissier:', error);
          this.toastService.error('Erreur lors du chargement du huissier');
          this.isLoading = false;
          this.router.navigate(['/juridique/huissiers']);
        }
      });
  }

  onBack(): void {
    this.router.navigate(['/juridique/huissiers']);
  }

  onEdit(): void {
    if (this.huissierId) {
      this.router.navigate(['/juridique/huissiers/edit', this.huissierId]);
    }
  }

  onDelete(): void {
    if (!this.huissier || !this.huissierId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmer la suppression',
        message: `Êtes-vous sûr de vouloir supprimer le huissier ${this.huissier.prenom} ${this.huissier.nom} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.isLoading = true;
        this.huissierService.deleteHuissier(this.huissierId!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.toastService.success('Huissier supprimé avec succès');
              this.router.navigate(['/juridique/huissiers']);
            },
            error: (error) => {
              console.error('❌ Erreur lors de la suppression:', error);
              this.toastService.error('Erreur lors de la suppression du huissier');
              this.isLoading = false;
            }
          });
      }
    });
  }

  // Utility methods
  getHuissierFullName(): string {
    if (!this.huissier) return '';
    return `${this.huissier.prenom} ${this.huissier.nom}`.trim();
  }

  getHuissierInitials(): string {
    if (!this.huissier) return '';
    const firstInitial = this.huissier.prenom ? this.huissier.prenom.charAt(0).toUpperCase() : '';
    const lastInitial = this.huissier.nom ? this.huissier.nom.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  }

  getStatusColor(): string {
    // Since actif is not in the backend entity, we'll consider all huissiers as active
    return 'primary';
  }

  getStatusText(): string {
    // Since actif is not in the backend entity, we'll consider all huissiers as active
    return 'Actif';
  }

  getStatusIcon(): string {
    // Since actif is not in the backend entity, we'll consider all huissiers as active
    return 'check_circle';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Non renseignée';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  }
}
