import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DossierApi, DossierStatus } from '../../../shared/models/dossier-api.model';

@Component({
  selector: 'app-liste-dossiers-chef',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './liste-dossiers-chef.component.html',
  styleUrls: ['./liste-dossiers-chef.component.scss']
})
export class ListeDossiersChefComponent implements OnInit, OnDestroy {
  dossiers: DossierApi[] = [];
  loading = false;
  error: string | null = null;
  currentUser: any = null;
  validatingDossierId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private dossierApiService: DossierApiService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDossiers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.error = 'Utilisateur non connecté';
      return;
    }
  }

  private loadDossiers(): void {
    this.loading = true;
    this.error = null;

    // Charger les dossiers avec statut EN_ATTENTE_VALIDATION
    this.dossierApiService.getDossiersByStatut('ENCOURSDETRAITEMENT')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossiers) => {
          // Filtrer pour ne garder que ceux en attente de validation
          this.dossiers = dossiers.filter(dossier => 
            dossier.dossierStatus === DossierStatus.ENCOURSDETRAITEMENT
          );
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des dossiers:', error);
          this.error = 'Erreur lors du chargement des dossiers';
          this.loading = false;
        }
      });
  }

  /**
   * Valide un dossier
   */
  validateDossier(dossierId: number): void {
    if (!this.currentUser?.id) {
      this.toastService.error('ID utilisateur non disponible');
      return;
    }

    this.validatingDossierId = dossierId;
    const chefId = parseInt(this.currentUser.id);

    this.dossierApiService.validateDossier(dossierId, chefId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossierValide) => {
          this.toastService.success('Dossier validé avec succès');
          this.validatingDossierId = null;
          // Recharger la liste pour retirer le dossier validé
          this.loadDossiers();
        },
        error: (error) => {
          console.error('Erreur lors de la validation du dossier:', error);
          this.toastService.error('Erreur lors de la validation du dossier');
          this.validatingDossierId = null;
        }
      });
  }

  /**
   * Vérifie si un dossier est en cours de validation
   */
  isDossierValidating(dossierId: number): boolean {
    return this.validatingDossierId === dossierId;
  }

  /**
   * Retourne le nom complet de l'agent créateur
   */
  getAgentCreateurName(dossier: DossierApi): string {
    if (dossier.agentCreateur) {
      return `${dossier.agentCreateur.prenom} ${dossier.agentCreateur.nom}`;
    }
    return 'Non défini';
  }

  /**
   * Formate la date pour l'affichage
   */
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Formate le montant pour l'affichage
   */
  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND'
    }).format(montant);
  }

  /**
   * Recharge les dossiers
   */
  refresh(): void {
    this.loadDossiers();
  }

  /**
   * Retourne le nombre total de dossiers en attente
   */
  getTotalDossiersEnAttente(): number {
    return this.dossiers.length;
  }

  /**
   * Retourne le montant total des dossiers en attente
   */
  getMontantTotal(): number {
    return this.dossiers.reduce((total, dossier) => total + dossier.montantCreance, 0);
  }
}
