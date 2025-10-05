import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ListeDossiersAgentComponent } from './liste-dossiers-agent.component';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DossierApi, DossierStatus } from '../../../shared/models/dossier-api.model';

describe('ListeDossiersAgentComponent', () => {
  let component: ListeDossiersAgentComponent;
  let fixture: ComponentFixture<ListeDossiersAgentComponent>;
  let dossierApiService: jasmine.SpyObj<DossierApiService>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockDossiers: DossierApi[] = [
    {
      id: 1,
      titre: 'Dossier Test 1',
      description: 'Description test 1',
      numeroDossier: 'DOS-001',
      montantCreance: 15000,
      dateCreation: '2024-01-15',
      urgence: 'MOYENNE' as any,
      dossierStatus: DossierStatus.ENCOURSDETRAITEMENT,
      typeDocumentJustificatif: 'FACTURE' as any,
      creancier: {} as any,
      debiteur: {} as any,
      valide: false
    },
    {
      id: 2,
      titre: 'Dossier Test 2',
      description: 'Description test 2',
      numeroDossier: 'DOS-002',
      montantCreance: 25000,
      dateCreation: '2024-01-20',
      urgence: 'ELEVEE' as any,
      dossierStatus: DossierStatus.CLOTURE,
      typeDocumentJustificatif: 'CONTRAT' as any,
      creancier: {} as any,
      debiteur: {} as any,
      valide: true
    }
  ];

  beforeEach(async () => {
    const dossierApiServiceSpy = jasmine.createSpyObj('DossierApiService', ['getDossiersByUtilisateurId']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    await TestBed.configureTestingModule({
      imports: [ListeDossiersAgentComponent],
      providers: [
        { provide: DossierApiService, useValue: dossierApiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListeDossiersAgentComponent);
    component = fixture.componentInstance;
    dossierApiService = TestBed.inject(DossierApiService) as jasmine.SpyObj<DossierApiService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dossiers on init', () => {
    authService.getCurrentUser.and.returnValue({ id: '1', role: 'AGENT_DOSSIER' });
    dossierApiService.getDossiersByUtilisateurId.and.returnValue(of(mockDossiers));

    component.ngOnInit();

    expect(dossierApiService.getDossiersByUtilisateurId).toHaveBeenCalledWith(1);
    expect(component.dossiers).toEqual(mockDossiers);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading dossiers', () => {
    authService.getCurrentUser.and.returnValue({ id: '1', role: 'AGENT_DOSSIER' });
    dossierApiService.getDossiersByUtilisateurId.and.returnValue(throwError('Error loading dossiers'));

    component.ngOnInit();

    expect(component.error).toBe('Erreur lors du chargement des dossiers');
    expect(component.loading).toBeFalse();
  });

  it('should set error when user is not connected', () => {
    authService.getCurrentUser.and.returnValue(null);

    component.ngOnInit();

    expect(component.error).toBe('Utilisateur non connecté');
  });

  it('should set error when user id is not available', () => {
    authService.getCurrentUser.and.returnValue({ role: 'AGENT_DOSSIER' });

    component.ngOnInit();

    expect(component.error).toBe('ID utilisateur non disponible');
  });

  describe('getStatutLabel', () => {
    it('should return correct label for ENCOURSDETRAITEMENT', () => {
      const result = component.getStatutLabel(DossierStatus.ENCOURSDETRAITEMENT);
      expect(result).toBe('En attente de validation');
    });

    it('should return correct label for CLOTURE', () => {
      const result = component.getStatutLabel(DossierStatus.CLOTURE);
      expect(result).toBe('Validé');
    });

    it('should return correct label for SUSPENDU', () => {
      const result = component.getStatutLabel(DossierStatus.SUSPENDU);
      expect(result).toBe('Suspendu');
    });

    it('should return correct label for ANNULE', () => {
      const result = component.getStatutLabel(DossierStatus.ANNULE);
      expect(result).toBe('Annulé');
    });
  });

  describe('getStatutClass', () => {
    it('should return correct class for ENCOURSDETRAITEMENT', () => {
      const result = component.getStatutClass(DossierStatus.ENCOURSDETRAITEMENT);
      expect(result).toBe('statut-en-attente');
    });

    it('should return correct class for CLOTURE', () => {
      const result = component.getStatutClass(DossierStatus.CLOTURE);
      expect(result).toBe('statut-valide');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const result = component.formatDate('2024-01-15');
      expect(result).toBe('15/01/2024');
    });

    it('should return dash for empty date', () => {
      const result = component.formatDate('');
      expect(result).toBe('-');
    });
  });

  describe('formatMontant', () => {
    it('should format amount correctly', () => {
      const result = component.formatMontant(15000);
      expect(result).toBe('15 000,00 TND');
    });
  });

  describe('getDossiersEnAttente', () => {
    it('should return dossiers with ENCOURSDETRAITEMENT status', () => {
      component.dossiers = mockDossiers;
      const result = component.getDossiersEnAttente();
      expect(result.length).toBe(1);
      expect(result[0].dossierStatus).toBe(DossierStatus.ENCOURSDETRAITEMENT);
    });
  });

  describe('getDossiersValides', () => {
    it('should return dossiers with CLOTURE status', () => {
      component.dossiers = mockDossiers;
      const result = component.getDossiersValides();
      expect(result.length).toBe(1);
      expect(result[0].dossierStatus).toBe(DossierStatus.CLOTURE);
    });
  });

  describe('refresh', () => {
    it('should reload dossiers', () => {
      authService.getCurrentUser.and.returnValue({ id: '1', role: 'AGENT_DOSSIER' });
      dossierApiService.getDossiersByUtilisateurId.and.returnValue(of(mockDossiers));

      component.refresh();

      expect(dossierApiService.getDossiersByUtilisateurId).toHaveBeenCalledWith(1);
    });
  });
});
