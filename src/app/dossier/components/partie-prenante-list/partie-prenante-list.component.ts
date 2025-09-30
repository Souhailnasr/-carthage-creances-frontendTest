import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreancierService } from '../../services/creancier.service';
import { DebiteurService } from '../../services/debiteur.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { Creancier, Debiteur } from '../../../shared/models';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-partie-prenante-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partie-prenante-list.component.html',
  styleUrls: ['./partie-prenante-list.component.scss']
})
export class PartiePrenanteListComponent implements OnInit, OnDestroy {
  creanciers: Creancier[] = [];
  debiteurs: Debiteur[] = [];
  filteredCreanciers: Creancier[] = [];
  filteredDebiteurs: Debiteur[] = [];
  activeTab: 'creancier' | 'debiteur' = 'creancier';
  currentUser: any = null;
  private destroy$ = new Subject<void>();

  constructor(
    private creancierService: CreancierService,
    private debiteurService: DebiteurService,
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadCreanciers();
    this.loadDebiteurs();
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCreanciers(): void {
    this.creancierService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (creanciers) => {
          this.creanciers = creanciers;
          this.filterCreanciers();
        },
        error: (err) => {
          this.toastService.error('Erreur lors du chargement des créanciers.');
          console.error(err);
        }
      });
  }

  loadDebiteurs(): void {
    this.debiteurService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (debiteurs) => {
          this.debiteurs = debiteurs;
          this.filterDebiteurs();
        },
        error: (err) => {
          this.toastService.error('Erreur lors du chargement des débiteurs.');
          console.error(err);
        }
      });
  }

  filterCreanciers(): void {
    if (this.currentUser?.role === 'AGENT_DOSSIER') {
      // Pour les agents, ne montrer que les créanciers qu'ils ont créés
      this.filteredCreanciers = this.creanciers.filter(creancier => 
        creancier.agentCreateur === this.currentUser.getFullName()
      );
    } else {
      // Pour les chefs, montrer tous les créanciers
      this.filteredCreanciers = [...this.creanciers];
    }
  }

  filterDebiteurs(): void {
    if (this.currentUser?.role === 'AGENT_DOSSIER') {
      // Pour les agents, ne montrer que les débiteurs qu'ils ont créés
      this.filteredDebiteurs = this.debiteurs.filter(debiteur => 
        debiteur.agentCreateur === this.currentUser.getFullName()
      );
    } else {
      // Pour les chefs, montrer tous les débiteurs
      this.filteredDebiteurs = [...this.debiteurs];
    }
  }

  setActiveTab(tab: 'creancier' | 'debiteur'): void {
    this.activeTab = tab;
  }

  addCreancier(): void {
    this.router.navigate(['/dossier/parties-prenantes/ajouter/creancier']);
  }

  addDebiteur(): void {
    this.router.navigate(['/dossier/parties-prenantes/ajouter/debiteur']);
  }

  editCreancier(id: number): void {
    this.router.navigate(['/dossier/parties-prenantes/modifier/creancier', id.toString()]);
  }

  editDebiteur(id: number): void {
    this.router.navigate(['/dossier/parties-prenantes/modifier/debiteur', id.toString()]);
  }

  deleteCreancier(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce créancier ?')) {
      this.creancierService.delete(id.toString())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Créancier supprimé avec succès.');
            this.loadCreanciers();
          },
          error: (err) => {
            this.toastService.error('Erreur lors de la suppression du créancier.');
            console.error(err);
          }
        });
    }
  }

  deleteDebiteur(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce débiteur ?')) {
      this.debiteurService.delete(id.toString())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Débiteur supprimé avec succès.');
            this.loadDebiteurs();
          },
          error: (err) => {
            this.toastService.error('Erreur lors de la suppression du débiteur.');
            console.error(err);
          }
        });
    }
  }

  viewCreancier(id: number): void {
    this.router.navigate(['/dossier/parties-prenantes/voir/creancier', id.toString()]);
  }

  viewDebiteur(id: number): void {
    this.router.navigate(['/dossier/parties-prenantes/voir/debiteur', id.toString()]);
  }
}
