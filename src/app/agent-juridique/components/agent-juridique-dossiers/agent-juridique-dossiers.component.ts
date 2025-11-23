import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AgentJuridiqueService } from '../../../core/services/agent-juridique.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { User } from '../../../shared/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-agent-juridique-dossiers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './agent-juridique-dossiers.component.html',
  styleUrls: ['./agent-juridique-dossiers.component.scss']
})
export class AgentJuridiqueDossiersComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  dossiers: DossierApi[] = [];
  filteredDossiers: DossierApi[] = [];
  loading = false;
  searchTerm = '';
  
  // Pagination
  pageIndex = 0;
  pageSize = 10;
  totalElements = 0;
  
  displayedColumns: string[] = ['numeroDossier', 'titre', 'montantCreance', 'creancier', 'debiteur', 'avocat', 'huissier', 'statut', 'actions'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private agentJuridiqueService: AgentJuridiqueService,
    private jwtAuthService: JwtAuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (user) => {
        this.currentUser = user;
        if (user?.id) {
          this.loadDossiers(parseInt(user.id));
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
      }
    });
  }

  loadDossiers(agentId: number): void {
    this.loading = true;
    this.agentJuridiqueService.getDossiersAffectes(agentId, this.pageIndex, this.pageSize).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (dossiers) => {
        this.dossiers = dossiers;
        this.totalElements = dossiers.length;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des dossiers:', error);
        this.toastService.error('Erreur lors du chargement des dossiers');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.dossiers];
    
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.numeroDossier?.toLowerCase().includes(searchLower) ||
        d.titre?.toLowerCase().includes(searchLower) ||
        d.creancier?.nom?.toLowerCase().includes(searchLower) ||
        d.debiteur?.nom?.toLowerCase().includes(searchLower)
      );
    }
    
    this.filteredDossiers = filtered;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.currentUser?.id) {
      this.loadDossiers(parseInt(this.currentUser.id));
    }
  }

  getStatutLabel(statut: string | undefined): string {
    const labels: { [key: string]: string } = {
      'EN_ATTENTE_VALIDATION': 'En Attente',
      'VALIDE': 'Validé',
      'EN_COURS': 'En Cours',
      'CLOTURE': 'Clôturé',
      'REJETE': 'Rejeté'
    };
    return labels[statut || ''] || statut || 'N/A';
  }

  viewDossier(dossierId: number): void {
    window.location.href = `/dossier/detail/${dossierId}`;
  }

  manageAudiences(dossierId: number): void {
    window.location.href = `/agent-juridique/audiences?dossierId=${dossierId}`;
  }
}

