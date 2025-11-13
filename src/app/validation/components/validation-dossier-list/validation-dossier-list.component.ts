import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ValidationDossierService, ValidationDossier } from '../../../core/services/validation-dossier.service';
import { ValidationFilter, StatutValidation, ValidationStats } from '../../../shared/models/validation-dossier.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Role } from '../../../shared/models/enums.model';

@Component({
  selector: 'app-validation-dossier-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './validation-dossier-list.component.html',
  styleUrls: ['./validation-dossier-list.component.scss']
})
export class ValidationDossierListComponent implements OnInit, OnDestroy {
  validations: ValidationDossier[] = [];
  filteredValidations: ValidationDossier[] = [];
  stats: ValidationStats | null = null;
  loading = false;
  error: string | null = null;
  currentUser: any = null;
  
  // Filtres
  filterForm: FormGroup;
  searchTerm = '';
  
  // Pagination
  pageSize = 10;
  currentPage = 0;
  totalPages = 0;
  totalItems = 0;
  
  // Enums pour les options
  statutOptions = Object.values(StatutValidation);
  
  private destroy$ = new Subject<void>();

  constructor(
    private validationService: ValidationDossierService,
    private authService: AuthService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      statut: [''],
      agentId: [''],
      chefId: [''],
      dateDebut: [''],
      dateFin: [''],
      searchTerm: ['']
    });
  }

  ngOnInit(): void {
    // Charger l'utilisateur courant et adapter le chargement
    this.currentUser = this.authService.getCurrentUser();
    this.loadValidationsForRole();
    // Les stats seront calculées après le chargement des validations dans loadValidationsForRole()
    this.setupFilterListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterListeners(): void {
    // Écouter les changements de filtres avec debounce
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  loadValidations(): void {
    this.loading = true;
    this.error = null;

    this.validationService.getAllValidationsDossier()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validations) => {
          this.validations = validations;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des validations:', error);
          this.error = 'Erreur lors du chargement des validations';
          this.loading = false;
        }
      });
  }

  loadValidationsForRole(): void {
    this.loading = true;
    this.error = null;

    const user = this.authService.getCurrentUser();
    const role = user?.roleUtilisateur;

    if (role === Role.AGENT_DOSSIER && user && user.id) {
      const agentId = Number(user.id);
      this.validationService.getValidationsByAgent(agentId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (validations) => {
            this.validations = validations;
            this.applyFilters();
            // Recalculer les stats après chargement pour l'agent
            if (role === Role.AGENT_DOSSIER) {
              this.calculateStatsFromValidations();
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement des validations (agent):', error);
            this.error = 'Erreur lors du chargement des validations';
            this.loading = false;
          }
        });
    } else {
      // Pour le chef, charger toutes les validations
      this.validationService.getAllValidationsDossier()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (validations) => {
            this.validations = validations;
            this.applyFilters();
            // Recalculer les stats depuis toutes les validations pour le chef
            this.calculateStatsFromValidations();
            this.loading = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement des validations:', error);
            this.error = 'Erreur lors du chargement des validations';
            this.loading = false;
          }
        });
    }
  }

  loadStats(): void {
    const user = this.authService.getCurrentUser();
    const role = user?.roleUtilisateur;

    // Pour le chef, calculer les stats depuis toutes les validations chargées
    // Cela garantit que les stats reflètent toutes les validations, pas seulement celles du chef connecté
    if (role === Role.CHEF_DEPARTEMENT_DOSSIER || this.authService.canValidateDossiers()) {
      // Si les validations sont déjà chargées, calculer les stats
      if (this.validations && this.validations.length > 0) {
        this.calculateStatsFromValidations();
      } else {
        // Sinon, essayer de charger depuis l'API et utiliser comme fallback
        this.validationService.getValidationStats()
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (stats: any) => {
              this.stats = stats;
            },
            error: (error: any) => {
              console.error('Erreur lors du chargement des statistiques:', error);
              // Fallback: calculer depuis les validations chargées
              this.calculateStatsFromValidations();
            }
          });
      }
    } else {
      // Pour l'agent, calculer les stats depuis ses validations
      this.calculateStatsFromValidations();
    }
  }

  private calculateStatsFromValidations(): void {
    if (!this.validations || this.validations.length === 0) {
      this.stats = {
        total: 0,
        enAttente: 0,
        valides: 0,
        rejetes: 0,
        parAgent: {},
        parChef: {}
      };
      return;
    }

    // Calculer les stats par agent et par chef
    const parAgent: { [agentId: number]: number } = {};
    const parChef: { [chefId: number]: number } = {};

    this.validations.forEach(v => {
      // Par agent
      if (v.agentCreateur?.id) {
        const agentId = Number(v.agentCreateur.id);
        parAgent[agentId] = (parAgent[agentId] || 0) + 1;
      }

      // Par chef (si présent)
      if (v.chefValidateur?.id) {
        const chefId = Number(v.chefValidateur.id);
        parChef[chefId] = (parChef[chefId] || 0) + 1;
      }
    });

    this.stats = {
      total: this.validations.length,
      enAttente: this.validations.filter(v => v.statut === 'EN_ATTENTE').length,
      valides: this.validations.filter(v => v.statut === 'VALIDE').length,
      rejetes: this.validations.filter(v => v.statut === 'REJETE').length,
      parAgent,
      parChef
    };
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.validations];

    // Filtre par statut
    if (filters.statut) {
      filtered = filtered.filter(v => v.statut === filters.statut);
    }

    // Filtre par agent
    if (filters.agentId) {
      filtered = filtered.filter(v => v.agentCreateur.id === filters.agentId.toString());
    }

    // Filtre par chef
    if (filters.chefId) {
      filtered = filtered.filter(v => v.chefValidateur?.id === filters.chefId.toString());
    }

    // Filtre par date
    if (filters.dateDebut) {
      const dateDebut = new Date(filters.dateDebut);
      filtered = filtered.filter(v => new Date(v.dateCreation) >= dateDebut);
    }

    if (filters.dateFin) {
      const dateFin = new Date(filters.dateFin);
      filtered = filtered.filter(v => new Date(v.dateCreation) <= dateFin);
    }

    // Filtre par terme de recherche
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.dossier.titre.toLowerCase().includes(term) ||
        v.dossier.numeroDossier.toLowerCase().includes(term) ||
        v.agentCreateur.nom.toLowerCase().includes(term) ||
        v.agentCreateur.prenom.toLowerCase().includes(term)
      );
    }

    this.filteredValidations = filtered;
    this.updatePagination();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }

  // Actions de validation
  validerDossier(validation: ValidationDossier): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.showError('Utilisateur non connecté');
      return;
    }

    const commentaire = prompt('Commentaire (optionnel):');
    
    // Note: validerDossier attend (dossierId, chefId) - pas de commentaire
    this.validationService.validerDossier(validation.dossier.id, parseInt(currentUser.id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.toastService.showSuccess('Dossier validé avec succès');
          this.loadValidationsForRole();
          // Les stats seront recalculées automatiquement dans loadValidationsForRole()
        },
        error: (error) => {
          console.error('Erreur lors de la validation:', error);
          this.toastService.showError('Erreur lors de la validation');
        }
      });
  }

  rejeterDossier(validation: ValidationDossier): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.showError('Utilisateur non connecté');
      return;
    }

    const commentaire = prompt('Commentaire (optionnel):');
    
    // Note: rejeterDossier attend (dossierId, commentaire) - pas de chefId
    if (!commentaire || commentaire.trim() === '') {
      this.toastService.showError('Le commentaire est obligatoire pour rejeter un dossier');
      return;
    }
    this.validationService.rejeterDossier(validation.dossier.id, commentaire)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.toastService.showSuccess('Dossier rejeté');
          this.loadValidationsForRole();
          // Les stats seront recalculées automatiquement dans loadValidationsForRole()
        },
        error: (error) => {
          console.error('Erreur lors du rejet:', error);
          this.toastService.showError('Erreur lors du rejet');
        }
      });
  }

  remettreEnAttente(validation: ValidationDossier): void {
    const commentaire = prompt('Commentaire (optionnel):');
    
    this.validationService.remettreEnAttente(validation.id, commentaire || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.toastService.showSuccess('Dossier remis en attente');
          this.loadValidationsForRole();
          // Les stats seront recalculées automatiquement dans loadValidationsForRole()
        },
        error: (error) => {
          console.error('Erreur lors de la remise en attente:', error);
          this.toastService.showError('Erreur lors de la remise en attente');
        }
      });
  }

  // Pagination
  updatePagination(): void {
    this.totalItems = this.filteredValidations.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages - 1);
  }

  get paginatedValidations(): ValidationDossier[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredValidations.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  // Utilitaires
  getStatutLabel(statut: string): string {
    switch (statut) {
      case StatutValidation.EN_ATTENTE:
        return 'En Attente';
      case StatutValidation.VALIDE:
        return 'Validé';
      case StatutValidation.REJETE:
        return 'Rejeté';
      default:
        return 'Inconnu';
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case StatutValidation.EN_ATTENTE:
        return 'statut-en-attente';
      case StatutValidation.VALIDE:
        return 'statut-valide';
      case StatutValidation.REJETE:
        return 'statut-rejete';
      default:
        return 'statut-inconnu';
    }
  }

  // Statuts du dossier (workflow + validation dossier)
  getDossierValidationLabel(statut?: string): string {
    switch (statut) {
      case 'EN_ATTENTE_VALIDATION':
        return 'En Attente de Validation';
      case 'VALIDE':
        return 'Validé';
      case 'REJETE':
        return 'Rejeté';
      case 'EN_COURS':
        return 'En Cours';
      case 'CLOTURE':
        return 'Clôturé';
      default:
        return 'Inconnu';
    }
  }

  getDossierValidationClass(statut?: string): string {
    switch (statut) {
      case 'EN_ATTENTE_VALIDATION':
        return 'statut-en-attente';
      case 'VALIDE':
        return 'statut-valide';
      case 'REJETE':
        return 'statut-rejete';
      case 'EN_COURS':
        return 'statut-en-cours';
      case 'CLOTURE':
        return 'statut-cloture';
      default:
        return 'statut-inconnu';
    }
  }

  getDossierWorkflowLabel(status?: string): string {
    switch (status) {
      case 'ENCOURSDETRAITEMENT':
        return 'En Cours de Traitement';
      case 'CLOTURE':
        return 'Clôturé';
      default:
        return status || 'Inconnu';
    }
  }

  getDossierWorkflowClass(status?: string): string {
    switch (status) {
      case 'ENCOURSDETRAITEMENT':
        return 'status-encours';
      case 'CLOTURE':
        return 'status-cloture';
      default:
        return 'status-default';
    }
  }

  canValidate(): boolean {
    return this.authService.canValidateDossiers();
  }

  showCommentaires(commentaires: string): void {
    alert(commentaires);
  }

  formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }
}
