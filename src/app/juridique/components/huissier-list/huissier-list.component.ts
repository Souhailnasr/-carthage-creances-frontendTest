import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HuissierService } from '../../services/huissier.service';
import { RoleService } from '../../../core/services/role.service';
import { ToastService } from '../../../core/services/toast.service';
import { Huissier } from '../../../shared/models';
import { Subject, takeUntil } from 'rxjs';

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
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private huissierService: HuissierService,
    public roleService: RoleService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadHuissiers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHuissiers(): void {
    this.huissierService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (huissiers) => {
          this.huissiers = huissiers;
          this.filteredHuissiers = huissiers;
          this.updatePagination();
        },
        error: (err) => {
          this.toastService.error('Erreur lors du chargement des huissiers.');
          console.error(err);
        }
      });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredHuissiers = this.huissiers;
    } else {
      this.filteredHuissiers = this.huissiers.filter(huissier =>
        huissier.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        huissier.prenom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        huissier.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        huissier.specialite.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredHuissiers.length / this.pageSize);
  }

  getPaginatedHuissiers(): Huissier[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredHuissiers.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  deleteHuissier(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet huissier ?')) {
      this.huissierService.delete(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Huissier supprimé avec succès.');
            this.loadHuissiers();
          },
          error: (err) => {
            this.toastService.error('Erreur lors de la suppression de l\'huissier.');
            console.error(err);
          }
        });
    }
  }
}
