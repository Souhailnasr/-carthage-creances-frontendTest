import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Huissier } from '../../models/huissier.model';
import { HuissierService } from '../../services/huissier.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-huissier-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './huissier-list.component.html',
  styleUrls: ['./huissier-list.component.scss']
})
export class HuissierListComponent implements OnInit, OnDestroy {
  huissiers: Huissier[] = [];
  filteredHuissiers: Huissier[] = [];
  searchTerm: string = '';
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
        next: (huissiers) => {
          this.huissiers = huissiers;
          this.filteredHuissiers = [...huissiers];
          this.isLoading = false;
          console.log('✅ Huissiers chargés:', huissiers);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des huissiers:', error);
          this.toastService.error('Erreur lors du chargement des huissiers');
          this.isLoading = false;
        }
      });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredHuissiers = [...this.huissiers];
    } else {
      this.filteredHuissiers = this.huissiers.filter(huissier =>
        `${huissier.prenom} ${huissier.nom}`.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        huissier.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (huissier.telephone || '').includes(this.searchTerm)
      );
    }
  }

  deleteHuissier(huissier: Huissier): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet huissier ?')) {
      this.huissierService.deleteHuissier(huissier.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Huissier supprimé avec succès.');
            this.loadHuissiers();
          },
          error: (error) => {
            console.error('❌ Erreur lors de la suppression:', error);
            this.toastService.error('Erreur lors de la suppression de l\'huissier');
          }
        });
    }
  }

  getHuissierInitials(huissier: Huissier): string {
    return `${huissier.prenom} ${huissier.nom}`.split(' ').map(n => n[0]).join('');
  }
}