import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { ValidationStatut } from '../../../shared/models/enums.model';
import { Subject, takeUntil, finalize, debounceTime, distinctUntilChanged, combineLatest, forkJoin, catchError, of, Observable, switchMap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ValidationEnqueteService } from '../../../core/services/validation-enquete.service';
import { EnqueteService } from '../../../core/services/enquete.service';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { ValidationEnquete, StatutValidation, User, Enquette, Role } from '../../../shared/models';
import { Dossier } from '../../../shared/models/dossier.model';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { EnqueteDetailsComponent } from '../enquete-details/enquete-details.component';
import { ConfirmDeleteEnqueteDialogComponent } from '../dialogs/confirm-delete-enquete-dialog/confirm-delete-enquete-dialog.component';

@Component({
  selector: 'app-mes-validations-enquete',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './mes-validations-enquete.component.html',
  styleUrls: ['./mes-validations-enquete.component.scss']
})
export class MesValidationsEnqueteComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['rapportCode', 'numeroDossier', 'titreDossier', 'statut', 'dateCreation', 'dateValidation', 'chefValidateur', 'commentaires', 'actions'];
  displayedColumnsForChef: string[] = ['rapportCode', 'numeroDossier', 'titreDossier', 'agentCreateur', 'statut', 'dateCreation', 'dateValidation', 'commentaires', 'actions'];
  
  currentUser: User | null = null;
  dataSource = new MatTableDataSource<ValidationEnquete>([]);
  filteredData: ValidationEnquete[] = [];
  loading = false;
  stats = {
    total: 0,
    enAttente: 0,
    validees: 0,
    rejetees: 0
  };

  filterForm: FormGroup;
  statutOptions = Object.values(StatutValidation);
  
  // Exposer l'enum pour l'utiliser dans le template
  StatutValidation = StatutValidation;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private destroy$ = new Subject<void>();
  // IDs des enquêtes en cours de suppression pour désactiver les boutons
  deletingIds = new Set<number>();

  constructor(
    private validationEnqueteService: ValidationEnqueteService,
    private enqueteService: EnqueteService,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private dossierApiService: DossierApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      statut: [''],
      searchTerm: ['']
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadValidations();
    this.setupFilters();
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          this.currentUser = user;
        },
        error: (err) => {
          console.error('❌ Erreur lors du chargement de l\'utilisateur:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadValidations(): void {
    this.loading = true;
    
    // Récupérer l'ID utilisateur depuis le token JWT (méthode principale)
    let userId: number | null = this.jwtAuthService.getCurrentUserId();
    
    // Fallback sur authService si getCurrentUserId() retourne null
    if (!userId) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.id) {
        userId = Number(currentUser.id);
        if (isNaN(userId) || userId <= 0) {
          userId = null;
        }
      }
    }
    
    if (!userId) {
      console.error('❌ ID utilisateur non disponible');
      this.snackBar.open('Erreur: Utilisateur non connecté. Veuillez vous reconnecter.', 'Fermer', { duration: 5000 });
      this.loading = false;
      return;
    }

    // Déterminer le rôle de l'utilisateur
    const isChef = this.currentUser?.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER || 
                   this.currentUser?.roleUtilisateur === Role.SUPER_ADMIN;
    const isAgent = this.currentUser?.roleUtilisateur === Role.AGENT_DOSSIER;

    console.log('📤 Chargement des validations pour:', { userId, role: this.currentUser?.roleUtilisateur, isChef, isAgent });
    
    // Charger les validations selon le rôle
    // Pour les chefs : charger les validations qu'ils ont effectuées
    // Pour les agents : charger les validations de leurs enquêtes
    const validations$ = isChef 
      ? this.validationEnqueteService.getValidationsByChef(userId)
      : this.validationEnqueteService.getValidationsByAgent(userId);
    
    validations$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (validations) => {
          console.log('✅ Validations chargées:', validations.length);
          
          // Filtrer les validations qui référencent des enquêtes supprimées (enquete null ou invalide)
          const validationsValides = validations.filter(v => {
            // Vérifier si l'enquête existe et est valide
            if (!v.enquete && !v.enqueteId) {
              console.warn('⚠️ Validation sans enquête trouvée, ignorée:', v.id);
              return false;
            }
            // Si l'enquête est un proxy Hibernate qui ne peut pas être chargé, elle sera null
            // On vérifie si on peut accéder à au moins un champ de base
            try {
              const enqueteId = v.enquete?.id || v.enqueteId;
              if (!enqueteId) {
                console.warn('⚠️ Validation avec enquête invalide trouvée, ignorée:', v.id);
                return false;
              }
              
              return true;
            } catch (error) {
              console.warn('⚠️ Erreur lors de l\'accès à l\'enquête de la validation, ignorée:', v.id, error);
              return false;
            }
          });
          
          console.log(`✅ ${validationsValides.length} validations valides (${validations.length - validationsValides.length} ignorées)`);
          
          // Pour les chefs : charger aussi les enquêtes créées par les agents pour avoir une vue complète
          if (isChef) {
            // Charger toutes les enquêtes pour voir celles créées par les agents
            this.enqueteService.getAllEnquetes()
              .pipe(
                takeUntil(this.destroy$),
                finalize(() => {
                  this.loading = false;
                  this.calculateStats();
                })
              )
              .subscribe({
                next: (allEnquetes) => {
                  console.log('✅ Toutes les enquêtes chargées pour le chef:', allEnquetes.length);
                  
                  // Pour les chefs : combiner les validations qu'ils ont effectuées avec les enquêtes créées par les agents
                  // Cela leur permet de voir toutes les enquêtes qu'ils ont validées ET celles créées par les agents
                  const enquetesAgents = allEnquetes.filter(e => {
                    // Enquêtes créées par des agents (pas par le chef lui-même)
                    const agentId = e.agentCreateurId || (e.agentCreateur?.id ? Number(e.agentCreateur.id) : null);
                    return agentId !== null && agentId !== userId;
                  });
                  
                  console.log(`✅ ${enquetesAgents.length} enquêtes créées par les agents trouvées`);
                  
                  // Pour chaque enquête créée par un agent, créer une ValidationEnquete virtuelle si elle n'a pas déjà de validation
                  const validationsVirtuelles: ValidationEnquete[] = enquetesAgents
                    .filter(enquete => {
                      // Ne pas créer de validation virtuelle si une validation existe déjà
                      return !validationsValides.some(v => {
                        const vEnqueteId = v.enquete?.id || v.enqueteId;
                        return vEnqueteId === enquete.id;
                      });
                    })
                    .map(enquete => ({
                      id: undefined,
                      enquete: enquete,
                      enqueteId: enquete.id,
                      agentCreateurId: enquete.agentCreateurId,
                      agentCreateur: enquete.agentCreateur,
                      chefValidateur: null,
                      chefValidateurId: undefined,
                      dateValidation: null,
                      statut: enquete.statut === 'VALIDE' ? StatutValidation.VALIDE :
                              enquete.statut === 'REJETE' ? StatutValidation.REJETE :
                              StatutValidation.EN_ATTENTE,
                      commentaires: null,
                      dateCreation: enquete.dateCreation || new Date().toISOString(),
                      dateModification: null
                    } as ValidationEnquete));
                  
                  // Combiner les validations réelles avec les validations virtuelles
                  const allValidations = [...validationsValides, ...validationsVirtuelles];
                  console.log(`✅ Total validations à afficher pour le chef: ${allValidations.length} (${validationsValides.length} réelles, ${validationsVirtuelles.length} virtuelles)`);
                  
                  // Charger les dossiers manquants
                  this.loadDossiersForValidations(allValidations);
                },
                error: (error) => {
                  console.error('❌ Erreur lors du chargement des enquêtes pour le chef:', error);
                  // Afficher quand même les validations chargées
                  this.loadDossiersForValidations(validationsValides);
                }
              });
            return;
          }
          
          // Pour les agents : charger aussi les enquêtes créées par l'agent avec statut EN_ATTENTE_VALIDATION
          // qui n'ont pas encore de validation
          // Utiliser getAllEnquetes() et filtrer côté client pour éviter l'erreur 404 si l'endpoint /agent/{id} n'existe pas
          this.enqueteService.getAllEnquetes()
            .pipe(
              takeUntil(this.destroy$),
              finalize(() => {
                this.loading = false;
                this.calculateStats();
              })
            )
            .subscribe({
              next: (allEnquetes) => {
                console.log('✅ Toutes les enquêtes chargées:', allEnquetes.length);
                
                // Filtrer les enquêtes de l'agent avec logging détaillé
                // IMPORTANT: Après validation, agent_createur_id peut être NULL dans enquette
                // Il faut aussi vérifier dans validation_enquetes via validationsValides
                console.log(`🔍 Filtrage des enquêtes pour l'agent ${userId} parmi ${allEnquetes.length} enquêtes totales`);
                
                // Créer un map des enquete_id -> agent_createur_id depuis les validations
                const agentCreateurFromValidations = new Map<number, number>();
                validationsValides.forEach(v => {
                  const enqueteId = v.enqueteId || v.enquete?.id;
                  const agentCreateurId = v.agentCreateurId || (v.agentCreateur?.id ? Number(v.agentCreateur.id) : null);
                  if (enqueteId && agentCreateurId) {
                    agentCreateurFromValidations.set(Number(enqueteId), Number(agentCreateurId));
                    console.log(`📋 Validation ${v.id}: enqueteId=${enqueteId}, agentCreateurId=${agentCreateurId}`);
                  }
                });
                
                const enquetes = allEnquetes.filter(e => {
                  if (!e.id) return false;
                  
                  const agentCreateurId = e.agentCreateurId;
                  const agentCreateurIdFromObject = e.agentCreateur?.id ? Number(e.agentCreateur.id) : null;
                  const agentCreateurIdFromValidation = agentCreateurFromValidations.get(e.id);
                  
                  // Comparer agentCreateurId (number) depuis enquette
                  if (agentCreateurId === userId) {
                    console.log(`✅ Enquête ${e.id} correspond (agentCreateurId: ${agentCreateurId})`);
                    return true;
                  }
                  
                  // Comparer agentCreateur.id (peut être string ou number) depuis enquette
                  if (agentCreateurIdFromObject !== null && !isNaN(agentCreateurIdFromObject) && agentCreateurIdFromObject === userId) {
                    console.log(`✅ Enquête ${e.id} correspond (agentCreateur.id: ${agentCreateurIdFromObject})`);
                    return true;
                  }
                  
                  // Si agent_createur_id est NULL dans enquette, utiliser validation_enquetes
                  if ((!agentCreateurId && !agentCreateurIdFromObject) && agentCreateurIdFromValidation === userId) {
                    console.log(`✅ Enquête ${e.id} correspond (agentCreateurId depuis validation: ${agentCreateurIdFromValidation})`);
                    // Mettre à jour l'enquête avec l'agentCreateurId trouvé dans les validations
                    e.agentCreateurId = agentCreateurIdFromValidation;
                    return true;
                  }
                  
                  // Log pour debug
                  console.log(`❌ Enquête ${e.id} ne correspond pas:`, {
                    userIdRecherche: userId,
                    agentCreateurId: agentCreateurId,
                    agentCreateurIdFromObject: agentCreateurIdFromObject,
                    agentCreateurIdFromValidation: agentCreateurIdFromValidation,
                    rapportCode: e.rapportCode
                  });
                  
                  return false;
                });
                console.log(`✅ ${enquetes.length} enquêtes trouvées pour l'agent ${userId}`);
                console.log(`📋 Détails des enquêtes trouvées:`, enquetes.map(e => ({
                  id: e.id,
                  rapportCode: e.rapportCode,
                  agentCreateurId: e.agentCreateurId,
                  agentCreateurIdFromObject: e.agentCreateur?.id,
                  dossierId: e.dossierId
                })));
                
                // Pour les agents : afficher TOUTES leurs enquêtes (pas seulement celles en attente)
                // Cela leur permet de voir toutes leurs enquêtes et leur statut de validation
                console.log('📋 Toutes les enquêtes de l\'agent seront affichées (pas seulement en attente)');
                
                // Filtrer les enquêtes qui n'ont pas déjà une validation valide dans validationsValides
                // Si une validation existe déjà, elle sera affichée depuis validationsValides
                // Sinon, on crée une validation virtuelle pour l'afficher
                const enquetesSansValidation = enquetes.filter(enquete => {
                  const hasValidation = validationsValides.some(v => {
                    const vEnqueteId = v.enquete?.id || v.enqueteId;
                    return vEnqueteId === enquete.id;
                  });
                  return !hasValidation;
                });
                
                console.log(`📋 ${enquetesSansValidation.length} enquêtes sans validation existante (seront créées virtuellement)`);
                
                // Charger les dossiers manquants pour les enquêtes
                this.loadDossiersForEnquetes(enquetesSansValidation, validationsValides, userId);
              },
              error: (error) => {
                console.error('❌ Erreur lors du chargement des enquêtes:', error);
                // Afficher quand même les validations chargées
                this.dataSource.data = validations || [];
                this.filteredData = [...(validations || [])];
                if (this.paginator) {
                  this.dataSource.paginator = this.paginator;
                }
                this.loading = false;
                this.calculateStats();
              }
            });
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des validations:', error);
          
          // Si l'erreur est due à des validations orphelines (500 avec EntityNotFoundException),
          // essayer de charger directement les enquêtes
          if (error.status === 500 && error.error?.message?.includes('Unable to find')) {
            console.warn('⚠️ Erreur due à des validations orphelines, chargement direct des enquêtes');
            if (userId) {
              this.loadEnquetesDirectly(userId);
              return;
            }
          }
          
          // Pour les autres erreurs, afficher un message et arrêter le chargement
          this.loading = false;
          const message = error.error?.message || 'Erreur lors du chargement des validations';
          this.snackBar.open(message, 'Fermer', { duration: 5000 });
          
          // Afficher une liste vide plutôt que de planter
          this.dataSource.data = [];
          this.filteredData = [];
          this.calculateStats();
        }
      });
  }

  private loadEnquetesDirectly(agentId: number): void {
    // Utiliser getAllEnquetes() et filtrer côté client pour éviter l'erreur 404 si l'endpoint /agent/{id} n'existe pas
    this.enqueteService.getAllEnquetes()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.calculateStats();
        })
      )
      .subscribe({
        next: (allEnquetes) => {
          console.log('✅ Toutes les enquêtes chargées (fallback):', allEnquetes.length);
          
          // Filtrer les enquêtes de l'agent avec logging détaillé
          // IMPORTANT: Après validation, agent_createur_id peut être NULL dans enquette
          // Il faut charger les validations pour trouver l'agent_createur_id
          console.log(`🔍 Filtrage des enquêtes pour l'agent ${agentId} parmi ${allEnquetes.length} enquêtes totales (fallback)`);
          
          // Charger les validations pour trouver agent_createur_id si NULL dans enquette
          this.validationEnqueteService.getAllValidationsEnquete()
            .pipe(
              takeUntil(this.destroy$),
              map(validations => {
                // Créer un map des enquete_id -> agent_createur_id depuis les validations
                const agentCreateurFromValidations = new Map<number, number>();
                validations.forEach(v => {
                  const enqueteId = v.enqueteId || v.enquete?.id;
                  const agentCreateurId = v.agentCreateurId || (v.agentCreateur?.id ? Number(v.agentCreateur.id) : null);
                  if (enqueteId && agentCreateurId) {
                    agentCreateurFromValidations.set(Number(enqueteId), Number(agentCreateurId));
                  }
                });
                
                const enquetes = allEnquetes.filter(e => {
                  if (!e.id) return false;
                  
                  const agentCreateurId = e.agentCreateurId;
                  const agentCreateurIdFromObject = e.agentCreateur?.id ? Number(e.agentCreateur.id) : null;
                  const agentCreateurIdFromValidation = agentCreateurFromValidations.get(e.id);
                  
                  // Comparer agentCreateurId (number) depuis enquette
                  if (agentCreateurId === agentId) {
                    console.log(`✅ Enquête ${e.id} correspond (agentCreateurId: ${agentCreateurId})`);
                    return true;
                  }
                  
                  // Comparer agentCreateur.id (peut être string ou number) depuis enquette
                  if (agentCreateurIdFromObject !== null && !isNaN(agentCreateurIdFromObject) && agentCreateurIdFromObject === agentId) {
                    console.log(`✅ Enquête ${e.id} correspond (agentCreateur.id: ${agentCreateurIdFromObject})`);
                    return true;
                  }
                  
                  // Si agent_createur_id est NULL dans enquette, utiliser validation_enquetes
                  if ((!agentCreateurId && !agentCreateurIdFromObject) && agentCreateurIdFromValidation === agentId) {
                    console.log(`✅ Enquête ${e.id} correspond (agentCreateurId depuis validation: ${agentCreateurIdFromValidation})`);
                    // Mettre à jour l'enquête avec l'agentCreateurId trouvé dans les validations
                    e.agentCreateurId = agentCreateurIdFromValidation;
                    return true;
                  }
                  
                  // Log pour debug
                  console.log(`❌ Enquête ${e.id} ne correspond pas:`, {
                    agentIdRecherche: agentId,
                    agentCreateurId: agentCreateurId,
                    agentCreateurIdFromObject: agentCreateurIdFromObject,
                    agentCreateurIdFromValidation: agentCreateurIdFromValidation,
                    rapportCode: e.rapportCode
                  });
                  
                  return false;
                });
                
                return enquetes;
              }),
              catchError(error => {
                console.error('❌ Erreur lors du chargement des validations pour le fallback:', error);
                // Continuer avec le filtrage basique sans validations
                return of(allEnquetes.filter(e => {
                  const agentCreateurId = e.agentCreateurId;
                  const agentCreateurIdFromObject = e.agentCreateur?.id ? Number(e.agentCreateur.id) : null;
                  return agentCreateurId === agentId || (agentCreateurIdFromObject !== null && agentCreateurIdFromObject === agentId);
                }));
              })
            )
            .subscribe({
              next: (enquetes) => {
                console.log(`✅ ${enquetes.length} enquêtes trouvées pour l'agent ${agentId} (fallback)`);
                console.log(`📋 Détails des enquêtes trouvées:`, enquetes.map(e => ({
                  id: e.id,
                  rapportCode: e.rapportCode,
                  agentCreateurId: e.agentCreateurId,
                  agentCreateurIdFromObject: e.agentCreateur?.id,
                  dossierId: e.dossierId
                })));
                
                // Pour les agents : afficher TOUTES leurs enquêtes (pas seulement celles en attente)
                // Charger les dossiers manquants pour toutes les enquêtes
                this.loadDossiersForEnquetes(enquetes, [], agentId);
              },
              error: (error) => {
                console.error('❌ Erreur lors du chargement des enquêtes:', error);
                const message = error.error?.message || 'Erreur lors du chargement des données';
                this.snackBar.open(message, 'Fermer', { duration: 5000 });
              }
            });
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des enquêtes:', error);
          const message = error.error?.message || 'Erreur lors du chargement des données';
          this.snackBar.open(message, 'Fermer', { duration: 5000 });
        }
      });
  }

  setupFilters(): void {
    combineLatest([
      this.filterForm.get('statut')!.valueChanges,
      this.filterForm.get('searchTerm')!.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([statut, searchTerm]) => {
        this.applyFilters(statut, searchTerm);
      });
  }

  applyFilters(statut: string, searchTerm: string): void {
    // Utiliser filteredData comme source si disponible, sinon dataSource.data
    const sourceData = this.filteredData.length > 0 ? this.filteredData : this.dataSource.data;
    let filtered = [...sourceData];

    if (statut) {
      filtered = filtered.filter(v => v.statut === statut);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.enquete?.rapportCode?.toLowerCase().includes(term) ||
        v.enquete?.dossier?.numeroDossier?.toLowerCase().includes(term) ||
        v.enquete?.dossier?.titre?.toLowerCase().includes(term)
      );
    }

    this.filteredData = filtered;
    this.dataSource.data = filtered;
    
    // Recalculer les statistiques après le filtrage
    this.calculateStats();
  }

  calculateStats(): void {
    // Utiliser filteredData pour les statistiques (données filtrées mais pas paginées)
    const data = this.filteredData.length > 0 ? this.filteredData : this.dataSource.data;
    this.stats = {
      total: data.length,
      enAttente: data.filter(v => v.statut === StatutValidation.EN_ATTENTE).length,
      validees: data.filter(v => v.statut === StatutValidation.VALIDE).length,
      rejetees: data.filter(v => v.statut === StatutValidation.REJETE).length
    };
    
    console.log('📊 Statistiques calculées:', {
      total: this.stats.total,
      enAttente: this.stats.enAttente,
      validees: this.stats.validees,
      rejetees: this.stats.rejetees,
      role: this.currentUser?.roleUtilisateur,
      source: this.filteredData.length > 0 ? 'filteredData' : 'dataSource.data'
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

  modifierEnquete(validation: ValidationEnquete): void {
    // Vérifier l'ID de l'enquête
    const enqueteId = validation.enquete?.id || validation.enqueteId;
    
    if (!enqueteId) {
      this.snackBar.open('Erreur: ID d\'enquête manquant', 'Fermer', { duration: 3000 });
      return;
    }

    // Vérifier que l'enquête peut être modifiée (pas encore validée)
    if (validation.statut === StatutValidation.VALIDE) {
      this.snackBar.open('Impossible de modifier une enquête validée', 'Fermer', { duration: 3000 });
      return;
    }

    // Rediriger vers la page d'édition
    this.router.navigate(['/enquetes/edit', enqueteId]);
  }

  supprimerEnquete(validation: ValidationEnquete): void {
    // Logs détaillés pour diagnostiquer le problème
    console.log('🔍 Validation complète avant suppression:', {
      validationId: validation.id,
      validationEnqueteId: validation.enqueteId,
      enqueteObject: validation.enquete,
      enqueteIdFromObject: validation.enquete?.id,
      enqueteRapportCode: validation.enquete?.rapportCode,
      enqueteDossierId: validation.enquete?.dossierId,
      enqueteDossier: validation.enquete?.dossier
    });
    
    // Vérifier l'ID de l'enquête
    const enqueteId = validation.enquete?.id || validation.enqueteId;
    
    if (!enqueteId) {
      console.error('❌ ID d\'enquête manquant dans la validation:', validation);
      this.snackBar.open('Erreur: ID d\'enquête manquant. La validation ne contient pas d\'enquête valide.', 'Fermer', { duration: 5000 });
      return;
    }

    const rapportCode = validation.enquete?.rapportCode || `ID ${enqueteId}`;
    
    // Vérifier que l'enquête existe avant de tenter la suppression
    console.log(`🔍 Vérification de l'existence de l'enquête ${enqueteId} avant suppression...`);
    
    // Utiliser le dialogue de confirmation au lieu de confirm()
    const dialogRef = this.dialog.open(ConfirmDeleteEnqueteDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l\'enquête',
        message: `Êtes-vous sûr de vouloir supprimer l'enquête ${rapportCode} (ID: ${enqueteId}) ?`,
        details: 'Cette action supprimera également toutes les validations associées. Cette action est irréversible.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        console.log('🗑️ Début de la suppression de l\'enquête:', {
          enqueteId,
          rapportCode,
          validationId: validation.id,
          validationEnqueteId: validation.enqueteId,
          enqueteObjectExists: !!validation.enquete,
          enqueteIdFromObject: validation.enquete?.id,
          enqueteIdFromValidation: validation.enqueteId
        });

        // Vérifier une dernière fois que l'ID est valide
        if (!enqueteId || isNaN(Number(enqueteId))) {
          console.error('❌ ID d\'enquête invalide:', enqueteId);
          this.snackBar.open('Erreur: ID d\'enquête invalide. Impossible de supprimer.', 'Fermer', { duration: 5000 });
          return;
        }

        // Le backend supprime maintenant automatiquement toutes les validations associées
        // Plus besoin de les supprimer manuellement
        console.log(`🗑️ Appel DELETE pour l'enquête ${enqueteId} depuis mes-validations-enquete`);
        console.log(`📋 URL complète: ${this.enqueteService['API_URL']}/${enqueteId}`);
        
        // Ajouter l'ID à la liste des suppressions en cours
        this.deletingIds.add(Number(enqueteId));
        
        // Afficher un indicateur de chargement
        const loadingSnackBar = this.snackBar.open('Suppression en cours...', '', {
          duration: 0 // Ne pas fermer automatiquement
        });
        
        this.loading = true;
        
        // Vérifier que l'enquête existe avant de tenter la suppression
        // Cela permet d'éviter d'envoyer une requête DELETE pour une enquête qui n'existe pas
        this.enqueteService.getEnqueteById(Number(enqueteId))
          .pipe(
            takeUntil(this.destroy$),
            switchMap(enquete => {
              if (!enquete || !enquete.id) {
                console.error('❌ Enquête non trouvée lors de la vérification préalable:', enqueteId);
                throw new Error(`L'enquête avec l'ID ${enqueteId} n'existe pas dans la base de données. Elle a peut-être déjà été supprimée.`);
              }
              
              console.log('✅ Enquête trouvée, procédure de suppression:', {
                id: enquete.id,
                rapportCode: enquete.rapportCode,
                dossierId: enquete.dossierId
              });
              
              // Maintenant, procéder à la suppression
              return this.enqueteService.deleteEnquete(Number(enqueteId));
            }),
            catchError(error => {
              // Si l'erreur vient de la vérification préalable, la propager
              if (error.message && error.message.includes('n\'existe pas')) {
                return throwError(() => error);
              }
              // Sinon, c'est une erreur de suppression, la propager aussi
              return throwError(() => error);
            })
          )
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
              this.loading = false;
              this.deletingIds.delete(Number(enqueteId)); // Retirer de la liste même en cas d'erreur
              loadingSnackBar.dismiss(); // Fermer l'indicateur de chargement
            })
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
                this.loadValidations();
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
              
              console.error('❌ Erreur lors de la suppression:', {
                message: errorMessage,
                status: error.status,
                error: error.error,
                enqueteId: enqueteId
              });
              
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
                  this.loadValidations();
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

  canModify(validation: ValidationEnquete): boolean {
    // Un agent peut modifier uniquement ses propres enquêtes non validées
    if (!this.currentUser) return false;
    
    const agentId = this.jwtAuthService.getCurrentUserId();
    if (!agentId) return false;

    const isOwner = validation.agentCreateurId === agentId || 
                    validation.agentCreateur?.id === agentId?.toString() ||
                    Number(validation.agentCreateur?.id) === agentId;
    
    const isNotValidated = validation.statut !== StatutValidation.VALIDE;
    
    return isOwner && isNotValidated;
  }

  canDelete(validation: ValidationEnquete): boolean {
    if (!this.currentUser) return false;
    
    // Agent créateur peut supprimer ses propres enquêtes (même validées maintenant)
    const agentId = validation.agentCreateurId || (validation.agentCreateur?.id ? Number(validation.agentCreateur.id) : null);
    if (agentId && this.currentUser.id && Number(this.currentUser.id) === agentId) {
      return true;
    }
    
    // Chef peut supprimer n'importe quelle enquête
    const userRole = this.currentUser.roleUtilisateur;
    return userRole === Role.CHEF_DEPARTEMENT_DOSSIER || userRole === Role.SUPER_ADMIN;
  }

  demanderNouvelleValidation(validation: ValidationEnquete): void {
    if (!validation.enquete?.id) {
      this.snackBar.open('Erreur: Enquête non trouvée', 'Fermer', { duration: 3000 });
      return;
    }

    // Récupérer l'ID utilisateur depuis le token JWT (méthode principale)
    let agentId: number | null = this.jwtAuthService.getCurrentUserId();
    
    // Fallback sur authService si getCurrentUserId() retourne null
    if (!agentId) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.id) {
        agentId = Number(currentUser.id);
        if (isNaN(agentId) || agentId <= 0) {
          agentId = null;
        }
      }
    }
    
    if (!agentId) {
      this.snackBar.open('Erreur: Utilisateur non connecté. Veuillez vous reconnecter.', 'Fermer', { duration: 5000 });
      return;
    }

    const validationData = {
      enquete: { id: validation.enquete.id } as any,
      agentCreateurId: agentId
    };

    this.validationEnqueteService.createValidationEnquete(validationData)
      .pipe(
        finalize(() => this.loading = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Nouvelle validation demandée avec succès', 'Fermer', { duration: 3000 });
          this.loadValidations();
        },
        error: (error) => {
          const message = error.error?.message || error.message || 'Erreur lors de la demande de validation';
          this.snackBar.open(message, 'Fermer', { duration: 5000 });
        }
      });
  }

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

  getDossierInfo(validation: ValidationEnquete): string {
    if (validation.enquete?.dossier) {
      return `${validation.enquete.dossier.numeroDossier} - ${validation.enquete.dossier.titre}`;
    }
    return 'N/A';
  }

  getDossierNumero(validation: ValidationEnquete): string {
    // Essayer d'abord depuis validation.enquete.dossier
    if (validation.enquete?.dossier?.numeroDossier) {
      return validation.enquete.dossier.numeroDossier;
    }
    // Si pas de dossier chargé mais dossierId existe, essayer de charger
    const dossierId = validation.enquete?.dossierId || validation.enquete?.dossier?.id;
    if (dossierId && !validation.enquete?.dossier) {
      // Le dossier sera chargé par loadDossiersForValidations
      return 'Chargement...';
    }
    return 'N/A';
  }

  getDossierTitre(validation: ValidationEnquete): string {
    // Essayer d'abord depuis validation.enquete.dossier
    if (validation.enquete?.dossier?.titre) {
      return validation.enquete.dossier.titre;
    }
    // Si pas de dossier chargé mais dossierId existe, essayer de charger
    const dossierId = validation.enquete?.dossierId || validation.enquete?.dossier?.id;
    if (dossierId && !validation.enquete?.dossier) {
      // Le dossier sera chargé par loadDossiersForValidations
      return 'Chargement...';
    }
    return 'N/A';
  }

  getChefName(validation: ValidationEnquete): string {
    if (validation.chefValidateur) {
      return `${validation.chefValidateur.prenom} ${validation.chefValidateur.nom}`;
    }
    return 'N/A';
  }

  getAgentName(validation: ValidationEnquete): string {
    if (validation.agentCreateur) {
      return `${validation.agentCreateur.prenom} ${validation.agentCreateur.nom}`;
    }
    return 'N/A';
  }

  getDisplayedColumns(): string[] {
    const isChef = this.currentUser?.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER || 
                   this.currentUser?.roleUtilisateur === Role.SUPER_ADMIN;
    return isChef ? this.displayedColumnsForChef : this.displayedColumns;
  }

  /**
   * Charge les dossiers manquants pour les enquêtes qui n'ont pas la relation dossier chargée
   */
  private loadDossiersForEnquetes(
    enquetes: Enquette[], 
    validations: ValidationEnquete[], 
    userId: number
  ): void {
    // Identifier les enquêtes qui ont un dossierId mais pas de dossier chargé
    const enquetesAvecDossierId = enquetes.filter(e => {
      const dossierId = e.dossierId || e.dossier?.id;
      return dossierId && !e.dossier?.numeroDossier && !e.dossier?.titre;
    });

    if (enquetesAvecDossierId.length === 0) {
      // Pas de dossiers à charger, convertir directement
      this.convertEnquetesToValidations(enquetes, validations, userId);
      return;
    }

    console.log(`📥 Chargement de ${enquetesAvecDossierId.length} dossier(s) manquant(s)`);

    // Charger tous les dossiers en parallèle
    const dossierLoads: Observable<{ enquete: Enquette; dossierApi: DossierApi | null }>[] = enquetesAvecDossierId.map(enquete => {
      const dossierId = enquete.dossierId || enquete.dossier?.id;
      if (!dossierId) {
        return of({ enquete, dossierApi: null });
      }
      return this.dossierApiService.getDossierById(Number(dossierId)).pipe(
        catchError(error => {
          console.warn(`⚠️ Erreur lors du chargement du dossier ${dossierId}:`, error);
          return of(null);
        }),
        map((dossierApi: DossierApi | null) => ({ enquete, dossierApi }))
      );
    });

    forkJoin(dossierLoads)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results: { enquete: Enquette; dossierApi: DossierApi | null }[]) => {
          // Associer les dossiers chargés aux enquêtes
          results.forEach(({ enquete, dossierApi }) => {
            if (dossierApi && enquete) {
              // Créer un objet Dossier complet avec toutes les données nécessaires
              enquete.dossier = {
                id: dossierApi.id?.toString() || '',
                numeroDossier: dossierApi.numeroDossier || '',
                titre: dossierApi.titre || '',
                montantCreance: dossierApi.montantCreance,
                creancier: dossierApi.creancier,
                debiteur: dossierApi.debiteur,
                urgence: dossierApi.urgence,
                statut: dossierApi.statut,
                dateCreation: dossierApi.dateCreation
              } as any;
              console.log(`✅ Dossier ${dossierApi.id} chargé pour l'enquête ${enquete.id}:`, {
                numeroDossier: dossierApi.numeroDossier,
                titre: dossierApi.titre
              });
            } else if (enquete) {
              console.warn(`⚠️ Dossier non trouvé pour l'enquête ${enquete.id} (dossierId: ${enquete.dossierId})`);
            }
          });

          // Maintenant convertir les enquêtes en validations
          this.convertEnquetesToValidations(enquetes, validations, userId);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des dossiers:', error);
          // Continuer quand même avec les enquêtes sans dossier
          this.convertEnquetesToValidations(enquetes, validations, userId);
        }
      });
  }

  /**
   * Charge les dossiers manquants pour les validations existantes
   */
  private loadDossiersForValidations(validations: ValidationEnquete[]): void {
    // Identifier les validations qui ont un dossierId mais pas de dossier chargé
    const validationsAvecDossierId = validations.filter(v => {
      const enquete = v.enquete;
      if (!enquete) return false;
      const dossierId = enquete.dossierId || enquete.dossier?.id;
      // Charger le dossier si dossierId existe mais que les infos ne sont pas chargées
      return dossierId && (!enquete.dossier?.numeroDossier || !enquete.dossier?.titre);
    });

    console.log(`📥 ${validationsAvecDossierId.length} validation(s) nécessitant le chargement du dossier sur ${validations.length} total`);

    if (validationsAvecDossierId.length === 0) {
      // Pas de dossiers à charger, afficher directement
      console.log('✅ Tous les dossiers sont déjà chargés, affichage direct');
      this.dataSource.data = validations;
      this.filteredData = [...validations];
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      this.loading = false;
      this.calculateStats();
      return;
    }

    console.log(`📥 Chargement de ${validationsAvecDossierId.length} dossier(s) manquant(s) pour les validations`);

    // Charger tous les dossiers en parallèle
    const dossierLoads: Observable<{ validation: ValidationEnquete; dossierApi: DossierApi | null }>[] = validationsAvecDossierId.map(validation => {
      const enquete = validation.enquete!;
      const dossierId = enquete.dossierId || enquete.dossier?.id;
      if (!dossierId) {
        console.warn(`⚠️ Validation ${validation.id} a une enquête sans dossierId`);
        return of({ validation, dossierApi: null });
      }
      console.log(`📥 Chargement du dossier ${dossierId} pour l'enquête ${enquete.id}`);
      return this.dossierApiService.getDossierById(Number(dossierId)).pipe(
        catchError(error => {
          console.warn(`⚠️ Erreur lors du chargement du dossier ${dossierId}:`, error);
          return of(null);
        }),
        map((dossierApi: DossierApi | null) => {
          if (dossierApi && enquete) {
            // Créer un objet Dossier complet avec toutes les données
            enquete.dossier = {
              id: dossierApi.id?.toString() || '',
              numeroDossier: dossierApi.numeroDossier || '',
              titre: dossierApi.titre || '',
              montantCreance: dossierApi.montantCreance,
              creancier: dossierApi.creancier,
              debiteur: dossierApi.debiteur,
              urgence: dossierApi.urgence,
              statut: dossierApi.statut,
              dateCreation: dossierApi.dateCreation
            } as any;
            console.log(`✅ Dossier ${dossierId} chargé pour l'enquête ${enquete.id}:`, { 
              numero: dossierApi.numeroDossier, 
              titre: dossierApi.titre 
            });
          }
          return { validation, dossierApi };
        })
      );
    });

    forkJoin(dossierLoads)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results: { validation: ValidationEnquete; dossierApi: DossierApi | null }[]) => {
          // Associer les dossiers chargés aux enquêtes
          results.forEach(({ validation, dossierApi }) => {
            if (dossierApi && validation?.enquete) {
              // Créer un objet Dossier complet avec toutes les données nécessaires
              validation.enquete.dossier = {
                id: dossierApi.id?.toString() || '',
                numeroDossier: dossierApi.numeroDossier || '',
                titre: dossierApi.titre || '',
                montantCreance: dossierApi.montantCreance,
                creancier: dossierApi.creancier,
                debiteur: dossierApi.debiteur,
                urgence: dossierApi.urgence,
                statut: dossierApi.statut,
                dateCreation: dossierApi.dateCreation
              } as any;
              console.log(`✅ Dossier associé à l'enquête ${validation.enquete.id}:`, {
                numero: validation.enquete.dossier?.numeroDossier || 'N/A',
                titre: validation.enquete.dossier?.titre || 'N/A'
              });
            } else if (validation?.enquete && !dossierApi) {
              console.warn(`⚠️ Impossible de charger le dossier pour l'enquête ${validation.enquete.id}`);
            }
          });

          // Afficher les validations avec les dossiers chargés
          console.log(`✅ Affichage de ${validations.length} validation(s) avec dossiers chargés`);
          this.dataSource.data = validations;
          this.filteredData = [...validations];
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          this.loading = false;
          this.calculateStats();
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des dossiers:', error);
          // Afficher quand même les validations sans dossier
          this.dataSource.data = validations;
          this.filteredData = [...validations];
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          this.loading = false;
          this.calculateStats();
        }
      });
  }

  /**
   * Convertit les enquêtes en ValidationEnquete et met à jour la data source
   */
  private convertEnquetesToValidations(
    enquetes: Enquette[],
    validations: ValidationEnquete[],
    userId: number
  ): void {
    const validationsFromEnquetes: ValidationEnquete[] = enquetes.map(enquete => {
      console.log('🔄 Conversion enquête en ValidationEnquete:', {
        enqueteId: enquete.id,
        rapportCode: enquete.rapportCode,
        dossierNumero: enquete.dossier?.numeroDossier,
        dossierTitre: enquete.dossier?.titre
      });
      return {
        id: undefined,
        enquete: enquete, // Objet enquête complet avec ID et dossier
        enqueteId: enquete.id, // ID également dans enqueteId
        agentCreateurId: userId!,
        agentCreateur: enquete.agentCreateur,
        chefValidateur: null,
        chefValidateurId: undefined,
        dateValidation: null,
        // Utiliser le statut réel de l'enquête au lieu de toujours EN_ATTENTE
        statut: enquete.statut === 'VALIDE' ? StatutValidation.VALIDE :
                enquete.statut === 'REJETE' ? StatutValidation.REJETE :
                StatutValidation.EN_ATTENTE,
        commentaires: null,
        dateCreation: enquete.dateCreation || new Date().toISOString(),
        dateModification: null
      } as ValidationEnquete;
    });

    // Combiner les validations existantes avec les enquêtes en attente
    const allValidations = [...validations, ...validationsFromEnquetes];

    console.log('📊 Total validations (existantes + en attente):', allValidations.length);

    this.dataSource.data = allValidations;
    this.filteredData = [...allValidations];
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }
}

