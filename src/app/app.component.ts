import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastComponent } from './shared/components/toast/toast.component';

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
    private authService: AuthService,
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
    // Ne pas afficher la sidebar sur les pages de login, erreur, et modules avec leur propre layout
    const hideSidebarRoutes = ['/login', '/unauthorized', '/chef-amiable'];
    return !hideSidebarRoutes.some(route => url.startsWith(route)) && this.authService.isAuthenticated();
  }
}
