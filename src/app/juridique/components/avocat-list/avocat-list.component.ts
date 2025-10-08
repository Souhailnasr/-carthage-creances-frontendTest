import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Avocat } from '../../models/avocat.model';
import { AvocatService } from '../../services/avocat.service';
import { ToastService } from '../../../core/services/toast.service';

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
        next: (avocats) => {
          this.avocats = avocats;
          this.filteredAvocats = [...avocats];
          this.isLoading = false;
          console.log('✅ Avocats chargés:', avocats);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des avocats:', error);
          this.toastService.error('Erreur lors du chargement des avocats');
          this.isLoading = false;
        }
      });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredAvocats = [...this.avocats];
    } else {
      this.filteredAvocats = this.avocats.filter(avocat =>
        `${avocat.prenom} ${avocat.nom}`.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        avocat.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (avocat.telephone || '').includes(this.searchTerm)
      );
    }
  }

  deleteAvocat(avocat: Avocat): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet avocat ?')) {
      this.avocatService.deleteAvocat(avocat.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Avocat supprimé avec succès.');
            this.loadAvocats();
          },
          error: (error) => {
            console.error('❌ Erreur lors de la suppression:', error);
            this.toastService.error('Erreur lors de la suppression de l\'avocat');
          }
        });
    }
  }

  getAvocatInitials(avocat: Avocat): string {
    return `${avocat.prenom} ${avocat.nom}`.split(' ').map(n => n[0]).join('');
  }
}