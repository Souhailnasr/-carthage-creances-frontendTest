import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDeleteEnqueteDialogData {
  title: string;
  message: string;
  details?: string;
}

@Component({
  selector: 'app-confirm-delete-enquete-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      <p *ngIf="data.details" class="details">{{ data.details }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">
        <mat-icon>delete</mat-icon>
        Supprimer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .details {
      color: #666;
      font-size: 0.9em;
      margin-top: 10px;
      font-style: italic;
    }
    mat-dialog-content {
      min-width: 300px;
    }
  `]
})
export class ConfirmDeleteEnqueteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteEnqueteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteEnqueteDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

