import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IaPredictionResult } from '../../models/ia-prediction-result.model';

@Component({
  selector: 'app-ia-prediction-badge',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './ia-prediction-badge.component.html',
  styleUrls: ['./ia-prediction-badge.component.scss']
})
export class IaPredictionBadgeComponent implements OnInit {
  @Input() prediction: IaPredictionResult | null = null;
  @Input() loading: boolean = false;
  @Input() showDetails: boolean = true; // Afficher les détails ou juste le badge
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  constructor() {}

  ngOnInit(): void {
    // Le composant reçoit la prédiction en input
  }

  /**
   * Obtenir la couleur du badge selon le niveau de risque
   */
  getRiskLevelColor(riskLevel?: string): string {
    if (!riskLevel) return 'secondary';
    switch (riskLevel.toLowerCase()) {
      case 'faible':
        return 'success';
      case 'moyen':
        return 'warning';
      case 'élevé':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  /**
   * Obtenir l'icône selon le niveau de risque
   */
  getRiskLevelIcon(riskLevel?: string): string {
    if (!riskLevel) return 'help_outline';
    switch (riskLevel.toLowerCase()) {
      case 'faible':
        return 'check_circle';
      case 'moyen':
        return 'warning';
      case 'élevé':
        return 'error';
      default:
        return 'help_outline';
    }
  }

  /**
   * Obtenir le label de l'état final
   */
  getEtatFinalLabel(etatFinal?: string): string {
    if (!etatFinal) return 'Non disponible';
    switch (etatFinal) {
      case 'RECOVERED_TOTAL':
        return 'Récupération Totale';
      case 'RECOVERED_PARTIAL':
        return 'Récupération Partielle';
      case 'NOT_RECOVERED':
        return 'Non Récupéré';
      default:
        return etatFinal;
    }
  }

  /**
   * Obtenir la couleur de l'état final
   */
  getEtatFinalColor(etatFinal?: string): string {
    if (!etatFinal) return 'secondary';
    switch (etatFinal) {
      case 'RECOVERED_TOTAL':
        return 'success';
      case 'RECOVERED_PARTIAL':
        return 'warning';
      case 'NOT_RECOVERED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  /**
   * Obtenir la couleur du score de risque selon sa valeur
   */
  getScoreColor(score?: number): string {
    if (score === undefined) return 'secondary';
    if (score <= 33) return 'success';
    if (score <= 66) return 'warning';
    return 'danger';
  }
}

