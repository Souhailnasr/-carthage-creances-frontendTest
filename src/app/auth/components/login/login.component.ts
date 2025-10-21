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
        console.log('🔍 Réponse d\'authentification complète:', JSON.stringify(data, null, 2));
        
        // Sauvegarder le token
        this.tokenStorage.saveToken(data.token);
        
        // Si la réponse ne contient que le token, créer un utilisateur basique
        if (data.token && !data.user && !data.utilisateur && !data.id) {
          console.log('🔍 Token reçu, création d\'utilisateur basique...');
          
          // Créer un utilisateur basique avec l'email
          const basicUser = {
            id: null,
            nom: this.extractNameFromEmail(this.email),
            prenom: this.extractFirstNameFromEmail(this.email),
            email: this.email,
            role: this.determineRoleFromEmail(this.email),
            actif: true,
            getFullName: function() {
              return `${this.prenom} ${this.nom}`;
            }
          };
          
          console.log('🔍 Utilisateur basique créé:', basicUser);
          this.handleSuccessfulLogin(basicUser, data.token);
        } else {
          // La réponse contient des données utilisateur
          let userData = null;
          
          if (data.user) {
            userData = data.user;
          } else if (data.utilisateur) {
            userData = data.utilisateur;
          } else if (data.id || data.nom || data.prenom) {
            userData = data;
          }
          
          console.log('🔍 Données utilisateur extraites:', userData);
          
          if (!userData) {
            console.error('❌ Aucune donnée utilisateur trouvée dans la réponse');
            this.toastService.error('Erreur lors de la récupération des données utilisateur');
            this.invalidLogin = true;
            return;
          }
          
          this.handleSuccessfulLogin(userData, data.token);
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

  private handleSuccessfulLogin(userData: any, token: string): void {
    console.log('🔍 Traitement de la connexion réussie');
    
    // Créer un objet User compatible avec AuthService
    const user = {
      id: userData.id,
      nom: userData.nom,
      prenom: userData.prenom,
      email: userData.email,
      role: userData.role || userData.roleUtilisateur,
      actif: userData.actif !== undefined ? userData.actif : true,
      getFullName: function() {
        return `${this.prenom} ${this.nom}`;
      }
    };
    
    console.log('🔍 Utilisateur créé:', user);
    console.log('🔍 Rôle de l\'utilisateur:', user.role);
    
    // Sauvegarder les données utilisateur
    this.tokenStorage.saveUser(user);
    
    // Synchroniser avec AuthService
    this.authService.saveUserToStorage(user, token);
    this.authService.setCurrentUser(user);
    
    this.isLoggedIn = true;
    this.invalidLogin = false;
    
    // Redirection selon le rôle
    this.redirectByRole(user.role);
  }

  private extractNameFromEmail(email: string): string {
    const emailParts = email.split('@')[0];
    const nameParts = emailParts.split('.');
    if (nameParts.length >= 2) {
      return nameParts[nameParts.length - 1].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].slice(1);
    }
    return 'Utilisateur';
  }

  private extractFirstNameFromEmail(email: string): string {
    const emailParts = email.split('@')[0];
    const nameParts = emailParts.split('.');
    if (nameParts.length >= 2) {
      return nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
    }
    return 'Connecté';
  }

  private determineRoleFromEmail(email: string): string {
    const emailLower = email.toLowerCase();
    
    // Déterminer le rôle basé sur les comptes réels de la base de données
    if (emailLower.includes('ali.mejri')) {
      return 'SUPER_ADMIN'; // Ali Mejri = Super Admin
    } else if (emailLower.includes('mohamed.daas')) {
      return 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE'; // Mohamed Daas = Chef Département Recouvrement Amiable
    } else if (emailLower.includes('ahmed.daas')) {
      return 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE'; // Ahmed Daas = Chef Département Recouvrement Juridique
    } else if (emailLower.includes('souhailnsrpro98')) {
      return 'AGENT_DOSSIER'; // Souhail Nasr = Agent Dossier
    } else if (emailLower.includes('souhailnasr80')) {
      return 'CHEF_DEPARTEMENT_DOSSIER'; // Souhailou Nasr = Chef Département Dossier
    } else if (emailLower.includes('admin') || emailLower.includes('super')) {
      return 'SUPER_ADMIN';
    } else if (emailLower.includes('chef.dossier') || emailLower.includes('chefdossier')) {
      return 'CHEF_DEPARTEMENT_DOSSIER';
    } else if (emailLower.includes('chef.juridique') || emailLower.includes('chefjuridique')) {
      return 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE';
    } else if (emailLower.includes('chef.amiable') || emailLower.includes('chefamiable')) {
      return 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE';
    } else if (emailLower.includes('agent.dossier') || emailLower.includes('agentdossier')) {
      return 'AGENT_DOSSIER';
    } else if (emailLower.includes('agent.juridique') || emailLower.includes('agentjuridique')) {
      return 'AGENT_RECOUVREMENT_JURIDIQUE';
    } else if (emailLower.includes('agent.amiable') || emailLower.includes('agentamiable')) {
      return 'AGENT_RECOUVREMENT_AMIABLE';
    }
    
    // Rôle par défaut
    return 'AGENT_DOSSIER';
  }

  private redirectByRole(role: string): void {
    console.log('🔍 Rôle reçu pour redirection:', role);
    
    // Vérifier si le rôle est défini
    if (!role || role === 'undefined' || role === 'null') {
      console.error('❌ Rôle non défini ou invalide:', role);
      this.toastService.error('Erreur: Rôle utilisateur non trouvé');
      this.invalidLogin = true;
      return;
    }
    
    // Normaliser le rôle (enlever les préfixes possibles)
    const normalizedRole = role.replace(/^RoleUtilisateur_/, '').replace(/^ROLE_/, '');
    console.log('🔍 Rôle normalisé:', normalizedRole);
    
    switch (normalizedRole) {
      case 'SUPER_ADMIN':
        this.router.navigate(['/admin/dashboard']);
        this.toastService.success('Connexion réussie - Super Admin');
        break;
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        this.router.navigate(['/juridique/dashboard']);
        this.toastService.success('Connexion réussie - Chef Département Juridique');
        break;
      case 'CHEF_DEPARTEMENT_DOSSIER':
        this.router.navigate(['/dossier/chef-dashboard']);
        this.toastService.success('Connexion réussie - Chef Département Dossier');
        break;
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
        this.router.navigate(['/chef-amiable/dashboard']);
        this.toastService.success('Connexion réussie - Chef Département Amiable');
        break;
      case 'AGENT_DOSSIER':
        this.router.navigate(['/dossier/dashboard']);
        this.toastService.success('Connexion réussie - Agent Dossier');
        break;
      case 'AGENT_RECOUVREMENT_JURIDIQUE':
        this.router.navigate(['/juridique/dashboard']);
        this.toastService.success('Connexion réussie - Agent Juridique');
        break;
      case 'AGENT_RECOUVREMENT_AMIABLE':
        this.router.navigate(['/chef-amiable/dashboard']);
        this.toastService.success('Connexion réussie - Agent Amiable');
        break;
      default:
        console.warn('⚠️ Rôle non reconnu:', role, 'normalisé:', normalizedRole);
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
