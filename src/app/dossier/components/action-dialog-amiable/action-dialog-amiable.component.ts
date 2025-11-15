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
  actionForm: FormGroup;
  isEditMode: boolean = false;
  
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

    this.actionForm = this.fb.group({
      type: ['', Validators.required],
      dateAction: [new Date(), Validators.required],
      nbOccurrences: [1, [Validators.required, Validators.min(1)]],
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
      const actionData: Partial<ActionRecouvrement> = {
        ...this.actionForm.value,
        dateAction: this.actionForm.value.dateAction.toISOString().split('T')[0]
      };

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
          const errorMessage = err.error?.message || err.message || 'Erreur lors de l\'enregistrement';
          this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
        }
      });
    } else {
      this.snackBar.open('Veuillez remplir tous les champs requis', 'Fermer', { duration: 3000 });
    }
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

