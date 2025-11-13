import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { ValidationStatut, Role } from '../../../shared/models/enums.model';
import { Subject, takeUntil, finalize, interval, map, Observable, throwError, of, forkJoin } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ValidationEnqueteService } from '../../../core/services/validation-enquete.service';
import { EnqueteService } from '../../../core/services/enquete.service';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { ValidationEnquete, StatutValidation, User } from '../../../shared/models';
import { ValidationEnqueteDialogComponent } from '../dialogs/validation-enquete-dialog/validation-enquete-dialog.component';
import { RejetEnqueteDialogComponent } from '../dialogs/rejet-enquete-dialog/rejet-enquete-dialog.component';
import { EnqueteDetailsComponent } from '../enquete-details/enquete-details.component';
import { ConfirmDeleteEnqueteDialogComponent } from '../dialogs/confirm-delete-enquete-dialog/confirm-delete-enquete-dialog.component';

@Component({
  selector: 'app-enquetes-en-attente',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './enquetes-en-attente.component.html',
  styleUrls: ['./enquetes-en-attente.component.scss']
})
export class EnquetesEnAttenteComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['rapportCode', 'dossier', 'agentCreateur', 'dateCreation', 'statut', 'actions'];
  dataSource = new MatTableDataSource<ValidationEnquete>([]);
  loading = false;
  autoRefreshInterval = 30000; // 30 secondes
  autoRefreshEnabled = true;
  currentUser: User | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private destroy$ = new Subject<void>();
  private autoRefresh$?: any;
  // IDs des enquêtes en cours de suppression pour désactiver les boutons
  deletingIds = new Set<number>();

  constructor(
    private validationEnqueteService: ValidationEnqueteService,
    private enqueteService: EnqueteService,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadEnquetesEnAttente();
    this.startAutoRefresh();
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          this.currentUser = user;
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'utilisateur:', error);
          // Essayer avec authService en fallback
          this.currentUser = this.authService.getCurrentUser();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAutoRefresh();
  }

  loadEnquetesEnAttente(): void {
    this.loading = true;
    
    // STRATÉGIE : Charger directement les enquêtes en attente, puis récupérer leurs ValidationEnquete existantes
    // Cela évite l'erreur 500 causée par les validations orphelines dans le backend
    // On charge d'abord toutes les enquêtes avec statut EN_ATTENTE_VALIDATION
    // Puis on récupère les ValidationEnquete existantes pour chaque enquête
    console.log('📤 Chargement direct des enquêtes en attente (pour éviter l\'erreur 500 du backend)...');
    
    this.enqueteService.getAllEnquetes()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('❌ Erreur lors du chargement de toutes les enquêtes:', error);
          return of([]);
        }),
        map((allEnquetes) => {
          // Filtrer les enquêtes en attente de validation
          const enquetesEnAttente = allEnquetes.filter(e => {
            if (!e.id) return false;
            // Statut explicite EN_ATTENTE_VALIDATION
            if (e.statut === 'EN_ATTENTE_VALIDATION') return true;
            // Enquête non validée et pas encore validée/rejetée
            if (!e.valide && e.statut !== 'VALIDE' && e.statut !== 'REJETE') {
              return true;
            }
            return false;
          });
          
          console.log('✅ Enquêtes en attente trouvées:', enquetesEnAttente.length);
          console.log('📋 Détails des enquêtes en attente:', enquetesEnAttente.map(e => ({
            id: e.id,
            rapportCode: e.rapportCode,
            statut: e.statut,
            agentCreateurId: e.agentCreateurId
          })));
          
          return enquetesEnAttente;
        }),
        switchMap((enquetesEnAttente) => {
          // Pour chaque enquête en attente, essayer de récupérer sa ValidationEnquete existante
          if (enquetesEnAttente.length === 0) {
            return of([]);
          }
          
          console.log('📤 Récupération des ValidationEnquete existantes pour chaque enquête...');
          
          // Récupérer les ValidationEnquete une par une pour chaque enquête
          const validationRequests = enquetesEnAttente.map(enquete => 
            this.validationEnqueteService.getValidationsByEnquete(enquete.id!)
              .pipe(
                map(validations => {
                  // Filtrer pour ne garder que celles en attente
                  const validationEnAttente = validations.find(v => {
                    const statutStr = String(v.statut || '').toUpperCase();
                    return statutStr === 'EN_ATTENTE' || 
                           statutStr === StatutValidation.EN_ATTENTE?.toUpperCase() ||
                           v.statut === StatutValidation.EN_ATTENTE;
                  });
                  
                  if (validationEnAttente && validationEnAttente.id !== undefined && validationEnAttente.id !== null) {
                    console.log(`✅ ValidationEnquete trouvée pour l'enquête ${enquete.id}: ID ${validationEnAttente.id}`);
                    // S'assurer que l'enquête est attachée et que l'ID est présent
                    return { ...validationEnAttente, enquete: enquete, enqueteId: enquete.id } as ValidationEnquete;
                  } else {
                    console.log(`⚠️ Aucune ValidationEnquete en attente avec ID trouvée pour l'enquête ${enquete.id}`);
                    return null;
                  }
                }),
                catchError(error => {
                  console.warn(`⚠️ Erreur lors de la récupération de ValidationEnquete pour l'enquête ${enquete.id}:`, error);
                  // Si l'erreur est 404, c'est normal (pas de ValidationEnquete)
                  // Si c'est une autre erreur, on ignore aussi
                  return of(null);
                })
              )
          );
          
          // Combiner toutes les requêtes
          return forkJoin(validationRequests).pipe(
            map(results => {
              // Filtrer les nulls d'abord - utiliser une fonction helper pour le type guard
              const isNotNull = (v: ValidationEnquete | null): v is ValidationEnquete => v !== null;
              const validationsNonNull = results.filter(isNotNull);
              
              // Filtrer et ne garder que les ValidationEnquete valides avec ID NON-NULL
              // IMPORTANT: Si validation.id est null, l'enquête n'existe pas - on ne l'utilise pas
              const validationsAvecId: ValidationEnquete[] = validationsNonNull
                .filter(v => {
                  // Vérifier que v a un ID non-null (obligatoire)
                  if (v.id === undefined || v.id === null) {
                    console.warn(`⚠️ ValidationEnquete sans ID ignorée (enquête n'existe pas):`, v.enqueteId || v.enquete?.id);
                    return false;
                  }
                  // Vérifier que l'enquête est présente
                  if (!v.enquete && !v.enqueteId) {
                    console.warn(`⚠️ ValidationEnquete ${v.id} sans enquête ignorée`);
                    return false;
                  }
                  return true;
                });
              
              console.log(`✅ ${validationsAvecId.length} ValidationEnquete avec ID trouvées sur ${enquetesEnAttente.length} enquêtes`);
              
              // Pour les enquêtes sans ValidationEnquete, créer des ValidationEnquete virtuelles
              const validationsVirtuelles: ValidationEnquete[] = enquetesEnAttente
                .filter(enquete => {
                  // Vérifier qu'il n'y a pas déjà une ValidationEnquete avec ID pour cette enquête
                  return !validationsAvecId.some(v => {
                    const vEnqueteId = v.enqueteId || v.enquete?.id;
                    return vEnqueteId === enquete.id;
                  });
                })
                .map(enquete => {
                  console.warn(`⚠️ Enquête ${enquete.id} n'a pas de ValidationEnquete avec ID - création virtuelle (sera créée lors de la validation)`);
                  return {
                    id: undefined,
                    enquete: enquete,
                    enqueteId: enquete.id,
                    agentCreateurId: enquete.agentCreateurId,
                    agentCreateur: enquete.agentCreateur,
                    chefValidateur: null,
                    chefValidateurId: undefined,
                    dateValidation: null,
                    statut: StatutValidation.EN_ATTENTE,
                    commentaires: null,
                    dateCreation: enquete.dateCreation || new Date().toISOString(),
                    dateModification: null
                  } as ValidationEnquete;
                });
              
              const allValidations: ValidationEnquete[] = [...validationsAvecId, ...validationsVirtuelles];
              console.log(`✅ Total validations à afficher: ${allValidations.length} (${validationsAvecId.length} avec ID, ${validationsVirtuelles.length} virtuelles)`);
              
              return allValidations;
            })
          );
        }),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (allValidations) => {
          console.log('✅ Total enquêtes en attente à afficher:', allValidations.length);
          console.log('📋 Détails finaux des validations:', allValidations.map(v => ({
            id: v.id,
            enqueteId: v.enqueteId || v.enquete?.id,
            rapportCode: v.enquete?.rapportCode,
            statut: v.statut,
            hasEnquete: !!v.enquete
          })));
          
          this.dataSource.data = allValidations;
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          
          // Afficher un message si aucune validation n'est trouvée
          if (allValidations.length === 0) {
            console.warn('⚠️ Aucune enquête en attente trouvée. Vérifiez les logs ci-dessus pour comprendre pourquoi.');
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement des enquêtes en attente:', error);
          // Afficher une liste vide plutôt que de planter
          this.dataSource.data = [];
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          this.snackBar.open('Erreur lors du chargement des enquêtes en attente. Certaines enquêtes ont peut-être été supprimées.', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  validerEnquete(validation: ValidationEnquete): void {
    const dialogRef = this.dialog.open(ValidationEnqueteDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { validation }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        // Utiliser jwtAuthService comme méthode principale, avec fallback sur authService
        let chefId: number | null = this.jwtAuthService.getCurrentUserId();
        
        if (!chefId) {
          const currentUser = this.authService.getCurrentUser();
          if (currentUser?.id) {
            chefId = Number(currentUser.id);
            if (isNaN(chefId) || chefId <= 0) {
              chefId = null;
            }
          }
        }
        
        if (!chefId) {
          this.snackBar.open('Erreur: Utilisateur non connecté. Veuillez vous reconnecter.', 'Fermer', { duration: 5000 });
          return;
        }

        const enqueteId = validation.enquete?.id || validation.enqueteId;
        
        if (!enqueteId) {
          this.snackBar.open('Erreur: ID d\'enquête manquant', 'Fermer', { duration: 3000 });
          return;
        }

        this.loading = true;
        const commentaire = result.commentaire || undefined;

        // Si la ValidationEnquete n'a pas d'ID, la créer d'abord
        if (!validation.id) {
          console.log('⚠️ ValidationEnquete sans ID - création en cours...');
          
          // Récupérer l'agentCreateurId
          let agentCreateurId: number | undefined = validation.agentCreateurId;
          
          if (!agentCreateurId && validation.agentCreateur?.id) {
            agentCreateurId = Number(validation.agentCreateur.id);
          }
          
          if (!agentCreateurId || isNaN(agentCreateurId) || agentCreateurId <= 0) {
            this.snackBar.open('Erreur: Impossible de créer la validation. Agent créateur manquant.', 'Fermer', { duration: 5000 });
            this.loading = false;
            return;
          }
          
          // Créer la ValidationEnquete
          // Le backend n'accepte PAS agentCreateurId selon l'erreur "Unrecognized field agentCreateurId"
          // On envoie seulement l'enquête et le statut, le backend déduira l'agentCreateurId de l'enquête
          const validationData: Partial<ValidationEnquete> = {
            enqueteId: Number(enqueteId),
            statut: StatutValidation.EN_ATTENTE
            // Ne pas envoyer agentCreateurId - le backend le déduit de l'enquête
          };
          
          this.validationEnqueteService.createValidationEnquete(validationData)
            .pipe(
              takeUntil(this.destroy$),
              catchError(createError => {
                console.error('❌ Erreur lors de la création de ValidationEnquete:', createError);
                
                // Si l'erreur indique que l'enquête n'existe plus
                if (createError.status === 404 || createError.status === 500) {
                  const errorMessage = createError.error?.message || '';
                  if (errorMessage.includes('Unable to find') || errorMessage.includes('EntityNotFoundException')) {
                    this.snackBar.open('Erreur: Cette enquête a été supprimée. La liste sera actualisée.', 'Fermer', {
                      duration: 5000,
                      panelClass: ['error-snackbar']
                    });
                    setTimeout(() => this.loadEnquetesEnAttente(), 1000);
                    this.loading = false;
                    return throwError(() => createError);
                  }
                }
                
                const message = createError.error?.message || createError.error?.error || 'Erreur lors de la création de la validation';
                this.snackBar.open(message, 'Fermer', {
                  duration: 5000,
                  panelClass: ['error-snackbar']
                });
                this.loading = false;
                return throwError(() => createError);
              }),
              switchMap(newValidation => {
                console.log('✅ ValidationEnquete créée avec ID:', newValidation.id);
                
                if (!newValidation.id) {
                  this.snackBar.open('Erreur: La validation a été créée mais n\'a pas d\'ID. Veuillez rafraîchir la page.', 'Fermer', { duration: 5000 });
                  this.loading = false;
                  return throwError(() => new Error('ValidationEnquete créée sans ID'));
                }
                
                // Maintenant valider avec l'ID créé
                console.log('📤 Validation via ValidationEnquete (créée):', newValidation.id, 'par chef:', chefId);
                return this.validationEnqueteService.validerEnquete(newValidation.id, chefId, commentaire);
              })
            )
            .subscribe({
              next: (validationResult) => {
                console.log('✅ Enquête validée avec succès via ValidationEnquete:', validationResult);
                this.snackBar.open('Enquête validée avec succès', 'Fermer', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
                this.loadEnquetesEnAttente();
              },
              error: (error) => {
                console.error('❌ Erreur finale lors de la validation:', error);
                // L'erreur est déjà gérée dans les catchError précédents
                if (!this.loading) {
                  // Si loading est déjà false, l'erreur a été gérée
                  return;
                }
                this.loading = false;
              }
            });
        } else {
          // La ValidationEnquete a un ID, valider directement
          const validationId = validation.id;
          console.log('📤 Validation via ValidationEnquete (existante):', validationId, 'par chef:', chefId);
          
          this.validationEnqueteService.validerEnquete(validationId, chefId, commentaire)
            .pipe(
              finalize(() => this.loading = false),
              takeUntil(this.destroy$),
              catchError(error => {
                console.error('❌ Erreur lors de la validation via ValidationEnquete:', error);
                console.error('❌ Détails complets:', {
                  status: error.status,
                  statusText: error.statusText,
                  message: error.error?.message,
                  error: error.error?.error,
                  errors: error.error?.errors,
                  url: error.url
                });
                
                // Si l'erreur indique que l'enquête n'existe plus
                if (error.status === 404 || error.status === 500) {
                  const errorMessage = error.error?.message || '';
                  if (errorMessage.includes('Unable to find') || errorMessage.includes('EntityNotFoundException')) {
                    this.snackBar.open('Erreur: Cette enquête a été supprimée. La liste sera actualisée.', 'Fermer', {
                      duration: 5000,
                      panelClass: ['error-snackbar']
                    });
                    setTimeout(() => this.loadEnquetesEnAttente(), 1000);
                    return throwError(() => error);
                  }
                }
                
                // Extraire le message d'erreur détaillé depuis error.message (déjà extrait par le service)
                let errorMessage = error.message || 'Erreur lors de la validation de l\'enquête.';
                
                // Si le message commence par "Erreur : ", le retirer pour un affichage plus propre
                if (errorMessage.startsWith('Erreur : ')) {
                  errorMessage = errorMessage.substring(9);
                } else if (errorMessage.startsWith('Erreur: ')) {
                  errorMessage = errorMessage.substring(8);
                }
                
                this.snackBar.open(errorMessage, 'Fermer', {
                  duration: 5000,
                  panelClass: ['error-snackbar']
                });
                
                return throwError(() => error);
              })
            )
            .subscribe({
              next: (validationResult) => {
                console.log('✅ Enquête validée avec succès via ValidationEnquete:', validationResult);
                this.snackBar.open('Enquête validée avec succès', 'Fermer', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
                this.loadEnquetesEnAttente();
              },
              error: (error) => {
                // L'erreur est déjà gérée dans catchError
                console.error('❌ Erreur finale lors de la validation:', error);
              }
            });
        }
      }
    });
  }


  rejeterEnquete(validation: ValidationEnquete): void {
    // Vérifier que la validation a un ID (ValidationEnquete existe en base)
    if (!validation.id) {
      console.error('❌ ValidationEnquete sans ID - impossible de rejeter via ValidationEnquete');
      this.snackBar.open('Erreur: ValidationEnquete invalide. Veuillez rafraîchir la page.', 'Fermer', { duration: 5000 });
      return;
    }

    const dialogRef = this.dialog.open(RejetEnqueteDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { validation }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.commentaire) {
        // Utiliser jwtAuthService comme méthode principale, avec fallback sur authService
        let chefId: number | null = this.jwtAuthService.getCurrentUserId();
        
        if (!chefId) {
          const currentUser = this.authService.getCurrentUser();
          if (currentUser?.id) {
            chefId = Number(currentUser.id);
            if (isNaN(chefId) || chefId <= 0) {
              chefId = null;
            }
          }
        }
        
        if (!chefId) {
          this.snackBar.open('Erreur: Utilisateur non connecté. Veuillez vous reconnecter.', 'Fermer', { duration: 5000 });
          return;
        }
        const enqueteId = validation.enquete?.id || validation.enqueteId;
        
        if (!enqueteId) {
          this.snackBar.open('Erreur: ID d\'enquête manquant', 'Fermer', { duration: 3000 });
          return;
        }

        this.loading = true;

        // Utiliser directement l'endpoint de rejet de l'enquête (comme dans enquete-details)
        console.log('📤 Rejet direct de l\'enquête:', enqueteId);
        
        this.enqueteService.rejeterEnquete(Number(enqueteId), result.commentaire)
          .pipe(
            finalize(() => this.loading = false),
            takeUntil(this.destroy$),
            catchError(error => {
              console.error('❌ Erreur lors du rejet:', error);
              
              // Si l'erreur est due à une enquête supprimée (400 ou 500 avec EntityNotFoundException)
              if (error.status === 400 || error.status === 500) {
                const errorMessage = error.error?.message || '';
                if (errorMessage.includes('Unable to find') || errorMessage.includes('EntityNotFoundException')) {
                  this.snackBar.open('Erreur: Cette enquête a été supprimée. La liste sera actualisée.', 'Fermer', {
                    duration: 5000,
                    panelClass: ['error-snackbar']
                  });
                  // Recharger la liste pour retirer l'enquête supprimée
                  setTimeout(() => this.loadEnquetesEnAttente(), 1000);
                  return throwError(() => error);
                }
              }
              
              // Extraire le message d'erreur détaillé
              let errorMessage = error.error?.message || error.message || 'Erreur lors du rejet';
              
              // Si le message commence par "Erreur : ", le retirer pour un affichage plus propre
              if (errorMessage.startsWith('Erreur : ')) {
                errorMessage = errorMessage.substring(9);
              } else if (errorMessage.startsWith('Erreur: ')) {
                errorMessage = errorMessage.substring(8);
              }
              
              this.snackBar.open(errorMessage, 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              return throwError(() => error);
            })
          )
          .subscribe({
            next: (enquete) => {
              console.log('✅ Enquête rejetée avec succès:', enquete);
              this.snackBar.open('Enquête rejetée', 'Fermer', {
                duration: 3000,
                panelClass: ['warn-snackbar']
              });
              // Recharger la liste après rejet réussi
              this.loadEnquetesEnAttente();
            },
            error: (error) => {
              // L'erreur est déjà gérée dans catchError
              console.error('❌ Erreur finale lors du rejet:', error);
            }
          });
      }
    });
  }

  voirDetails(validation: ValidationEnquete): void {
    // Vérifier que l'enquête existe avant d'ouvrir les détails
    const enqueteId = validation.enquete?.id || validation.enqueteId;
    if (!enqueteId) {
      this.snackBar.open('Erreur: Enquête non trouvée. Elle a peut-être été supprimée.', 'Fermer', { duration: 5000 });
      return;
    }
    
    // Vérifier si l'enquête est accessible (pas un proxy Hibernate invalide)
    try {
      if (validation.enquete && !validation.enquete.id && !validation.enquete.rapportCode) {
        // L'enquête est probablement un proxy Hibernate qui ne peut pas être chargé
        console.warn('⚠️ Enquête invalide détectée, tentative de chargement direct');
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors de l\'accès à l\'enquête:', error);
      this.snackBar.open('Erreur: Impossible d\'accéder aux détails de l\'enquête. Elle a peut-être été supprimée.', 'Fermer', { duration: 5000 });
      return;
    }

    console.log('📤 Ouverture des détails de l\'enquête:', enqueteId);

    this.dialog.open(EnqueteDetailsComponent, {
      width: '90%',
      maxWidth: '1200px',
      disableClose: false,
      data: { enqueteId: Number(enqueteId) }
    });
  }

  voirHistorique(validation: ValidationEnquete): void {
    if (!validation.enquete?.id) {
      this.snackBar.open('Erreur: Enquête non trouvée', 'Fermer', { duration: 3000 });
      return;
    }

    // Navigation vers la page d'historique ou ouverture d'un dialog
    // Pour l'instant, on ouvre les détails
    this.voirDetails(validation);
  }

  getStatutBadgeClass(statut: StatutValidation): string {
    switch (statut) {
      case StatutValidation.EN_ATTENTE:
        return 'statut-en-attente';
      case StatutValidation.VALIDE:
        return 'statut-valide';
      case StatutValidation.REJETE:
        return 'statut-rejete';
      default:
        return '';
    }
  }

  getStatutLabel(statut: StatutValidation): string {
    switch (statut) {
      case StatutValidation.EN_ATTENTE:
        return 'En attente';
      case StatutValidation.VALIDE:
        return 'Validée';
      case StatutValidation.REJETE:
        return 'Rejetée';
      default:
        return statut || 'Non défini';
    }
  }

  // Exposer StatutValidation pour le template
  StatutValidation = StatutValidation;

  getStatutColor(statut: StatutValidation): string {
    switch (statut) {
      case StatutValidation.EN_ATTENTE:
        return 'warn';
      case StatutValidation.VALIDE:
        return 'primary';
      case StatutValidation.REJETE:
        return 'accent';
      default:
        return '';
    }
  }

  canValidate(): boolean {
    if (!this.currentUser) return false;
    const userRole = this.currentUser.roleUtilisateur;
    return userRole === Role.CHEF_DEPARTEMENT_DOSSIER || userRole === Role.SUPER_ADMIN;
  }

  canDelete(validation: ValidationEnquete): boolean {
    if (!this.currentUser) return false;
    
    // Agent créateur peut supprimer ses propres enquêtes
    const agentId = validation.agentCreateurId || (validation.agentCreateur?.id ? Number(validation.agentCreateur.id) : null);
    if (agentId && this.currentUser.id && Number(this.currentUser.id) === agentId) {
      return true;
    }
    
    // Chef peut supprimer n'importe quelle enquête
    const userRole = this.currentUser.roleUtilisateur;
    return userRole === Role.CHEF_DEPARTEMENT_DOSSIER || userRole === Role.SUPER_ADMIN;
  }

  confirmDeleteEnquete(validation: ValidationEnquete): void {
    const enqueteId = validation.enquete?.id || validation.enqueteId;
    if (!enqueteId) {
      this.snackBar.open('Erreur: ID d\'enquête manquant', 'Fermer', { duration: 3000 });
      return;
    }

    const rapportCode = validation.enquete?.rapportCode || `ID ${enqueteId}`;
    
    const dialogRef = this.dialog.open(ConfirmDeleteEnqueteDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l\'enquête',
        message: `Êtes-vous sûr de vouloir supprimer l'enquête ${rapportCode} ?`,
        details: 'Cette action supprimera également toutes les validations associées. Cette action est irréversible.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // Ajouter l'ID à la liste des suppressions en cours
        this.deletingIds.add(Number(enqueteId));
        
        // Afficher un indicateur de chargement
        const loadingSnackBar = this.snackBar.open('Suppression en cours...', '', {
          duration: 0 // Ne pas fermer automatiquement
        });
        
        this.loading = true;
        
        this.enqueteService.deleteEnquete(Number(enqueteId))
          .pipe(
            finalize(() => {
              this.loading = false;
              this.deletingIds.delete(Number(enqueteId)); // Retirer de la liste même en cas d'erreur
              loadingSnackBar.dismiss(); // Fermer l'indicateur de chargement
            }),
            takeUntil(this.destroy$)
          )
          .subscribe({
            next: (result) => {
              if (result === 'success') {
                // ✅ Suppression réussie : afficher le message et rafraîchir
                console.log('✅ Enquête supprimée avec succès du backend');
                this.snackBar.open(
                  'Enquête supprimée avec succès. Les validations associées ont également été supprimées.', 
                  'Fermer', 
                  { 
                    duration: 5000,
                    panelClass: ['success-snackbar']
                  }
                );
                // Rafraîchir la liste pour refléter la suppression
                this.loadEnquetesEnAttente();
              } else {
                // Le backend a retourné un message d'erreur
                console.warn('⚠️ Le backend a retourné un message d\'erreur:', result);
                this.snackBar.open(
                  result, 
                  'Fermer', 
                  { 
                    duration: 7000,
                    panelClass: ['error-snackbar']
                  }
                );
                // Ne pas rafraîchir, l'enquête est toujours là
              }
            },
            error: (error) => {
              // Extraire le message d'erreur
              let errorMessage = 'Erreur lors de la suppression de l\'enquête';
              
              if (error.message) {
                errorMessage = error.message;
              } else if (error.error) {
                errorMessage = typeof error.error === 'string' 
                  ? error.error 
                  : error.error.message || errorMessage;
              }
              
              console.error('❌ Erreur lors de la suppression:', errorMessage);
              
              // Afficher le message d'erreur détaillé
              this.snackBar.open(
                errorMessage, 
                'Fermer', 
                { 
                  duration: 7000,
                  panelClass: ['error-snackbar']
                }
              );
              
              // Pour une erreur 404, rafraîchir la liste pour vérifier si l'enquête existe toujours
              // Cela peut être dû à un problème de cache ou de synchronisation backend
              if (error.status === 404) {
                console.log('⚠️ Erreur 404 détectée, rafraîchissement de la liste pour vérifier l\'état actuel');
                setTimeout(() => {
                  this.loadEnquetesEnAttente();
                }, 1000);
              }
              // Sinon, ne pas rafraîchir la liste, l'enquête est toujours présente
            }
          });
      }
    });
  }

  /**
   * Vérifie si une enquête est en cours de suppression
   */
  isDeleting(id: number | undefined): boolean {
    return id !== undefined && this.deletingIds.has(id);
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return date;
    }
  }

  getAgentName(validation: ValidationEnquete): string {
    if (validation.agentCreateur) {
      return `${validation.agentCreateur.prenom} ${validation.agentCreateur.nom}`;
    }
    return 'N/A';
  }

  getDossierInfo(validation: ValidationEnquete): string {
    if (validation.enquete?.dossier) {
      return `${validation.enquete.dossier.numeroDossier} - ${validation.enquete.dossier.titre}`;
    }
    return 'N/A';
  }

  startAutoRefresh(): void {
    if (this.autoRefreshEnabled) {
      this.autoRefresh$ = interval(this.autoRefreshInterval)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.loadEnquetesEnAttente();
        });
    }
  }

  stopAutoRefresh(): void {
    if (this.autoRefresh$) {
      this.autoRefresh$.unsubscribe();
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }
}

