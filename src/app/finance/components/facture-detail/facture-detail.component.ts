import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { FinanceService, ActionFinance } from '../../../core/services/finance.service';
import { FactureService } from '../../../core/services/facture.service';
import { DetailFacture, Finance, Facture } from '../../../shared/models/finance.models';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { EnqueteService } from '../../../core/services/enquete.service';
import { Enquette } from '../../../shared/models/enquete.model';
import { EnquetteApi } from '../../../shared/models/dossier-api.model';

@Component({
  selector: 'app-facture-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule
  ],
  templateUrl: './facture-detail.component.html',
  styleUrls: ['./facture-detail.component.scss']
})
export class FactureDetailComponent implements OnInit, OnDestroy {
  factureId!: number;
  dossierId: number | null = null;
  facture: Facture | null = null;
  detailFacture: DetailFacture | null = null;
  finance: Finance | null = null;
  dossier: DossierApi | null = null;
  enquete: Enquette | EnquetteApi | null = null;
  actionsAmiable: ActionFinance[] = [];
  actionsJuridique: ActionFinance[] = [];
  loading = false;
  
  // Tarif fixe enquête selon l'annexe
  readonly FRAIS_FIXE_ENQUETE = 300;
  
  displayedColumnsAmiable: string[] = ['dateAction', 'type', 'nbOccurrences', 'coutUnitaire', 'total'];
  displayedColumnsJuridique: string[] = ['dateAction', 'type', 'nbOccurrences', 'coutUnitaire', 'total'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private financeService: FinanceService,
    private factureService: FactureService,
    private dossierApiService: DossierApiService,
    private enqueteService: EnqueteService,
    private snackBar: MatSnackBar,
    private jwtAuthService: JwtAuthService
  ) {}

  ngOnInit(): void {
    // Vérifier l'authentification
    if (!this.jwtAuthService.isUserLoggedIn()) {
      this.snackBar.open('Vous devez être connecté pour accéder à cette page', 'Fermer', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }
    
    // Détecter la route pour savoir si on a un factureId ou un dossierId
    const routePath = this.route.snapshot.url.map(segment => segment.path).join('/');
    const id = +this.route.snapshot.paramMap.get('id')!;
    
    if (!id) {
      this.snackBar.open('ID invalide', 'Fermer', { duration: 3000 });
      this.router.navigate(['/finance/factures']);
      return;
    }
    
    // Si la route contient "dossier" et "facture", alors id est un dossierId
    if (routePath.includes('dossier') && routePath.includes('facture')) {
      // Route: /finance/dossier/:id/facture
      this.dossierId = id;
      this.loadFactureByDossier();
    } else {
      // Route: /finance/factures/:id
      this.factureId = id;
      this.loadFacture();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger la facture par son ID (route: /finance/factures/:id)
   */
  loadFacture(): void {
    this.loading = true;
    this.factureService.getFactureById(this.factureId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (facture) => {
        console.log('✅ Facture chargée:', facture);
        this.facture = facture;
        // Récupérer le dossierId depuis la facture
        this.dossierId = facture.dossierId;
        
        if (!this.dossierId) {
          console.error('❌ La facture n\'a pas de dossierId');
          this.snackBar.open('La facture n\'a pas de dossier associé', 'Fermer', { duration: 3000 });
          this.loading = false;
          return;
        }
        
        console.log('📋 DossierId extrait de la facture:', this.dossierId);
        
        // Charger les données du dossier maintenant qu'on a le dossierId
        this.loadDetailFacture();
        this.loadFinance();
        this.loadDossier();
        this.loadEnquete();
        this.loadActions();
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement de la facture:', err);
        this.snackBar.open('Erreur lors du chargement de la facture', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  /**
   * Charger la facture par dossierId (route: /finance/dossier/:id/facture)
   */
  loadFactureByDossier(): void {
    if (!this.dossierId) return;
    
    this.loading = true;
    // Charger d'abord les données du dossier
    this.loadDetailFacture();
    this.loadFinance();
    this.loadDossier();
    this.loadEnquete();
    this.loadActions();
    
    // Ensuite, charger la facture associée au dossier
    this.factureService.getFacturesByDossier(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (factures) => {
        if (factures && factures.length > 0) {
          // Prendre la facture la plus récente (ou la première)
          this.facture = factures[0];
          this.factureId = this.facture.id!;
          console.log('✅ Facture chargée depuis le dossier:', this.facture);
        } else {
          console.warn('⚠️ Aucune facture trouvée pour le dossier', this.dossierId);
          this.snackBar.open('Aucune facture trouvée pour ce dossier. Vous pouvez en générer une depuis la validation des tarifs.', 'Fermer', { duration: 5000 });
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des factures du dossier:', err);
        // Ne pas bloquer l'affichage, on peut quand même afficher les détails du dossier
        this.loading = false;
      }
    });
  }

  loadDetailFacture(): void {
    if (!this.dossierId) return;
    
    this.financeService.getDetailFacture(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (detail) => {
        this.detailFacture = detail;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement du détail facture:', err);
        // Ne pas bloquer l'affichage si le détail n'existe pas encore
        this.loading = false;
      }
    });
  }

  loadFinance(): void {
    if (!this.dossierId) return;
    
    this.financeService.getFinanceByDossier(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (finance) => {
        this.finance = finance;
      },
      error: (err) => {
        // 404 est normal si Finance n'existe pas encore
        if (err.status !== 404) {
          console.error('❌ Erreur lors du chargement de Finance:', err);
        }
      }
    });
  }

  loadDossier(): void {
    if (!this.dossierId) return;
    
    this.dossierApiService.getDossierById(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (dossier) => {
        this.dossier = dossier;
        console.log('✅ Dossier chargé:', dossier);
        console.log('📋 Dossier a une enquête?', dossier.enquette != null);
      },
      error: (err) => {
        // 404 est normal si le dossier n'existe pas
        if (err.status !== 404) {
          console.error('❌ Erreur lors du chargement du dossier:', err);
        }
      }
    });
  }

  loadEnquete(): void {
    if (!this.dossierId) return;
    
    // Charger l'enquête via EnqueteService si elle n'est pas dans le dossier
    this.enqueteService.getEnqueteByDossier(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (enquete) => {
        if (enquete) {
          this.enquete = enquete;
          console.log('✅ Enquête chargée:', enquete);
          // Si le dossier n'a pas l'enquête chargée, l'ajouter
          if (this.dossier && !this.dossier.enquette) {
            // Convertir Enquette en EnquetteApi pour le dossier
            this.dossier.enquette = {
              id: enquete.id || 0,
              dossierId: enquete.dossierId || this.dossierId || 0,
              dateEnquete: this.getEnqueteDate(enquete) || new Date().toISOString(),
              resultat: this.getEnqueteResultat(enquete) || '',
              observations: enquete.observations || '',
              statut: enquete.statut as any
            };
          }
        } else {
          console.log('ℹ️ Aucune enquête trouvée pour ce dossier');
        }
      },
      error: (err) => {
        // 404 est normal si le dossier n'a pas d'enquête
        if (err.status !== 404) {
          console.error('❌ Erreur lors du chargement de l\'enquête:', err);
        }
      }
    });
  }

  /**
   * Helper pour obtenir la date de l'enquête (gère les deux types d'interfaces)
   */
  getEnqueteDate(enquete: Enquette | EnquetteApi | null | undefined): string | null {
    if (!enquete) return null;
    // EnquetteApi a dateEnquete
    if ('dateEnquete' in enquete) {
      return enquete.dateEnquete;
    }
    // Enquette a dateCreation
    if ('dateCreation' in enquete && enquete.dateCreation) {
      return enquete.dateCreation;
    }
    return null;
  }

  /**
   * Helper pour obtenir le résultat de l'enquête (gère les deux types d'interfaces)
   */
  getEnqueteResultat(enquete: Enquette | EnquetteApi | null | undefined): string | null {
    if (!enquete) return null;
    // EnquetteApi a resultat
    if (this.hasProperty(enquete, 'resultat')) {
      return (enquete as any).resultat;
    }
    // Enquette a decisionComite ou observations
    if (this.hasProperty(enquete, 'decisionComite') && (enquete as any).decisionComite) {
      return (enquete as any).decisionComite;
    }
    if (this.hasProperty(enquete, 'observations') && (enquete as any).observations) {
      return (enquete as any).observations;
    }
    return null;
  }

  /**
   * Helper pour obtenir les observations de l'enquête (pour l'affichage)
   */
  getEnqueteObservations(): string | null {
    // Priorité : dossier.enquette.observations
    if (this.dossier?.enquette?.observations) {
      return this.dossier.enquette.observations;
    }
    // Sinon : enquete.observations
    if (this.enquete) {
      if (this.hasProperty(this.enquete, 'observations')) {
        return (this.enquete as any).observations;
      }
    }
    return null;
  }

  /**
   * Helper pour vérifier si un objet a une propriété (remplace l'opérateur 'in' dans les templates)
   */
  hasProperty(obj: any, prop: string): boolean {
    return obj != null && prop in obj;
  }

  loadActions(): void {
    if (!this.dossierId) return;
    
    this.financeService.getActionsAvecCouts(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (actions) => {
        // Filtrer par type de recouvrement (à adapter selon la structure backend)
        // Pour l'instant, on sépare par type d'action
        this.actionsAmiable = actions.filter(a => 
          ['APPEL', 'EMAIL', 'VISITE', 'LETTRE'].includes(a.type)
        );
        this.actionsJuridique = actions.filter(a => 
          !['APPEL', 'EMAIL', 'VISITE', 'LETTRE'].includes(a.type)
        );
      },
      error: (err) => {
        // 404 est normal si pas d'actions
        if (err.status !== 404) {
          console.error('❌ Erreur lors du chargement des actions:', err);
        }
      }
    });
  }

  recalculerCouts(): void {
    if (!this.dossierId) return;
    
    this.loading = true;
    this.financeService.recalculerCouts(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (finance) => {
        this.finance = finance;
        this.loadDetailFacture();
        this.snackBar.open('Coûts recalculés avec succès', 'Fermer', { duration: 3000 });
      },
      error: (err) => {
        console.error('❌ Erreur lors du recalcul:', err);
        const errorMessage = err.error?.message || err.message || 'Erreur lors du recalcul';
        this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  genererFacture(): void {
    if (!this.dossierId) return;
    
    this.loading = true;
    this.financeService.genererFacture(this.dossierId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (factureDetail) => {
        const facture = factureDetail.facture;
        this.snackBar.open(`Facture ${facture.numeroFacture} générée avec succès`, 'Fermer', { duration: 3000 });
        this.router.navigate(['/finance/factures', facture.id]);
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors de la génération:', err);
        const errorMessage = err.error?.message || err.message || 'Erreur lors de la génération';
        this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  finaliserFacture(): void {
    if (!this.dossierId) {
      this.snackBar.open('Dossier ID manquant', 'Fermer', { duration: 3000 });
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir finaliser cette facture ?')) {
      this.loading = true;
      this.financeService.finaliserFacture(this.dossierId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (finance) => {
          this.finance = finance;
          this.snackBar.open('Facture finalisée avec succès', 'Fermer', { duration: 3000 });
          this.loadDetailFacture();
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Erreur lors de la finalisation:', err);
          const errorMessage = err.error?.message || err.message || 'Erreur lors de la finalisation';
          this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
          this.loading = false;
        }
      });
    }
  }

  imprimerFacture(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/finance']);
  }
}

