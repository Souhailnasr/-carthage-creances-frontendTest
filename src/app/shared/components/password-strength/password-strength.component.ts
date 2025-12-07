import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export interface PasswordCriteria {
  label: string;
  met: boolean;
}

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './password-strength.component.html',
  styleUrls: ['./password-strength.component.scss']
})
export class PasswordStrengthComponent implements OnChanges {
  @Input() password: string = '';

  criteria: PasswordCriteria[] = [
    { label: 'Au moins 8 caractères', met: false },
    { label: 'Au moins une majuscule', met: false },
    { label: 'Au moins une minuscule', met: false },
    { label: 'Au moins un chiffre', met: false },
    { label: 'Au moins un caractère spécial', met: false }
  ];

  strength: 'weak' | 'medium' | 'strong' = 'weak';
  strengthPercentage = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password']) {
      this.validatePassword();
    }
  }

  private validatePassword(): void {
    const pwd = this.password || '';

    // Vérifier chaque critère
    this.criteria[0].met = pwd.length >= 8;
    this.criteria[1].met = /[A-Z]/.test(pwd);
    this.criteria[2].met = /[a-z]/.test(pwd);
    this.criteria[3].met = /[0-9]/.test(pwd);
    this.criteria[4].met = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    // Calculer la force
    const metCount = this.criteria.filter(c => c.met).length;
    
    if (metCount <= 2) {
      this.strength = 'weak';
      this.strengthPercentage = (metCount / 5) * 100;
    } else if (metCount <= 4) {
      this.strength = 'medium';
      this.strengthPercentage = (metCount / 5) * 100;
    } else {
      this.strength = 'strong';
      this.strengthPercentage = 100;
    }
  }

  getStrengthColor(): string {
    switch (this.strength) {
      case 'weak':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'strong':
        return '#4caf50';
      default:
        return '#e0e0e0';
    }
  }

  getStrengthLabel(): string {
    switch (this.strength) {
      case 'weak':
        return 'Faible';
      case 'medium':
        return 'Moyen';
      case 'strong':
        return 'Fort';
      default:
        return '';
    }
  }
}

