import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChefAmiableService } from '../../services/chef-amiable.service';
import { StatistiqueAmiable, PerformanceAgent, ChefAmiableNotification } from '../../../shared/models';

@Component({
  selector: 'app-chef-amiable-dashboard',
  templateUrl: './chef-amiable-dashboard.component.html',
  styleUrls: ['./chef-amiable-dashboard.component.scss']
})
export class ChefAmiableDashboardComponent implements OnInit {
  statistiques: StatistiqueAmiable = new StatistiqueAmiable();
  performances: PerformanceAgent[] = [];
  notifications: ChefAmiableNotification[] = [];
  notificationsNonLues: number = 0;

  constructor(private chefAmiableService: ChefAmiableService) { }

  ngOnInit(): void {
    this.loadStatistiques();
    this.loadPerformances();
    this.loadNotifications();
  }

  loadStatistiques(): void {
    this.chefAmiableService.getStatistiques().subscribe(stats => {
      this.statistiques = stats;
    });
  }

  loadPerformances(): void {
    this.chefAmiableService.getPerformancesAgents().subscribe(performances => {
      this.performances = performances;
    });
  }

  loadNotifications(): void {
    this.chefAmiableService.getNotifications().subscribe(notifications => {
      this.notifications = notifications;
      this.notificationsNonLues = notifications.filter(n => !n.lu).length;
    });
  }

  marquerCommeLu(notification: ChefAmiableNotification): void {
    notification.lu = true;
    this.notificationsNonLues = this.notifications.filter(n => !n.lu).length;
  }

  getTauxReussiteActions(): number {
    if (this.statistiques.actionsEffectuees === 0) return 0;
    return (this.statistiques.actionsReussies / this.statistiques.actionsEffectuees) * 100;
  }
}
