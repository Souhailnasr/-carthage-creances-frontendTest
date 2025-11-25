import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, Observable, of, EMPTY } from 'rxjs';
import { map, catchError, expand, reduce } from 'rxjs/operators';
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
    console.log('🔍 Type de agentId:', typeof agentId);
    this.loading = true;
    this.error = null;

    // Utiliser getDossiersByAgent() qui récupère les dossiers AFFECTÉS à l'agent
    // Si l'endpoint retourne une erreur (404, 500, etc.), utiliser le fallback
    // Mais si l'endpoint retourne une liste vide (200 OK avec []), c'est normal (pas de dossiers affectés)
    this.dossierApiService.getDossiersByAgent(agentId)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Endpoint /agent/{id} indisponible ou erreur, utilisation du fallback', error);
          console.warn('⚠️ Détails de l\'erreur:', {
            status: error?.status,
            statusText: error?.statusText,
            message: error?.message,
            url: error?.url
          });
          // Fallback: charger tous les dossiers et filtrer par agentResponsable
          return this.loadDossiersFallback(agentId);
        })
      )
      .subscribe({
        next: (dossiers) => {
          console.log('✅ Dossiers affectés chargés via endpoint /agent/{id}:', dossiers?.length || 0);
          
          if (dossiers && dossiers.length > 0) {
            // Des dossiers ont été trouvés
            this.dossiers = dossiers;
            this.loading = false;
            this.error = null;
            console.log('✅ Dossiers affectés affichés:', this.dossiers.length);
          } else {
            // Liste vide - peut être normal (pas de dossiers affectés) ou problème backend
            console.log('⚠️ Liste vide depuis l\'endpoint /agent/{id}');
            console.log('⚠️ Vérification via fallback pour confirmer...');
            
            // Essayer le fallback pour confirmer s'il y a vraiment des dossiers
            this.loadDossiersFallback(agentId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (fallbackDossiers) => {
                  console.log('✅ Dossiers affectés chargés via fallback:', fallbackDossiers?.length || 0);
                  
                  if (fallbackDossiers && fallbackDossiers.length > 0) {
                    // Le fallback a trouvé des dossiers, donc l'endpoint principal ne fonctionne pas correctement
                    console.warn('⚠️ L\'endpoint /agent/{id} ne retourne pas les dossiers, mais le fallback en a trouvé');
                    this.dossiers = fallbackDossiers;
                    this.error = null;
                  } else {
                    // Aucun dossier trouvé même via fallback, donc vraiment aucun dossier affecté
                    console.log('✅ Aucun dossier affecté trouvé (ni via endpoint ni via fallback)');
                    this.dossiers = [];
                    this.error = null; // Pas d'erreur, juste aucun dossier
                  }
                  this.loading = false;
                },
                error: (fallbackError) => {
                  console.error('❌ Erreur également lors du fallback:', fallbackError);
                  this.dossiers = [];
                  this.loading = false;
                  this.error = 'Erreur lors du chargement des dossiers.';
                }
              });
          }
        },
        error: (error) => {
          // Cette erreur ne devrait pas se produire car elle est gérée dans catchError
          console.error('❌ Erreur non gérée lors du chargement des dossiers affectés:', error);
          this.dossiers = [];
          this.loading = false;
          this.error = 'Erreur lors du chargement des dossiers.';
        }
      });
  }

  /**
   * Fallback: Charge tous les dossiers par pages et filtre par agentResponsable.id
   * Utilise size=100 (max autorisé) et charge plusieurs pages si nécessaire
   */
  private loadDossiersFallback(agentId: number): Observable<DossierApi[]> {
    console.log('🔄 Fallback: Chargement de tous les dossiers et filtrage par agentResponsable...');
    console.log('🔄 Agent ID:', agentId);
    
    const pageSize = 100; // Taille max autorisée par le backend
    
    // Charger la première page
    return this.dossierApiService.getAllDossiers(0, pageSize).pipe(
      // Utiliser expand pour charger toutes les pages suivantes
      expand((page) => {
        const currentPage = page.number || 0;
        const totalPages = page.totalPages || 0;
        const isLast = page.last || false;
        
        console.log(`🔄 Page ${currentPage + 1}/${totalPages} chargée: ${page.content?.length || 0} dossiers`);
        
        // Si ce n'est pas la dernière page, charger la suivante
        if (!isLast && (currentPage + 1) < totalPages) {
          return this.dossierApiService.getAllDossiers(currentPage + 1, pageSize);
        } else {
          // Dernière page, arrêter l'expansion
          return EMPTY;
        }
      }),
      // Réduire toutes les pages en un seul tableau
      reduce((allDossiers: DossierApi[], page: any) => {
        if (page && page.content) {
          return [...allDossiers, ...page.content];
        }
        return allDossiers;
      }, []),
      // Filtrer les dossiers où agentResponsable.id === agentId
      map((allDossiers) => {
        console.log('🔄 Total dossiers chargés:', allDossiers.length);
        
        const dossiersAffectes = allDossiers.filter(dossier => {
          const agentRespId = dossier.agentResponsable?.id;
          const matches = agentRespId && Number(agentRespId) === Number(agentId);
          if (matches) {
            console.log('✅ Dossier affecté trouvé:', dossier.id, dossier.titre, 'agentResponsable.id:', agentRespId);
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
