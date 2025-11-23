import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #chartCanvas></canvas>`,
  styles: [`
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
    }
    canvas {
      max-width: 100%;
      max-height: 100%;
    }
  `]
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() type: ChartType = 'line';
  @Input() data: any;
  @Input() options: any = {};
  
  private chart: Chart | null = null;

  ngOnInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && (changes['data'] || changes['type'] || changes['options'])) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart(): void {
    if (!this.chartCanvas) return;

    const config: ChartConfiguration = {
      type: this.type,
      data: this.data || { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...this.options
      }
    };

    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(this.chartCanvas.nativeElement, config);
  }

  private updateChart(): void {
    if (!this.chart) return;

    // Recréer le graphique avec le nouveau type si nécessaire
    const currentType = (this.chart.config as ChartConfiguration).type;
    if (currentType !== this.type) {
      this.chart.destroy();
      this.createChart();
      return;
    }

    this.chart.data = this.data || { labels: [], datasets: [] };
    this.chart.options = {
      ...this.chart.options,
      ...this.options
    };
    this.chart.update();
  }
}

