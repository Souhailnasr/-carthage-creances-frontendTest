import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { DossierApiService, AffectationDossierDTO } from '../../../core/services/dossier-api.service';
import { AvocatService } from '../../services/avocat.service';
import { HuissierService } from '../../services/huissier.service';
import { Avocat } from '../../models/avocat.model';
import { Huissier } from '../../models/huissier.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-affectation-dossiers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './affectation-dossiers.component.html',
  styleUrls: ['./affectation-dossiers.component.scss']
})
export class AffectationDossiersComponent implements OnInit, OnDestroy {
  dossiers: DossierApi[] = [];
  filteredDossiers: DossierApi[] = [];
  avocats: Avocat[] = [];
  huissiers: Huissier[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  isLoadingAssignment: boolean = false;
  showAssignmentForm: boolean = false;
  selectedDossier: DossierApi | null = null;
  assignmentForm!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private dossierApiService: DossierApiService,
    private avocatService: AvocatService,
    private huissierService: HuissierService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm(): void {
    this.assignmentForm = this.fb.group({
      avocatId: [null],
      huissierId: [null]
    });
  }

  loadData(): void {
    this.isLoading = true;
    
    // Load dossiers assigned to "recouvrement Juridique" using the correct API
    this.dossierApiService.getDossiersRecouvrementJuridique(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          // Vérifier que page et page.content existent et sont valides
          if (page && Array.isArray(page.content)) {
            this.dossiers = page.content;
            this.filteredDossiers = [...this.dossiers];
            console.log('✅ Dossiers de recouvrement juridique chargés:', this.dossiers.length);
          } else {
            console.warn('⚠️ Format de réponse inattendu:', page);
            this.dossiers = [];
            this.filteredDossiers = [];
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du chargement des dossiers:', error);
          this.dossiers = [];
          this.filteredDossiers = [];
          this.isLoading = false;
          
          // Gérer les erreurs de sérialisation backend
          let errorMsg = 'Erreur lors du chargement des dossiers';
          if (error.error?.message) {
            errorMsg = error.error.message;
          } else if (error.message) {
            errorMsg = error.message;
          } else if (error.status === 0) {
            errorMsg = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
          } else if (error.status === 500) {
            errorMsg = 'Erreur serveur lors du chargement des dossiers. Le backend peut avoir un problème de sérialisation.';
          }
          
          this.toastService.error(errorMsg);
        }
      });

    // Load avocats
    this.avocatService.getAllAvocats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avocats) => {
          if (Array.isArray(avocats)) {
            this.avocats = avocats;
            console.log('✅ Avocats chargés:', this.avocats.length);
          } else {
            console.warn('⚠️ Format de réponse inattendu pour avocats:', avocats);
            this.avocats = [];
            this.toastService.error('Format de réponse inattendu pour les avocats');
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des avocats:', error);
          this.avocats = [];
          const errorMsg = error.error?.message || error.message || 'Erreur lors du chargement des avocats';
          this.toastService.error(`Erreur lors du chargement des avocats: ${errorMsg}`);
        }
      });

    // Load huissiers
    this.huissierService.getAllHuissiers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (huissiers) => {
          if (Array.isArray(huissiers)) {
            this.huissiers = huissiers;
            console.log('✅ Huissiers chargés:', this.huissiers.length);
          } else {
            console.warn('⚠️ Format de réponse inattendu pour huissiers:', huissiers);
            this.huissiers = [];
            this.toastService.error('Format de réponse inattendu pour les huissiers');
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des huissiers:', error);
          this.huissiers = [];
          const errorMsg = error.error?.message || error.message || 'Erreur lors du chargement des huissiers';
          this.toastService.error(`Erreur lors du chargement des huissiers: ${errorMsg}`);
        }
      });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredDossiers = [...this.dossiers];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredDossiers = this.dossiers.filter(dossier => {
        const numeroMatch = dossier.numeroDossier?.toLowerCase().includes(searchLower) || false;
        
        // Gérer le créancier (peut être personne physique ou morale)
        let creancierMatch = false;
        if (dossier.creancier) {
          const creancierNom = dossier.creancier.nom?.toLowerCase() || '';
          const creancierPrenom = dossier.creancier.prenom?.toLowerCase() || '';
          creancierMatch = creancierNom.includes(searchLower) || creancierPrenom.includes(searchLower) ||
                          `${creancierPrenom} ${creancierNom}`.trim().includes(searchLower);
        }
        
        // Gérer le débiteur (peut être personne physique ou morale)
        let debiteurMatch = false;
        if (dossier.debiteur) {
          const debiteurNom = dossier.debiteur.nom?.toLowerCase() || '';
          const debiteurPrenom = dossier.debiteur.prenom?.toLowerCase() || '';
          debiteurMatch = debiteurNom.includes(searchLower) || debiteurPrenom.includes(searchLower) ||
                         `${debiteurPrenom} ${debiteurNom}`.trim().includes(searchLower);
        }
        
        return numeroMatch || creancierMatch || debiteurMatch;
      });
    }
  }

  showAssignmentModal(dossier: DossierApi): void {
    this.selectedDossier = dossier;
    this.showAssignmentForm = true;
    
    // Initialiser le formulaire avec les affectations actuelles
    this.assignmentForm.reset();
    this.assignmentForm.patchValue({
      avocatId: dossier.avocat?.id || null,
      huissierId: dossier.huissier?.id || null
    });
  }

  onSubmitAssignment(): void {
    if (!this.selectedDossier || !this.selectedDossier.id) {
      this.toastService.error('Dossier invalide');
      return;
    }

    const formValue = this.assignmentForm.value;
    const affectation: AffectationDossierDTO = {
      avocatId: formValue.avocatId || null,
      huissierId: formValue.huissierId || null
    };

    // Vérifier qu'au moins un est sélectionné (ou permettre de retirer les deux)
    // Pour l'instant, on permet de retirer les deux si nécessaire

    this.isLoadingAssignment = true;

    this.dossierApiService.affecterAvocatEtHuissier(this.selectedDossier.id, affectation)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossierUpdated) => {
          // Mettre à jour le dossier dans la liste
          const index = this.dossiers.findIndex(d => d.id === dossierUpdated.id);
          if (index !== -1) {
            this.dossiers[index] = dossierUpdated;
            this.filteredDossiers = [...this.dossiers];
          }

          // Construire le message de succès
          let successMessage = `Dossier ${this.selectedDossier!.numeroDossier} `;
          const parts: string[] = [];
          
          if (affectation.avocatId) {
            const avocat = this.avocats.find(a => a.id === affectation.avocatId);
            if (avocat) {
              parts.push(`avocat: ${avocat.prenom} ${avocat.nom}`);
            }
          } else if (this.selectedDossier!.avocat) {
            parts.push('avocat retiré');
          }
          
          if (affectation.huissierId) {
            const huissier = this.huissiers.find(h => h.id === affectation.huissierId);
            if (huissier) {
              parts.push(`huissier: ${huissier.prenom} ${huissier.nom}`);
            }
          } else if (this.selectedDossier!.huissier) {
            parts.push('huissier retiré');
          }

          if (parts.length > 0) {
            successMessage += `affecté à ${parts.join(' et ')}`;
          } else {
            successMessage += 'affectations mises à jour';
          }

          this.toastService.success(successMessage);
          this.isLoadingAssignment = false;
          this.cancelAssignment();
        },
        error: (error) => {
          console.error('❌ Erreur lors de l\'affectation:', error);
          const errorMessage = error.message || 'Erreur lors de l\'affectation';
          this.toastService.error(errorMessage);
          this.isLoadingAssignment = false;
        }
      });
  }

  cancelAssignment(): void {
    this.showAssignmentForm = false;
    this.selectedDossier = null;
    this.assignmentForm.reset();
  }

  getAvocatDisplayName(avocat: Avocat): string {
    let name = `${avocat.prenom} ${avocat.nom}`;
    if (avocat.specialite) {
      name += ` - ${avocat.specialite}`;
    }
    return name;
  }

  getHuissierDisplayName(huissier: Huissier): string {
    let name = `${huissier.prenom} ${huissier.nom}`;
    if (huissier.specialite) {
      name += ` - ${huissier.specialite}`;
    }
    return name;
  }

  getAvocatName(dossier: DossierApi): string {
    if (dossier.avocat) {
      return `${dossier.avocat.prenom || ''} ${dossier.avocat.nom || ''}`.trim() || 'N/A';
    }
    return 'Non affecté';
  }

  getHuissierName(dossier: DossierApi): string {
    if (dossier.huissier) {
      return `${dossier.huissier.prenom || ''} ${dossier.huissier.nom || ''}`.trim() || 'N/A';
    }
    return 'Non affecté';
  }

  getCreancierName(dossier: DossierApi): string {
    if (!dossier.creancier) return 'N/A';
    const typeCreancier = (dossier.creancier as any).typeCreancier;
    if (typeCreancier === 'PERSONNE_MORALE') {
      return dossier.creancier.nom || 'N/A';
    } else if (dossier.creancier.prenom && dossier.creancier.nom) {
      return `${dossier.creancier.prenom} ${dossier.creancier.nom}`;
    } else if (dossier.creancier.nom) {
      return dossier.creancier.nom;
    }
    return 'N/A';
  }

  getDebiteurName(dossier: DossierApi): string {
    if (!dossier.debiteur) return 'N/A';
    const typeDebiteur = (dossier.debiteur as any).typeDebiteur;
    if (typeDebiteur === 'PERSONNE_MORALE') {
      return dossier.debiteur.nom || 'N/A';
    } else if (dossier.debiteur.prenom && dossier.debiteur.nom) {
      return `${dossier.debiteur.prenom} ${dossier.debiteur.nom}`;
    } else if (dossier.debiteur.nom) {
      return dossier.debiteur.nom;
    }
    return 'N/A';
  }
}
