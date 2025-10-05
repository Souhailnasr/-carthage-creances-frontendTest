import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DossierGestionComponent } from './dossier-gestion.component';
import { AuthService } from '../../../core/services/auth.service';
import { AgentDossierService } from '../../../core/services/agent-dossier.service';
import { ChefDossierService } from '../../../core/services/chef-dossier.service';
import { CreancierApiService } from '../../../core/services/creancier-api.service';
import { DebiteurApiService } from '../../../core/services/debiteur-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { Role } from '../../../shared/models';

describe('DossierGestionComponent', () => {
  let component: DossierGestionComponent;
  let fixture: ComponentFixture<DossierGestionComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const agentDossierServiceSpy = jasmine.createSpyObj('AgentDossierService', ['creerDossier']);
    const chefDossierServiceSpy = jasmine.createSpyObj('ChefDossierService', ['getDossiers']);
    const creancierApiServiceSpy = jasmine.createSpyObj('CreancierApiService', ['searchCreancierByName']);
    const debiteurApiServiceSpy = jasmine.createSpyObj('DebiteurApiService', ['searchDebiteurByName']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [DossierGestionComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AgentDossierService, useValue: agentDossierServiceSpy },
        { provide: ChefDossierService, useValue: chefDossierServiceSpy },
        { provide: CreancierApiService, useValue: creancierApiServiceSpy },
        { provide: DebiteurApiService, useValue: debiteurApiServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DossierGestionComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('determineDossierStatus', () => {
    it('should return ENCOURSDETRAITEMENT for CHEF_DOSSIER', () => {
      component.currentUser = { id: '1', role: Role.CHEF_DOSSIER };
      const result = (component as any).determineDossierStatus();
      expect(result).toBe('ENCOURSDETRAITEMENT');
    });

    it('should return ENCOURSDETRAITEMENT for CHEF_DEPARTEMENT_DOSSIER', () => {
      component.currentUser = { id: '1', role: Role.CHEF_DEPARTEMENT_DOSSIER };
      const result = (component as any).determineDossierStatus();
      expect(result).toBe('ENCOURSDETRAITEMENT');
    });

    it('should return ENCOURSDETRAITEMENT for AGENT_DOSSIER', () => {
      component.currentUser = { id: '1', role: Role.AGENT_DOSSIER };
      const result = (component as any).determineDossierStatus();
      expect(result).toBe('ENCOURSDETRAITEMENT');
    });

    it('should return null for unknown role', () => {
      component.currentUser = { id: '1', role: 'UNKNOWN_ROLE' as any };
      const result = (component as any).determineDossierStatus();
      expect(result).toBeNull();
    });
  });

  describe('getSuccessMessage', () => {
    it('should return appropriate message for CHEF_DOSSIER', () => {
      component.currentUser = { id: '1', role: Role.CHEF_DOSSIER };
      const result = (component as any).getSuccessMessage('ENCOURSDETRAITEMENT');
      expect(result).toBe('Dossier créé avec succès et validé automatiquement.');
    });

    it('should return appropriate message for AGENT_DOSSIER', () => {
      component.currentUser = { id: '1', role: Role.AGENT_DOSSIER };
      const result = (component as any).getSuccessMessage('ENCOURSDETRAITEMENT');
      expect(result).toBe('Dossier créé avec succès. En attente de validation par le chef de dossier.');
    });

    it('should return default message for unknown role', () => {
      component.currentUser = { id: '1', role: 'UNKNOWN_ROLE' as any };
      const result = (component as any).getSuccessMessage('ENCOURSDETRAITEMENT');
      expect(result).toBe('Dossier créé avec succès.');
    });
  });
});
