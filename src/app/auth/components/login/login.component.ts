import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { Subject, takeUntil } from 'rxjs';
import { Role } from '../../../shared/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  loading: boolean = false;
  returnUrl: string = '/dashboard';
  showPassword: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        return '/admin/dashboard';
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        return '/juridique/dashboard';
      case 'CHEF_DEPARTEMENT_DOSSIER':
        return '/dossier/dashboard';
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
        return '/chef-amiable/dashboard';
      case 'AGENT_RECOUVREMENT_JURIDIQUE':
        return '/juridique/dashboard';
      default:
        return '/dashboard';
    }
  }
}
