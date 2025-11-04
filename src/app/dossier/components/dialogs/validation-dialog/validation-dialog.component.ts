import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { DossierApi } from '../../../../shared/models/dossier-api.model';

export interface ValidationDialogData {
  dossier: DossierApi;
}

@Component({
  selector: 'app-validation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './validation-dialog.component.html',
  styleUrls: ['./validation-dialog.component.scss']
})
export class ValidationDialogComponent {
  validationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ValidationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ValidationDialogData
  ) {
    this.validationForm = this.fb.group({
      commentaire: ['', [Validators.maxLength(500)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.validationForm.valid) {
      this.dialogRef.close({
        confirmed: true,
        commentaire: this.validationForm.get('commentaire')?.value?.trim() || undefined
      });
    }
  }
}

