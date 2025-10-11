import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AvocatService, Avocat } from '../../../core/services/avocat.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-avocats-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './avocats-admin.component.html',
  styleUrls: ['./avocats-admin.component.scss']
})
export class AvocatsAdminComponent implements OnInit, OnDestroy {
  avocats: Avocat[] = [];
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private avocatService: AvocatService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAvocats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAvocats(): void {
    this.isLoading = true;
    this.avocatService.getAllAvocats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avocats: Avocat[]) => {
          this.avocats = avocats;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des avocats:', error);
          this.toastService.error('Erreur lors du chargement des avocats');
          this.isLoading = false;
        }
      });
  }

  getAvocatInitials(avocat: Avocat): string {
    return `${avocat.prenom || ''} ${avocat.nom || ''}`.split(' ').map(n => n[0]).join('');
  }
}
