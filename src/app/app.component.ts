import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { JwtAuthService } from './core/services/jwt-auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'carthage-creance';
  showSidebar: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private jwtAuthService: JwtAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Écouter les changements de route pour afficher/masquer la sidebar
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.showSidebar = this.shouldShowSidebar(event.url);
        }
      });

    // Vérifier l'état initial
    this.showSidebar = this.shouldShowSidebar(this.router.url);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private shouldShowSidebar(url: string): boolean {
    // Ne pas afficher la sidebar sur les pages de login et erreur
    const hideSidebarRoutes = ['/login', '/unauthorized'];
    
    // Ne pas afficher pour les routes de login/erreur
    if (hideSidebarRoutes.some(route => url.startsWith(route))) {
      return false;
    }
    
    // Afficher la sidebar pour toutes les autres routes si l'utilisateur est connecté
    // Y compris pour /chef-amiable (on utilise la sidebar principale maintenant)
    return this.jwtAuthService.isUserLoggedIn();
  }
}
