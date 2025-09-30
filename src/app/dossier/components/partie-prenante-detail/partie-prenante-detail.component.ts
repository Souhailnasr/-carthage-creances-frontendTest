import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CreancierService } from '../../services/creancier.service';
import { DebiteurService } from '../../services/debiteur.service';
import { ToastService } from '../../../core/services/toast.service';
import { Creancier, Debiteur } from '../../../shared/models';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-partie-prenante-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partie-prenante-detail.component.html',
  styleUrls: ['./partie-prenante-detail.component.scss']
})
export class PartiePrenanteDetailComponent implements OnInit, OnDestroy {
  partiePrenante: Creancier | Debiteur | null = null;
  type: 'creancier' | 'debiteur' | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private creancierService: CreancierService,
    private debiteurService: DebiteurService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      const type = params.get('type') as 'creancier' | 'debiteur';

      if (id && type) {
        this.type = type;
        this.loadPartiePrenante(id, type);
      } else {
        this.router.navigate(['/dossier/parties-prenantes']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPartiePrenante(id: string, type: 'creancier' | 'debiteur'): void {
    if (type === 'creancier') {
      this.creancierService.getById(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (creancier) => {
            if (creancier) {
              this.partiePrenante = creancier;
            } else {
              this.toastService.error('Créancier non trouvé.');
              this.router.navigate(['/dossier/parties-prenantes']);
            }
          },
          error: (err) => {
            this.toastService.error('Erreur lors du chargement du créancier.');
            console.error(err);
            this.router.navigate(['/dossier/parties-prenantes']);
          }
        });
    } else if (type === 'debiteur') {
      this.debiteurService.getById(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (debiteur) => {
            if (debiteur) {
              this.partiePrenante = debiteur;
            } else {
              this.toastService.error('Débiteur non trouvé.');
              this.router.navigate(['/dossier/parties-prenantes']);
            }
          },
          error: (err) => {
            this.toastService.error('Erreur lors du chargement du débiteur.');
            console.error(err);
            this.router.navigate(['/dossier/parties-prenantes']);
          }
        });
    }
  }

  editPartiePrenante(): void {
    if (this.partiePrenante && this.type) {
      this.router.navigate(['/dossier/parties-prenantes/modifier', this.type, this.partiePrenante.id.toString()]);
    }
  }

  deletePartiePrenante(): void {
    if (this.partiePrenante && this.type) {
      const message = this.type === 'creancier' ? 'créancier' : 'débiteur';
      if (confirm(`Êtes-vous sûr de vouloir supprimer ce ${message} ?`)) {
        if (this.type === 'creancier') {
          this.creancierService.delete(this.partiePrenante.id.toString())
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.toastService.success('Créancier supprimé avec succès.');
                this.router.navigate(['/dossier/parties-prenantes']);
              },
              error: (err) => {
                this.toastService.error('Erreur lors de la suppression du créancier.');
                console.error(err);
              }
            });
        } else {
          this.debiteurService.delete(this.partiePrenante.id.toString())
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.toastService.success('Débiteur supprimé avec succès.');
                this.router.navigate(['/dossier/parties-prenantes']);
              },
              error: (err) => {
                this.toastService.error('Erreur lors de la suppression du débiteur.');
                console.error(err);
              }
            });
        }
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/dossier/parties-prenantes']);
  }

  getCreancierCodeCreancier(): string {
    if (this.type === 'creancier' && this.partiePrenante) {
      return (this.partiePrenante as any).codeCreancier || '';
    }
    return '';
  }

  getCodeCreance(): string {
    if (this.partiePrenante) {
      return (this.partiePrenante as any).codeCreance || '';
    }
    return '';
  }

  getFax(): string {
    if (this.partiePrenante) {
      return (this.partiePrenante as any).fax || '';
    }
    return '';
  }
}
