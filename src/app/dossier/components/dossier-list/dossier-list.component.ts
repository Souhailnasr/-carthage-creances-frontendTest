import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DossierService } from '../../../core/services/dossier.service';

@Component({
  selector: 'app-dossier-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dossier-list.component.html',
  styleUrls: ['./dossier-list.component.scss']
})
export class DossierListComponent implements OnInit {
  dossiers: any[] = [];
  filteredDossiers: any[] = [];
  isLoading = false;
  error: string | null = null;
  searchTerm = '';
  selectedDossier: any = null;
  isEditing = false;
  editData: any = {};

  constructor(private dossierService: DossierService) { }

  ngOnInit(): void {
    this.loadDossiers();
  }

  loadDossiers(): void {
    this.isLoading = true;
    this.error = null;

    this.dossierService.getAllDossiers().subscribe({
      next: (response) => {
        this.dossiers = response || [];
        this.filteredDossiers = [...this.dossiers];
        this.isLoading = false;
        console.log('Dossiers chargés:', this.dossiers);
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des dossiers';
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }

  searchDossiers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredDossiers = [...this.dossiers];
      return;
    }

    this.dossierService.searchDossiers(this.searchTerm).subscribe({
      next: (response) => {
        this.filteredDossiers = response || [];
        console.log('Résultats de recherche:', this.filteredDossiers);
      },
      error: (error) => {
        this.error = 'Erreur lors de la recherche';
        console.error('Erreur de recherche:', error);
      }
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredDossiers = [...this.dossiers];
  }

  viewDossier(dossier: any): void {
    this.selectedDossier = dossier;
    this.isEditing = false;
  }

  editDossier(dossier: any): void {
    this.selectedDossier = dossier;
    this.isEditing = true;
    this.editData = { ...dossier };
  }

  updateDossier(): void {
    if (!this.selectedDossier || !this.editData) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.dossierService.updateDossier(this.selectedDossier.id, this.editData).subscribe({
      next: (response) => {
        // Mettre à jour la liste locale
        const index = this.dossiers.findIndex(d => d.id === this.selectedDossier.id);
        if (index !== -1) {
          this.dossiers[index] = { ...this.dossiers[index], ...this.editData };
          this.filteredDossiers = [...this.dossiers];
        }
        
        this.selectedDossier = null;
        this.isEditing = false;
        this.editData = {};
        this.isLoading = false;
        console.log('Dossier mis à jour:', response);
      },
      error: (error) => {
        this.error = 'Erreur lors de la mise à jour du dossier';
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }

  deleteDossier(dossier: any): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le dossier "${dossier.titre}" ?`)) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.dossierService.deleteDossier(dossier.id).subscribe({
      next: () => {
        // Suppression réussie (204 NO_CONTENT, pas de body)
        // Supprimer de la liste locale
        this.dossiers = this.dossiers.filter(d => d.id !== dossier.id);
        this.filteredDossiers = [...this.dossiers];
        this.isLoading = false;
        console.log('✅ Dossier supprimé avec succès');
      },
      error: (error) => {
        this.isLoading = false;
        
        // Extraire le message d'erreur depuis le body de la réponse
        let errorMessage = 'Erreur lors de la suppression du dossier';
        
        if (error?.error) {
          // Le backend retourne {"error": "...", "message": "..."}
          if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.error) {
            errorMessage = error.error.error;
          } else if (typeof error.error === 'string') {
            errorMessage = error.error;
          }
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        // Gestion spécifique selon le code HTTP
        if (error?.status === 400) {
          errorMessage = errorMessage || 'Impossible de supprimer le dossier : des validations sont en cours (EN_ATTENTE)';
        } else if (error?.status === 404) {
          errorMessage = errorMessage || 'Dossier introuvable';
        } else if (error?.status === 500) {
          errorMessage = errorMessage || 'Erreur interne du serveur';
        }
        
        this.error = errorMessage;
        console.error('❌ Erreur lors de la suppression:', error);
      }
    });
  }

  assignAgent(dossier: any, agentId: number): void {
    this.isLoading = true;
    this.error = null;

    this.dossierService.assignAgent(dossier.id, agentId).subscribe({
      next: (response) => {
        // Mettre à jour la liste locale
        const index = this.dossiers.findIndex(d => d.id === dossier.id);
        if (index !== -1) {
          this.dossiers[index].agentId = agentId;
          this.filteredDossiers = [...this.dossiers];
        }
        
        this.isLoading = false;
        console.log('Agent assigné:', response);
      },
      error: (error) => {
        this.error = 'Erreur lors de l\'assignation de l\'agent';
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }

  assignAvocat(dossier: any, avocatId: number): void {
    this.isLoading = true;
    this.error = null;

    this.dossierService.assignAvocat(dossier.id, avocatId).subscribe({
      next: (response) => {
        // Mettre à jour la liste locale
        const index = this.dossiers.findIndex(d => d.id === dossier.id);
        if (index !== -1) {
          this.dossiers[index].avocatId = avocatId;
          this.filteredDossiers = [...this.dossiers];
        }
        
        this.isLoading = false;
        console.log('Avocat assigné:', response);
      },
      error: (error) => {
        this.error = 'Erreur lors de l\'assignation de l\'avocat';
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }

  assignHuissier(dossier: any, huissierId: number): void {
    this.isLoading = true;
    this.error = null;

    this.dossierService.assignHuissier(dossier.id, huissierId).subscribe({
      next: (response) => {
        // Mettre à jour la liste locale
        const index = this.dossiers.findIndex(d => d.id === dossier.id);
        if (index !== -1) {
          this.dossiers[index].huissierId = huissierId;
          this.filteredDossiers = [...this.dossiers];
        }
        
        this.isLoading = false;
        console.log('Huissier assigné:', response);
      },
      error: (error) => {
        this.error = 'Erreur lors de l\'assignation du huissier';
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }

  cancelEdit(): void {
    this.selectedDossier = null;
    this.isEditing = false;
    this.editData = {};
  }

  getUrgenceClass(urgence: string): string {
    switch (urgence?.toLowerCase()) {
      case 'critique': return 'urgence-critique';
      case 'elevee': return 'urgence-elevee';
      case 'moyenne': return 'urgence-moyenne';
      case 'faible': return 'urgence-faible';
      default: return 'urgence-faible';
    }
  }

  getUrgenceLabel(urgence: string): string {
    switch (urgence?.toLowerCase()) {
      case 'critique': return 'Critique';
      case 'elevee': return 'Élevée';
      case 'moyenne': return 'Moyenne';
      case 'faible': return 'Faible';
      default: return 'Non définie';
    }
  }
}































