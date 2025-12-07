import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DashboardAnalyticsService, AlertesResponse } from '../../../core/services/dashboard-analytics.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-alertes-actions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './alertes-actions.component.html',
  styleUrls: ['./alertes-actions.component.scss']
})
export class AlertesActionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  alertes: AlertesResponse | null = null;
  loading = false;

  constructor(
    private analyticsService: DashboardAnalyticsService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;

    this.analyticsService.getAlertes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alertes) => {
          this.alertes = alertes;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des alertes:', error);
          this.loading = false;
        }
      });
  }

  getSeverityClass(joursRetard?: number): string {
    if (!joursRetard) return 'severity-medium';
    if (joursRetard > 90) return 'severity-critical';
    if (joursRetard > 60) return 'severity-high';
    if (joursRetard > 30) return 'severity-medium';
    return 'severity-low';
  }
}

