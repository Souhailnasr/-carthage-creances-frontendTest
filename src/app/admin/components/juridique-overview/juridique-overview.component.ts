import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AvocatService, Avocat } from '../../../core/services/avocat.service';
import { HuissierService, Huissier } from '../../../core/services/huissier.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-juridique-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './juridique-overview.component.html',
  styleUrls: ['./juridique-overview.component.scss']
})
export class JuridiqueOverviewComponent implements OnInit, OnDestroy {
  avocats: Avocat[] = [];
  huissiers: Huissier[] = [];
  audiences: any[] = [];
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private avocatService: AvocatService,
    private huissierService: HuissierService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    
    // Charger les avocats
    this.avocatService.getAllAvocats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avocats: Avocat[]) => {
          this.avocats = avocats;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des avocats:', error);
          this.toastService.error('Erreur lors du chargement des avocats');
        }
      });

    // Charger les huissiers
    this.huissierService.getAllHuissiers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (huissiers: Huissier[]) => {
          this.huissiers = huissiers;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des huissiers:', error);
          this.toastService.error('Erreur lors du chargement des huissiers');
        }
      });

    // Simuler les audiences (à remplacer par un vrai service)
    this.audiences = [
      { id: 1, date: '2024-01-15', type: 'Audience civile', statut: 'Programmée' },
      { id: 2, date: '2024-01-20', type: 'Audience pénale', statut: 'En cours' }
    ];

    this.isLoading = false;
  }

  getAvocatInitials(avocat: Avocat): string {
    return `${avocat.prenom || ''} ${avocat.nom || ''}`.split(' ').map(n => n[0]).join('');
  }

  getHuissierInitials(huissier: Huissier): string {
    return `${huissier.prenom || ''} ${huissier.nom || ''}`.split(' ').map(n => n[0]).join('');
  }
}
