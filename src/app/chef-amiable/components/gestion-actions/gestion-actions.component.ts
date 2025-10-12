import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChefAmiableService } from '../../services/chef-amiable.service';
import { TypeAction, ReponseDebiteur } from '../../../shared/models';

interface DossierAvecActions {
  numeroDossier: string;
  nomCreancier: string;
  nomDebiteur: string;
  actions: any[];
}

@Component({
  selector: 'app-gestion-actions',
  templateUrl: './gestion-actions.component.html',
  styleUrls: ['./gestion-actions.component.scss']
})
export class GestionActionsComponent implements OnInit {
  dossiers: DossierAvecActions[] = [];
  dossierSelectionne: DossierAvecActions | null = null;
  numeroDossierRecherche: string = '';
  showAffectationForm: boolean = false;
  
  // Types d'actions disponibles
  typesActions = [
    { value: TypeAction.APPEL, label: 'Appel' },
    { value: TypeAction.EMAIL, label: 'Email' },
    { value: TypeAction.VISITE, label: 'Visite' },
    { value: TypeAction.LETTRE, label: 'Lettre' },
    { value: TypeAction.AUTRE, label: 'Autre' }
  ];

  // Réponses débiteur
  reponsesDebiteur = [
    { value: ReponseDebiteur.POSITIVE, label: 'POSITIVE' },
    { value: ReponseDebiteur.NEGATIVE, label: 'NEGATIVE' },
    { value: ReponseDebiteur.EN_ATTENTE, label: 'EN_ATTENTE' }
  ];

  constructor(private chefAmiableService: ChefAmiableService) { }

  ngOnInit(): void {
    this.loadDossiers();
  }

  loadDossiers(): void {
    this.chefAmiableService.getDossiersAvecActions().subscribe(dossiers => {
      this.dossiers = dossiers;
    });
  }

  selectionnerDossier(dossier: DossierAvecActions): void {
    this.dossierSelectionne = dossier;
  }

  rechercherDossier(): void {
    if (this.numeroDossierRecherche.trim()) {
      const dossier = this.dossiers.find(d => 
        d.numeroDossier.toLowerCase().includes(this.numeroDossierRecherche.toLowerCase())
      );
      if (dossier) {
        this.dossierSelectionne = dossier;
      }
    }
  }

  affecterAuJuridique(): void {
    if (this.dossierSelectionne) {
      this.chefAmiableService.affecterAuJuridique(this.dossierSelectionne.numeroDossier).subscribe(success => {
        if (success) {
          alert('Dossier affecté au département juridique avec succès');
          this.showAffectationForm = false;
          this.numeroDossierRecherche = '';
          this.dossierSelectionne = null;
        }
      });
    }
  }

  cloturerDossier(): void {
    if (this.dossierSelectionne) {
      this.chefAmiableService.cloturerDossier(this.dossierSelectionne.numeroDossier).subscribe(success => {
        if (success) {
          alert('Dossier clôturé avec succès');
          this.showAffectationForm = false;
          this.numeroDossierRecherche = '';
          this.dossierSelectionne = null;
        }
      });
    }
  }

  getTypeActionLabel(type: TypeAction): string {
    const typeAction = this.typesActions.find(t => t.value === type);
    return typeAction ? typeAction.label : type;
  }

  getReponseDebiteurLabel(reponse: ReponseDebiteur): string {
    const reponseDebiteur = this.reponsesDebiteur.find(r => r.value === reponse);
    return reponseDebiteur ? reponseDebiteur.label : reponse;
  }

  getReponseClass(reponse: ReponseDebiteur): string {
    switch (reponse) {
      case ReponseDebiteur.POSITIVE:
        return 'reponse-positive';
      case ReponseDebiteur.NEGATIVE:
        return 'reponse-negative';
      case ReponseDebiteur.EN_ATTENTE:
        return 'reponse-attente';
      default:
        return '';
    }
  }

  getFormattedDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
  }

  getFormattedCost(cost: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(cost);
  }

  getTotalCost(): number {
    if (!this.dossierSelectionne) return 0;
    return this.dossierSelectionne.actions.reduce((total, action) => total + (action.nbOccurrences * action.coutUnitaire), 0);
  }

  getPositiveResponses(): number {
    if (!this.dossierSelectionne) return 0;
    return this.dossierSelectionne.actions.filter(a => a.reponseDebiteur === ReponseDebiteur.POSITIVE).length;
  }

  getNegativeResponses(): number {
    if (!this.dossierSelectionne) return 0;
    return this.dossierSelectionne.actions.filter(a => a.reponseDebiteur === ReponseDebiteur.NEGATIVE).length;
  }
}
