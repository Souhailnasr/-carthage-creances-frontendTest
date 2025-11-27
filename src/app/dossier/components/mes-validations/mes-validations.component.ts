import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
// Utiliser un badge personnalisé si MatChipModule n'est pas disponible
// import { MatChipModule } from '@angular/material/chip';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, combineLatest } from 'rxjs';
import { ValidationDossierService, ValidationDossier } from '../../../core/services/validation-dossier.service';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Role } from '../../../shared/models/enums.model';

@Component({
  selector: 'app-mes-validations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatSelectModule,
    MatInputModule,
    // MatChipModule, // Module non disponible, utiliser un badge personnalisé
    MatCardModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './mes-validations.component.html',
  styleUrls: ['./mes-validations.component.scss']
})
export class MesValidationsComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['numeroDossier', 'titre', 'statut', 'dateCreation', 'dateValidation', 'chefValidateur', 'commentaires', 'actions'];
  dataSource = new MatTableDataSource<ValidationDossier>();
  filteredDataSource = new MatTableDataSource<ValidationDossier>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  loading = false;
  private destroy$ = new Subject<void>();

  // Filtres
  statutFilter = new FormControl('TOUS');
  searchControl = new FormControl('');

  // Statistiques
  stats = {
    total: 0,
    enAttente: 0,
    valides: 0,
    rejetes: 0
  };

  constructor(
    private validationService: ValidationDossierService,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadValidations();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    this.filteredDataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadValidations(): void {
    this.loading = true;
    
    // Utiliser jwtAuthService pour récupérer l'utilisateur de manière asynchrone
    firstValueFrom(this.jwtAuthService.getCurrentUser())
      .then(currentUser => {
        if (!currentUser || !currentUser.id) {
          console.error('❌ Utilisateur non connecté');
          this.loading = false;
          return;
        }

        const userId = Number(currentUser.id);
        const userRole = currentUser.roleUtilisateur;
        
        // Déterminer si l'utilisateur est un chef ou un agent
        const isChef = userRole === Role.CHEF_DEPARTEMENT_DOSSIER || 
                       userRole === Role.SUPER_ADMIN;
        const isAgent = userRole === Role.AGENT_DOSSIER;

        console.log('✅ Chargement des validations pour:', { 
          userId, 
          role: userRole, 
          isChef, 
          isAgent 
        });

        // Pour les chefs : charger les validations qu'ils ont effectuées pour leurs agents
        // Pour les agents : charger les validations de leurs dossiers
        const validations$ = isChef 
          ? this.validationService.getValidationsByChef(userId)
          : this.validationService.getValidationsByAgent(userId);

        validations$
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (validations) => {
              console.log('✅ Validations reçues:', validations.length);
              this.dataSource.data = validations;
              this.updateStats(validations);
              this.applyFilters();
              this.loading = false;
              console.log('✅ Validations chargées:', validations.length);
            },
            error: (error) => {
              console.error('❌ Erreur lors du chargement des validations:', error);
              this.loading = false;
              // Afficher un message d'erreur à l'utilisateur si nécessaire
            }
          });
      })
      .catch(error => {
        console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
        this.loading = false;
      });
  }

  setupFilters(): void {
    // Combiner les filtres avec debounce pour la recherche
    combineLatest([
      this.statutFilter.valueChanges,
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  applyFilters(): void {
    let filtered = [...this.dataSource.data];

    // Filtre par statut
    const statut = this.statutFilter.value;
    if (statut && statut !== 'TOUS') {
      filtered = filtered.filter(v => v.statut === statut);
    }

    // Filtre par recherche
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.dossier.numeroDossier.toLowerCase().includes(searchTerm) ||
        v.dossier.titre.toLowerCase().includes(searchTerm)
      );
    }

    this.filteredDataSource.data = filtered;
    
    // Réinitialiser la pagination
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  updateStats(validations: ValidationDossier[]): void {
    this.stats = {
      total: validations.length,
      enAttente: validations.filter(v => v.statut === 'EN_ATTENTE').length,
      valides: validations.filter(v => v.statut === 'VALIDE').length,
      rejetes: validations.filter(v => v.statut === 'REJETE').length
    };
  }

  voirDetails(validation: ValidationDossier): void {
    this.router.navigate(['/dossier/detail', validation.dossier.id]);
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

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'En Attente';
      case 'VALIDE':
        return 'Validé';
      case 'REJETE':
        return 'Rejeté';
      default:
        return statut;
    }
  }

  getChefName(validation: ValidationDossier): string {
    if (validation.chefValidateur) {
      return `${validation.chefValidateur.prenom} ${validation.chefValidateur.nom}`;
    }
    return '-';
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }
}

