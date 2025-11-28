import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Subject, debounceTime, distinctUntilChanged, forkJoin, of, Observable } from 'rxjs';
import { takeUntil, map, catchError } from 'rxjs/operators';
import { ChefAmiableService } from '../../services/chef-amiable.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { ActionRecouvrementService } from '../../../core/services/action-recouvrement.service';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { TypeAction, ReponseDebiteur } from '../../../shared/models';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { DossierActionsAmiableComponent } from '../../../dossier/components/dossier-actions-amiable/dossier-actions-amiable.component';
import { DossierRecommandationsComponent } from '../dossier-recommandations/dossier-recommandations.component';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

interface DossierAvecActions {
  id?: number;
  numeroDossier: string;
  nomCreancier: string;
  nomDebiteur: string;
  actions?: any[];
  typeRecouvrement?: string;
  statut?: string;
  affecteAuJuridique?: boolean;
}

@Component({
  selector: 'app-gestion-actions',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatSnackBarModule, 
    MatProgressSpinnerModule, 
    MatDialogModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule,
    DossierActionsAmiableComponent,
    DossierRecommandationsComponent
  ],
  templateUrl: './gestion-actions.component.html',
  styleUrls: ['./gestion-actions.component.scss']
})
export class GestionActionsComponent implements OnInit, OnDestroy {
  dossiers: DossierAvecActions[] = [];
  dossierSelectionne: DossierAvecActions | null = null;
  dossierApiSelectionne: DossierApi | null = null;
  numeroDossierRecherche: string = '';
  searchTerm: string = '';
  showAffectationForm: boolean = false;
  loading: boolean = false;
  selectedTab = 0; // 0 = Liste, 1 = Actions, 2 = Détails, 3 = Recommandations
  
  tabs = [
    { label: 'Liste des Dossiers', icon: 'list', disabled: false },
    { label: 'Actions', icon: 'history', disabled: true },
    { label: 'Détails', icon: 'info', disabled: true },
    { label: 'Recommandations', icon: 'lightbulb', disabled: true }
  ];
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Types d'actions disponibles
  typesActions = [
    { value: TypeAction.APPEL, label: 'Appel' },
    { value: TypeAction.EMAIL, label: 'Email' },
    { value: TypeAction.VISITE, label: 'Visite' },
    { value: TypeAction.LETTRE, label: 'Lettre' },
    { value: TypeAction.AUTRE, label: 'Autre' }
  ];

  // Réponses débiteur
  reponsesDebiteur = [
    { value: ReponseDebiteur.POSITIVE, label: 'POSITIVE' },
    { value: ReponseDebiteur.NEGATIVE, label: 'NEGATIVE' },
    { value: ReponseDebiteur.EN_ATTENTE, label: 'EN_ATTENTE' }
  ];

  constructor(
    private chefAmiableService: ChefAmiableService,
    private dossierApiService: DossierApiService,
    private actionService: ActionRecouvrementService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private jwtAuthService: JwtAuthService
  ) {
    // Configuration du debounce pour la recherche
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.rechercherDossier();
    });
  }

  ngOnInit(): void {
    // Vérifier l'authentification
    if (!this.jwtAuthService.isUserLoggedIn()) {
      this.snackBar.open('Vous devez être connecté pour accéder à cette page', 'Fermer', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadDossiers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  loadDossiers(): void {
    this.loading = true;
    // Réinitialiser la liste des dossiers pour éviter les doublons
    this.dossiers = [];
    // Charger les dossiers affectés au recouvrement amiable
    // Utiliser une taille de page raisonnable pour éviter les erreurs 400
    // Commencer par charger la première page avec une taille raisonnable
    this.loadDossiersPage(0, 50);
  }

  private loadDossiersPage(page: number, size: number): void {
    // Charger tous les dossiers et filtrer pour garder uniquement ceux affectés au recouvrement amiable
    // Un dossier est considéré comme "amiable" si :
    // 1. typeRecouvrement === AMIABLE (actuellement en amiable)
    // 2. OU il a été validé et est en cours ET n'a pas d'avocat/huissier (était en amiable)
    // 3. OU il a des actions (car les actions sont créées uniquement en amiable)
    this.dossierApiService.getAllDossiers(page, size).pipe(
      takeUntil(this.destroy$),
      map((pageResponse) => {
        // Filtrer pour garder uniquement les dossiers affectés au recouvrement amiable
        const filtered = pageResponse.content.filter((dossier: DossierApi) => {
          // Cas 1: Actuellement en recouvrement amiable
          if (dossier.typeRecouvrement === 'AMIABLE') {
            return true;
          }
          // Cas 2: A été en amiable (validé, en cours, sans avocat/huissier au moment de la création)
          // On garde les dossiers validés qui sont en cours, même s'ils ont été affectés au juridique après
          // car ils ont un historique d'actions en amiable
          if (dossier.valide === true && 
              (dossier.statut === 'EN_COURS' || dossier.dossierStatus === 'ENCOURSDETRAITEMENT') &&
              !dossier.dateCloture) {
            // Si le dossier a un avocat ou huissier, c'est qu'il a été affecté au juridique
            // Mais on le garde quand même pour voir l'historique des actions amiable
            // On vérifiera plus tard s'il a des actions pour confirmer qu'il était en amiable
            return true;
          }
          return false;
        });
        
        return {
          ...pageResponse,
          content: filtered,
          totalElements: filtered.length,
          totalPages: Math.ceil(filtered.length / size)
        };
      })
    ).subscribe({
      next: (pageResponse) => {
        // Convertir DossierApi en DossierAvecActions et charger les actions pour chaque dossier
        const dossiersObservables = pageResponse.content.map((dossier: DossierApi) => {
          // Gérer les noms de créancier (personne physique ou morale)
          let nomCreancier = 'N/A';
          if (dossier.creancier) {
            const typeCreancier = (dossier.creancier as any).typeCreancier;
            if (typeCreancier === 'PERSONNE_MORALE') {
              nomCreancier = dossier.creancier.nom || 'N/A';
            } else if (dossier.creancier.prenom && dossier.creancier.nom) {
              nomCreancier = `${dossier.creancier.prenom} ${dossier.creancier.nom}`;
            } else if (dossier.creancier.nom) {
              nomCreancier = dossier.creancier.nom;
            }
          }
          
          // Gérer les noms de débiteur (personne physique ou morale)
          let nomDebiteur = 'N/A';
          if (dossier.debiteur) {
            const typeDebiteur = (dossier.debiteur as any).typeDebiteur;
            if (typeDebiteur === 'PERSONNE_MORALE') {
              nomDebiteur = dossier.debiteur.nom || 'N/A';
            } else if (dossier.debiteur.prenom && dossier.debiteur.nom) {
              nomDebiteur = `${dossier.debiteur.prenom} ${dossier.debiteur.nom}`;
            } else if (dossier.debiteur.nom) {
              nomDebiteur = dossier.debiteur.nom;
            }
          }
          
          // Charger les actions pour ce dossier
          const dossierBase = {
            id: dossier.id,
            numeroDossier: dossier.numeroDossier || `DOS-${dossier.id}`,
            nomCreancier: nomCreancier,
            nomDebiteur: nomDebiteur,
            typeRecouvrement: dossier.typeRecouvrement,
            statut: dossier.statut || dossier.dossierStatus,
            affecteAuJuridique: dossier.typeRecouvrement === 'JURIDIQUE' || !!dossier.avocat || !!dossier.huissier
          };
          
          if (dossier.id) {
            return this.actionService.getActionsByDossier(dossier.id).pipe(
              map(actions => ({
                ...dossierBase,
                actions: actions || []
              })),
              catchError(error => {
                console.warn(`⚠️ Erreur lors du chargement des actions pour dossier ${dossier.id}:`, error);
                return of({
                  ...dossierBase,
                  actions: []
                });
              })
            );
          } else {
            return of({
              ...dossierBase,
              actions: []
            });
          }
        });
        
        // Charger toutes les actions en parallèle avec forkJoin
        // Limiter à 50 requêtes en parallèle pour éviter de surcharger le backend
        if (dossiersObservables.length > 0) {
          // Traiter par lots de 50 pour éviter de surcharger le backend
          const batchSize = 50;
          const batches: Observable<DossierAvecActions>[][] = [];
          
          for (let i = 0; i < dossiersObservables.length; i += batchSize) {
            batches.push(dossiersObservables.slice(i, i + batchSize));
          }
          
          // Charger les lots séquentiellement
          const loadBatch = (batchIndex: number): void => {
            if (batchIndex >= batches.length) {
              // Tous les lots de cette page sont chargés, vérifier s'il y a d'autres pages
              if (pageResponse.totalPages > page + 1) {
                // Charger la page suivante
                this.loadDossiersPage(page + 1, size);
              } else {
                // Toutes les pages sont chargées
                this.loading = false;
                console.log('✅ Tous les dossiers avec actions chargés:', this.dossiers.length);
                console.log('📊 Dossiers affectés au juridique:', this.dossiers.filter(d => d.affecteAuJuridique).length);
              }
              return;
            }
            
            forkJoin(batches[batchIndex]).pipe(
              takeUntil(this.destroy$)
            ).subscribe({
              next: (dossiersAvecActions) => {
                // Filtrer pour garder uniquement les dossiers qui ont des actions OU qui sont actuellement en amiable
                // Cela permet d'exclure les dossiers qui n'ont jamais été en amiable
                const dossiersFiltres = (dossiersAvecActions as DossierAvecActions[]).filter(dossier => {
                  // Garder si le dossier est actuellement en amiable
                  if (dossier.typeRecouvrement === 'AMIABLE') {
                    return true;
                  }
                  // Garder si le dossier a des actions (preuve qu'il a été en amiable)
                  if (dossier.actions && dossier.actions.length > 0) {
                    return true;
                  }
                  // Exclure les autres dossiers
                  return false;
                });
                
                // Éviter les doublons en vérifiant l'ID ou le numéro de dossier
                const dossiersSansDoublons = dossiersFiltres.filter(nouveauDossier => {
                  // Vérifier si le dossier existe déjà dans la liste
                  const existeDeja = this.dossiers.some(dossierExistant => 
                    (dossierExistant.id && nouveauDossier.id && dossierExistant.id === nouveauDossier.id) ||
                    (dossierExistant.numeroDossier && nouveauDossier.numeroDossier && 
                     dossierExistant.numeroDossier === nouveauDossier.numeroDossier)
                  );
                  return !existeDeja;
                });
                
                this.dossiers = [...this.dossiers, ...dossiersSansDoublons];
                // Charger le lot suivant
                loadBatch(batchIndex + 1);
              },
              error: (error) => {
                console.error(`❌ Erreur lors du chargement du lot ${batchIndex + 1}:`, error);
                // Continuer avec le lot suivant même en cas d'erreur
                loadBatch(batchIndex + 1);
              }
            });
          };
          
          // Commencer le chargement du premier lot
          loadBatch(0);
        } else {
          // Si pas de dossiers dans cette page, vérifier s'il y a d'autres pages
          // Note: On utilise totalPages de la réponse originale pour continuer le chargement
          // même si le filtre a réduit le nombre de dossiers
          const originalTotalPages = Math.ceil(pageResponse.totalElements / size);
          if (originalTotalPages > page + 1) {
            // Charger la page suivante
            this.loadDossiersPage(page + 1, size);
          } else {
            this.loading = false;
          }
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des dossiers:', error);
        // Si c'est une erreur 400 avec size trop grand, réessayer avec une taille plus petite
        if (error.status === 400 && size > 10) {
          console.log(`⚠️ Taille ${size} trop grande, réessai avec taille 10`);
          this.loadDossiersPage(page, 10);
        } else {
          this.snackBar.open('Erreur lors du chargement des dossiers', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      }
    });
  }

  selectionnerDossier(dossier: DossierAvecActions): void {
    this.dossierSelectionne = dossier;
    
    // Charger les détails complets du dossier depuis l'API
    if (dossier.id) {
      this.dossierApiService.getDossierById(dossier.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (dossierApi) => {
          this.dossierApiSelectionne = dossierApi;
          // Activer les onglets Actions, Détails et Recommandations
          this.tabs[1].disabled = false;
          this.tabs[2].disabled = false;
          this.tabs[3].disabled = false;
          // Aller directement à l'onglet Actions
          this.selectedTab = 1;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des détails du dossier:', error);
          // Activer quand même les onglets avec les données disponibles
          this.tabs[1].disabled = false;
          this.tabs[2].disabled = false;
          this.tabs[3].disabled = false;
          this.selectedTab = 1;
        }
      });
    }
  }
  
  onTabChange(index: number): void {
    this.selectedTab = index;
  }
  
  getActionsCount(dossierId: number | undefined): number {
    if (!dossierId) return 0;
    const dossier = this.dossiers.find(d => d.id === dossierId);
    return dossier?.actions?.length || 0;
  }

  rechercherDossier(): void {
    const searchTerm = this.searchTerm || this.numeroDossierRecherche;
    if (searchTerm.trim()) {
      const dossier = this.dossiers.find(d => 
        d.numeroDossier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.nomCreancier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.nomDebiteur.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (dossier) {
        this.dossierSelectionne = dossier;
        // Scroll vers le dossier sélectionné
        setTimeout(() => {
          const element = document.querySelector(`[data-dossier-id="${dossier.id}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        this.snackBar.open('Aucun dossier trouvé avec ce critère de recherche', 'Fermer', {
          duration: 3000,
          panelClass: ['warning-snackbar']
        });
      }
    }
  }

  affecterAuJuridique(): void {
    if (this.dossierSelectionne && this.dossierSelectionne.id) {
      const dialogData: ConfirmationDialogData = {
        title: 'Affecter au Recouvrement Juridique',
        message: `Êtes-vous sûr de vouloir affecter le dossier ${this.dossierSelectionne.numeroDossier} au recouvrement juridique ? Cette action est irréversible.`,
        confirmText: 'Affecter',
        cancelText: 'Annuler',
        warning: true
      };

      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: dialogData,
        width: '400px'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loading = true;
          this.dossierApiService.affecterAuRecouvrementJuridique(this.dossierSelectionne!.id!).subscribe({
            next: (dossier) => {
              this.snackBar.open('Dossier affecté au recouvrement juridique avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.showAffectationForm = false;
              this.numeroDossierRecherche = '';
              this.searchTerm = '';
              this.dossierSelectionne = null;
              this.loadDossiers(); // Recharger la liste
            },
            error: (error) => {
              console.error('❌ Erreur lors de l\'affectation au juridique:', error);
              let errorMessage = 'Erreur lors de l\'affectation au juridique';
              if (error.error?.message) {
                errorMessage = error.error.message;
              } else if (error.message) {
                errorMessage = error.message;
              }
              this.snackBar.open(errorMessage, 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              this.loading = false;
            }
          });
        }
      });
    } else {
      this.snackBar.open('Veuillez sélectionner un dossier', 'Fermer', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  cloturerDossier(): void {
    if (this.dossierSelectionne && this.dossierSelectionne.id) {
      const dialogData: ConfirmationDialogData = {
        title: 'Clôturer le Dossier',
        message: `Êtes-vous sûr de vouloir clôturer le dossier ${this.dossierSelectionne.numeroDossier} ? Cette action est irréversible et le dossier ne pourra plus être modifié.`,
        confirmText: 'Clôturer',
        cancelText: 'Annuler',
        warning: true
      };

      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: dialogData,
        width: '400px'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loading = true;
          this.dossierApiService.cloturerDossier(this.dossierSelectionne!.id!).subscribe({
            next: (dossier) => {
              this.snackBar.open('Dossier clôturé avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.showAffectationForm = false;
              this.numeroDossierRecherche = '';
              this.searchTerm = '';
              this.dossierSelectionne = null;
              this.loadDossiers(); // Recharger la liste
            },
            error: (error) => {
              console.error('❌ Erreur lors de la clôture:', error);
              let errorMessage = 'Erreur lors de la clôture du dossier';
              if (error.error?.message) {
                errorMessage = error.error.message;
              } else if (error.message) {
                errorMessage = error.message;
              }
              this.snackBar.open(errorMessage, 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              this.loading = false;
            }
          });
        }
      });
    } else {
      this.snackBar.open('Veuillez sélectionner un dossier', 'Fermer', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  getTypeActionLabel(type: TypeAction): string {
    const typeAction = this.typesActions.find(t => t.value === type);
    return typeAction ? typeAction.label : type;
  }

  getReponseDebiteurLabel(reponse: ReponseDebiteur): string {
    const reponseDebiteur = this.reponsesDebiteur.find(r => r.value === reponse);
    return reponseDebiteur ? reponseDebiteur.label : reponse;
  }

  getReponseClass(reponse: ReponseDebiteur): string {
    switch (reponse) {
      case ReponseDebiteur.POSITIVE:
        return 'reponse-positive';
      case ReponseDebiteur.NEGATIVE:
        return 'reponse-negative';
      case ReponseDebiteur.EN_ATTENTE:
        return 'reponse-attente';
      default:
        return '';
    }
  }

  getFormattedDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
  }

  getFormattedCost(cost: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(cost);
  }

  getTotalCost(): number {
    if (!this.dossierSelectionne || !this.dossierSelectionne.actions) return 0;
    return this.dossierSelectionne.actions.reduce((total, action) => {
      const cout = action.coutUnitaire || 0;
      const occurrences = action.nbOccurrences || 0;
      return total + (occurrences * cout);
    }, 0);
  }

  getPositiveResponses(): number {
    if (!this.dossierSelectionne || !this.dossierSelectionne.actions) return 0;
    return this.dossierSelectionne.actions.filter(a => a.reponseDebiteur === ReponseDebiteur.POSITIVE).length;
  }

  getNegativeResponses(): number {
    if (!this.dossierSelectionne || !this.dossierSelectionne.actions) return 0;
    return this.dossierSelectionne.actions.filter(a => a.reponseDebiteur === ReponseDebiteur.NEGATIVE).length;
  }

  /**
   * Récupère le montant recouvré du dossier
   */
  getMontantRecouvre(): number | null {
    if (!this.dossierApiSelectionne) return null;
    // Le backend peut retourner montantRecouvre directement ou via finance
    // FinanceApi utilise montantRecupere, mais le backend peut aussi retourner montantRecouvre directement
    return (this.dossierApiSelectionne as any).montantRecouvre || 
           (this.dossierApiSelectionne.finance as any)?.montantRecouvre ||
           this.dossierApiSelectionne.finance?.montantRecupere || 
           null;
  }

  /**
   * Récupère le montant restant du dossier
   */
  getMontantRestant(): number | null {
    if (!this.dossierApiSelectionne) return null;
    const montantTotal = this.dossierApiSelectionne.montantCreance || 0;
    const montantRecouvre = this.getMontantRecouvre() || 0;
    
    if (montantTotal === 0) return null;
    
    return Math.max(0, montantTotal - montantRecouvre);
  }

  /**
   * Récupère l'icône pour un type d'action
   */
  getActionIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'APPEL': 'phone',
      'EMAIL': 'email',
      'VISITE': 'home',
      'LETTRE': 'mail',
      'AUTRE': 'more_horiz'
    };
    return icons[type] || 'help';
  }

  /**
   * Récupère le label pour un type d'action
   */
  getActionTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'APPEL': 'Appel téléphonique',
      'EMAIL': 'Email',
      'VISITE': 'Visite sur place',
      'LETTRE': 'Lettre recommandée',
      'AUTRE': 'Autre action'
    };
    return labels[type] || type;
  }

  /**
   * Vérifie si le dossier est affecté au recouvrement juridique
   */
  isDossierJuridique(): boolean {
    return this.dossierSelectionne?.affecteAuJuridique === true || 
           this.dossierApiSelectionne?.typeRecouvrement === 'JURIDIQUE';
  }

  /**
   * Récupère le label pour le type de recouvrement
   */
  getTypeRecouvrementLabel(type: string | undefined): string {
    if (!type) return 'Non défini';
    const labels: { [key: string]: string } = {
      'AMIABLE': 'Recouvrement Amiable',
      'JURIDIQUE': 'Recouvrement Juridique',
      'NON_AFFECTE': 'Non Affecté'
    };
    return labels[type] || type;
  }
}
