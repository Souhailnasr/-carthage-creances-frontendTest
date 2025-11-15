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

    // Vérifier si des fichiers sont sélectionnés
    if (this.contratFile || this.pouvoirFile) {
      this.createDossierWithFiles();
    } else {
      this.createDossierSimple();
    }
  }

  private createDossierSimple(): void {
    this.dossierService.createDossier(this.dossierData).subscribe({
      next: (response) => {
        this.result = response;
        this.isLoading = false;
        console.log('Dossier créé avec succès:', response);
      },
      error: (error) => {
        this.error = 'Erreur lors de la création du dossier';
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }

  private createDossierWithFiles(): void {
    this.dossierService.createDossierWithFiles(
      this.dossierData,
      this.contratFile || undefined,
      this.pouvoirFile || undefined
    ).subscribe({
      next: (response) => {
        this.result = response;
        this.isLoading = false;
        console.log('Dossier créé avec fichiers avec succès:', response);
      },
      error: (error) => {
        this.error = 'Erreur lors de la création du dossier avec fichiers';
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






















