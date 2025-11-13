import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin, finalize } from 'rxjs';
import { EnqueteService } from '../../../core/services/enquete.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { User, Role } from '../../../shared/models';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-statistiques-enquetes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSnackBarModule,
    FormsModule
  ],
  templateUrl: './statistiques-enquetes.component.html',
  styleUrls: ['./statistiques-enquetes.component.scss']
})
export class StatistiquesEnquetesComponent implements OnInit, OnDestroy {
  loading = false;
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  // Statistiques principales
  totalEnquetes = 0;
  enquetesValides = 0;
  enquetesNonValides = 0;
  enquetesCeMois = 0;

  // Période sélectionnée
  selectedPeriod: 'ce-mois' | 'ce-trimestre' | 'cette-annee' | 'personnalise' = 'ce-mois';
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Statistiques par agent (tableau)
  statsByAgent: Array<{
    agentId: number;
    agentName: string;
    enquetesCrees: number;
    enquetesResponsable: number;
    tauxValidation: number;
  }> = [];

  displayedColumns: string[] = ['agent', 'enquetesCrees', 'enquetesResponsable', 'tauxValidation'];

  // Exposer Role pour le template
  Role = Role;

  constructor(
    private enqueteService: EnqueteService,
    private jwtAuthService: JwtAuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          this.currentUser = user;
          this.loadStatistics();
        },
        error: (err) => {
          console.error('❌ Erreur lors du chargement de l\'utilisateur:', err);
          this.loadStatistics();
        }
      });
  }

  loadStatistics(): void {
    this.loading = true;

    // Charger toutes les statistiques en parallèle
    forkJoin({
      total: this.enqueteService.getTotalEnquetes(),
      valides: this.enqueteService.getEnquetesValides(),
      nonValides: this.enqueteService.getEnquetesNonValides(),
      ceMois: this.enqueteService.getEnquetesCreesCeMois()
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (stats) => {
          this.totalEnquetes = stats.total;
          this.enquetesValides = stats.valides;
          this.enquetesNonValides = stats.nonValides;
          this.enquetesCeMois = stats.ceMois;
        },
        error: (err) => {
          console.error('❌ Erreur lors du chargement des statistiques:', err);
          this.snackBar.open('Erreur lors du chargement des statistiques', 'Fermer', { duration: 3000 });
        }
      });
  }

  onPeriodChange(): void {
    // Recharger les statistiques selon la période sélectionnée
    this.loadStatistics();
  }

  applyCustomPeriod(): void {
    if (!this.startDate || !this.endDate) {
      this.snackBar.open('Veuillez sélectionner une période complète', 'Fermer', { duration: 3000 });
      return;
    }

    if (this.startDate > this.endDate) {
      this.snackBar.open('La date de début doit être antérieure à la date de fin', 'Fermer', { duration: 3000 });
      return;
    }

    this.loadStatistics();
  }

  formatPercentage(value: number): string {
    if (isNaN(value) || !isFinite(value)) return '0%';
    return `${value.toFixed(1)}%`;
  }
}

