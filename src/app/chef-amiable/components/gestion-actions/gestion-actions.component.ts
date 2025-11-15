import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChefAmiableService } from '../../services/chef-amiable.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { TypeAction, ReponseDebiteur } from '../../../shared/models';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/dialogs/confirmation-dialog/confirmation-dialog.component';

interface DossierAvecActions {
  id?: number;
  numeroDossier: string;
  nomCreancier: string;
  nomDebiteur: string;
  actions?: any[];
}

@Component({
  selector: 'app-gestion-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule],
  templateUrl: './gestion-actions.component.html',
  styleUrls: ['./gestion-actions.component.scss']
})
export class GestionActionsComponent implements OnInit, OnDestroy {
  dossiers: DossierAvecActions[] = [];
  dossierSelectionne: DossierAvecActions | null = null;
  numeroDossierRecherche: string = '';
  searchTerm: string = '';
  showAffectationForm: boolean = false;
  loading: boolean = false;
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
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

  constructor(
    private chefAmiableService: ChefAmiableService,
    private dossierApiService: DossierApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Configuration du debounce pour la recherche
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.rechercherDossier();
    });
  }

  ngOnInit(): void {
    this.loadDossiers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  loadDossiers(): void {
    this.loading = true;
    // Utiliser une taille raisonnable pour éviter les erreurs backend
    this.dossierApiService.getDossiersRecouvrementAmiable(0, 50).subscribe({
      next: (page) => {
        // Convertir DossierApi en DossierAvecActions
        this.dossiers = page.content.map((dossier: DossierApi) => {
          // Gérer les noms de créancier (personne physique ou morale)
          let nomCreancier = 'N/A';
          if (dossier.creancier) {
            const typeCreancier = (dossier.creancier as any).typeCreancier;
            if (typeCreancier === 'PERSONNE_MORALE') {
              // Pour une personne morale, le champ 'nom' contient la raison sociale
              nomCreancier = dossier.creancier.nom || 'N/A';
            } else if (dossier.creancier.prenom && dossier.creancier.nom) {
              // Pour une personne physique, combiner prénom et nom
              nomCreancier = `${dossier.creancier.prenom} ${dossier.creancier.nom}`;
            } else if (dossier.creancier.nom) {
              nomCreancier = dossier.creancier.nom;
            }
          }
          
          // Gérer les noms de débiteur (personne physique ou morale)
          let nomDebiteur = 'N/A';
          if (dossier.debiteur) {
            const typeDebiteur = (dossier.debiteur as any).typeDebiteur;
            if (typeDebiteur === 'PERSONNE_MORALE') {
              // Pour une personne morale, le champ 'nom' contient la raison sociale
              nomDebiteur = dossier.debiteur.nom || 'N/A';
            } else if (dossier.debiteur.prenom && dossier.debiteur.nom) {
              // Pour une personne physique, combiner prénom et nom
              nomDebiteur = `${dossier.debiteur.prenom} ${dossier.debiteur.nom}`;
            } else if (dossier.debiteur.nom) {
              nomDebiteur = dossier.debiteur.nom;
            }
          }
          
          return {
            id: dossier.id,
            numeroDossier: dossier.numeroDossier || `DOS-${dossier.id}`,
            nomCreancier: nomCreancier,
            nomDebiteur: nomDebiteur,
            actions: dossier.actions || [] // Si les actions sont disponibles dans DossierApi
          };
        });
        this.loading = false;
        console.log('✅ Dossiers affectés au recouvrement amiable chargés:', this.dossiers.length);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des dossiers:', error);
        this.snackBar.open('Erreur lors du chargement des dossiers', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      }
    });
  }

  selectionnerDossier(dossier: DossierAvecActions): void {
    this.dossierSelectionne = dossier;
  }

  rechercherDossier(): void {
    const searchTerm = this.searchTerm || this.numeroDossierRecherche;
    if (searchTerm.trim()) {
      const dossier = this.dossiers.find(d => 
        d.numeroDossier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.nomCreancier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.nomDebiteur.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (dossier) {
        this.dossierSelectionne = dossier;
        // Scroll vers le dossier sélectionné
        setTimeout(() => {
          const element = document.querySelector(`[data-dossier-id="${dossier.id}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        this.snackBar.open('Aucun dossier trouvé avec ce critère de recherche', 'Fermer', {
          duration: 3000,
          panelClass: ['warning-snackbar']
        });
      }
    }
  }

  affecterAuJuridique(): void {
    if (this.dossierSelectionne && this.dossierSelectionne.id) {
      const dialogData: ConfirmationDialogData = {
        title: 'Affecter au Recouvrement Juridique',
        message: `Êtes-vous sûr de vouloir affecter le dossier ${this.dossierSelectionne.numeroDossier} au recouvrement juridique ? Cette action est irréversible.`,
        confirmText: 'Affecter',
        cancelText: 'Annuler',
        warning: true
      };

      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: dialogData,
        width: '400px'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loading = true;
          this.dossierApiService.affecterAuRecouvrementJuridique(this.dossierSelectionne!.id!).subscribe({
            next: (dossier) => {
              this.snackBar.open('Dossier affecté au recouvrement juridique avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.showAffectationForm = false;
              this.numeroDossierRecherche = '';
              this.searchTerm = '';
              this.dossierSelectionne = null;
              this.loadDossiers(); // Recharger la liste
            },
            error: (error) => {
              console.error('❌ Erreur lors de l\'affectation au juridique:', error);
              let errorMessage = 'Erreur lors de l\'affectation au juridique';
              if (error.error?.message) {
                errorMessage = error.error.message;
              } else if (error.message) {
                errorMessage = error.message;
              }
              this.snackBar.open(errorMessage, 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              this.loading = false;
            }
          });
        }
      });
    } else {
      this.snackBar.open('Veuillez sélectionner un dossier', 'Fermer', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  cloturerDossier(): void {
    if (this.dossierSelectionne && this.dossierSelectionne.id) {
      const dialogData: ConfirmationDialogData = {
        title: 'Clôturer le Dossier',
        message: `Êtes-vous sûr de vouloir clôturer le dossier ${this.dossierSelectionne.numeroDossier} ? Cette action est irréversible et le dossier ne pourra plus être modifié.`,
        confirmText: 'Clôturer',
        cancelText: 'Annuler',
        warning: true
      };

      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: dialogData,
        width: '400px'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loading = true;
          this.dossierApiService.cloturerDossier(this.dossierSelectionne!.id!).subscribe({
            next: (dossier) => {
              this.snackBar.open('Dossier clôturé avec succès', 'Fermer', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.showAffectationForm = false;
              this.numeroDossierRecherche = '';
              this.searchTerm = '';
              this.dossierSelectionne = null;
              this.loadDossiers(); // Recharger la liste
            },
            error: (error) => {
              console.error('❌ Erreur lors de la clôture:', error);
              let errorMessage = 'Erreur lors de la clôture du dossier';
              if (error.error?.message) {
                errorMessage = error.error.message;
              } else if (error.message) {
                errorMessage = error.message;
              }
              this.snackBar.open(errorMessage, 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              this.loading = false;
            }
          });
        }
      });
    } else {
      this.snackBar.open('Veuillez sélectionner un dossier', 'Fermer', {
        duration: 3000,
        panelClass: ['warning-snackbar']
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
    if (!this.dossierSelectionne || !this.dossierSelectionne.actions) return 0;
    return this.dossierSelectionne.actions.reduce((total, action) => total + (action.nbOccurrences * action.coutUnitaire), 0);
  }

  getPositiveResponses(): number {
    if (!this.dossierSelectionne || !this.dossierSelectionne.actions) return 0;
    return this.dossierSelectionne.actions.filter(a => a.reponseDebiteur === ReponseDebiteur.POSITIVE).length;
  }

  getNegativeResponses(): number {
    if (!this.dossierSelectionne || !this.dossierSelectionne.actions) return 0;
    return this.dossierSelectionne.actions.filter(a => a.reponseDebiteur === ReponseDebiteur.NEGATIVE).length;
  }
}
