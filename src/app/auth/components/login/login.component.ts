import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { Subject, takeUntil } from 'rxjs';
import { Role } from '../../../shared/models';
import { jwtDecode } from 'jwt-decode';
import { TokenStorageService } from '../../../core/services/token-storage.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  user: any = {};
  email: string = '';
  password: string = '';
  isSent : boolean = false;
  authority:string='';
  sub:string | null = null;
  token: string = '';
  private role: string[] = [];
  @Input() error: string | null = null;
  form: any = {
    email: null,
    password: null
  };
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';

  invalidLogin = false
  getDecodedAccessToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch(Error) {
      return null;
    }
  }

  loginForm!: FormGroup;
  loading: boolean = false;
  returnUrl: string = '/dashboard';
  showPassword: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private tokenStorage: TokenStorageService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      const currentUser = this.authService.getCurrentUser();
      const redirectUrl = currentUser ? this.getRedirectUrlByRole(currentUser.role) : this.returnUrl;
      this.router.navigate([redirectUrl]);
    }

    if (this.tokenStorage.getToken()) {
      this.isLoggedIn = true;
      const token = sessionStorage.getItem('auth-user');
      if (token) {
        this.token = token;
        const tokenInfo = this.getDecodedAccessToken(this.token);
        if (tokenInfo && tokenInfo.roles && tokenInfo.roles.length > 0) {
          this.role[0] = tokenInfo.role[0];
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkLogin() {
    // Récupérer les valeurs du formulaire
    this.email = this.loginForm.get('email')?.value || '';
    this.password = this.loginForm.get('password')?.value || '';

    if (!this.email || !this.password) {
      this.toastService.error('Veuillez saisir votre email et mot de passe.');
      return;
    }

    this.loading = true;
    this.invalidLogin = false;

    this.authService.authenticate(this.email, this.password).subscribe({
      next: (data) => {
        this.loading = false;
        this.tokenStorage.saveToken(data.accessToken);
        this.tokenStorage.saveUser(data);
        
        // Récupérer le token pour décoder les informations
        const token = sessionStorage.getItem('auth-user');
        if (token) {
          this.token = token;
          const tokenInfo = this.getDecodedAccessToken(this.token);
          console.log('Token:', this.token);
          console.log('Token Info:', tokenInfo);
          console.log('Roles:', tokenInfo.role.length);
          
          if (tokenInfo && tokenInfo.role && tokenInfo.role.length > 0) {
            this.isLoggedIn = true;
            this.invalidLogin = false;
            
            // Redirection selon le rôle
            const role = tokenInfo.role[0].authority;
            this.redirectByRole(role);
          } else {
            this.toastService.error('Erreur lors de la récupération des informations utilisateur.');
            this.invalidLogin = true;
          }
        } else {
          this.toastService.error('Erreur lors de la sauvegarde du token.');
          this.invalidLogin = true;
        }
      },
      error: (error) => {
        this.loading = false;
        this.invalidLogin = true;
        this.error = error.message || 'Erreur de connexion';
        this.toastService.error('Email ou mot de passe incorrect.');
        console.error('Login error:', error);
      }
    });
  }

  private redirectByRole(role: string): void {
    console.log('🔍 Rôle reçu pour redirection:', role);
    
    switch (role) {
      case 'RoleUtilisateur_SUPER_ADMIN':
        this.router.navigate(['/admin/dashboard']);
        this.toastService.success('Connexion réussie - Super Admin');
        break;
      case 'RoleUtilisateur_CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        this.router.navigate(['/juridique/dashboard']);
        this.toastService.success('Connexion réussie - Chef Département Juridique');
        break;
      case 'RoleUtilisateur_CHEF_DEPARTEMENT_DOSSIER':
        this.router.navigate(['/dossier/dashboard']);
        this.toastService.success('Connexion réussie - Chef Département Dossier');
        break;
      case 'RoleUtilisateur_CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
        this.router.navigate(['/chef-amiable/dashboard']);
        this.toastService.success('Connexion réussie - Chef Département Amiable');
        break;
      case 'RoleUtilisateur_AGENT_DOSSIER':
        this.router.navigate(['/dossier/dashboard']);
        this.toastService.success('Connexion réussie - Agent Dossier');
        break;
      case 'RoleUtilisateur_AGENT_RECOUVREMENT_JURIDIQUE':
        this.router.navigate(['/juridique/dashboard']);
        this.toastService.success('Connexion réussie - Agent Juridique');
        break;
      case 'RoleUtilisateur_AGENT_RECOUVREMENT_AMIABLE':
        this.router.navigate(['/chef-amiable/dashboard']);
        this.toastService.success('Connexion réussie - Agent Amiable');
        break;
      default:
        console.warn('⚠️ Rôle non reconnu:', role);
        this.router.navigate(['/dashboard']);
        this.toastService.success('Connexion réussie');
        break;
    }
  }

  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastService.error('Veuillez corriger les erreurs du formulaire.');
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false; // Réinitialiser le loading
          this.toastService.success('Connexion réussie !');
          
          // Attendre un peu pour que l'authentification soit complètement persistée
          setTimeout(() => {
            const redirectUrl = this.getRedirectUrlByRole(response.user.role);
            this.router.navigate([redirectUrl]);
          }, 100);
        },
        error: (error) => {
          this.toastService.error('Email ou mot de passe incorrect.');
          this.loading = false;
        }
      });
  }

  // Helper methods for quick login during development
  loginAsChefDossier(): void {
    this.loginForm.patchValue({
      email: 'jane.smith@carthage-creance.tn',
      password: 'password123'
    });
    this.onSubmit();
  }

  loginAsAgentDossier(): void {
    this.loginForm.patchValue({
      email: 'john.doe@carthage-creance.tn',
      password: 'password123'
    });
    this.onSubmit();
  }

  loginAsChefJuridique(): void {
    this.loginForm.patchValue({
      email: 'fatma.trabelsi@carthage-creance.tn',
      password: 'password123'
    });
    this.onSubmit();
  }

  loginAsSuperAdmin(): void {
    this.loginForm.patchValue({
      email: 'mohamed.khelil@carthage-creance.tn',
      password: 'password123'
    });
    this.onSubmit();
  }

  loginAsChefAmiable(): void {
    this.loginForm.patchValue({
      email: 'chef.amiable@carthage-creance.tn',
      password: 'password123'
    });
    this.onSubmit();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.type = this.showPassword ? 'text' : 'password';
    }
  }

  private getRedirectUrlByRole(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'RoleUtilisateur_SUPER_ADMIN':
        return '/admin/dashboard';
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
      case 'RoleUtilisateur_CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        return '/juridique/dashboard';
      case 'CHEF_DEPARTEMENT_DOSSIER':
      case 'RoleUtilisateur_CHEF_DEPARTEMENT_DOSSIER':
        return '/dossier/dashboard';
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
      case 'RoleUtilisateur_CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
        return '/chef-amiable/dashboard';
      case 'AGENT_RECOUVREMENT_JURIDIQUE':
      case 'RoleUtilisateur_AGENT_RECOUVREMENT_JURIDIQUE':
        return '/juridique/dashboard';
      case 'AGENT_DOSSIER':
      case 'RoleUtilisateur_AGENT_DOSSIER':
        return '/dossier/dashboard';
      case 'AGENT_RECOUVREMENT_AMIABLE':
      case 'RoleUtilisateur_AGENT_RECOUVREMENT_AMIABLE':
        return '/chef-amiable/dashboard';
      default:
        return '/dashboard';
    }
  }
}
