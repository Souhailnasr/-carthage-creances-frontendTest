import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HuissierService, Huissier } from '../../../core/services/huissier.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-huissiers-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './huissiers-admin.component.html',
  styleUrls: ['./huissiers-admin.component.scss']
})
export class HuissiersAdminComponent implements OnInit, OnDestroy {
  huissiers: Huissier[] = [];
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private huissierService: HuissierService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadHuissiers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHuissiers(): void {
    this.isLoading = true;
    this.huissierService.getAllHuissiers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (huissiers: Huissier[]) => {
          this.huissiers = huissiers;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des huissiers:', error);
          this.toastService.error('Erreur lors du chargement des huissiers');
          this.isLoading = false;
        }
      });
  }

  getHuissierInitials(huissier: Huissier): string {
    return `${huissier.prenom || ''} ${huissier.nom || ''}`.split(' ').map(n => n[0]).join('');
  }
}
