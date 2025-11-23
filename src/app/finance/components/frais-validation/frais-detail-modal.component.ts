import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PendingFraisItem } from '../../models/finance-feature.interfaces';

@Component({
  selector: 'app-frais-detail-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Détail du Frais</h2>
    <mat-dialog-content>
      <div class="detail-section">
        <div class="detail-item">
          <strong>Dossier ID:</strong> {{ data.dossierId }}
        </div>
        <div class="detail-item">
          <strong>Phase:</strong> {{ data.phase }}
        </div>
        <div class="detail-item">
          <strong>Catégorie:</strong> {{ data.categorie }}
        </div>
        <div class="detail-item">
          <strong>Montant:</strong> {{ data.montant | number:'1.2-2' }} TND
        </div>
        <div class="detail-item">
          <strong>Demandeur:</strong> {{ data.demandeur }}
        </div>
        <div class="detail-item">
          <strong>Créé le:</strong> {{ data.creeLe | date:'dd/MM/yyyy HH:mm' }}
        </div>
        <div class="detail-item" *ngIf="data.justificationUrl">
          <strong>Justificatif:</strong>
          <button mat-button color="primary" (click)="downloadJustificatif()">
            <mat-icon>download</mat-icon>
            Télécharger
          </button>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .detail-section {
      padding: 16px 0;
    }
    .detail-item {
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class FraisDetailModalComponent {
  constructor(
    public dialogRef: MatDialogRef<FraisDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PendingFraisItem
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  downloadJustificatif(): void {
    if (this.data.justificationUrl) {
      window.open(this.data.justificationUrl, '_blank');
    }
  }
}



