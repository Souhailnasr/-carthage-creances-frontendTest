import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';
import { FinanceService, StatistiquesCouts } from '../../../core/services/finance.service';
import { Finance } from '../../../shared/models/finance.models';
import { FluxFraisService } from '../../../core/services/flux-frais.service';
import { FactureService } from '../../../core/services/facture.service';
import { FluxFrais } from '../../../shared/models/finance.models';
import { Facture } from '../../../shared/models/finance.models';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { Router } from '@angular/router';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { EnqueteService } from '../../../core/services/enquete.service';
import { IaPredictionService } from '../../../core/services/ia-prediction.service';
import { IaPredictionBadgeComponent } from '../../../shared/components/ia-prediction-badge/ia-prediction-badge.component';
import { IaPredictionResult } from '../../../shared/models/ia-prediction-result.model';
import { Dossier } from '../../../shared/models/dossier.model';
import { forkJoin, of, firstValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { StatistiqueCompleteService } from '../../../core/services/statistique-complete.service';
import { StatistiquesGlobales } from '../../../shared/models/statistique-complete.model';

@Component({
  selector: 'app-chef-finance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatTableModule,
    MatChipsModule,
    IaPredictionBadgeComponent
  ],
  templateUrl: './chef-finance-dashboard.component.html',
  styleUrls: ['./chef-finance-dashboard.component.scss']
})
export class ChefFinanceDashboardComponent implements OnInit, OnDestroy {
  statistiques: StatistiquesCouts = {
    totalFraisCreation: 0,
    totalFraisGestion: 0,
    totalActionsAmiable: 0,
    totalActionsJuridique: 0,
    totalAvocat: 0,
    totalHuissier: 0,
    grandTotal: 0,
    tauxReussiteRecouvrement: 0,
    nombreDossiersEnquete: 0,
    nombreDossiersAmiable: 0,
    nombreDossiersJuridique: 0,
    nombreDossiersTotal: 0,
    nombreDossiersClotures: 0,
    montantTotalRecouvre: 0,
    montantTotalEnCours: 0,
    nombreFacturesEmises: 0,
    nombreFacturesPayees: 0,
    montantFacturesEnAttente: 0,
    // ✅ NOUVEAU : Statistiques financières
    totalFraisEngages: 0,
    fraisRecuperes: 0,
    netGenere: 0
  };
  
  facturesEnAttente: Finance[] = [];
  fraisEnAttente: FluxFrais[] = [];
  facturesEnRetard: Facture[] = [];
  error: string | null = null;
  
  // ✅ Dossiers récents avec prédiction IA
  dossiersRecents: DossierApi[] = [];
  loadingDossiersRecents = false;
  
  // ✅ NOUVEAU : Statistiques de recouvrement par phase
  statsRecouvrement: any = null;
  statsFinancieres: any = null; // Statistiques financières complètes
  
  private destroy$ = new Subject<void>();

  constructor(
    private financeService: FinanceService,
    private fluxFraisService: FluxFraisService,
    private factureService: FactureService,
    private dossierApiService: DossierApiService,
    private enqueteService: EnqueteService,
    private iaPredictionService: IaPredictionService,
    private statistiqueCompleteService: StatistiqueCompleteService,
    private snackBar: MatSnackBar,
    private jwtAuthService: JwtAuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Vérifier l'authentification
    if (!this.jwtAuthService.isUserLoggedIn()) {
      this.snackBar.open('Vous devez être connecté pour accéder à cette page', 'Fermer', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loadStatistiques();
    this.loadFacturesEnAttente();
    this.loadFraisEnAttente();
    this.loadFacturesEnRetard();
    this.loadDossiersRecents();
  }

  /**
   * Charger les dossiers récents avec leurs prédictions IA
   */
  loadDossiersRecents(): void {
    this.loadingDossiersRecents = true;
    this.dossierApiService.getAllDossiers(0, 10).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('❌ Erreur lors du chargement des dossiers récents:', error);
        return of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 });
      })
    ).subscribe({
      next: (page) => {
        this.dossiersRecents = page.content.slice(0, 5); // Prendre les 5 premiers
        this.loadingDossiersRecents = false;
      },
      error: () => {
        this.loadingDossiersRecents = false;
      }
    });
  }

  /**
   * Obtenir la prédiction IA depuis un dossier API
   */
  getPrediction(dossier: DossierApi): IaPredictionResult | null {
    if (!dossier.etatPrediction && dossier.riskScore === undefined) {
      return null;
    }
    // Convertir DossierApi en Dossier pour utiliser le service
    const dossierModel = new Dossier({
      id: String(dossier.id),
      etatPrediction: dossier.etatPrediction,
      riskScore: dossier.riskScore,
      riskLevel: dossier.riskLevel,
      datePrediction: dossier.datePrediction
    });
    return this.iaPredictionService.getPredictionFromDossier(dossierModel);
  }

  /**
   * Déclencher une prédiction IA pour un dossier
   */
  triggerPrediction(dossierId: number, event: Event): void {
    event.stopPropagation();
    this.iaPredictionService.predictForDossier(dossierId).subscribe({
      next: (prediction) => {
        this.snackBar.open('Prédiction IA calculée avec succès', 'Fermer', { duration: 3000 });
        // Rafraîchir les dossiers récents
        this.loadDossiersRecents();
      },
      error: (error) => {
        console.error('❌ Erreur lors de la prédiction:', error);
        this.snackBar.open('Erreur lors du calcul de la prédiction IA', 'Fermer', { duration: 3000 });
      }
    });
  }

  /**
   * Naviguer vers le détail d'un dossier
   */
  viewDossier(dossierId: number): void {
    this.router.navigate(['/dossier/detail', dossierId]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatistiques(): void {
    // ✅ STANDARDISATION : Utiliser getStatistiquesGlobales() + getStatistiquesFinancieres() + getStatistiquesCouts()
    forkJoin({
      globales: this.statistiqueCompleteService.getStatistiquesGlobales().pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques globales:', err);
          return of(null);
        })
      ),
      departement: this.statistiqueCompleteService.getStatistiquesDepartement().pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques du département:', err);
          return of(null);
        })
      ),
      couts: this.financeService.getStatistiquesCouts().pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques de coûts:', err);
          return of(null);
        })
      ),
      financieres: this.statistiqueCompleteService.getStatistiquesFinancieres().pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.warn('⚠️ Erreur lors du chargement des statistiques financières:', err);
          return of(null);
        })
      )
    }).subscribe({
      next: (results) => {
        // ✅ STANDARDISATION : Prioriser getStatistiquesGlobales() comme source principale
        // Mapper les statistiques SANS valeurs par défaut (0)
        if (results.couts) {
          this.statistiques = {
            ...results.couts,
            // ✅ Statistiques financières depuis /api/statistiques/financieres
            montantTotalRecouvre: results.financieres?.montantRecouvre ?? results.globales?.montantRecouvre ?? results.departement?.montantRecouvre ?? null,
            montantTotalEnCours: results.financieres?.montantEnCours ?? results.globales?.montantEnCours ?? results.departement?.montantEnCours ?? null,
            // Taux de réussite depuis globales ou departement (financieres n'a pas de tauxReussiteGlobal)
            tauxReussiteRecouvrement: results.globales?.tauxReussiteGlobal ?? results.departement?.tauxReussite ?? null,
            // Nouvelles données financières disponibles
            totalFraisEngages: results.financieres?.totalFraisEngages ?? undefined,
            fraisRecuperes: results.financieres?.fraisRecuperes ?? undefined,
            netGenere: results.financieres?.netGenere ?? undefined,
            // Statistiques de dossiers depuis globales (priorité) ou departement
            nombreDossiersEnquete: results.globales?.dossiersPhaseEnquete ?? results.departement?.dossiersParPhaseEnquete ?? null,
            nombreDossiersAmiable: results.globales?.dossiersPhaseAmiable ?? results.departement?.dossiersParPhaseAmiable ?? null,
            nombreDossiersJuridique: results.globales?.dossiersPhaseJuridique ?? results.departement?.dossiersParPhaseJuridique ?? null,
            nombreDossiersTotal: results.globales?.totalDossiers ?? results.departement?.totalDossiers ?? null,
            nombreDossiersClotures: results.globales?.dossiersClotures ?? results.departement?.dossiersClotures ?? null,
            // Factures (sera rempli par loadStatistiquesFactures)
            nombreFacturesEmises: undefined,
            nombreFacturesPayees: undefined,
            montantFacturesEnAttente: undefined
          };
        } else {
          // Si couts est null, initialiser avec les données globales, financières et département
          this.statistiques = {
            totalFraisCreation: 0,
            totalFraisGestion: 0,
            totalActionsAmiable: 0,
            totalActionsJuridique: 0,
            totalAvocat: 0,
            totalHuissier: 0,
            grandTotal: 0,
            montantTotalRecouvre: results.financieres?.montantRecouvre ?? results.globales?.montantRecouvre ?? results.departement?.montantRecouvre ?? null,
            montantTotalEnCours: results.financieres?.montantEnCours ?? results.globales?.montantEnCours ?? results.departement?.montantEnCours ?? null,
            tauxReussiteRecouvrement: results.globales?.tauxReussiteGlobal ?? results.departement?.tauxReussite ?? null,
            totalFraisEngages: results.financieres?.totalFraisEngages ?? undefined,
            fraisRecuperes: results.financieres?.fraisRecuperes ?? undefined,
            netGenere: results.financieres?.netGenere ?? undefined,
            nombreDossiersEnquete: results.globales?.dossiersPhaseEnquete ?? results.departement?.dossiersParPhaseEnquete ?? null,
            nombreDossiersAmiable: results.globales?.dossiersPhaseAmiable ?? results.departement?.dossiersParPhaseAmiable ?? null,
            nombreDossiersJuridique: results.globales?.dossiersPhaseJuridique ?? results.departement?.dossiersParPhaseJuridique ?? null,
            nombreDossiersTotal: results.globales?.totalDossiers ?? results.departement?.totalDossiers ?? null,
            nombreDossiersClotures: results.globales?.dossiersClotures ?? results.departement?.dossiersClotures ?? null,
            nombreFacturesEmises: undefined,
            nombreFacturesPayees: undefined,
            montantFacturesEnAttente: undefined
          };
        }
        // ✅ NOUVEAU : Stocker les statistiques financières complètes
        this.statsFinancieres = results.financieres;
        
        // ✅ NOUVEAU : Charger les statistiques de recouvrement par phase
        this.statistiqueCompleteService.getStatistiquesRecouvrementParPhaseDepartement().pipe(
          takeUntil(this.destroy$),
          catchError((err) => {
            console.warn('⚠️ Erreur lors du chargement des statistiques de recouvrement par phase:', err);
            return of(null);
          })
        ).subscribe({
          next: (recouvrement) => {
            this.statsRecouvrement = recouvrement;
            console.log('✅ Statistiques de recouvrement par phase chargées:', recouvrement);
          }
        });
        
        console.log('✅ Statistiques chargées (standardisées):', {
          globales: results.globales,
          couts: results.couts,
          financieres: results.financieres,
          departement: results.departement
        });
        // Charger les statistiques de dossiers (pour compléter si nécessaire)
        this.loadStatistiquesDossiers();
        // Charger les statistiques de factures
        this.loadStatistiquesFactures();
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des statistiques:', err);
        this.snackBar.open('Erreur lors du chargement des statistiques', 'Fermer', { duration: 3000 });
      }
    });
  }

  /**
   * Charge les statistiques des dossiers par phase
   */
  loadStatistiquesDossiers(): void {
    console.log('📊 Début du chargement des statistiques de dossiers...');
    
    // Le backend limite la taille de page à 100 maximum
    // Utiliser 100 comme taille de page (limite maximale autorisée)
    const pageSize = 100;
    
    // Récupérer tous les dossiers pour calculer les statistiques
    // Utiliser catchError pour éviter que les erreurs cassent tout
    forkJoin({
      tous: this.dossierApiService.getAllDossiers(0, pageSize).pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('❌ Erreur lors du chargement de tous les dossiers:', err);
          return of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 });
        })
      ),
      amiable: this.dossierApiService.getDossiersRecouvrementAmiable(0, pageSize).pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('❌ Erreur lors du chargement des dossiers amiable:', err);
          return of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 });
        })
      ),
      juridique: this.dossierApiService.getDossiersRecouvrementJuridique(0, pageSize).pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('❌ Erreur lors du chargement des dossiers juridique:', err);
          return of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 });
        })
      )
    }).subscribe({
      next: (results) => {
        console.log('✅ Données reçues:', {
          tous: results.tous.totalElements,
          amiable: results.amiable.totalElements,
          juridique: results.juridique.totalElements
        });

        const tousDossiers = results.tous.content || [];
        const dossiersAmiable = results.amiable.content || [];
        const dossiersJuridique = results.juridique.content || [];

        // Calculer les statistiques (seulement si pas déjà définies depuis departement)
        if (this.statistiques.nombreDossiersTotal === null || this.statistiques.nombreDossiersTotal === undefined || this.statistiques.nombreDossiersTotal === 0) {
          this.statistiques.nombreDossiersTotal = results.tous.totalElements || 0;
        }
        if (this.statistiques.nombreDossiersAmiable === null || this.statistiques.nombreDossiersAmiable === undefined || this.statistiques.nombreDossiersAmiable === 0) {
          this.statistiques.nombreDossiersAmiable = results.amiable.totalElements || 0;
        }
        if (this.statistiques.nombreDossiersJuridique === null || this.statistiques.nombreDossiersJuridique === undefined || this.statistiques.nombreDossiersJuridique === 0) {
          this.statistiques.nombreDossiersJuridique = results.juridique.totalElements || 0;
        }

        console.log('📊 Statistiques calculées:', {
          total: this.statistiques.nombreDossiersTotal,
          amiable: this.statistiques.nombreDossiersAmiable,
          juridique: this.statistiques.nombreDossiersJuridique
        });

        // Dossiers en phase d'enquête : compter tous les dossiers qui ont une enquête
        // Un dossier peut avoir une enquête ET être en phase amiable ou juridique en même temps
        console.log('🔍 Vérification des enquêtes dans les dossiers...');
        console.log('📋 Nombre total de dossiers chargés:', tousDossiers.length);
        
        // Log détaillé pour les premiers dossiers
        tousDossiers.slice(0, 5).forEach((d, index) => {
          console.log(`📄 Dossier ${index + 1} (ID: ${d.id}):`, {
            numeroDossier: d.numeroDossier,
            hasEnquette: d.enquette != null,
            enquette: d.enquette
          });
        });
        
        // Si l'enquête n'est pas chargée dans getAllDossiers, on doit charger les dossiers individuellement
        // ou utiliser un endpoint qui charge l'enquête
        // Pour l'instant, on compte ceux qui ont déjà l'enquête chargée
        let dossiersEnquete = tousDossiers.filter(d => {
          return d.enquette != null && d.enquette !== undefined;
        });
        
        // Si aucun dossier n'a d'enquête chargée, utiliser le service EnqueteService pour vérifier
        if (dossiersEnquete.length === 0 && tousDossiers.length > 0) {
          console.warn('⚠️ Aucune enquête chargée dans les dossiers. Vérification via EnqueteService...');
          // Utiliser EnqueteService.getEnqueteByDossier pour vérifier si chaque dossier a une enquête
          this.checkEnquetesForDossiers(tousDossiers);
        } else {
          this.statistiques.nombreDossiersEnquete = dossiersEnquete.length;
          console.log('📊 Dossiers en enquête:', this.statistiques.nombreDossiersEnquete, 'sur', tousDossiers.length);
        }

        // ✅ CORRECTION : Ne remplacer que si les valeurs ne sont pas déjà définies depuis financieres/departement
        // Dossiers clôturés
        const dossiersClotures = tousDossiers.filter(d => d.dateCloture != null || d.dossierStatus === 'CLOTURE');
        if (this.statistiques.nombreDossiersClotures === null || this.statistiques.nombreDossiersClotures === undefined || this.statistiques.nombreDossiersClotures === 0) {
          this.statistiques.nombreDossiersClotures = dossiersClotures.length;
        }
        console.log('📊 Dossiers clôturés:', this.statistiques.nombreDossiersClotures);

        // Montant total récupéré (dossiers clôturés) - seulement si pas déjà défini depuis financieres
        if (this.statistiques.montantTotalRecouvre === null || this.statistiques.montantTotalRecouvre === undefined || this.statistiques.montantTotalRecouvre === 0) {
          this.statistiques.montantTotalRecouvre = dossiersClotures.reduce(
            (sum, d) => sum + (d.montantCreance || 0), 0
          );
        }

        // Montant total en cours (dossiers non clôturés) - seulement si pas déjà défini depuis financieres
        if (this.statistiques.montantTotalEnCours === null || this.statistiques.montantTotalEnCours === undefined || this.statistiques.montantTotalEnCours === 0) {
          const dossiersEnCours = tousDossiers.filter(d => !d.dateCloture && d.dossierStatus !== 'CLOTURE');
          this.statistiques.montantTotalEnCours = dossiersEnCours.reduce(
            (sum, d) => sum + (d.montantCreance || 0), 0
          );
        }

        // Taux de réussite de recouvrement - seulement si pas déjà défini depuis financieres
        if ((this.statistiques.tauxReussiteRecouvrement === null || this.statistiques.tauxReussiteRecouvrement === undefined || this.statistiques.tauxReussiteRecouvrement === 0) && this.statistiques.nombreDossiersTotal > 0) {
          this.statistiques.tauxReussiteRecouvrement = Math.round(
            (this.statistiques.nombreDossiersClotures / this.statistiques.nombreDossiersTotal) * 100 * 10
          ) / 10;
        }

        console.log('✅ Statistiques finales:', {
          tauxReussite: this.statistiques.tauxReussiteRecouvrement,
          montantRecouvre: this.statistiques.montantTotalRecouvre,
          montantEnCours: this.statistiques.montantTotalEnCours
        });
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des statistiques de dossiers:', err);
        this.snackBar.open('Erreur lors du chargement des statistiques de dossiers', 'Fermer', { duration: 5000 });
      }
    });
  }

  /**
   * Vérifie les enquêtes pour une liste de dossiers en utilisant EnqueteService
   * Cette méthode utilise l'endpoint spécifique pour vérifier si chaque dossier a une enquête
   */
  private checkEnquetesForDossiers(dossiers: DossierApi[]): void {
    console.log(`🔍 Vérification de ${dossiers.length} dossiers pour les enquêtes...`);
    
    // Limiter à 50 dossiers pour éviter trop de requêtes simultanées
    const dossiersToCheck = dossiers.slice(0, Math.min(50, dossiers.length));
    
    // Créer un tableau d'observables pour vérifier chaque dossier
    const enqueteChecks = dossiersToCheck.map(dossier => 
      this.enqueteService.getEnqueteByDossier(dossier.id).pipe(
        takeUntil(this.destroy$),
        map(enquete => ({ dossierId: dossier.id, numeroDossier: dossier.numeroDossier, hasEnquete: enquete !== null })),
        catchError((err) => {
          // 404 est normal si le dossier n'a pas d'enquête
          if (err.status === 404) {
            return of({ dossierId: dossier.id, numeroDossier: dossier.numeroDossier, hasEnquete: false });
          }
          console.error(`❌ Erreur lors de la vérification de l'enquête pour le dossier ${dossier.id}:`, err);
          return of({ dossierId: dossier.id, numeroDossier: dossier.numeroDossier, hasEnquete: false });
        })
      )
    );
    
    // Exécuter toutes les vérifications en parallèle
    forkJoin(enqueteChecks).subscribe({
      next: (results) => {
        const dossiersAvecEnquete = results.filter(r => r.hasEnquete);
        this.statistiques.nombreDossiersEnquete = dossiersAvecEnquete.length;
        
        console.log(`✅ Vérification terminée: ${dossiersAvecEnquete.length} dossiers avec enquête sur ${results.length} vérifiés`);
        dossiersAvecEnquete.forEach(r => {
          console.log(`  ✅ Dossier ${r.dossierId} (${r.numeroDossier}) a une enquête`);
        });
        
        // Si on a vérifié moins de dossiers que le total, estimer le nombre total
        if (dossiersToCheck.length < dossiers.length) {
          const ratio = dossiersAvecEnquete.length / dossiersToCheck.length;
          const estimation = Math.round(ratio * dossiers.length);
          console.log(`📊 Estimation: ${estimation} dossiers avec enquête sur ${dossiers.length} total (basé sur ${dossiersToCheck.length} vérifiés)`);
          // On peut utiliser l'estimation ou garder le nombre vérifié
          // Pour l'instant, on garde le nombre vérifié pour être précis
        }
      },
      error: (err) => {
        console.error('❌ Erreur lors de la vérification des enquêtes:', err);
        this.statistiques.nombreDossiersEnquete = 0;
      }
    });
  }

  /**
   * Charge les statistiques des factures
   */
  loadStatistiquesFactures(): void {
    console.log('📊 Début du chargement des statistiques de factures...');
    
    // Récupérer toutes les factures
    this.factureService.getAllFactures().pipe(
      takeUntil(this.destroy$),
      catchError((err) => {
        console.error('❌ Erreur lors du chargement des factures:', err);
        return of([]);
      })
    ).subscribe({
      next: (factures) => {
        console.log('✅ Factures reçues:', factures.length);

        // Factures émises
        this.statistiques.nombreFacturesEmises = factures.filter(f => f.statut !== 'BROUILLON').length;

        // Factures payées
        this.statistiques.nombreFacturesPayees = factures.filter(f => f.statut === 'PAYEE').length;

        // Montant des factures en attente (non payées)
        const facturesEnAttente = factures.filter(f => f.statut !== 'PAYEE' && f.statut !== 'BROUILLON');
        this.statistiques.montantFacturesEnAttente = facturesEnAttente.reduce(
          (sum, f) => sum + (f.montantTTC || 0), 0
        );

        console.log('✅ Statistiques factures:', {
          emises: this.statistiques.nombreFacturesEmises,
          payees: this.statistiques.nombreFacturesPayees,
          enAttente: this.statistiques.montantFacturesEnAttente
        });
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des statistiques de factures:', err);
        this.snackBar.open('Erreur lors du chargement des statistiques de factures', 'Fermer', { duration: 5000 });
      }
    });
  }


  loadFacturesEnAttente(): void {
    this.financeService.getFacturesEnAttente().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (factures) => {
        this.facturesEnAttente = factures;
        
        // ✅ Plus besoin de charger les dossiers séparément car numeroDossier est déjà dans le DTO
        // On peut garder loadDossiersInfo pour d'autres usages si nécessaire, mais ce n'est plus critique
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des factures en attente:', err);
      }
    });
  }

  /**
   * Naviguer vers la page de validation des tarifs
   */
  validerTarifs(dossierId: number | null | undefined): void {
    if (!dossierId) {
      this.snackBar.open('Dossier ID manquant - Impossible d\'accéder à la validation des tarifs', 'Fermer', { duration: 3000 });
      return;
    }
    this.router.navigate(['/finance/validation-tarifs', dossierId]);
  }

  /**
   * Voir le détail de la facture
   */
  voirDetail(dossierId: number | null | undefined): void {
    if (!dossierId) {
      this.snackBar.open('Dossier ID manquant - Impossible d\'afficher les détails', 'Fermer', { duration: 3000 });
      return;
    }
    this.router.navigate(['/finance/dossier', dossierId, 'facture']);
  }

  /**
   * Finaliser la facture
   */
  finaliserFacture(dossierId: number | null | undefined): void {
    if (!dossierId) {
      this.snackBar.open('Dossier ID manquant - Impossible de finaliser', 'Fermer', { duration: 3000 });
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir finaliser cette facture ?')) {
      this.financeService.finaliserFacture(dossierId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.snackBar.open('Facture finalisée avec succès', 'Fermer', { duration: 3000 });
          this.loadFacturesEnAttente();
        },
        error: (err) => {
          console.error('❌ Erreur lors de la finalisation:', err);
          const errorMessage = err.error?.message || err.message || 'Erreur lors de la finalisation';
          this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
        }
      });
    }
  }

  loadFraisEnAttente(): void {
    this.fluxFraisService.getFluxFraisEnAttente().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (frais) => {
        this.fraisEnAttente = frais;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des frais en attente:', err);
      }
    });
  }

  loadFacturesEnRetard(): void {
    this.factureService.getFacturesEnRetard().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (factures) => {
        this.facturesEnRetard = factures;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des factures en retard:', err);
      }
    });
  }

  validerFrais(fraisId: number): void {
    this.fluxFraisService.validerFrais(fraisId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Frais validé avec succès', 'Fermer', { duration: 3000 });
        this.loadDashboard();
      },
      error: (err) => {
        this.error = 'Erreur lors de la validation du frais';
        console.error(err);
        this.snackBar.open(this.error, 'Fermer', { duration: 5000 });
      }
    });
  }

  rejeterFrais(fraisId: number): void {
    const motif = prompt('Motif du rejet :');
    if (motif) {
      this.fluxFraisService.rejeterFrais(fraisId, { commentaire: motif }).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.snackBar.open('Frais rejeté avec succès', 'Fermer', { duration: 3000 });
          this.loadDashboard();
        },
        error: (err) => {
          this.error = 'Erreur lors du rejet du frais';
          console.error(err);
          this.snackBar.open(this.error, 'Fermer', { duration: 5000 });
        }
      });
    }
  }

  relancerFacture(factureId: number): void {
    this.factureService.relancerFacture(factureId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Relance envoyée avec succès', 'Fermer', { duration: 3000 });
        this.loadFacturesEnRetard();
      },
      error: (err) => {
        console.error('❌ Erreur lors de la relance:', err);
        this.snackBar.open('Erreur lors de la relance', 'Fermer', { duration: 5000 });
      }
    });
  }

  calculerTotal(finance: Finance): number {
    return (finance.fraisCreationDossier || 0) +
           (finance.fraisGestionDossier || 0) * (finance.dureeGestionMois || 0) +
           (finance.coutActionsAmiable || 0) +
           (finance.coutActionsJuridique || 0) +
           (finance.fraisAvocat || 0) +
           (finance.fraisHuissier || 0);
  }

  /**
   * Obtenir le numéro de dossier
   */
  getDossierNumero(finance: Finance): string {
    if (finance.numeroDossier) {
      return finance.numeroDossier;
    }
    
    const dossierId = finance.dossierId;
    if (dossierId) {
      return `#${dossierId}`;
    }
    
    return 'N/A';
  }

  getTotalFacture(finance: Finance): number {
    return this.calculerTotal(finance);
  }
}

