import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../shared/models';
import { DossierApi } from '../../../shared/models/dossier-api.model';

@Component({
  selector: 'app-finance-agent-dossiers',
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
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './finance-agent-dossiers.component.html',
  styleUrls: ['./finance-agent-dossiers.component.scss']
})
export class FinanceAgentDossiersComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  dossiers: DossierApi[] = [];
  filteredDossiers: DossierApi[] = [];
  loading = false;
  searchTerm = '';
  error: string | null = null;

  displayedColumns: string[] = [
    'numero',
    'titre',
    'montantCreance',
    'statut',
    'urgence',
    'actions'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private jwtAuthService: JwtAuthService,
    private dossierApiService: DossierApiService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          const agentId = user?.id ? parseInt(user.id) : null;
          if (agentId) {
            this.loadDossiers(agentId);
          } else {
            this.error = 'Utilisateur inconnu';
          }
        },
        error: (err) => {
          console.error('❌ Erreur lors du chargement de l’utilisateur:', err);
          this.error = 'Impossible de charger le profil utilisateur.';
        }
      });
  }

  private loadDossiers(agentId: number): void {
    this.loading = true;
    this.dossierApiService.getDossiersByAgent(agentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossiers) => {
          this.dossiers = dossiers || [];
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Erreur lors du chargement des dossiers finance:', err);
          this.toastService.error('Erreur lors du chargement des dossiers affectés.');
          this.loading = false;
          this.error = 'Impossible de récupérer vos dossiers actuellement.';
        }
      });
  }

  applyFilters(): void {
    if (!this.searchTerm.trim()) {
      this.filteredDossiers = [...this.dossiers];
      return;
    }

    const search = this.searchTerm.toLowerCase();
    this.filteredDossiers = this.dossiers.filter(dossier =>
      dossier.numeroDossier?.toLowerCase().includes(search) ||
      dossier.titre?.toLowerCase().includes(search) ||
      dossier.creancier?.nom?.toLowerCase().includes(search) ||
      dossier.debiteur?.nom?.toLowerCase().includes(search)
    );
  }

  trackByDossier(_: number, dossier: DossierApi): number | undefined {
    return dossier.id;
  }

  viewFinance(dossier: DossierApi): void {
    if (!dossier.id) { return; }
    this.router.navigate(['/finance/dossier', dossier.id, 'finance']);
  }

  viewDetail(dossier: DossierApi): void {
    if (!dossier.id) { return; }
    this.router.navigate(['/dossier/detail', dossier.id]);
  }

  getStatutLabel(statut?: string): string {
    const labels: Record<string, string> = {
      'EN_ATTENTE_VALIDATION': 'En attente',
      'VALIDE': 'Validé',
      'EN_COURS': 'En cours',
      'CLOTURE': 'Clôturé',
      'REJETE': 'Rejeté'
    };
    return labels[statut || ''] || statut || 'N/A';
  }

  getUrgenceLabel(urgence?: string): string {
    const labels: Record<string, string> = {
      'TRES_URGENT': 'Très urgent',
      'MOYENNE': 'Moyenne',
      'FAIBLE': 'Faible'
    };
    return labels[urgence || ''] || 'Non définie';
  }

  getUrgenceClass(urgence?: string): string {
    const classes: Record<string, string> = {
      'TRES_URGENT': 'urgent-high',
      'MOYENNE': 'urgent-medium',
      'FAIBLE': 'urgent-low'
    };
    return classes[urgence || ''] || 'urgent-none';
  }
}


