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
      reponseDebiteur: [null]
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
      // Formater la date correctement
      const dateValue = this.actionForm.value.dateAction;
      let dateFormatted: string;
      
      if (dateValue instanceof Date) {
        dateFormatted = dateValue.toISOString().split('T')[0];
      } else if (typeof dateValue === 'string') {
        // Si c'est déjà une string, vérifier le format
        dateFormatted = dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
      } else {
        dateFormatted = new Date(dateValue).toISOString().split('T')[0];
      }
      
      const actionData: Partial<ActionRecouvrement> = {
        type: this.actionForm.value.type,
        dateAction: dateFormatted,
        nbOccurrences: this.actionForm.value.nbOccurrences,
        coutUnitaire: this.actionForm.value.coutUnitaire || 0,
        agentId: this.currentUserId || undefined,
        // Ne pas envoyer reponseDebiteur si c'est null, ou l'envoyer selon les besoins du backend
        ...(this.actionForm.value.reponseDebiteur !== null && { reponseDebiteur: this.actionForm.value.reponseDebiteur })
      };

      console.log('💾 Données du formulaire:', this.actionForm.value);
      console.log('📤 Données à envoyer:', actionData);

      const operation = this.isEditMode
        ? this.actionService.updateAction(this.data.action!.id!, actionData)
        : this.actionService.createAction(this.data.dossierId, actionData);

      operation.subscribe({
        next: () => {
          this.snackBar.open(
            `Action ${this.isEditMode ? 'modifiée' : 'créée'} avec succès`,
            'Fermer',
            { duration: 3000 }
          );
          this.dialogRef.close(true);
        },
        error: (err) => {
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
      });
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

