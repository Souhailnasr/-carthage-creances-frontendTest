import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ListeDossiersChefComponent } from './liste-dossiers-chef.component';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DossierApi, DossierStatus, RoleUtilisateur } from '../../../shared/models/dossier-api.model';

describe('ListeDossiersChefComponent', () => {
  let component: ListeDossiersChefComponent;
  let fixture: ComponentFixture<ListeDossiersChefComponent>;
  let dossierApiService: jasmine.SpyObj<DossierApiService>;
  let authService: jasmine.SpyObj<AuthService>;
  let toastService: jasmine.SpyObj<ToastService>;

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
      agentCreateur: {
        id: 1,
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@test.com',
        roleUtilisateur: RoleUtilisateur.AGENT_DOSSIER,
        actif: true
      },
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
      dossierStatus: DossierStatus.ENCOURSDETRAITEMENT,
      typeDocumentJustificatif: 'CONTRAT' as any,
      creancier: {} as any,
      debiteur: {} as any,
      agentCreateur: {
        id: 2,
        nom: 'Smith',
        prenom: 'Jane',
        email: 'jane.smith@test.com',
        roleUtilisateur: RoleUtilisateur.AGENT_DOSSIER,
        actif: true
      },
      valide: false
    }
  ];

  beforeEach(async () => {
    const dossierApiServiceSpy = jasmine.createSpyObj('DossierApiService', ['getDossiersByStatut', 'validateDossier']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [ListeDossiersChefComponent],
      providers: [
        { provide: DossierApiService, useValue: dossierApiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListeDossiersChefComponent);
    component = fixture.componentInstance;
    dossierApiService = TestBed.inject(DossierApiService) as jasmine.SpyObj<DossierApiService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dossiers en attente on init', () => {
    authService.getCurrentUser.and.returnValue({ id: '1', role: 'CHEF_DOSSIER' });
    dossierApiService.getDossiersByStatut.and.returnValue(of(mockDossiers));

    component.ngOnInit();

    expect(dossierApiService.getDossiersByStatut).toHaveBeenCalledWith('ENCOURSDETRAITEMENT');
    expect(component.dossiers).toEqual(mockDossiers);
    expect(component.loading).toBeFalse();
  });

  it('should filter dossiers to only show ENCOURSDETRAITEMENT status', () => {
    const mixedDossiers = [
      ...mockDossiers,
      {
        ...mockDossiers[0],
        id: 3,
        dossierStatus: DossierStatus.CLOTURE
      }
    ];

    authService.getCurrentUser.and.returnValue({ id: '1', role: 'CHEF_DOSSIER' });
    dossierApiService.getDossiersByStatut.and.returnValue(of(mixedDossiers));

    component.ngOnInit();

    expect(component.dossiers.length).toBe(2);
    expect(component.dossiers.every(d => d.dossierStatus === DossierStatus.ENCOURSDETRAITEMENT)).toBeTrue();
  });

  it('should handle error when loading dossiers', () => {
    authService.getCurrentUser.and.returnValue({ id: '1', role: 'CHEF_DOSSIER' });
    dossierApiService.getDossiersByStatut.and.returnValue(throwError('Error loading dossiers'));

    component.ngOnInit();

    expect(component.error).toBe('Erreur lors du chargement des dossiers');
    expect(component.loading).toBeFalse();
  });

  it('should set error when user is not connected', () => {
    authService.getCurrentUser.and.returnValue(null);

    component.ngOnInit();

    expect(component.error).toBe('Utilisateur non connecté');
  });

  describe('validateDossier', () => {
    it('should validate dossier successfully', () => {
      authService.getCurrentUser.and.returnValue({ id: '1', role: 'CHEF_DOSSIER' });
      const validatedDossier = { ...mockDossiers[0], dossierStatus: DossierStatus.CLOTURE };
      dossierApiService.validateDossier.and.returnValue(of(validatedDossier));
      component.dossiers = mockDossiers;

      component.validateDossier(1);

      expect(dossierApiService.validateDossier).toHaveBeenCalledWith(1, 1);
      expect(toastService.success).toHaveBeenCalledWith('Dossier validé avec succès');
      expect(component.validatingDossierId).toBeNull();
    });

    it('should handle error when validating dossier', () => {
      authService.getCurrentUser.and.returnValue({ id: '1', role: 'CHEF_DOSSIER' });
      dossierApiService.validateDossier.and.returnValue(throwError('Error validating dossier'));

      component.validateDossier(1);

      expect(toastService.error).toHaveBeenCalledWith('Erreur lors de la validation du dossier');
      expect(component.validatingDossierId).toBeNull();
    });

    it('should set error when user id is not available', () => {
      authService.getCurrentUser.and.returnValue({ role: 'CHEF_DOSSIER' });

      component.validateDossier(1);

      expect(toastService.error).toHaveBeenCalledWith('ID utilisateur non disponible');
    });
  });

  describe('isDossierValidating', () => {
    it('should return true when dossier is being validated', () => {
      component.validatingDossierId = 1;
      expect(component.isDossierValidating(1)).toBeTrue();
    });

    it('should return false when dossier is not being validated', () => {
      component.validatingDossierId = 1;
      expect(component.isDossierValidating(2)).toBeFalse();
    });
  });

  describe('getAgentCreateurName', () => {
    it('should return full name when agent is available', () => {
      const dossier = mockDossiers[0];
      const result = component.getAgentCreateurName(dossier);
      expect(result).toBe('John Doe');
    });

    it('should return "Non défini" when agent is not available', () => {
      const dossier = { ...mockDossiers[0], agentCreateur: undefined };
      const result = component.getAgentCreateurName(dossier);
      expect(result).toBe('Non défini');
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

  describe('getTotalDossiersEnAttente', () => {
    it('should return total number of dossiers', () => {
      component.dossiers = mockDossiers;
      const result = component.getTotalDossiersEnAttente();
      expect(result).toBe(2);
    });
  });

  describe('getMontantTotal', () => {
    it('should return total amount of dossiers', () => {
      component.dossiers = mockDossiers;
      const result = component.getMontantTotal();
      expect(result).toBe(40000);
    });
  });

  describe('refresh', () => {
    it('should reload dossiers', () => {
      authService.getCurrentUser.and.returnValue({ id: '1', role: 'CHEF_DOSSIER' });
      dossierApiService.getDossiersByStatut.and.returnValue(of(mockDossiers));

      component.refresh();

      expect(dossierApiService.getDossiersByStatut).toHaveBeenCalledWith('ENCOURSDETRAITEMENT');
    });
  });
});
