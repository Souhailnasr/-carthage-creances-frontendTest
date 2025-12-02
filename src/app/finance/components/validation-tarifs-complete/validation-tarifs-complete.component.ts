import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FinanceService } from '../../../core/services/finance.service';
import { ToastService } from '../../../core/services/toast.service';
import { 
  TraitementsDossierDTO, 
  ValidationEtatDTO,
  StatutTarif 
} from '../../../shared/models/finance.models';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ValidationTarifsCreationComponent } from '../validation-tarifs-creation/validation-tarifs-creation.component';
import { ValidationTarifsEnqueteComponent } from '../validation-tarifs-enquete/validation-tarifs-enquete.component';
import { ValidationTarifsAmiableComponent } from '../validation-tarifs-amiable/validation-tarifs-amiable.component';
import { ValidationTarifsJuridiqueComponent } from '../validation-tarifs-juridique/validation-tarifs-juridique.component';

@Component({
  selector: 'app-validation-tarifs-complete',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ValidationTarifsCreationComponent,
    ValidationTarifsEnqueteComponent,
    ValidationTarifsAmiableComponent,
    ValidationTarifsJuridiqueComponent
  ],
  templateUrl: './validation-tarifs-complete.component.html',
  styleUrls: ['./validation-tarifs-complete.component.scss']
})
export class ValidationTarifsCompleteComponent implements OnInit, OnDestroy {
  dossierId!: number;
  traitements!: TraitementsDossierDTO;
  validationEtat!: ValidationEtatDTO;
  isLoading = false;
  
  // Totaux calculés
  totalCreation = 0;
  totalEnquete = 0;
  totalAmiable = 0;
  totalCommissionsAmiable = 0;
  totalJuridique = 0;
  totalCommissionsJuridique = 0;
  totalHT = 0;
  tva = 0;
  totalTTC = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private financeService: FinanceService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    console.log('🔍 ValidationTarifsCompleteComponent - ngOnInit');
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      console.log('📋 Paramètres de route:', params);
      this.dossierId = +params['dossierId'] || +params['id'];
      console.log('📋 Dossier ID extrait:', this.dossierId);
      if (this.dossierId && !isNaN(this.dossierId)) {
        console.log('✅ Dossier ID valide, chargement des données...');
        this.loadTraitements();
        this.loadValidationEtat();
      } else {
        console.error('❌ Dossier ID invalide:', this.dossierId);
        this.toastService.error('ID de dossier invalide');
      }
    });
    
    // Vérifier aussi les query params au cas où
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(queryParams => {
      console.log('📋 Query params:', queryParams);
      if (!this.dossierId && queryParams['dossierId']) {
        this.dossierId = +queryParams['dossierId'];
        if (this.dossierId && !isNaN(this.dossierId)) {
          this.loadTraitements();
          this.loadValidationEtat();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTraitements(): void {
    console.log('📊 Chargement des traitements pour le dossier:', this.dossierId);
    this.isLoading = true;
    this.financeService.getTraitementsDossier(this.dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (traitements) => {
          console.log('✅ Traitements chargés:', traitements);
          this.traitements = traitements;
          this.calculerTotaux();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des traitements:', error);
          console.error('❌ Détails de l\'erreur:', error.error);
          this.toastService.error('Erreur lors du chargement des traitements. Vérifiez la console pour plus de détails.');
          this.isLoading = false;
          // Initialiser avec des valeurs vides pour éviter les erreurs
          this.traitements = {
            phaseCreation: { traitements: [] },
            phaseEnquete: { 
              enquetePrecontentieuse: { 
                type: 'ENQUETE_PRECONTENTIEUSE', 
                date: new Date(), 
                statut: 'NON_VALIDE' 
              }, 
              traitementsPossibles: [] 
            },
            phaseAmiable: { actions: [] },
            phaseJuridique: { documentsHuissier: [], actionsHuissier: [], audiences: [] }
          };
        }
      });
  }

  loadValidationEtat(): void {
    this.financeService.getValidationEtat(this.dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (etat) => {
          console.log('📊 État de validation chargé:', etat);
          console.log('📊 Statut global:', etat.statutGlobal);
          console.log('📊 Peut générer facture:', etat.peutGenererFacture);
          console.log('📊 Détails par phase:', etat.phases);
          this.validationEtat = etat;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement de l\'état de validation:', error);
        }
      });
  }

  onTarifValide(): void {
    // Recharger les données après validation d'un tarif
    this.loadTraitements();
    this.loadValidationEtat();
  }

  calculerTotaux(): void {
    // Phase Création
    this.totalCreation = this.traitements.phaseCreation?.traitements
      ?.filter(t => t.tarifExistant?.statut === StatutTarif.VALIDE)
      .reduce((sum, t) => sum + (t.fraisFixe || t.tarifExistant?.montantTotal || 0), 0) || 0;

    // Phase Enquête
    const fraisEnqueteFixe = this.traitements.phaseEnquete?.enquetePrecontentieuse?.tarifExistant?.statut === StatutTarif.VALIDE
      ? (this.traitements.phaseEnquete.enquetePrecontentieuse.fraisFixe || 0)
      : 0;
    const fraisEnqueteVariables = this.traitements.phaseEnquete?.traitementsPossibles
      ?.filter(t => t.tarifExistant?.statut === StatutTarif.VALIDE)
      .reduce((sum, t) => sum + (t.tarifExistant?.montantTotal || 0), 0) || 0;
    this.totalEnquete = fraisEnqueteFixe + fraisEnqueteVariables;

    // Phase Amiable
    this.totalAmiable = this.traitements.phaseAmiable?.actions
      ?.filter(a => a.tarifExistant?.statut === StatutTarif.VALIDE)
      .reduce((sum, a) => sum + (a.tarifExistant?.montantTotal || 0), 0) || 0;
    this.totalCommissionsAmiable = this.traitements.phaseAmiable?.commissions
      ?.filter(c => c.tarifExistant?.statut === StatutTarif.VALIDE)
      .reduce((sum, c) => sum + (c.montant || 0), 0) || 0;

    // Phase Juridique
    const fraisDocuments = this.traitements.phaseJuridique?.documentsHuissier
      ?.filter(d => d.tarifExistant?.statut === StatutTarif.VALIDE)
      .reduce((sum, d) => sum + (d.tarifExistant?.montantTotal || 0), 0) || 0;
    const fraisActions = this.traitements.phaseJuridique?.actionsHuissier
      ?.filter(a => a.tarifExistant?.statut === StatutTarif.VALIDE)
      .reduce((sum, a) => sum + (a.tarifExistant?.montantTotal || 0), 0) || 0;
    const fraisAudiences = this.traitements.phaseJuridique?.audiences
      ?.filter(a => a.tarifAudience?.statut === StatutTarif.VALIDE)
      .reduce((sum, a) => sum + (a.tarifAudience?.montantTotal || 0), 0) || 0;
    const fraisAvocats = this.traitements.phaseJuridique?.audiences
      ?.filter(a => a.tarifAvocat?.statut === StatutTarif.VALIDE)
      .reduce((sum, a) => sum + (a.tarifAvocat?.montantTotal || 0), 0) || 0;
    const fraisFixes = this.traitements.phaseJuridique?.fraisFixes
      ?.filter(f => f.tarifExistant?.statut === StatutTarif.VALIDE)
      .reduce((sum, f) => sum + (f.montant || 0), 0) || 0;
    this.totalJuridique = fraisDocuments + fraisActions + fraisAudiences + fraisAvocats + fraisFixes;
    this.totalCommissionsJuridique = this.traitements.phaseJuridique?.commissions
      ?.filter(c => c.tarifExistant?.statut === StatutTarif.VALIDE)
      .reduce((sum, c) => sum + (c.montant || 0), 0) || 0;

    // Totaux
    this.totalHT = this.totalCreation + this.totalEnquete + this.totalAmiable + 
                   this.totalCommissionsAmiable + this.totalJuridique + this.totalCommissionsJuridique;
    this.tva = this.totalHT * 0.19;
    this.totalTTC = this.totalHT + this.tva;
  }

  genererFacture(): void {
    console.log('🔍 Tentative de génération de facture pour le dossier:', this.dossierId);
    console.log('🔍 État de validation:', this.validationEtat);
    console.log('🔍 Peut générer facture:', this.validationEtat?.peutGenererFacture);
    
    if (!this.validationEtat?.peutGenererFacture) {
      // Afficher un message détaillé sur les tarifs en attente
      const phasesEnAttente: string[] = [];
      if (this.validationEtat?.phases) {
        Object.keys(this.validationEtat.phases).forEach(phase => {
          const phaseEtat = this.validationEtat.phases[phase];
          if (phaseEtat.statut !== 'VALIDE') {
            phasesEnAttente.push(`${phase}: ${phaseEtat.tarifsValides}/${phaseEtat.tarifsTotal} validés`);
          }
        });
      }
      const message = phasesEnAttente.length > 0
        ? `Tous les tarifs doivent être validés avant de générer la facture.\n\nTarifs en attente:\n${phasesEnAttente.join('\n')}`
        : 'Tous les tarifs doivent être validés avant de générer la facture';
      this.toastService.warning(message);
      return;
    }

    const confirmed = confirm(`Générer la facture pour le dossier #${this.dossierId} ?\n\nTotal TTC: ${this.totalTTC.toFixed(2)} TND`);
    if (!confirmed) {
      return;
    }

    this.isLoading = true;
    this.financeService.genererFacture(this.dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (factureDetail) => {
          console.log('✅ Facture générée avec succès:', factureDetail);
          this.toastService.success('Facture générée avec succès !');
          this.router.navigate(['/finance/factures', factureDetail.facture.id]);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors de la génération de la facture:', error);
          console.error('❌ Détails de l\'erreur:', error.error);
          const errorMessage = error.error?.message || error.message || 'Erreur lors de la génération de la facture';
          this.toastService.error(errorMessage);
          this.isLoading = false;
        }
      });
  }

  getIndicateurClass(): string {
    if (this.validationEtat?.peutGenererFacture) {
      return 'indicateur-ok';
    }
    return 'indicateur-attente';
  }

  getIndicateurIcon(): string {
    if (this.validationEtat?.peutGenererFacture) {
      return 'check_circle';
    }
    return 'schedule';
  }

  getIndicateurMessage(): string {
    if (this.validationEtat?.peutGenererFacture) {
      return '✅ Tous les tarifs sont validés';
    }
    const totalEnAttente = Object.values(this.validationEtat?.phases || {})
      .reduce((sum, phase) => sum + (phase.tarifsTotal - phase.tarifsValides), 0);
    return `⏳ ${totalEnAttente} tarif(s) en attente de validation`;
  }

  retour(): void {
    this.router.navigate(['/finance/dashboard']);
  }
}

