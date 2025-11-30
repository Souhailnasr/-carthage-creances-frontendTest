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
    const hideSidebarRoutes = ['/login', '/unauthorized'];
    const modulesWithOwnLayout = ['/juridique']; // juridique est maintenant géré différemment
    
    // Always display the sidebar for /mes-agents
    if (url.startsWith('/mes-agents')) {
      return this.jwtAuthService.isUserLoggedIn();
    }
    
    // For chef-amiable routes, we want to show the main sidebar
    if (url.startsWith('/chef-amiable')) {
      return this.jwtAuthService.isUserLoggedIn();
    }
    
    // For juridique routes, we want to show the main sidebar
    if (url.startsWith('/juridique')) {
      return this.jwtAuthService.isUserLoggedIn();
    }
    
    // Do not display for login/error routes
    if (hideSidebarRoutes.some(route => url.startsWith(route))) {
      return false;
    }
    
    // Do not display for other modules with their own layout
    if (modulesWithOwnLayout.some(route => url.startsWith(route))) {
      return false;
    }
    
    return this.jwtAuthService.isUserLoggedIn();
  }
}
