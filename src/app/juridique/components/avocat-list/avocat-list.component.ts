import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AvocatService } from '../../services/avocat.service';
import { RoleService } from '../../../core/services/role.service';
import { ToastService } from '../../../core/services/toast.service';
import { Avocat } from '../../../shared/models';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-avocat-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './avocat-list.component.html',
  styleUrls: ['./avocat-list.component.scss']
})
export class AvocatListComponent implements OnInit, OnDestroy {
  avocats: Avocat[] = [];
  filteredAvocats: Avocat[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private avocatService: AvocatService,
    public roleService: RoleService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadAvocats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAvocats(): void {
    this.avocatService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avocats) => {
          this.avocats = avocats;
          this.filteredAvocats = avocats;
          this.updatePagination();
        },
        error: (err) => {
          this.toastService.error('Erreur lors du chargement des avocats.');
          console.error(err);
        }
      });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredAvocats = this.avocats;
    } else {
      this.filteredAvocats = this.avocats.filter(avocat =>
        avocat.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        avocat.prenom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        avocat.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        avocat.specialite.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAvocats.length / this.pageSize);
  }

  getPaginatedAvocats(): Avocat[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredAvocats.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  deleteAvocat(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet avocat ?')) {
      this.avocatService.delete(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Avocat supprimé avec succès.');
            this.loadAvocats();
          },
          error: (err) => {
            this.toastService.error('Erreur lors de la suppression de l\'avocat.');
            console.error(err);
          }
        });
    }
  }
}
