import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ValidationEnquete, Enquette } from '../../../../shared/models';

export interface RejetEnqueteDialogData {
  validation?: ValidationEnquete;
  enquete?: Enquette;
}

@Component({
  selector: 'app-rejet-enquete-dialog',
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
  templateUrl: './rejet-enquete-dialog.component.html',
  styleUrls: ['./rejet-enquete-dialog.component.scss']
})
export class RejetEnqueteDialogComponent {
  rejetForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RejetEnqueteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RejetEnqueteDialogData
  ) {
    this.rejetForm = this.fb.group({
      commentaire: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.rejetForm.valid) {
      this.dialogRef.close({
        commentaire: this.rejetForm.get('commentaire')?.value?.trim()
      });
    }
  }

  getErrorMessage(): string {
    const control = this.rejetForm.get('commentaire');
    if (control?.hasError('required')) {
      return 'Le commentaire est obligatoire';
    }
    if (control?.hasError('minlength')) {
      return 'Le commentaire doit contenir au moins 10 caractères';
    }
    if (control?.hasError('maxlength')) {
      return 'Le commentaire ne peut pas dépasser 500 caractères';
    }
    return '';
  }

  get enquete() {
    return this.data.enquete || this.data.validation?.enquete;
  }
}

