import { StatutDossier, ValidationStatut, Urgence } from './enums.model';
import { Creancier } from './creancier.model';
import { Debiteur } from './debiteur.model';

export enum TypeDocumentJustificatif {
  CONTRAT = 'CONTRAT',
  BON_DE_COMMANDE = 'BON_DE_COMMANDE',
  BON_DE_LIVRAISON = 'BON_DE_LIVRAISON',
  DEVIS_ACCEPTE = 'DEVIS_ACCEPTE',
  FACTURE = 'FACTURE',
  RELEVE_DE_COMPTE = 'RELEVE_DE_COMPTE',
  ECHEANCIER = 'ECHEANCIER',
  LETTRE_DE_CHANGE = 'LETTRE_DE_CHANGE',
  BILLET_A_ORDRE = 'BILLET_A_ORDRE',
  COURRIER_RELANCE = 'COURRIER_RELANCE',
  RECONNAISSANCE_DE_DOTE = 'RECONNAISSANCE_DE_DOTE',
  EMAIL_RECONNAISSANCE_DETTE = 'EMAIL_RECONNAISSANCE_DETTE',
  ACCUSE_RECEPTION_FACTURE = 'ACCUSE_RECEPTION_FACTURE',
  JUGEMENT = 'JUGEMENT',
  ORDONNANCE_REFERE = 'ORDONNANCE_REFERE',
  PROCES_VERBAL_CONCILIATION = 'PROCES_VERBAL_CONCILIATION',
  PROCES_VERBAL_HUISSIER = 'PROCES_VERBAL_HUISSIER'
}

export enum UrgenceDossier {
  TRES_URGENT = 'TRES_URGENT',
  MOYENNE = 'MOYENNE',
  FAIBLE = 'FAIBLE'
}

export class Dossier {
  id: string = '';
  titre: string = '';
  description: string = '';
  numeroDossier: string = '';
  montantCreance: number = 0;
  montantTotal: number = 0;
  montantRecouvre: number = 0;
  montantRestant: number = 0;
  etatDossier?: 'RECOVERED_TOTAL' | 'RECOVERED_PARTIAL' | 'NOT_RECOVERED';
  dateCreation: Date = new Date();
  dateCloture?: Date;
  // Deux statuts: dossierStatus (technique) + statut (fonctionnel)
  statut: ValidationStatut = ValidationStatut.EN_COURS;
  dossierStatus?: 'ENCOURSDETRAITEMENT' | 'CLOTURE';
  urgence: UrgenceDossier = UrgenceDossier.FAIBLE;
  creancier: Creancier = new Creancier();
  debiteur: Debiteur = new Debiteur();
  agentResponsable: string = '';
  
  // Nouveaux champs
  typeDocumentJustificatif: TypeDocumentJustificatif = TypeDocumentJustificatif.FACTURE;
  pouvoir: boolean = false;
  contratSigne: boolean = false;
  
  // Champs pour la validation
  agentCreateur: string = '';
  valide: boolean = false;
  dateValidation?: Date;

  // Types de créancier et débiteur
  typeCreancier?: string;
  typeDebiteur?: string;

  // ✅ Champs pour la prédiction IA (alignés avec le backend)
  etatPrediction?: 'RECOVERED_TOTAL' | 'RECOVERED_PARTIAL' | 'NOT_RECOVERED';
  riskScore?: number;
  riskLevel?: 'Faible' | 'Moyen' | 'Élevé';
  datePrediction?: string; // Format ISO string "2025-12-03T10:30:00" depuis le backend

  constructor(data?: Partial<Dossier>) {
    Object.assign(this, data);
  }

  getFormattedAmount(): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(this.montantCreance);
  }

  getFormattedDate(): string {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(this.dateCreation));
  }
}
