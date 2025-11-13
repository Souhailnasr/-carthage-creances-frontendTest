import { Component, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { finalize, catchError } from 'rxjs/operators';
import { throwError, of } from 'rxjs';
import { EnqueteService } from '../../../core/services/enquete.service';
import { ValidationEnqueteService } from '../../../core/services/validation-enquete.service';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { Enquette, ValidationEnquete, StatutValidation } from '../../../shared/models';
import { Role, ValidationStatut } from '../../../shared/models/enums.model';
import { RejetEnqueteDialogComponent } from '../dialogs/rejet-enquete-dialog/rejet-enquete-dialog.component';
import { ValidationEnqueteDialogComponent } from '../dialogs/validation-enquete-dialog/validation-enquete-dialog.component';
import { ConfirmDeleteEnqueteDialogComponent } from '../dialogs/confirm-delete-enquete-dialog/confirm-delete-enquete-dialog.component';

@Component({
  selector: 'app-enquete-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  templateUrl: './enquete-details.component.html',
  styleUrls: ['./enquete-details.component.scss']
})
export class EnqueteDetailsComponent implements OnInit {
  enquete: Enquette | null = null;
  validations: ValidationEnquete[] = [];
  loading = false;
  currentUser: any = null;
  isDialog = false;
  enqueteId: number | null = null;
  
  // Exposer les enums pour l'utiliser dans le template
  StatutValidation = StatutValidation;
  ValidationStatut = ValidationStatut;
  Role = Role;

  constructor(
    private enqueteService: EnqueteService,
    private validationEnqueteService: ValidationEnqueteService,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    @Optional() public dialogRef: MatDialogRef<EnqueteDetailsComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: { enqueteId: number }
  ) {
    this.isDialog = !!dialogRef;
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Déterminer l'ID de l'enquête selon le contexte (dialog ou route)
    if (this.isDialog && this.data) {
      this.enqueteId = this.data.enqueteId;
      console.log('📥 ID reçu depuis dialog:', this.enqueteId);
    } else {
      const id = this.route.snapshot.paramMap.get('id');
      this.enqueteId = id ? Number(id) : null;
      console.log('📥 ID reçu depuis route:', this.enqueteId);
    }

    if (this.enqueteId) {
      console.log('✅ ID d\'enquête valide, chargement...');
      this.loadEnquete();
      // loadValidations() sera appelé après le chargement réussi de l'enquête
    } else {
      console.error('❌ ID d\'enquête manquant');
      this.snackBar.open('ID d\'enquête manquant', 'Fermer', { duration: 3000 });
    }
  }

  loadEnquete(): void {
    if (!this.enqueteId) {
      console.error('❌ ID d\'enquête manquant');
      this.snackBar.open('ID d\'enquête manquant', 'Fermer', { duration: 3000 });
      return;
    }
    
    console.log('📤 Chargement de l\'enquête:', this.enqueteId);
    this.loading = true;
    
    this.enqueteService.getEnqueteById(this.enqueteId)
      .pipe(
        finalize(() => this.loading = false),
        catchError(error => {
          console.error('❌ Erreur lors du chargement de l\'enquête:', error);
          const message = error.error?.message || 'Erreur lors du chargement de l\'enquête';
          this.snackBar.open(message, 'Fermer', { duration: 5000 });
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (enquete) => {
          console.log('✅ Enquête chargée:', enquete);
          this.enquete = enquete;
          // Charger les validations seulement après que l'enquête soit chargée
          this.loadValidations();
        },
        error: (error) => {
          console.error('❌ Erreur dans le subscribe:', error);
          // Si l'enquête n'existe plus (404) ou erreur serveur (500), afficher un message approprié
          if (error.status === 404 || error.status === 500) {
            const message = error.status === 404 
              ? 'Cette enquête n\'existe plus ou a été supprimée'
              : 'Erreur serveur lors du chargement de l\'enquête. Elle a peut-être été supprimée.';
            this.snackBar.open(message, 'Fermer', { duration: 5000 });
            // Si c'est un dialog, on peut le fermer automatiquement
            if (this.isDialog && this.dialogRef) {
              setTimeout(() => {
                this.dialogRef.close();
              }, 2000);
            }
          }
        }
      });
  }

  loadValidations(): void {
    if (!this.enqueteId) return;
    
    // Ne charger les validations que si l'enquête existe
    if (!this.enquete) {
      console.warn('⚠️ Enquête non chargée, impossible de charger les validations');
      return;
    }
    
    this.validationEnqueteService.getValidationsByEnquete(this.enqueteId)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des validations:', error);
          // Si l'erreur est 404 ou 500, c'est probablement que l'enquête n'existe plus
          // Ne pas propager l'erreur, juste logger
          if (error.status === 404 || error.status === 500) {
            console.warn('⚠️ Impossible de charger les validations, l\'enquête a peut-être été supprimée');
            return of([]);
          }
          return throwError(() => error);
        })
      )
      .subscribe(validations => {
        this.validations = validations || [];
      });
  }

  canEdit(): boolean {
    if (!this.enquete || !this.currentUser) return false;
    return !this.enquete.valide && 
           this.currentUser.id === this.enquete.agentCreateur?.id?.toString();
  }

  canRequestValidation(): boolean {
    if (!this.enquete || !this.currentUser) return false;
    // Vérifier qu'il n'y a pas déjà une validation en attente
    return !this.validations.some(v => v.statut === StatutValidation.EN_ATTENTE);
  }

  /**
   * Vérifie si l'utilisateur peut valider/rejeter l'enquête
   * Conditions:
   * - L'enquête doit avoir le statut EN_ATTENTE_VALIDATION
   * - L'utilisateur doit être un chef
   * - L'utilisateur ne doit pas être le créateur de l'enquête
   */
  canValidate(): boolean {
    if (!this.enquete || !this.currentUser) return false;
    
    const isChef = this.currentUser?.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER || 
                   this.currentUser?.roleUtilisateur === Role.SUPER_ADMIN;
    const statut = this.enquete?.statut;
    const isEnAttente = statut === ValidationStatut.EN_ATTENTE_VALIDATION || 
                        statut === 'EN_ATTENTE_VALIDATION';
    const isNotCreator = this.enquete?.agentCreateur?.id?.toString() !== this.currentUser?.id?.toString();
    
    return isChef && isEnAttente && isNotCreator;
  }

  /**
   * Vérifie si l'utilisateur peut supprimer l'enquête
   * Conditions:
   * - L'utilisateur est l'agent créateur OU
   * - L'utilisateur est un chef
   */
  canDelete(): boolean {
    if (!this.enquete || !this.currentUser) return false;
    
    // Agent créateur peut supprimer ses propres enquêtes
    const agentId = this.enquete.agentCreateurId || (this.enquete.agentCreateur?.id ? Number(this.enquete.agentCreateur.id) : null);
    if (agentId && this.currentUser.id && Number(this.currentUser.id) === agentId) {
      return true;
    }
    
    // Chef peut supprimer n'importe quelle enquête
    const userRole = this.currentUser.roleUtilisateur;
    return userRole === Role.CHEF_DEPARTEMENT_DOSSIER || userRole === Role.SUPER_ADMIN;
  }

  /**
   * Confirme et supprime l'enquête
   */
  confirmDeleteEnquete(): void {
    if (!this.enquete?.id) {
      this.snackBar.open('Erreur: ID d\'enquête manquant', 'Fermer', { duration: 3000 });
      return;
    }

    const rapportCode = this.enquete.rapportCode || `ID ${this.enquete.id}`;
    
    const dialogRef = this.dialog.open(ConfirmDeleteEnqueteDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l\'enquête',
        message: `Êtes-vous sûr de vouloir supprimer l'enquête ${rapportCode} ?`,
        details: 'Cette action supprimera également toutes les validations associées. Cette action est irréversible.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // Afficher un indicateur de chargement
        const loadingSnackBar = this.snackBar.open('Suppression en cours...', '', {
          duration: 0 // Ne pas fermer automatiquement
        });
        
        this.loading = true;
        
        this.enqueteService.deleteEnquete(this.enquete!.id!)
          .pipe(
            finalize(() => {
              this.loading = false;
              loadingSnackBar.dismiss(); // Fermer l'indicateur de chargement
            })
          )
          .subscribe({
            next: (result) => {
              if (result === 'success') {
                // ✅ Suppression réussie : afficher le message et fermer/naviguer
                console.log('✅ Enquête supprimée avec succès du backend');
                this.snackBar.open(
                  'Enquête supprimée avec succès. Les validations associées ont également été supprimées.', 
                  'Fermer', 
                  { 
                    duration: 5000,
                    panelClass: ['success-snackbar']
                  }
                );
                
                // Si c'est un dialog, le fermer
                if (this.isDialog && this.dialogRef) {
                  setTimeout(() => {
                    this.dialogRef.close();
                  }, 1000);
                } else {
                  // Sinon, naviguer vers la liste
                  this.router.navigate(['/enquetes']);
                }
              } else {
                // Le backend a retourné un message d'erreur
                console.warn('⚠️ Le backend a retourné un message d\'erreur:', result);
                this.snackBar.open(
                  result, 
                  'Fermer', 
                  { 
                    duration: 7000,
                    panelClass: ['error-snackbar']
                  }
                );
                // Ne pas fermer le dialog, l'enquête est toujours là
              }
            },
            error: (error) => {
              // Extraire le message d'erreur
              let errorMessage = 'Erreur lors de la suppression de l\'enquête';
              
              if (error.message) {
                errorMessage = error.message;
              } else if (error.error) {
                errorMessage = typeof error.error === 'string' 
                  ? error.error 
                  : error.error.message || errorMessage;
              }
              
              console.error('❌ Erreur lors de la suppression:', errorMessage);
              
              // Afficher le message d'erreur détaillé
              this.snackBar.open(
                errorMessage, 
                'Fermer', 
                { 
                  duration: 7000,
                  panelClass: ['error-snackbar']
                }
              );
              
              // Ne pas fermer le dialog, l'enquête est toujours présente
            }
          });
      }
    });
  }

  /**
   * Valide l'enquête via ValidationEnquete si elle existe, sinon directement
   */
  validerEnquete(): void {
    if (!this.enquete?.id || !this.currentUser?.id) {
      this.snackBar.open('Erreur: Données manquantes', 'Fermer', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ValidationEnqueteDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { enquete: this.enquete }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        const chefId = Number(this.currentUser.id);
        const commentaire = result.commentaire || undefined;
        this.loading = true;
        
        // Chercher une ValidationEnquete existante pour cette enquête
        const validationEnAttente = this.validations.find(v => 
          v.statut === StatutValidation.EN_ATTENTE && 
          (v.enqueteId === this.enquete?.id || v.enquete?.id === this.enquete?.id)
        );
        
        if (validationEnAttente?.id) {
          // Utiliser l'endpoint ValidationEnquete si elle existe
          console.log('📤 Validation via ValidationEnquete:', validationEnAttente.id);
          this.validationEnqueteService.validerEnquete(validationEnAttente.id, chefId, commentaire)
            .pipe(
              finalize(() => this.loading = false),
              catchError(error => {
                console.error('❌ Erreur lors de la validation via ValidationEnquete:', error);
                const message = error.error?.message || error.error?.error || 'Erreur lors de la validation de l\'enquête';
                this.snackBar.open(message, 'Fermer', { duration: 5000 });
                return throwError(() => error);
              })
            )
            .subscribe({
              next: (validation) => {
                console.log('✅ Enquête validée via ValidationEnquete:', validation);
                this.snackBar.open('Enquête validée avec succès', 'Fermer', { duration: 3000 });
                this.loadEnquete(); // Recharger pour avoir les données à jour
                this.loadValidations();
              }
            });
        } else {
          // Utiliser l'endpoint direct de l'enquête
          console.log('📤 Validation directe de l\'enquête (pas de ValidationEnquete)');
          
          if (!this.enquete?.id) {
            this.snackBar.open('Erreur: ID d\'enquête manquant', 'Fermer', { duration: 5000 });
            this.loading = false;
            return;
          }
          
          this.enqueteService.validerEnquete(this.enquete.id, chefId, commentaire)
            .pipe(
              finalize(() => this.loading = false),
              catchError(error => {
                console.error('❌ Erreur lors de la validation:', error);
                
                // Extraire le message d'erreur détaillé
                let errorMessage = error.error?.message || error.error?.error || error.message || 'Erreur lors de la validation de l\'enquête';
                
                // Si le message commence par "Erreur : ", le retirer pour un affichage plus propre
                if (errorMessage.startsWith('Erreur : ')) {
                  errorMessage = errorMessage.substring(9);
                } else if (errorMessage.startsWith('Erreur: ')) {
                  errorMessage = errorMessage.substring(8);
                }
                
                this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
                return throwError(() => error);
              })
            )
            .subscribe({
              next: (enquete) => {
                this.enquete = enquete;
                this.snackBar.open('Enquête validée avec succès', 'Fermer', { duration: 3000 });
                this.loadEnquete(); // Recharger pour avoir les données à jour
                this.loadValidations();
              }
            });
        }
      }
    });
  }

  /**
   * Rejette l'enquête directement (sans passer par ValidationEnquete)
   */
  rejeterEnquete(): void {
    if (!this.enquete?.id) {
      this.snackBar.open('Erreur: ID de l\'enquête manquant', 'Fermer', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(RejetEnqueteDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { enquete: this.enquete }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.commentaire) {
        const commentaire = result.commentaire;
        this.loading = true;
        
        this.enqueteService.rejeterEnquete(this.enquete!.id!, commentaire)
          .pipe(
            finalize(() => this.loading = false),
            catchError(error => {
              console.error('❌ Erreur lors du rejet:', error);
              const message = error.error?.message || 'Erreur lors du rejet de l\'enquête';
              this.snackBar.open(message, 'Fermer', { duration: 5000 });
              return throwError(() => error);
            })
          )
          .subscribe({
            next: (enquete) => {
              this.enquete = enquete;
              this.snackBar.open('Enquête rejetée', 'Fermer', { duration: 3000 });
              this.loadEnquete(); // Recharger pour avoir les données à jour
              this.loadValidations();
            }
          });
      }
    });
  }

  /**
   * Retourne la couleur du badge selon le statut
   */
  getStatutColor(statut: string | undefined): string {
    if (!statut) return '';
    switch (statut) {
      case ValidationStatut.EN_ATTENTE_VALIDATION:
      case 'EN_ATTENTE_VALIDATION':
        return 'warn';
      case ValidationStatut.VALIDE:
      case 'VALIDE':
        return 'primary';
      case ValidationStatut.REJETE:
      case 'REJETE':
        return 'accent';
      case ValidationStatut.EN_COURS:
      case 'EN_COURS':
        return 'primary';
      case ValidationStatut.CLOTURE:
      case 'CLOTURE':
        return '';
      default:
        return '';
    }
  }

  getStatutBadgeClass(statut: StatutValidation): string {
    switch (statut) {
      case StatutValidation.EN_ATTENTE:
        return 'statut-en-attente';
      case StatutValidation.VALIDE:
        return 'statut-valide';
      case StatutValidation.REJETE:
        return 'statut-rejete';
      default:
        return '';
    }
  }

  getStatutClass(statut: string | undefined): string {
    if (!statut) return 'statut-default';
    switch (statut) {
      case 'EN_ATTENTE_VALIDATION':
      case StatutValidation.EN_ATTENTE:
        return 'statut-en-attente';
      case 'VALIDE':
      case StatutValidation.VALIDE:
        return 'statut-valide';
      case 'REJETE':
      case StatutValidation.REJETE:
        return 'statut-rejete';
      case 'EN_COURS':
        return 'statut-en-cours';
      case 'CLOTURE':
        return 'statut-cloture';
      default:
        return 'statut-default';
    }
  }

  getStatutLabel(statut: string | undefined): string {
    if (!statut) return 'Non défini';
    switch (statut) {
      case 'EN_ATTENTE_VALIDATION':
        return 'En Attente de Validation';
      case StatutValidation.EN_ATTENTE:
        return 'En Attente';
      case 'VALIDE':
      case StatutValidation.VALIDE:
        return 'Validée';
      case 'REJETE':
      case StatutValidation.REJETE:
        return 'Rejetée';
      case 'EN_COURS':
        return 'En Cours';
      case 'CLOTURE':
        return 'Clôturée';
      default:
        return statut;
    }
  }

  hasFinancialInfo(): boolean {
    return !!(this.enquete?.nomElementFinancier || 
              this.enquete?.pourcentage !== undefined || 
              this.enquete?.banqueAgence || 
              this.enquete?.banques || 
              this.enquete?.exercices || 
              this.enquete?.chiffreAffaire !== undefined || 
              this.enquete?.resultatNet !== undefined || 
              this.enquete?.disponibiliteBilan);
  }

  hasSolvabilityInfo(): boolean {
    return !!(this.enquete?.appreciationBancaire || 
              this.enquete?.paiementsCouverture || 
              this.enquete?.reputationCommerciale || 
              this.enquete?.incidents);
  }

  hasPatrimoineInfo(): boolean {
    return !!(this.enquete?.bienImmobilier || 
              this.enquete?.situationJuridiqueImmobilier || 
              this.enquete?.bienMobilier || 
              this.enquete?.situationJuridiqueMobilier);
  }

  hasCompanyInfo(): boolean {
    return !!(this.enquete?.registreCommerce || 
              this.enquete?.codeDouane || 
              this.enquete?.matriculeFiscale || 
              this.enquete?.formeJuridique || 
              this.enquete?.capital !== undefined || 
              this.enquete?.secteurActivite || 
              this.enquete?.descriptionActivite || 
              this.enquete?.effectif !== undefined || 
              this.enquete?.email);
  }

  hasDirigeantsInfo(): boolean {
    return !!(this.enquete?.pdg || 
              this.enquete?.directeurAdjoint || 
              this.enquete?.directeurFinancier || 
              this.enquete?.directeurCommercial);
  }

  hasDecisionInfo(): boolean {
    return !!(this.enquete?.decisionComite || 
              this.enquete?.visaDirecteurJuridique || 
              this.enquete?.visaEnqueteur || 
              this.enquete?.visaDirecteurCommercial);
  }

  hasOtherInfo(): boolean {
    return !!(this.enquete?.autresAffaires || 
              this.enquete?.observations || 
              this.enquete?.marques || 
              this.enquete?.groupe);
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return date;
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}

