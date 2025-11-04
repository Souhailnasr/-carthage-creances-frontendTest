import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
// Utiliser MatChipBadge ou créer un badge personnalisé si MatChipModule n'est pas disponible
// import { MatChipModule } from '@angular/material/chip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ValidationDossierService, ValidationDossier } from '../../../core/services/validation-dossier.service';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { ValidationDialogComponent } from '../dialogs/validation-dialog/validation-dialog.component';
import { RejetDialogComponent } from '../dialogs/rejet-dialog/rejet-dialog.component';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dossiers-en-attente',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    // MatChipModule, // Module non disponible, utiliser un badge personnalisé
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './dossiers-en-attente.component.html',
  styleUrls: ['./dossiers-en-attente.component.scss']
})
export class DossiersEnAttenteComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['numeroDossier', 'titre', 'agentCreateur', 'dateCreation', 'statut', 'actions'];
  dataSource = new MatTableDataSource<ValidationDossier>();
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private validationService: ValidationDossierService,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDossiersEnAttente();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDossiersEnAttente(): void {
    this.loading = true;
    this.validationService.getDossiersEnAttente()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (validations) => {
          this.dataSource.data = validations;
          console.log('✅ Dossiers en attente chargés:', validations.length);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des dossiers en attente:', error);
          this.snackBar.open('Erreur lors du chargement des dossiers en attente', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  validerDossier(validation: ValidationDossier): void {
    const dialogRef = this.dialog.open(ValidationDialogComponent, {
      width: '500px',
      data: { dossier: validation.dossier }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result?.confirmed) {
        try {
          // Utiliser jwtAuthService pour récupérer l'utilisateur de manière asynchrone
          const currentUser = await firstValueFrom(this.jwtAuthService.getCurrentUser());
          
          if (!currentUser || !currentUser.id) {
            console.error('❌ Utilisateur non trouvé:', currentUser);
            this.snackBar.open('Erreur: Utilisateur non connecté', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            return;
          }

          const chefId = Number(currentUser.id);
          console.log('✅ Chef ID récupéré:', chefId);
          this.loading = true;

          this.validationService.validerDossier(validation.dossier.id, chefId)
            .pipe(
              takeUntil(this.destroy$),
              finalize(() => this.loading = false)
            )
            .subscribe({
              next: () => {
                this.snackBar.open('Dossier validé avec succès', 'Fermer', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
                this.loadDossiersEnAttente(); // Rafraîchir la liste
              },
              error: (error) => {
                console.error('❌ Erreur lors de la validation:', error);
                const message = error.error?.message || error.message || 'Erreur lors de la validation du dossier';
                this.snackBar.open(message, 'Fermer', {
                  duration: 5000,
                  panelClass: ['error-snackbar']
                });
              }
            });
        } catch (error) {
          console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
          this.snackBar.open('Erreur: Impossible de récupérer les informations utilisateur', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }

  rejeterDossier(validation: ValidationDossier): void {
    const dialogRef = this.dialog.open(RejetDialogComponent, {
      width: '500px',
      data: { dossier: validation.dossier }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result?.commentaire) {
        try {
          // Vérifier que l'utilisateur est bien connecté
          if (!this.jwtAuthService.isUserLoggedIn()) {
            this.snackBar.open('Erreur: Utilisateur non connecté', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            return;
          }

          this.loading = true;

          this.validationService.rejeterDossier(validation.dossier.id, result.commentaire)
            .pipe(
              takeUntil(this.destroy$),
              finalize(() => this.loading = false)
            )
            .subscribe({
              next: () => {
                this.snackBar.open('Dossier rejeté avec succès', 'Fermer', {
                  duration: 3000,
                  panelClass: ['warn-snackbar']
                });
                this.loadDossiersEnAttente(); // Rafraîchir la liste
              },
              error: (error) => {
                console.error('❌ Erreur lors du rejet:', error);
                const message = error.error?.message || error.message || 'Erreur lors du rejet du dossier';
                this.snackBar.open(message, 'Fermer', {
                  duration: 5000,
                  panelClass: ['error-snackbar']
                });
              }
            });
        } catch (error) {
          console.error('❌ Erreur lors du rejet:', error);
          this.snackBar.open('Erreur: Impossible de traiter le rejet', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }

  voirDetails(validation: ValidationDossier): void {
    this.router.navigate(['/dossier/detail', validation.dossier.id]);
  }

  getAgentName(validation: ValidationDossier): string {
    if (validation.agentCreateur) {
      return `${validation.agentCreateur.prenom} ${validation.agentCreateur.nom}`;
    }
    return 'Non défini';
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'statut-en-attente';
      case 'VALIDE':
        return 'statut-valide';
      case 'REJETE':
        return 'statut-rejete';
      default:
        return '';
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

