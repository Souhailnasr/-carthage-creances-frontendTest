import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Dossier, StatutDossier, UrgenceDossier, TypeDocumentJustificatif, Creancier, Debiteur } from '../../../shared/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-dossier-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dossier-detail.component.html',
  styleUrls: ['./dossier-detail.component.scss']
})
export class DossierDetailComponent implements OnInit, OnDestroy {
  dossier: Dossier | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const dossierId = params['id'];
        if (dossierId) {
          this.loadDossier(dossierId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDossier(id: string): void {
    // Simulation de données - dans une vraie app, ceci viendrait d'une API
    const mockDossiers: Dossier[] = [
      new Dossier({
        id: '1',
        titre: 'Dossier Client ABC',
        description: 'Recouvrement facture impayée pour services de télécommunications',
        numeroDossier: 'DOS-2024-001',
        montantCreance: 15000,
        dateCreation: new Date('2024-01-15'),
        statut: StatutDossier.EN_COURS,
        urgence: UrgenceDossier.MOYENNE,
        agentResponsable: 'John Doe',
        agentCreateur: 'John Doe',
        typeDocumentJustificatif: TypeDocumentJustificatif.FACTURE,
        pouvoir: true,
        contratSigne: true,
        valide: false,
        dateValidation: undefined,
        creancier: new Creancier({
          id: 1,
          codeCreancier: 'CRE001',
          codeCreance: 'CREA001',
          nom: 'Entreprise Tunisie Telecom',
          prenom: '',
          adresse: 'Avenue Habib Bourguiba',
          ville: 'Tunis',
          codePostal: '1000',
          telephone: '71234567',
          fax: '71234568',
          email: 'contact@tunisietelecom.tn'
        }),
        debiteur: new Debiteur({
          id: 1,
          codeCreance: 'CREA001',
          nom: 'Ben Ammar',
          prenom: 'Ali',
          adresse: '123 Rue de la Paix',
          ville: 'Sfax',
          codePostal: '3000',
          telephone: '98111222',
          fax: '98111223',
          email: 'ali.benammar@email.com'
        })
      }),
      new Dossier({
        id: '2',
        titre: 'Dossier Client XYZ',
        description: 'Recouvrement contrat non honoré pour services bancaires',
        numeroDossier: 'DOS-2024-002',
        montantCreance: 25000,
        dateCreation: new Date('2024-01-20'),
        statut: StatutDossier.EN_COURS,
        urgence: UrgenceDossier.TRES_URGENT,
        agentResponsable: 'Jane Smith',
        agentCreateur: 'Jane Smith',
        typeDocumentJustificatif: TypeDocumentJustificatif.CONTRAT,
        pouvoir: false,
        contratSigne: true,
        valide: false,
        dateValidation: undefined,
        creancier: new Creancier({
          id: 2,
          codeCreancier: 'CRE002',
          codeCreance: 'CREA002',
          nom: 'Banque de Tunisie',
          prenom: '',
          adresse: 'Rue de la République',
          ville: 'Tunis',
          codePostal: '1001',
          telephone: '71234568',
          fax: '71234569',
          email: 'contact@btd.com.tn'
        }),
        debiteur: new Debiteur({
          id: 2,
          codeCreance: 'CREA002',
          nom: 'Trabelsi',
          prenom: 'Fatma',
          adresse: '456 Avenue de l\'Indépendance',
          ville: 'Sousse',
          codePostal: '4000',
          telephone: '22333444',
          fax: '22333445',
          email: 'fatma.trabelsi@email.com'
        })
      }),
      new Dossier({
        id: '3',
        titre: 'Dossier Client DEF',
        description: 'Recouvrement facture impayée pour services d\'électricité',
        numeroDossier: 'DOS-2024-003',
        montantCreance: 18000,
        dateCreation: new Date('2024-01-22'),
        statut: StatutDossier.ENQUETE,
        urgence: UrgenceDossier.FAIBLE,
        agentResponsable: 'Mike Johnson',
        agentCreateur: 'Mike Johnson',
        typeDocumentJustificatif: TypeDocumentJustificatif.FACTURE,
        pouvoir: true,
        contratSigne: false,
        valide: true,
        dateValidation: new Date('2024-01-23'),
        creancier: new Creancier({
          id: 3,
          codeCreancier: 'CRE003',
          codeCreance: 'CREA003',
          nom: 'STEG',
          prenom: '',
          adresse: 'Rue de la République',
          ville: 'Tunis',
          codePostal: '1000',
          telephone: '71234569',
          fax: '71234570',
          email: 'contact@steg.com.tn'
        }),
        debiteur: new Debiteur({
          id: 3,
          codeCreance: 'CREA003',
          nom: 'Hammami',
          prenom: 'Sonia',
          adresse: '789 Rue de la Liberté',
          ville: 'Monastir',
          codePostal: '5000',
          telephone: '33444555',
          fax: '33444556',
          email: 'sonia.hammami@email.com'
        })
      })
    ];

    this.dossier = mockDossiers.find(d => d.id === id) || null;
    
    if (!this.dossier) {
      this.toastService.error('Dossier non trouvé.');
      this.router.navigate(['/dossier/gestion']);
    }
  }

  getUrgenceClass(urgence: UrgenceDossier): string {
    switch (urgence) {
      case UrgenceDossier.TRES_URGENT:
        return 'urgence-tres-urgent';
      case UrgenceDossier.MOYENNE:
        return 'urgence-moyenne';
      case UrgenceDossier.FAIBLE:
        return 'urgence-faible';
      default:
        return '';
    }
  }

  getUrgenceLabel(urgence: UrgenceDossier): string {
    switch (urgence) {
      case UrgenceDossier.TRES_URGENT:
        return 'Très Urgent';
      case UrgenceDossier.MOYENNE:
        return 'Moyenne';
      case UrgenceDossier.FAIBLE:
        return 'Faible';
      default:
        return urgence;
    }
  }

  getStatutClass(statut: StatutDossier): string {
    switch (statut) {
      case StatutDossier.EN_COURS:
        return 'statut-en-cours';
      case StatutDossier.ENQUETE:
        return 'statut-enquete';
      case StatutDossier.CLOTURE:
        return 'statut-cloture';
      default:
        return '';
    }
  }

  getStatutLabel(statut: StatutDossier): string {
    switch (statut) {
      case StatutDossier.EN_COURS:
        return 'En Cours';
      case StatutDossier.ENQUETE:
        return 'En Enquête';
      case StatutDossier.CLOTURE:
        return 'Clôturé';
      default:
        return statut;
    }
  }

  goBack(): void {
    this.router.navigate(['/dossier/gestion']);
  }

  editDossier(): void {
    if (this.dossier) {
      this.router.navigate(['/dossier/gestion'], { 
        queryParams: { edit: this.dossier.id } 
      });
    }
  }
}
