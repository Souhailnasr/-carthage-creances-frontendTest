import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UtilisateurService, Utilisateur } from '../../../services/utilisateur.service';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { User, Role } from '../../../shared/models';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-mes-agents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mes-agents.component.html',
  styleUrls: ['./mes-agents.component.scss']
})
export class MesAgentsComponent implements OnInit, OnDestroy {
  utilisateurs: Utilisateur[] = [];
  currentUser: User | null = null;
  loading = false;
  error: string | null = null;

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly utilisateurService: UtilisateurService,
    private readonly authService: AuthService,
    private readonly jwtAuthService: JwtAuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUtilisateurs();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadUtilisateurs(): void {
    this.loading = true;
    this.error = null;

    const request$ = this.resolveRequest();

    if (!request$) {
      this.loading = false;
      return;
    }

    this.subscriptions.add(
      request$.subscribe({
        next: (utilisateurs) => {
          this.utilisateurs = utilisateurs || [];
          this.loading = false;
          const count = utilisateurs?.length || 0;
          
          if (count === 0 && this.isChef()) {
            console.warn('⚠️ Aucun agent trouvé pour ce chef. Vérifiez que les agents ont bien un chef_createur_id associé dans la base de données.');
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des utilisateurs', error);
          console.error('❌ Détails de l\'erreur:', {
            status: error?.status,
            statusText: error?.statusText,
            message: error?.message,
            error: error?.error,
            url: error?.url
          });
          
          // Gestion spécifique des erreurs HTTP
          if (error.status === 403 || error.status === 401) {
            const errorMessage = error?.error?.message || error?.message || '';
            if (errorMessage.includes('chef') || errorMessage.includes('Chef')) {
              this.error = 'Accès non autorisé. Vous n\'avez pas les permissions nécessaires pour voir les agents de ce chef.';
            } else {
              this.error = 'Accès non autorisé. Vous n\'avez pas les permissions nécessaires pour voir ces utilisateurs.';
            }
            console.error('❌ Erreur 403/401:', errorMessage);
          } else if (error.status === 404) {
            this.error = 'Endpoint non trouvé. Vérifiez que le backend est correctement configuré.';
            console.error('❌ Endpoint non trouvé - URL:', error?.url);
          } else if (error.status === 500) {
            const serverMessage = error?.error?.message || error?.message || 'Erreur serveur lors du chargement des utilisateurs.';
            this.error = serverMessage;
            console.error('❌ Erreur serveur 500:', serverMessage);
          } else if (error.status === 0) {
            this.error = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
            console.error('❌ Erreur de connexion au serveur');
          } else if (error.message) {
            this.error = error.message;
          } else {
            this.error = 'Erreur lors du chargement des utilisateurs. Veuillez réessayer.';
          }
          
          this.loading = false;
        }
      })
    );
  }

  isActif(utilisateur: Utilisateur): boolean {
    return utilisateur?.actif === true;
  }

  getStatutClass(utilisateur: Utilisateur): string {
    return this.isActif(utilisateur) ? 'statut-actif' : 'statut-inactif';
  }

  getStatutText(utilisateur: Utilisateur): string {
    return this.isActif(utilisateur) ? 'Actif' : 'Inactif';
  }

  isSuperAdmin(): boolean {
    if (!this.currentUser?.roleUtilisateur) return false;
    const role = this.currentUser.roleUtilisateur;
    
    // Vérifier si c'est l'enum Role.SUPER_ADMIN
    return role === Role.SUPER_ADMIN;
  }

  isChef(): boolean {
    // Méthode 1: Vérifier depuis currentUser
    if (this.currentUser?.roleUtilisateur) {
      const role = this.currentUser.roleUtilisateur;
      const roleString = typeof role === 'string' ? role : String(role);
      
      // Vérifier les valeurs de l'enum directement
      const isChefEnum = 
        role === Role.CHEF_DEPARTEMENT_DOSSIER ||
        role === Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE ||
        role === Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE ||
        role === Role.CHEF_DEPARTEMENT_FINANCE;
      
      // Vérifier si c'est une string qui commence par CHEF_
      const isChefString = roleString.startsWith('CHEF_');
      
      if (isChefEnum || isChefString) {
        return true;
      }
    }
    
    // Méthode 2: Vérifier depuis le token JWT (fallback)
    const roleAuthority = this.jwtAuthService.loggedUserAuthority();
    if (roleAuthority) {
      // Normaliser le rôle (supprimer le préfixe RoleUtilisateur_ si présent)
      const normalizedRole = roleAuthority.replace(/^RoleUtilisateur_/, '');
      return normalizedRole.startsWith('CHEF_');
    }
    
    return false;
  }

  private resolveRequest(): Observable<Utilisateur[]> | null {
    if (this.isSuperAdmin()) {
      return this.utilisateurService.getAllUtilisateurs();
    }

    if (this.isChef()) {
      // Méthode 1: Essayer JwtAuthService (le plus fiable)
      let chefId: number | null = this.jwtAuthService.getCurrentUserId();
      
      // Méthode 2: Si JwtAuthService ne fonctionne pas, essayer AuthService
      if (!chefId) {
        chefId = this.authService.getCurrentUserIdNumber();
      }
      
      // Méthode 3: Si toujours pas d'ID, essayer de parser depuis currentUser.id
      if (!chefId && this.currentUser?.id) {
        const parsedId = parseInt(this.currentUser.id.toString());
        if (!isNaN(parsedId)) {
          chefId = parsedId;
        }
      }

      if (!chefId) {
        console.error('❌ Impossible de déterminer l\'identifiant du chef connecté');
        this.error = 'Impossible de déterminer l\'identifiant du chef connecté. Veuillez vous reconnecter.';
        return null;
      }

      return this.utilisateurService.getAgentsByChef(chefId);
    }

    this.error = 'Accès non autorisé. Seuls les chefs et super admins peuvent accéder à cette page.';
    return null;
  }
}

