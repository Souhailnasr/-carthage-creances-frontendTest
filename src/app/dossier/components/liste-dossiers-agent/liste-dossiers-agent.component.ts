import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DossierApi, DossierStatus } from '../../../shared/models/dossier-api.model';

@Component({
  selector: 'app-liste-dossiers-agent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './liste-dossiers-agent.component.html',
  styleUrls: ['./liste-dossiers-agent.component.scss']
})
export class ListeDossiersAgentComponent implements OnInit, OnDestroy {
  dossiers: DossierApi[] = [];
  loading = false;
  error: string | null = null;
  currentUser: any = null;
  private destroy$ = new Subject<void>();

  constructor(
    private dossierApiService: DossierApiService,
    private authService: AuthService
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
    if (!this.currentUser?.id) {
      this.error = 'ID utilisateur non disponible';
      return;
    }

    this.loading = true;
    this.error = null;

    this.dossierApiService.getDossiersByUtilisateurId(parseInt(this.currentUser.id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossiers) => {
          this.dossiers = dossiers;
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
   * Retourne le libellé du statut pour l'affichage
   */
  getStatutLabel(statut: DossierStatus): string {
    switch (statut) {
      case DossierStatus.ENCOURSDETRAITEMENT:
        return 'En attente de validation';
      case DossierStatus.CLOTURE:
        return 'Validé';
      case DossierStatus.SUSPENDU:
        return 'Suspendu';
      case DossierStatus.ANNULE:
        return 'Annulé';
      default:
        return 'Inconnu';
    }
  }

  /**
   * Retourne la classe CSS pour le statut
   */
  getStatutClass(statut: DossierStatus): string {
    switch (statut) {
      case DossierStatus.ENCOURSDETRAITEMENT:
        return 'statut-en-attente';
      case DossierStatus.CLOTURE:
        return 'statut-valide';
      case DossierStatus.SUSPENDU:
        return 'statut-suspendu';
      case DossierStatus.ANNULE:
        return 'statut-annule';
      default:
        return 'statut-inconnu';
    }
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
   * Retourne les dossiers en attente de validation
   */
  getDossiersEnAttente(): DossierApi[] {
    return this.dossiers.filter(dossier => dossier.dossierStatus === DossierStatus.ENCOURSDETRAITEMENT);
  }

  /**
   * Retourne les dossiers validés
   */
  getDossiersValides(): DossierApi[] {
    return this.dossiers.filter(dossier => dossier.dossierStatus === DossierStatus.CLOTURE);
  }
}
