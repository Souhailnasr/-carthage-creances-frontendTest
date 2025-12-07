import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActionRecouvrementService, ActionRecouvrement, TypeAction, ReponseDebiteur } from '../../../core/services/action-recouvrement.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

@Component({
  selector: 'app-action-dialog-amiable',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './action-dialog-amiable.component.html',
  styleUrls: ['./action-dialog-amiable.component.scss']
})
export class ActionDialogAmiableComponent implements OnInit {
  actionForm!: FormGroup;
  isEditMode: boolean = false;
  currentUserId: number | null = null;
  
  typeActions = Object.values(TypeAction);
  reponses = [null, ReponseDebiteur.POSITIVE, ReponseDebiteur.NEGATIVE];

  constructor(
    private fb: FormBuilder,
    private actionService: ActionRecouvrementService,
    private dialogRef: MatDialogRef<ActionDialogAmiableComponent>,
    private snackBar: MatSnackBar,
    private jwtAuthService: JwtAuthService,
    @Inject(MAT_DIALOG_DATA) public data: { dossierId: number, action?: ActionRecouvrement }
  ) {
    // Vérifier l'authentification
    if (!this.jwtAuthService.isUserLoggedIn()) {
      this.snackBar.open('Vous devez être connecté', 'Fermer', { duration: 3000 });
      this.dialogRef.close(false);
      return;
    }

    this.currentUserId = this.jwtAuthService.getCurrentUserId();

    this.actionForm = this.fb.group({
      type: ['', Validators.required],
      dateAction: [new Date(), Validators.required],
      nbOccurrences: [1, [Validators.required, Validators.min(1)]],
      coutUnitaire: [0, [Validators.required, Validators.min(0)]],
      reponseDebiteur: [null],
      montantRecouvre: [{ value: null, disabled: true }]
    });
    
    // Gérer l'affichage conditionnel du champ montant recouvré
    this.actionForm.get('reponseDebiteur')?.valueChanges.subscribe(value => {
      const montantControl = this.actionForm.get('montantRecouvre');
      if (value === ReponseDebiteur.POSITIVE) {
        montantControl?.setValidators([Validators.required, Validators.min(0)]);
        montantControl?.enable();
      } else {
        montantControl?.clearValidators();
        montantControl?.setValue(null);
        montantControl?.disable();
      }
      montantControl?.updateValueAndValidity();
    });
    
    if (data.action) {
      this.isEditMode = true;
      this.actionForm.patchValue({
        ...data.action,
        dateAction: new Date(data.action.dateAction)
      });
    }
  }

  ngOnInit(): void {}

  save(): void {
    if (this.actionForm.valid) {
      // Validation des champs requis
      if (!this.actionForm.value.type) {
        this.snackBar.open('Le type d\'action est requis', 'Fermer', { duration: 3000 });
        return;
      }
      
      if (!this.actionForm.value.dateAction) {
        this.snackBar.open('La date de l\'action est requise', 'Fermer', { duration: 3000 });
        return;
      }
      
      if (!this.actionForm.value.nbOccurrences || this.actionForm.value.nbOccurrences < 1) {
        this.snackBar.open('Le nombre d\'occurrences doit être au moins 1', 'Fermer', { duration: 3000 });
        return;
      }
      
      // Formater la date correctement (YYYY-MM-DD)
      const dateValue = this.actionForm.value.dateAction;
      let dateFormatted: string;
      
      if (dateValue instanceof Date) {
        dateFormatted = dateValue.toISOString().split('T')[0];
      } else if (typeof dateValue === 'string') {
        // Si c'est déjà une string, vérifier le format
        if (dateValue.includes('T')) {
          dateFormatted = dateValue.split('T')[0];
        } else if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dateFormatted = dateValue;
        } else {
          // Essayer de parser la date
          const parsedDate = new Date(dateValue);
          if (isNaN(parsedDate.getTime())) {
            this.snackBar.open('Format de date invalide', 'Fermer', { duration: 3000 });
            return;
          }
          dateFormatted = parsedDate.toISOString().split('T')[0];
        }
      } else {
        this.snackBar.open('Format de date invalide', 'Fermer', { duration: 3000 });
        return;
      }
      
      // Valider le nombre d'occurrences
      const nbOccurrences = Number(this.actionForm.value.nbOccurrences);
      if (isNaN(nbOccurrences) || nbOccurrences < 1) {
        this.snackBar.open('Le nombre d\'occurrences doit être un nombre positif', 'Fermer', { duration: 3000 });
        return;
      }
      
      // Valider le coût unitaire
      const coutUnitaire = this.actionForm.value.coutUnitaire 
        ? Number(this.actionForm.value.coutUnitaire) 
        : 0;
      if (isNaN(coutUnitaire) || coutUnitaire < 0) {
        this.snackBar.open('Le coût unitaire doit être un nombre positif ou zéro', 'Fermer', { duration: 3000 });
        return;
      }
      
      const actionData: Partial<ActionRecouvrement> = {
        type: this.actionForm.value.type,
        dateAction: dateFormatted,
        nbOccurrences: nbOccurrences,
        coutUnitaire: coutUnitaire,
        // NE PAS envoyer agentId - le backend ne le reconnaît pas dans ActionRequestDTO
        // Ne pas envoyer reponseDebiteur si c'est null, ou l'envoyer selon les besoins du backend
        ...(this.actionForm.value.reponseDebiteur !== null && 
            this.actionForm.value.reponseDebiteur !== undefined && 
            { reponseDebiteur: this.actionForm.value.reponseDebiteur })
      };

      // Récupérer le montant recouvré si réponse positive
      const montantRecouvre = this.actionForm.value.reponseDebiteur === ReponseDebiteur.POSITIVE 
        ? (this.actionForm.value.montantRecouvre ? Number(this.actionForm.value.montantRecouvre) : null)
        : null;

      console.log('💾 Données du formulaire:', this.actionForm.value);
      console.log('📤 Données à envoyer:', actionData);
      console.log('💰 Montant recouvré:', montantRecouvre);

      // Utiliser createActionWithMontant pour les nouvelles actions avec montant
      if (this.isEditMode) {
        // Mode édition : utiliser updateAction
        this.actionService.updateAction(this.data.action!.id!, actionData).subscribe({
          next: () => {
            this.snackBar.open('Action modifiée avec succès', 'Fermer', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err: any) => {
            this.handleError(err);
          }
        });
      } else if (montantRecouvre != null && montantRecouvre > 0) {
        // Création avec montant : utiliser createActionWithMontant
        this.actionService.createActionWithMontant(this.data.dossierId, actionData, montantRecouvre).subscribe({
          next: (response: { action: ActionRecouvrement; dossier: any; montantUpdated: boolean; error?: any }) => {
            let message = 'Action créée avec succès';
            
            // Si c'est une création avec montant, afficher un message plus détaillé
            if (response.montantUpdated && response.dossier) {
              const montantRestant = response.dossier.montantRestant || 
                                    (response.dossier.montantCreance - (response.dossier.montantRecouvre || 0));
              message = `Action créée avec succès. Montant recouvré mis à jour. Montant restant: ${montantRestant.toFixed(2)} TND`;
            } else if (response.error) {
              const errorStatus = response.error?.status;
              const errorMessage = response.error?.error?.message || response.error?.message || 'Erreur inconnue';
              
              if (errorStatus === 404) {
                message = `Action créée avec succès, mais la mise à jour du montant a échoué (endpoint non trouvé). Veuillez vérifier que le dossier est bien en phase amiable.`;
              } else if (errorMessage.includes('Transaction') || errorMessage.includes('rollback')) {
                message = `Action créée avec succès, mais la mise à jour du montant a échoué (erreur de transaction backend). Veuillez contacter l'administrateur.`;
              } else {
                message = `Action créée avec succès, mais la mise à jour du montant a échoué: ${errorMessage}`;
              }
              
              console.error('❌ Erreur lors de la mise à jour du montant:', response.error);
            }
            
            this.snackBar.open(message, 'Fermer', { duration: 5000 });
            this.dialogRef.close(true);
          },
          error: (err: any) => {
            this.handleError(err);
          }
        });
      } else {
        // Création sans montant : utiliser createAction
        this.actionService.createAction(this.data.dossierId, actionData).subscribe({
          next: () => {
            this.snackBar.open('Action créée avec succès', 'Fermer', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err: any) => {
            this.handleError(err);
          }
        });
      }
    } else {
      console.error('❌ Formulaire invalide:', this.actionForm.errors);
      console.error('❌ État des champs:', {
        type: this.actionForm.get('type')?.errors,
        dateAction: this.actionForm.get('dateAction')?.errors,
        nbOccurrences: this.actionForm.get('nbOccurrences')?.errors,
        coutUnitaire: this.actionForm.get('coutUnitaire')?.errors
      });
      this.snackBar.open('Veuillez remplir tous les champs requis', 'Fermer', { duration: 3000 });
    }
  }

  private handleError(err: any): void {
    console.error('❌ Erreur lors de l\'enregistrement:', err);
    console.error('❌ Détails complets de l\'erreur:', {
      status: err.status,
      statusText: err.statusText,
      error: err.error,
      message: err.message
    });
    
    // Message d'erreur plus détaillé
    let errorMessage = 'Erreur lors de l\'enregistrement';
    if (err.error?.message) {
      errorMessage = err.error.message;
    } else if (err.error?.error) {
      errorMessage = err.error.error;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
  }

  close(): void {
    this.dialogRef.close(false);
  }

  getTypeLabel(type: TypeAction): string {
    const labels: { [key: string]: string } = {
      'APPEL': 'Appel téléphonique',
      'EMAIL': 'Email',
      'VISITE': 'Visite sur place',
      'LETTRE': 'Lettre recommandée',
      'AUTRE': 'Autre action'
    };
    return labels[type] || type;
  }

  getTypeIcon(type: TypeAction): string {
    const icons: { [key: string]: string } = {
      'APPEL': 'phone',
      'EMAIL': 'email',
      'VISITE': 'home',
      'LETTRE': 'mail',
      'AUTRE': 'more_horiz'
    };
    return icons[type] || 'help';
  }
}

