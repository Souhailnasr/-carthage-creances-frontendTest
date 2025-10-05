import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../shared/models/enums.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  private destroy$ = new Subject<void>();

  // Statistiques du dashboard
  stats = {
    totalUsers: 0,
    activeUsers: 0,
    totalDossiers: 0,
    pendingDossiers: 0
  };

  // Actions rapides
  quickActions = [
    {
      title: 'Gérer les utilisateurs',
      description: 'Créer, modifier et gérer les comptes utilisateurs',
      icon: 'fas fa-users',
      route: '/admin/users',
      color: 'primary'
    },
    {
      title: 'Paramètres système',
      description: 'Configurer les paramètres de l\'application',
      icon: 'fas fa-cogs',
      route: '/admin/settings',
      color: 'secondary'
    },
    {
      title: 'Rapports',
      description: 'Consulter les rapports et statistiques',
      icon: 'fas fa-chart-bar',
      route: '/admin/reports',
      color: 'success'
    },
    {
      title: 'Logs système',
      description: 'Consulter les logs et l\'activité système',
      icon: 'fas fa-file-alt',
      route: '/admin/logs',
      color: 'warning'
    }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  private loadDashboardData(): void {
    // Simuler le chargement des données du dashboard
    // Dans une vraie application, ceci viendrait d'un service API
    setTimeout(() => {
      this.stats = {
        totalUsers: 25,
        activeUsers: 23,
        totalDossiers: 150,
        pendingDossiers: 12
      };
    }, 1000);
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.prenom} ${this.currentUser.nom}`;
  }

  getUserRoleDisplay(): string {
    if (!this.currentUser) return '';
    return Role.toString(this.currentUser.role);
  }
}
