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
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { RoleUtilisateur } from '../../../shared/models/dossier-api.model';


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
    private jwtAuthService: JwtAuthService,
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
      const redirectUrl = currentUser ? this.getRedirectUrlByRole(currentUser.roleUtilisateur) : this.returnUrl;
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

  /**
   * Récupère le chemin de redirection selon le rôle depuis le token
   */
  private getRedirectPathByRoleAuthority(roleAuthority: string): string {
    // Normaliser le rôle (supprimer le préfixe RoleUtilisateur_ si présent)
    const normalizedRole = roleAuthority.replace(/^RoleUtilisateur_/, '');
    
    console.log('🔍 Rôle reçu pour redirection:', roleAuthority);
    console.log('🔍 Rôle normalisé:', normalizedRole);
    
    switch (normalizedRole) {
      case 'SUPER_ADMIN':
        return '/dashboard';
        
      case 'CHEF_DEPARTEMENT_DOSSIER':
        return '/dossier';
        
      case 'AGENT_DOSSIER':
        return '/dossier';
        
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        return '/juridique';
        
      case 'AGENT_RECOUVREMENT_JURIDIQUE':
        return '/juridique/dashboard';
        
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
        return '/chef-amiable';
        
      case 'AGENT_RECOUVREMENT_AMIABLE':
        return '/chef-amiable/dashboard';
        
      case 'CHEF_DEPARTEMENT_FINANCE':
        return '/dashboard';
        
      case 'AGENT_FINANCE':
        return '/dashboard';
        
      default:
        console.warn('⚠️ Rôle non reconnu:', roleAuthority, '- Redirection vers dashboard par défaut');
        return '/dashboard';
    }
  }

  /**
   * Récupère le nom d'affichage du rôle
   * Gère les deux formats : avec ou sans préfixe RoleUtilisateur_
   */
  private getRoleDisplayName(role: string): string {
    // Normaliser le rôle (supprimer le préfixe RoleUtilisateur_ si présent)
    const normalizedRole = role.replace(/^RoleUtilisateur_/, '');
    
    const roleNames: { [key: string]: string } = {
      'SUPER_ADMIN': 'Super Administrateur',
      'CHEF_DEPARTEMENT_DOSSIER': 'Chef Département Dossier',
      'AGENT_DOSSIER': 'Agent Dossier',
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': 'Chef Département Recouvrement Juridique',
      'AGENT_RECOUVREMENT_JURIDIQUE': 'Agent Recouvrement Juridique',
      'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE': 'Chef Département Recouvrement Amiable',
      'AGENT_RECOUVREMENT_AMIABLE': 'Agent Recouvrement Amiable',
      'CHEF_DEPARTEMENT_FINANCE': 'Chef Département Finance',
      'AGENT_FINANCE': 'Agent Finance'
    };
    
    return roleNames[normalizedRole] || normalizedRole;
  }

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastService.error('Veuillez corriger les erreurs du formulaire.');
      return;
    }

    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;

    this.loading = true;
    this.invalidLogin = false;

    this.jwtAuthService.login(email, password).subscribe({
      next: (data) => {
        this.loading = false;
        
        // 🔧 Stocker le token dans sessionStorage (auth-token et auth-user)
        this.tokenStorage.saveToken(data.accessToken);
        this.tokenStorage.saveUser(data);
        
        // 🔧 CORRECTION: Stocker aussi le token directement dans auth-user pour jwtAuthService.isUserLoggedIn()
        // Car jwtAuthService.isUserLoggedIn() vérifie auth-user, pas auth-token
        if (data.accessToken) {
          sessionStorage.setItem('auth-user', data.accessToken);
        }

        // Récupérer le token depuis auth-user (utilisé par jwtAuthService)
        const token = sessionStorage.getItem('auth-user') || data.accessToken || sessionStorage.getItem('auth-token');
        const tokenInfo = this.getDecodedAccessToken(token);

        console.log('✅ Token reçu:', token ? 'présent' : 'absent');
        console.log('✅ TokenInfo:', tokenInfo);

        if (!tokenInfo || !tokenInfo.role || !tokenInfo.role[0] || !tokenInfo.role[0].authority) {
          console.error('❌ Structure de rôle invalide dans le token');
          this.toastService.error('Erreur: Structure de rôle invalide');
          this.invalidLogin = true;
          return;
        }

        const roleAuthority = tokenInfo.role[0].authority;
        console.log('✅ Rôle extrait du token:', roleAuthority);

        this.isLoggedIn = true;
        this.invalidLogin = false;

        // Redirection selon le rôle
        const redirectPath = this.getRedirectPathByRoleAuthority(roleAuthority);
        const roleDisplayName = this.getRoleDisplayName(roleAuthority);
        
        console.log('✅ Redirection vers:', redirectPath);
        console.log('✅ Rôle affiché:', roleDisplayName);
        
        this.toastService.success(`Connexion réussie - ${roleDisplayName}`);
        this.router.navigate([redirectPath]);
      },
      error: (error) => {
        this.loading = false;
        this.invalidLogin = true;
        this.error = error.message || 'Erreur de connexion';
        this.toastService.error('Email ou mot de passe incorrect.');
        console.error('❌ Erreur de connexion:', error);
      }
    });
  }


  /**
   * @deprecated Utilisez onSubmit() à la place
   * Cette méthode est conservée pour compatibilité mais redirige vers onSubmit()
   */
  checkLogin() {
    // 🔧 CORRECTION: Utiliser directement onSubmit() qui utilise login() correctement
    console.warn('⚠️ checkLogin() est dépréciée, redirection vers onSubmit()');
    this.onSubmit();
  }

  /**
   * @deprecated Cette méthode n'est plus utilisée - login() dans AuthService fait maintenant tout
   */
  private oldCheckLoginMethod() {
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
        
        // Si la réponse ne contient que le token, essayer de récupérer l'ID utilisateur depuis le backend
        if (data.token && !data.user && !data.utilisateur && !data.id) {
          console.log('🔍 Token reçu, tentative de récupération de l\'ID utilisateur depuis le backend...');
          
          // Essayer de récupérer l'ID utilisateur depuis le backend
          this.authService.getUserIdFromBackend().then(backendUserId => {
            if (backendUserId && !isNaN(Number(backendUserId))) {
              console.log('✅ ID utilisateur récupéré depuis le backend:', backendUserId);
              
              // Créer un utilisateur avec l'ID récupéré
              const userWithId = {
                id: backendUserId,
                nom: this.extractNameFromEmail(this.email),
                prenom: this.extractFirstNameFromEmail(this.email),
                email: this.email,
                role: this.determineRoleFromEmail(this.email),
                actif: true,
                getFullName: function() {
                  return `${this.prenom} ${this.nom}`;
                }
              };
              
              console.log('🔍 Utilisateur créé avec ID:', userWithId);
              this.handleSuccessfulLogin(userWithId, data.token);
            } else {
              console.warn('⚠️ Impossible de récupérer l\'ID utilisateur, création d\'utilisateur basique...');
              
              // Créer un utilisateur basique avec l'email (fallback)
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
            }
          }).catch(error => {
            console.error('❌ Erreur lors de la récupération de l\'ID utilisateur:', error);
            
            // Créer un utilisateur basique avec l'email (fallback)
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
            
            console.log('🔍 Utilisateur basique créé (fallback):', basicUser);
            this.handleSuccessfulLogin(basicUser, data.token);
          });
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
      roleUtilisateur: userData.role || userData.roleUtilisateur,
      actif: userData.actif !== undefined ? userData.actif : true,
      getFullName: function() {
        return `${this.prenom} ${this.nom}`;
      }
    };
    
    console.log('🔍 Utilisateur créé:', user);
    console.log('🔍 Rôle de l\'utilisateur:', user.roleUtilisateur);
    
    // Sauvegarder les données utilisateur
    this.tokenStorage.saveUser(user);
    
    // Synchroniser avec AuthService
    this.authService.saveUserToStorage(user, token);
    this.authService.setCurrentUser(user);
    
    this.isLoggedIn = true;
    this.invalidLogin = false;
    
    // Redirection selon le rôle
    this.redirectByRole(user.roleUtilisateur);
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
          this.loading = false;
          console.log('✅ Connexion réussie, redirection en cours...');
          
          // 🔧 CORRECTION: Utiliser DIRECTEMENT getCurrentUser() car login() a déjà créé et stocké l'utilisateur
          // Pas besoin d'attendre /api/users/me car toutes les données sont dans la réponse d'authentification
          const user = this.authService.getCurrentUser();
          
          if (user && user.roleUtilisateur && user.id) {
            const redirectUrl = this.getRedirectUrlByRole(user.roleUtilisateur);
            console.log('✅ Redirection vers:', redirectUrl);
            console.log('✅ Utilisateur connecté:', {
              id: user.id,
              nom: user.nom,
              prenom: user.prenom,
              email: user.email,
              role: user.roleUtilisateur
            });
            
            this.toastService.success(`Connexion réussie - ${this.getRoleDisplayName(user.roleUtilisateur)}`);
            this.router.navigate([redirectUrl]);
          } else {
            console.error('❌ Utilisateur non trouvé ou incomplet après login:', user);
            this.toastService.error('Erreur: Impossible de récupérer les données utilisateur');
          }
        },
        error: (error) => {
          this.loading = false;
          this.toastService.error('Email ou mot de passe incorrect.');
          console.error('❌ Erreur de connexion:', error);
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
        return '/dashboard';
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
      case 'RoleUtilisateur_CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        return '/juridique';
      case 'CHEF_DEPARTEMENT_DOSSIER':
      case 'RoleUtilisateur_CHEF_DEPARTEMENT_DOSSIER':
        return '/dossier';
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
      case 'RoleUtilisateur_CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
        return '/chef-amiable';
      case 'AGENT_RECOUVREMENT_JURIDIQUE':
      case 'RoleUtilisateur_AGENT_RECOUVREMENT_JURIDIQUE':
        return '/juridique';
      case 'AGENT_DOSSIER':
      case 'RoleUtilisateur_AGENT_DOSSIER':
        return '/dossier';
      case 'AGENT_RECOUVREMENT_AMIABLE':
      case 'RoleUtilisateur_AGENT_RECOUVREMENT_AMIABLE':
        return '/chef-amiable/dashboard';
      default:
        return '/dashboard';
    }
  }
}
