import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DossierService } from '../../../core/services/dossier.service';

@Component({
  selector: 'app-dossier-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dossier-form.component.html',
  styleUrls: ['./dossier-form.component.scss']
})
export class DossierFormComponent implements OnInit {
  dossierData: any = {
    titre: '',
    description: '',
    numeroDossier: '',
    montantCreance: 0,
    typeDocumentJustificatif: 'FACTURE',
    urgence: 'FAIBLE',
    typeCreancier: 'PERSONNE_PHYSIQUE',
    nomCreancier: '',
    prenomCreancier: '',
    emailCreancier: '',
    telCreancier: '',
    adresseCreancier: '',
    typeDebiteur: 'PERSONNE_PHYSIQUE',
    nomDebiteur: '',
    prenomDebiteur: '',
    emailDebiteur: '',
    telDebiteur: '',
    adresseDebiteur: '',
    pouvoir: false,
    contratSigne: false,
    isChef: false
  };

  contratFile: File | null = null;
  pouvoirFile: File | null = null;
  isLoading = false;
  result: any = null;
  error: string | null = null;

  constructor(private dossierService: DossierService) { }

  ngOnInit(): void {
    // Initialisation du composant
  }

  onContratFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.contratFile = file;
    }
  }

  onPouvoirFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.pouvoirFile = file;
    }
  }

  createDossier(): void {
    this.isLoading = true;
    this.error = null;
    this.result = null;

    // ✅ NOUVEAU : Utiliser la méthode unifiée qui détecte automatiquement les fichiers
    // Le service choisit automatiquement entre multipart (si fichiers) ou JSON (si pas de fichiers)
    this.dossierService.createDossier(
      this.dossierData,
      this.contratFile || undefined,
      this.pouvoirFile || undefined,
      this.dossierData.isChef || false
    ).subscribe({
      next: (response) => {
        this.result = response;
        this.isLoading = false;
        const hasFiles = !!(this.contratFile || this.pouvoirFile);
        console.log(`Dossier créé avec succès${hasFiles ? ' (avec fichiers)' : ''}:`, response);
      },
      error: (error) => {
        this.error = 'Erreur lors de la création du dossier';
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }

  resetForm(): void {
    this.dossierData = {
      titre: '',
      description: '',
      numeroDossier: '',
      montantCreance: 0,
      typeDocumentJustificatif: 'FACTURE',
      urgence: 'FAIBLE',
      typeCreancier: 'PERSONNE_PHYSIQUE',
      nomCreancier: '',
      prenomCreancier: '',
      emailCreancier: '',
      telCreancier: '',
      adresseCreancier: '',
      typeDebiteur: 'PERSONNE_PHYSIQUE',
      nomDebiteur: '',
      prenomDebiteur: '',
      emailDebiteur: '',
      telDebiteur: '',
      adresseDebiteur: '',
      pouvoir: false,
      contratSigne: false,
      isChef: false
    };
    this.contratFile = null;
    this.pouvoirFile = null;
    this.result = null;
    this.error = null;
  }
}































