import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
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
  private destroy$ = new Subject<void>();

  constructor(
    private dossierApiService: DossierApiService,
    private jwtAuthService: JwtAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDossiers();
  }

  openDossier(dossier: DossierApi): void {
    if (!dossier?.id) {
      return;
    }
    this.router.navigate(['/dossier/detail', dossier.id]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDossiers(): void {
    // Extraire l'ID utilisateur depuis le token JWT
    const agentId = this.jwtAuthService.getCurrentUserId();
    
    if (!agentId || agentId <= 0) {
      console.error('❌ ID utilisateur non disponible depuis le token JWT');
      this.error = 'ID utilisateur non disponible. Veuillez vous reconnecter.';
      return;
    }

    console.log('✅ ID agent extrait du token:', agentId);
    this.loading = true;
    this.error = null;

    // Utiliser getDossiersByAgent() qui récupère les dossiers AFFECTÉS à l'agent
    // Si l'endpoint retourne une liste vide ou une erreur, utiliser le fallback
    this.dossierApiService.getDossiersByAgent(agentId)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Endpoint /agent/{id} indisponible ou erreur, utilisation du fallback', error);
          // Fallback: charger tous les dossiers et filtrer par agentResponsable
          return this.loadDossiersFallback(agentId);
        })
      )
      .subscribe({
        next: (dossiers) => {
          console.log('✅ Dossiers affectés chargés:', dossiers?.length || 0);
          // Si la liste est vide, essayer le fallback
          if (dossiers.length === 0) {
            console.log('⚠️ Liste vide, tentative de fallback...');
            this.loadDossiersFallback(agentId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (fallbackDossiers) => {
                  console.log('✅ Dossiers affectés chargés via fallback:', fallbackDossiers?.length || 0);
                  this.dossiers = fallbackDossiers || [];
                  this.loading = false;
                  if (fallbackDossiers.length === 0) {
                    this.error = null; // Pas d'erreur, juste aucun dossier
                  }
                },
                error: (fallbackError) => {
                  console.error('❌ Erreur également lors du fallback:', fallbackError);
                  this.dossiers = [];
                  this.loading = false;
                  this.error = 'Aucun dossier affecté trouvé.';
                }
              });
          } else {
            this.dossiers = dossiers || [];
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des dossiers affectés:', error);
          this.dossiers = [];
          this.loading = false;
          this.error = 'Aucun dossier affecté trouvé.';
        }
      });
  }

  /**
   * Fallback: Charge tous les dossiers et filtre par agentResponsable.id
   */
  private loadDossiersFallback(agentId: number): Observable<DossierApi[]> {
    console.log('🔄 Fallback: Chargement de tous les dossiers et filtrage par agentResponsable...');
    return this.dossierApiService.getAllDossiers(0, 1000) // Charger beaucoup de dossiers
      .pipe(
        map((page) => {
          const allDossiers = page.content || [];
          console.log('🔄 Total dossiers chargés:', allDossiers.length);
          
          // Filtrer les dossiers où agentResponsable.id === agentId
          const dossiersAffectes = allDossiers.filter(dossier => {
            const agentRespId = dossier.agentResponsable?.id;
            const matches = agentRespId && Number(agentRespId) === Number(agentId);
            if (matches) {
              console.log('✅ Dossier affecté trouvé:', dossier.id, dossier.titre);
            }
            return matches;
          });
          
          console.log('✅ Dossiers affectés filtrés:', dossiersAffectes.length);
          return dossiersAffectes;
        }),
        catchError((error) => {
          console.error('❌ Erreur lors du chargement de tous les dossiers (fallback):', error);
          return of([]);
        })
      );
  }

  /**
   * Retourne le libellé du statut pour l'affichage
   */
  getStatutLabel(statut?: string): string {
    switch (statut) {
      case DossierStatus.ENCOURSDETRAITEMENT:
        return 'En attente de validation';
      case DossierStatus.CLOTURE:
        return 'Validé';
      case 'SUSPENDU':
        return 'Suspendu';
      case 'ANNULE':
        return 'Annulé';
      default:
        return 'Inconnu';
    }
  }

  /**
   * Retourne la classe CSS pour le statut
   */
  getStatutClass(statut?: string): string {
    switch (statut) {
      case DossierStatus.ENCOURSDETRAITEMENT:
        return 'statut-en-attente';
      case DossierStatus.CLOTURE:
        return 'statut-valide';
      case 'SUSPENDU':
        return 'statut-suspendu';
      case 'ANNULE':
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
  formatMontant(montant?: number): string {
    const value = montant ?? 0;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND'
    }).format(value);
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
