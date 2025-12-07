import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { UtilisateurService, Utilisateur } from '../../../services/utilisateur.service';
import { UtilisateurCreateComponent } from '../utilisateur-create/utilisateur-create.component';
import { UtilisateurEditComponent } from '../utilisateur-edit/utilisateur-edit.component';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { ConfirmationDialogComponent } from '../../../shared/components/dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-utilisateur-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  providers: [UtilisateurService],
  templateUrl: './utilisateur-list.component.html',
  styleUrls: ['./utilisateur-list.component.scss']
})
export class UtilisateurListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Configuration du tableau
  displayedColumns: string[] = [
    'avatar',
    'nom',
    'prenom',
    'email',
    'role',
    'statut',
    'actions'
  ];

  dataSource = new MatTableDataSource<Utilisateur>([]);
  searchControl = new FormControl('');
  isLoading = false;
  currentUser: any = null; // ✅ NOUVEAU : Utilisateur connecté
  isSuperAdmin = false; // ✅ NOUVEAU : Vérification du rôle
  private destroy$ = new Subject<void>();

  // Options pour les filtres
  roles = ['ADMIN', 'CHEF_DOSSIER', 'AGENT_DOSSIER', 'SUPER_ADMIN'];
  statuts = ['ACTIF', 'INACTIF'];

  constructor(
    private utilisateurService: UtilisateurService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private jwtAuthService: JwtAuthService // ✅ NOUVEAU : Service d'authentification
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser(); // ✅ NOUVEAU : Charger l'utilisateur connecté
    this.loadUtilisateurs();
    this.setupSearch();
  }

  /**
   * ✅ NOUVEAU : Charge l'utilisateur connecté et vérifie le rôle
   */
  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.isSuperAdmin = user?.roleUtilisateur === 'SUPER_ADMIN';
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'utilisateur connecté:', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge la liste des utilisateurs
   */
  loadUtilisateurs(): void {
    this.isLoading = true;
    this.utilisateurService.getUtilisateurs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (utilisateurs) => {
          this.dataSource.data = utilisateurs;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des utilisateurs:', error);
          this.snackBar.open('Erreur lors du chargement des utilisateurs', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });
  }

  /**
   * Configure la recherche avec debounce
   */
  setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.searchUtilisateurs(searchTerm || '');
      });
  }

  /**
   * Recherche des utilisateurs
   */
  searchUtilisateurs(searchTerm: string): void {
    if (searchTerm.trim()) {
      this.isLoading = true;
      this.utilisateurService.getUtilisateurs(searchTerm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (utilisateurs) => {
            this.dataSource.data = utilisateurs;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur lors de la recherche:', error);
            this.snackBar.open('Erreur lors de la recherche', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            this.isLoading = false;
          }
        });
    } else {
      this.loadUtilisateurs();
    }
  }

  /**
   * Ouvre le dialogue de création d'utilisateur
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(UtilisateurCreateComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadUtilisateurs();
          this.snackBar.open('Utilisateur créé avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      });
  }

  /**
   * Ouvre le dialogue de modification d'utilisateur
   */
  openEditDialog(utilisateur: Utilisateur): void {
    const dialogRef = this.dialog.open(UtilisateurEditComponent, {
      width: '600px',
      disableClose: true,
      data: { utilisateur }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadUtilisateurs();
          this.snackBar.open('Utilisateur modifié avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      });
  }

  /**
   * Supprime un utilisateur avec confirmation
   */
  deleteUtilisateur(utilisateur: Utilisateur): void {
    const confirmation = confirm(
      `Êtes-vous sûr de vouloir supprimer l'utilisateur ${utilisateur.prenom} ${utilisateur.nom} ?`
    );

    if (confirmation) {
      this.isLoading = true;
      this.utilisateurService.deleteUtilisateur(utilisateur.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadUtilisateurs();
            this.snackBar.open('Utilisateur supprimé avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            this.isLoading = false;
          }
        });
    }
  }

  /**
   * ✅ NOUVEAU : Change le statut d'un utilisateur avec confirmation et utilisation des nouveaux endpoints
   */
  toggleStatut(utilisateur: Utilisateur): void {
    // Vérifier que l'utilisateur connecté est SUPER_ADMIN
    if (!this.isSuperAdmin) {
      this.snackBar.open('Seul un Super Admin peut activer/désactiver des utilisateurs', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Empêcher la désactivation d'un SUPER_ADMIN
    if (utilisateur.roleUtilisateur === 'SUPER_ADMIN' && utilisateur.actif) {
      this.snackBar.open('Impossible de désactiver un Super Admin', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const action = utilisateur.actif ? 'désactiver' : 'activer';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} l'utilisateur`,
        message: `Êtes-vous sûr de vouloir ${action} l'utilisateur ${utilisateur.prenom} ${utilisateur.nom} ?`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        cancelText: 'Annuler',
        warning: !utilisateur.actif // Avertissement si on désactive
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.isLoading = true;
          const action$ = utilisateur.actif 
            ? this.utilisateurService.desactiverUtilisateur(utilisateur.id!)
            : this.utilisateurService.activerUtilisateur(utilisateur.id!);

          action$.pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (utilisateurModifie) => {
                // Mettre à jour l'utilisateur dans la liste
                const index = this.dataSource.data.findIndex(u => u.id === utilisateur.id);
                if (index !== -1) {
                  this.dataSource.data[index] = utilisateurModifie;
                  this.dataSource._updateChangeSubscription();
                }
                
                this.snackBar.open(
                  `Utilisateur ${action} avec succès`,
                  'Fermer',
                  {
                    duration: 3000,
                    panelClass: ['success-snackbar']
                  }
                );
                this.isLoading = false;
              },
              error: (error) => {
                console.error('Erreur lors du changement de statut:', error);
                const errorMessage = error.error?.message || error.message || 'Erreur lors du changement de statut';
                this.snackBar.open(errorMessage, 'Fermer', {
                  duration: 5000,
                  panelClass: ['error-snackbar']
                });
                this.isLoading = false;
              }
            });
        }
      });
  }

  /**
   * Obtient l'icône du statut
   */
  getStatutIcon(statut: string): string {
    return statut === 'ACTIF' ? 'check_circle' : 'cancel';
  }

  /**
   * Obtient la classe CSS du statut
   */
  getStatutClass(statut: string): string {
    return statut === 'ACTIF' ? 'statut-actif' : 'statut-inactif';
  }

  /**
   * Obtient l'icône du rôle
   */
  getRoleIcon(role: string): string {
    const roleIcons: { [key: string]: string } = {
      'ADMIN': 'admin_panel_settings',
      'CHEF_DOSSIER': 'supervisor_account',
      'AGENT_DOSSIER': 'person',
      'SUPER_ADMIN': 'security'
    };
    return roleIcons[role] || 'person';
  }

  /**
   * Obtient l'initiale pour l'avatar
   */
  getInitials(nom: string, prenom: string): string {
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
  }

  /**
   * Obtient la couleur de l'avatar basée sur le nom
   */
  getAvatarColor(nom: string): string {
    const colors = [
      '#2196F3', '#4CAF50', '#FF9800', '#F44336', 
      '#9C27B0', '#00BCD4', '#795548', '#607D8B'
    ];
    const index = nom.charCodeAt(0) % colors.length;
    return colors[index];
  }

  /**
   * Applique un filtre au tableau
   */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
