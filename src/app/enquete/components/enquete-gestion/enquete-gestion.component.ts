import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Enquette, User, Role } from '../../../shared/models';
import { EnqueteService } from '../../../core/services/enquete.service';
import { ValidationEnqueteService } from '../../../core/services/validation-enquete.service';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { RejetEnqueteDialogComponent } from '../dialogs/rejet-enquete-dialog/rejet-enquete-dialog.component';

@Component({
  selector: 'app-enquete-gestion',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './enquete-gestion.component.html',
  styleUrls: ['./enquete-gestion.component.scss']
})
export class EnqueteGestionComponent implements OnInit, OnDestroy {
  enquetes: Enquette[] = [];
  filteredEnquetes: Enquette[] = [];
  pagedEnquetes: Enquette[] = [];
  searchTerm: string = '';
  loading = false;
  loadingStats = false;
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  // Statistiques
  totalEnquetes = 0;
  enquetesValides = 0;
  enquetesNonValides = 0;
  enquetesCeMois = 0;

  // Filtres
  selectedStatut: string = 'all';
  statutOptions = [
    { value: 'all', label: 'Toutes' },
    { value: 'EN_ATTENTE_VALIDATION', label: 'En attente' },
    { value: 'VALIDE', label: 'Validées' },
    { value: 'REJETE', label: 'Rejetées' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'CLOTURE', label: 'Clôturées' }
  ];

  // Pagination
  pageIndex = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  // Sorting
  sortKey: 'dateCreation' | 'rapportCode' | 'statut' = 'dateCreation';
  sortDir: 'asc' | 'desc' = 'desc';

  // Colonnes du tableau
  displayedColumns: string[] = ['rapportCode', 'dossier', 'agentCreateur', 'dateCreation', 'statut', 'actions'];

  // Exposer Role pour le template
  Role = Role;

  constructor(
    private enqueteService: EnqueteService,
    private validationEnqueteService: ValidationEnqueteService,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    // loadEnquetes() sera appelé après le chargement de l'utilisateur
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          this.currentUser = user;
          // Charger les enquêtes et statistiques après avoir chargé l'utilisateur
          this.loadEnquetes();
          this.loadStatistics();
        },
        error: (err) => {
          console.error('❌ Erreur lors du chargement de l\'utilisateur:', err);
          // Charger toutes les enquêtes même en cas d'erreur
          this.loadEnquetes();
          this.loadStatistics();
        }
      });
  }

  loadStatistics(): void {
    // Charger les statistiques seulement pour les chefs et admins
    if (!this.currentUser || 
        (this.currentUser.roleUtilisateur !== Role.CHEF_DEPARTEMENT_DOSSIER && 
         this.currentUser.roleUtilisateur !== Role.SUPER_ADMIN)) {
      return;
    }

    this.loadingStats = true;
    
    // Charger toutes les statistiques en parallèle
    this.enqueteService.getTotalEnquetes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (total) => this.totalEnquetes = total,
        error: (err) => console.error('Erreur lors du chargement du total:', err)
      });

    this.enqueteService.getEnquetesValides()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (valides) => this.enquetesValides = valides,
        error: (err) => console.error('Erreur lors du chargement des enquêtes validées:', err)
      });

    this.enqueteService.getEnquetesNonValides()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (nonValides) => this.enquetesNonValides = nonValides,
        error: (err) => console.error('Erreur lors du chargement des enquêtes non validées:', err)
      });

    this.enqueteService.getEnquetesCreesCeMois()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingStats = false)
      )
      .subscribe({
        next: (ceMois) => this.enquetesCeMois = ceMois,
        error: (err) => console.error('Erreur lors du chargement des enquêtes créées ce mois:', err)
      });
  }

  loadEnquetes(): void {
    this.loading = true;
    
    // Charger les enquêtes selon le rôle de l'utilisateur (même logique que pour les dossiers)
    if (!this.currentUser) {
      // Si pas d'utilisateur, charger toutes les enquêtes
      this.loadAllEnquetes();
      return;
    }

    const userId = this.jwtAuthService.getCurrentUserId();
    
    if (this.currentUser.roleUtilisateur === Role.AGENT_DOSSIER && userId) {
      // Pour les agents : charger uniquement leurs enquêtes
      this.loadEnquetesByAgent(userId);
    } else if (this.currentUser.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER || 
               this.currentUser.roleUtilisateur === Role.SUPER_ADMIN) {
      // Pour les chefs : charger toutes les enquêtes
      this.loadAllEnquetes();
    } else {
      // Par défaut : charger toutes les enquêtes
      this.loadAllEnquetes();
    }
  }

  private loadAllEnquetes(): void {
    this.enqueteService.getAllEnquetes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (enquetes: Enquette[]) => {
          this.enquetes = enquetes || [];
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des enquêtes:', error);
          this.snackBar.open('Erreur lors du chargement des enquêtes', 'Fermer', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  private loadEnquetesByAgent(agentId: number): void {
    this.enqueteService.getEnquetesByAgent(agentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (enquetes: Enquette[]) => {
          this.enquetes = enquetes || [];
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des enquêtes de l\'agent:', error);
          // Fallback : charger toutes les enquêtes
          this.loadAllEnquetes();
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.enquetes];

    // Filtre par statut
    if (this.selectedStatut !== 'all') {
      filtered = filtered.filter(e => e.statut === this.selectedStatut);
    }

    // Filtre par recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.rapportCode?.toLowerCase().includes(term) ||
        e.dossier?.numeroDossier?.toLowerCase().includes(term) ||
        e.agentCreateur?.nom?.toLowerCase().includes(term) ||
        e.agentCreateur?.prenom?.toLowerCase().includes(term)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortKey) {
        case 'dateCreation':
          aValue = a.dateCreation || '';
          bValue = b.dateCreation || '';
          break;
        case 'rapportCode':
          aValue = a.rapportCode || '';
          bValue = b.rapportCode || '';
          break;
        case 'statut':
          aValue = a.statut || '';
          bValue = b.statut || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return this.sortDir === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredEnquetes = filtered;
    this.totalElements = filtered.length;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
    this.applyPaging();
  }

  applyPaging(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedEnquetes = this.filteredEnquetes.slice(start, end);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyPaging();
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.applyFilters();
  }

  filterByStatut(statut: string): void {
    this.selectedStatut = statut;
    this.pageIndex = 0;
    this.applyFilters();
  }

  getStatutColor(statut?: string): string {
    switch (statut) {
      case 'EN_ATTENTE_VALIDATION':
        return 'warn';
      case 'VALIDE':
        return 'primary';
      case 'REJETE':
        return 'accent';
      case 'EN_COURS':
        return 'primary';
      case 'CLOTURE':
        return '';
      default:
        return '';
    }
  }

  getStatutLabel(statut?: string): string {
    const labels: { [key: string]: string } = {
      'EN_ATTENTE_VALIDATION': 'En attente',
      'VALIDE': 'Validée',
      'REJETE': 'Rejetée',
      'EN_COURS': 'En cours',
      'CLOTURE': 'Clôturée'
    };
    return labels[statut || ''] || statut || 'Non défini';
  }

  canValidate(enquete: Enquette): boolean {
    if (!this.currentUser) return false;
    
    const isChef = this.currentUser.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER ||
                   this.currentUser.roleUtilisateur === Role.SUPER_ADMIN;
    
    const isEnAttente = enquete.statut === 'EN_ATTENTE_VALIDATION';
    const isNotCreator = enquete.agentCreateur?.id !== this.currentUser.id;
    
    return isChef && isEnAttente && isNotCreator;
  }

  validerEnquete(enquete: Enquette): void {
    if (!enquete.id || !this.currentUser?.id) {
      this.snackBar.open('Erreur: Informations manquantes', 'Fermer', { duration: 3000 });
      return;
    }

    const chefId = Number(this.currentUser.id);
    this.loading = true;

    this.enqueteService.validerEnquete(enquete.id, chefId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedEnquete) => {
          this.snackBar.open('Enquête validée avec succès', 'Fermer', { duration: 3000 });
          this.loadEnquetes();
        },
        error: (error) => {
          console.error('❌ Erreur lors de la validation:', error);
          
          // Extraire le message d'erreur détaillé
          let errorMessage = error.error?.message || error.error?.error || error.message || 'Erreur lors de la validation de l\'enquête';
          
          // Si le message commence par "Erreur : ", le retirer pour un affichage plus propre
          if (errorMessage.startsWith('Erreur : ')) {
            errorMessage = errorMessage.substring(9);
          } else if (errorMessage.startsWith('Erreur: ')) {
            errorMessage = errorMessage.substring(8);
          }
          
          this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
          this.loading = false;
        }
      });
  }

  rejeterEnquete(enquete: Enquette): void {
    if (!enquete.id) {
      this.snackBar.open('Erreur: ID de l\'enquête manquant', 'Fermer', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(RejetEnqueteDialogComponent, {
      width: '500px',
      data: { enquete }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.commentaire) {
        const commentaire = result.commentaire;
        this.loading = true;
        this.enqueteService.rejeterEnquete(enquete.id!, commentaire)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedEnquete) => {
              this.snackBar.open('Enquête rejetée', 'Fermer', { duration: 3000 });
              this.loadEnquetes();
            },
            error: (error) => {
              console.error('❌ Erreur lors du rejet:', error);
              const message = error.error?.message || 'Erreur lors du rejet de l\'enquête';
              this.snackBar.open(message, 'Fermer', { duration: 5000 });
              this.loading = false;
            }
          });
      }
    });
  }

  voirDetails(enquete: Enquette): void {
    if (enquete.id) {
      this.router.navigate(['/enquetes', enquete.id]);
    }
  }

  formatDate(date?: string): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('fr-FR');
    } catch {
      return date;
    }
  }

  getDossierInfo(enquete: Enquette): string {
    if (!enquete.dossier) return 'N/A';
    return enquete.dossier.numeroDossier || `Dossier #${enquete.dossier.id}`;
  }

  getAgentName(enquete: Enquette): string {
    if (!enquete.agentCreateur) return 'N/A';
    const nom = enquete.agentCreateur.nom || '';
    const prenom = enquete.agentCreateur.prenom || '';
    return `${prenom} ${nom}`.trim() || 'N/A';
  }

  getEnquetesByStatut(statut: string): number {
    if (statut === 'all') return this.totalEnquetes || this.enquetes.length;
    return this.enquetes.filter(e => e.statut === statut).length;
  }

  refreshData(): void {
    this.loadEnquetes();
    this.loadStatistics();
  }
}

