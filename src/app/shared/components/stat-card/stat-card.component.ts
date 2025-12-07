import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss']
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() stats: { [key: string]: number | string } = {};
  @Input() icon: string = 'bar_chart';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';

  /**
   * Formate une valeur pour l'affichage : remplace null/undefined/N/A par 0
   */
  formatValue(value: number | string | null | undefined): string | number {
    if (value === null || value === undefined || value === 'N/A' || value === 'null' || value === 'undefined') {
      return 0;
    }
    return value;
  }
}

