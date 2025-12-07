import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { NotificationCompleteService } from '../../../core/services/notification-complete.service';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import {
  SendNotificationMultipleRequest,
  SendNotificationToAgentsRequest,
  TypeNotification
} from '../../../shared/models/notification-complete.model';
import { User } from '../../../shared/models/user.model';
import { Role } from '../../../shared/models/enums.model';

@Component({
  selector: 'app-send-notification',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatListModule
  ],
  templateUrl: './send-notification.component.html',
  styleUrls: ['./send-notification.component.scss']
})
export class SendNotificationComponent implements OnInit {
  @ViewChild('selectionList') selectionList!: MatSelectionList;
  
  notificationForm: FormGroup;
  users: User[] = [];
  selectedUsers: number[] = [];
  currentUser: User | null = null;
  isChef = false;
  isSuperAdmin = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationCompleteService,
    private utilisateurService: UtilisateurService,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private snackBar: MatSnackBar
  ) {
    this.notificationForm = this.fb.group({
      type: ['NOTIFICATION_MANUELLE', Validators.required],
      titre: ['', Validators.required],
      message: ['', Validators.required],
      entiteId: [null],
      entiteType: [null]
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    // loadUsers() sera appelé dans loadCurrentUser() après avoir obtenu l'utilisateur
  }

  /**
   * Charge l'utilisateur actuel pour déterminer les permissions
   * Utilise JwtAuthService qui retourne un Observable<User>
   */
  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        if (user) {
          const role = String(user.roleUtilisateur || '');
          this.isChef = role.includes('CHEF');
          this.isSuperAdmin = role === String(Role.SUPER_ADMIN);
        }
        // Charger les utilisateurs après avoir obtenu l'utilisateur
        this.loadUsers();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        // Essayer avec AuthService en fallback
        const fallbackUser = this.authService.getCurrentUser();
        if (fallbackUser) {
          this.currentUser = fallbackUser;
          const role = String(fallbackUser.roleUtilisateur || '');
          this.isChef = role.includes('CHEF');
          this.isSuperAdmin = role === String(Role.SUPER_ADMIN);
          this.loadUsers();
        }
      }
    });
  }

  /**
   * Charge les utilisateurs selon le rôle
   */
  loadUsers(): void {
    // Attendre que loadCurrentUser soit terminé
    if (!this.currentUser) {
      setTimeout(() => this.loadUsers(), 100);
      return;
    }

    if (this.isSuperAdmin) {
      // SuperAdmin peut voir tous les utilisateurs
      this.utilisateurService.getAllUtilisateurs().subscribe({
        next: (users) => {
          console.log('📥 Utilisateurs bruts reçus du backend:', users);
          // Mapper Utilisateur vers User si nécessaire
          this.users = users.map((u: any, index: number) => {
            // Log les 3 premiers utilisateurs pour déboguer
            if (index < 3) {
              console.log(`🔍 Utilisateur ${index} brut:`, {
                id: u.id,
                userId: u.userId,
                nom: u.nom,
                prenom: u.prenom,
                allKeys: Object.keys(u)
              });
            }
            
            // Utiliser directement u.id (qui existe et est un nombre)
            // Ne pas chercher u.userId qui est undefined
            const userId = u.id;
            
            if (index < 3) {
              console.log(`🔍 Utilisateur ${index} - ID utilisé:`, userId, 'Type:', typeof userId);
            }
            
            if (userId === undefined || userId === null) {
              console.warn(`⚠️ Utilisateur ${u.nom} ${u.prenom} n'a pas d'ID!`, u);
            }
            
            return new User({
              id: String(userId || ''),
              nom: u.nom || '',
              prenom: u.prenom || '',
              email: u.email || '',
              roleUtilisateur: (u.roleUtilisateur || u.role || Role.AGENT_DOSSIER) as Role,
              actif: u.actif !== undefined ? u.actif : true
            });
          });
          
          console.log('📋 Utilisateurs mappés:', this.users.map(u => ({
            id: u.id,
            nom: u.nom,
            prenom: u.prenom,
            idNumber: this.toNumber(u.id)
          })));
        },
        error: (error) => {
          console.error('Erreur lors du chargement des utilisateurs:', error);
        }
      });
    } else if (this.isChef && this.currentUser?.id) {
      // Chef peut voir ses agents
      const chefId = Number(this.currentUser.id);
      if (chefId) {
        this.utilisateurService.getAgentsByChef(chefId).subscribe({
          next: (users) => {
            // Mapper Utilisateur vers User si nécessaire
            // Utiliser directement u.id (qui existe) au lieu de u.userId (undefined)
            this.users = users.map((u: any) => new User({
              id: String(u.id || ''),
              nom: u.nom || '',
              prenom: u.prenom || '',
              email: u.email || '',
              roleUtilisateur: (u.roleUtilisateur || u.role || Role.AGENT_DOSSIER) as Role,
              actif: u.actif !== undefined ? u.actif : true
            }));
          },
          error: (error) => {
            console.error('Erreur lors du chargement des agents:', error);
          }
        });
      }
    }
  }

  /**
   * Gère le changement de sélection de la liste
   */
  onSelectionListChange(event: any): void {
    console.log('🔍 onSelectionListChange appelé:', event);
    
    // Mettre à jour selectedUsers immédiatement depuis selectionList
    this.updateSelectedUsersFromList();
  }

  /**
   * Met à jour selectedUsers depuis selectionList
   */
  private updateSelectedUsersFromList(): void {
    if (this.selectionList) {
      const selectedOptions = this.selectionList.selectedOptions.selected;
      console.log('🔍 updateSelectedUsersFromList - Options sélectionnées:', selectedOptions.length);
      console.log('🔍 updateSelectedUsersFromList - Valeurs brutes:', selectedOptions.map((opt: any) => ({
        value: opt.value,
        valueType: typeof opt.value,
        selected: opt.selected
      })));
      
      // Vérifier aussi les utilisateurs disponibles pour comparer
      console.log('🔍 Utilisateurs disponibles pour comparaison:', this.users.map(u => ({
        id: u.id,
        idType: typeof u.id,
        idNumber: this.toNumber(u.id),
        nom: u.nom,
        prenom: u.prenom
      })));
      
      this.selectedUsers = selectedOptions.map((option: any) => {
        const value = option.value;
        const numValue = typeof value === 'string' ? parseInt(value, 10) : Number(value);
        console.log(`🔍 Conversion: "${value}" (${typeof value}) -> ${numValue} (${typeof numValue})`);
        
        // Vérifier que cet ID correspond à un utilisateur réel
        const userFound = this.users.find(u => this.toNumber(u.id) === numValue);
        if (!userFound) {
          console.warn(`⚠️ ID ${numValue} ne correspond à aucun utilisateur dans la liste!`);
        } else {
          console.log(`✅ ID ${numValue} correspond à: ${userFound.nom} ${userFound.prenom}`);
        }
        
        return isNaN(numValue) ? 0 : numValue;
      }).filter(id => id > 0); // Filtrer les IDs invalides
      
      console.log('📋 selectedUsers mis à jour:', this.selectedUsers);
      console.log('📋 selectedUsers.length:', this.selectedUsers.length);
    } else {
      console.warn('⚠️ selectionList non disponible');
      // Réessayer après un court délai si selectionList n'est pas encore disponible
      setTimeout(() => {
        if (this.selectionList) {
          this.updateSelectedUsersFromList();
        }
      }, 50);
    }
  }

  /**
   * Toggle la sélection d'un utilisateur (méthode alternative si nécessaire)
   */
  toggleUserSelection(userId: string | number, event: any): void {
    // Cette méthode est appelée par l'événement selectionChange de chaque option
    // Mais on utilise maintenant onSelectionListChange pour synchroniser
    const id = Number(userId);
    console.log('🔍 toggleUserSelection appelé pour userId:', id, 'event:', event);
    
    // Synchroniser avec la liste après un court délai pour laisser Angular mettre à jour
    setTimeout(() => {
      if (this.selectionList) {
        const selectedOptions = this.selectionList.selectedOptions.selected;
        this.selectedUsers = selectedOptions.map((option: any) => Number(option.value));
        console.log('📋 selectedUsers synchronisé:', this.selectedUsers);
      }
    }, 0);
  }

  /**
   * Obtient les noms des utilisateurs sélectionnés
   */
  getSelectedUsersNames(): string {
    return this.selectedUsers
      .map(id => {
        const user = this.users.find(u => this.toNumber(u.id) === id);
        return user ? `${user.nom} ${user.prenom}` : '';
      })
      .filter(name => name !== '')
      .join(', ');
  }

  /**
   * Envoie la notification
   */
  sendNotification(): void {
    if (this.notificationForm.invalid) {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
      return;
    }

    this.loading = true;
    const formValue = this.notificationForm.value;

    // CRITIQUE: Synchroniser selectedUsers depuis selectionList AVANT toute vérification
    this.updateSelectedUsersFromList();

    // Attendre un court instant pour s'assurer que la synchronisation est terminée
    setTimeout(() => {
      // Log pour déboguer
      console.log('📤 sendNotification appelé');
      console.log('📋 selectedUsers:', this.selectedUsers);
      console.log('📋 selectedUsers.length:', this.selectedUsers.length);
      console.log('👤 isSuperAdmin:', this.isSuperAdmin);
      console.log('📋 selectionList disponible:', !!this.selectionList);
      if (this.selectionList) {
        const selectedCount = this.selectionList.selectedOptions.selected.length;
        console.log('📋 Options sélectionnées dans selectionList:', selectedCount);
        console.log('📋 Valeurs sélectionnées:', this.selectionList.selectedOptions.selected.map((opt: any) => opt.value));
      }

      this.executeSendNotification(formValue);
    }, 50);
  }

  /**
   * Exécute l'envoi de la notification après synchronisation
   */
  private executeSendNotification(formValue: any): void {

    // PRIORITÉ 1: SuperAdmin avec utilisateurs sélectionnés → envoyer uniquement aux utilisateurs sélectionnés
    if (this.isSuperAdmin && this.selectedUsers.length > 0) {
      console.log('✅ MODE: Envoi à des utilisateurs spécifiques');
      console.log('📤 Utilisateurs sélectionnés:', this.selectedUsers);
      
      // Vérification supplémentaire: s'assurer que les IDs sont valides
      const validUserIds = this.selectedUsers.filter(id => id > 0 && !isNaN(id));
      if (validUserIds.length === 0) {
        console.error('❌ Aucun ID utilisateur valide trouvé!');
        console.error('❌ selectedUsers:', this.selectedUsers);
        console.error('❌ users disponibles:', this.users.map(u => ({ id: u.id, nom: u.nom, prenom: u.prenom, idNumber: this.toNumber(u.id) })));
        this.snackBar.open('Erreur: Aucun utilisateur valide sélectionné', 'Fermer', { duration: 3000 });
        this.loading = false;
        return;
      }
      
      // Vérifier que les IDs sélectionnés correspondent à des utilisateurs réels
      const validIdsFromUsers = validUserIds.filter(id => {
        const userExists = this.users.some(u => this.toNumber(u.id) === id);
        if (!userExists) {
          console.warn(`⚠️ ID ${id} sélectionné mais utilisateur non trouvé dans la liste!`);
        }
        return userExists;
      });
      
      if (validIdsFromUsers.length === 0) {
        console.error('❌ Aucun ID utilisateur ne correspond à un utilisateur réel!');
        console.error('❌ IDs sélectionnés:', validUserIds);
        console.error('❌ IDs disponibles:', this.users.map(u => this.toNumber(u.id)));
        this.snackBar.open('Erreur: Les IDs sélectionnés ne correspondent à aucun utilisateur', 'Fermer', { duration: 3000 });
        this.loading = false;
        return;
      }
      
      // Utiliser les IDs validés
      const finalUserIds = validIdsFromUsers;
      console.log('✅ IDs utilisateur validés:', finalUserIds);

      // Construire la requête en excluant les champs null/undefined
      const request: SendNotificationMultipleRequest = {
        userIds: finalUserIds,
        type: formValue.type,
        titre: formValue.titre,
        message: formValue.message
      };
      
      // Ajouter entiteId seulement s'il est défini et valide
      if (formValue.entiteId !== null && formValue.entiteId !== undefined && formValue.entiteId !== '') {
        const entiteIdNum = Number(formValue.entiteId);
        if (!isNaN(entiteIdNum) && entiteIdNum > 0) {
          request.entiteId = entiteIdNum;
        }
      }
      
      // Ajouter entiteType seulement s'il est défini
      if (formValue.entiteType !== null && formValue.entiteType !== undefined && formValue.entiteType !== '') {
        request.entiteType = formValue.entiteType;
      }
      
      console.log('📤 Request envoyée à /envoyer-multiples:', JSON.stringify(request, null, 2));
      console.log('📤 Détails de la requête:', {
        userIds: request.userIds,
        userIdsLength: request.userIds.length,
        type: request.type,
        titre: request.titre,
        messageLength: request.message?.length,
        hasEntiteId: !!request.entiteId,
        hasEntiteType: !!request.entiteType
      });
      
      this.notificationService.envoyerNotificationMultiples(request).subscribe({
        next: (response) => {
          console.log('✅ Réponse reçue:', response);
          // Afficher le message de succès du backend si présent, sinon message par défaut
          const successMessage = response.message || `Notification envoyée à ${response.count} utilisateur(s) sélectionné(s)`;
          this.snackBar.open(successMessage, 'Fermer', { duration: 3000 });
          this.notificationForm.reset();
          this.selectedUsers = [];
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors de l\'envoi à des utilisateurs spécifiques:', error);
          console.error('❌ Status:', error?.status);
          console.error('❌ StatusText:', error?.statusText);
          console.error('❌ Error body:', error?.error);
          
          // Si l'erreur est 400 (Bad Request), essayer d'envoyer à tous les utilisateurs comme fallback
          // C'est le comportement qui fonctionnait avant
          if (error?.status === 400) {
            console.warn('⚠️ L\'envoi à des utilisateurs spécifiques a échoué (400). Tentative d\'envoi à tous les utilisateurs (comportement précédent)...');
            
            // Construire la requête pour envoyer à tous
            const requestToAll: SendNotificationToAgentsRequest = {
              type: formValue.type,
              titre: formValue.titre,
              message: formValue.message
            };
            
            // Ajouter entiteId seulement s'il est défini et valide
            if (formValue.entiteId !== null && formValue.entiteId !== undefined && formValue.entiteId !== '') {
              const entiteIdNum = Number(formValue.entiteId);
              if (!isNaN(entiteIdNum) && entiteIdNum > 0) {
                requestToAll.entiteId = entiteIdNum;
              }
            }
            
            // Ajouter entiteType seulement s'il est défini
            if (formValue.entiteType !== null && formValue.entiteType !== undefined && formValue.entiteType !== '') {
              requestToAll.entiteType = formValue.entiteType;
            }
            
            // Essayer d'envoyer à tous les utilisateurs
            this.notificationService.envoyerNotificationATous(requestToAll).subscribe({
              next: (response) => {
                console.log('✅ Notification envoyée à tous les utilisateurs (fallback):', response);
                this.snackBar.open(`Notification envoyée à ${response.count} utilisateur(s) (tous les utilisateurs)`, 'Fermer', { duration: 3000 });
                this.notificationForm.reset();
                this.selectedUsers = [];
                this.loading = false;
              },
              error: (fallbackError) => {
                console.error('❌ Erreur lors de l\'envoi à tous les utilisateurs (fallback):', fallbackError);
                // Extraire le message d'erreur du backend (format: {"error": "message"})
                let errorMsg = 'Erreur lors de l\'envoi de la notification';
                if (fallbackError?.error) {
                  if (typeof fallbackError.error === 'string') {
                    errorMsg = fallbackError.error;
                  } else if (fallbackError.error.error) {
                    errorMsg = fallbackError.error.error;
                  } else if (fallbackError.error.message) {
                    errorMsg = fallbackError.error.message;
                  }
                } else if (fallbackError?.message) {
                  errorMsg = fallbackError.message;
                }
                this.snackBar.open(`Erreur: ${errorMsg}`, 'Fermer', { duration: 5000 });
                this.loading = false;
              }
            });
          } else {
            // Pour les autres erreurs, afficher le message d'erreur explicite du backend
            // Le backend retourne maintenant {"error": "message explicite"}
            let errorMsg = 'Erreur inconnue';
            if (error?.error) {
              if (typeof error.error === 'string') {
                // Format: erreur directe en string
                errorMsg = error.error;
              } else if (error.error.error) {
                // Format backend: {"error": "message explicite"}
                errorMsg = error.error.error;
              } else if (error.error.message) {
                // Format alternatif: {"message": "message explicite"}
                errorMsg = error.error.message;
              } else {
                // Format inconnu, essayer de stringifier
                errorMsg = JSON.stringify(error.error);
              }
            } else if (error?.message) {
              errorMsg = error.message;
            }
            
            console.error('❌ Message d\'erreur final:', errorMsg);
            this.snackBar.open(`Erreur: ${errorMsg}`, 'Fermer', { duration: 5000 });
            this.loading = false;
          }
        }
      });
      return; // Important : arrêter l'exécution ici
    }

    // PRIORITÉ 2: Chef (mais pas SuperAdmin) → envoyer à tous les agents du chef
    if (this.isChef && !this.isSuperAdmin) {
      console.log('📤 Envoi à tous les agents du chef');
      const chefId = this.jwtAuthService.getCurrentUserId();
      if (!chefId) {
        this.snackBar.open('Impossible de déterminer l\'ID du chef', 'Fermer', { duration: 3000 });
        this.loading = false;
        return;
      }
      // Construire la requête en excluant les champs null/undefined
      const request: SendNotificationToAgentsRequest = {
        type: formValue.type,
        titre: formValue.titre,
        message: formValue.message
      };
      
      // Ajouter entiteId seulement s'il est défini et valide
      if (formValue.entiteId !== null && formValue.entiteId !== undefined && formValue.entiteId !== '') {
        const entiteIdNum = Number(formValue.entiteId);
        if (!isNaN(entiteIdNum) && entiteIdNum > 0) {
          request.entiteId = entiteIdNum;
        }
      }
      
      // Ajouter entiteType seulement s'il est défini
      if (formValue.entiteType !== null && formValue.entiteType !== undefined && formValue.entiteType !== '') {
        request.entiteType = formValue.entiteType;
      }
      
      this.notificationService.envoyerNotificationAAgentsChef(chefId, request).subscribe({
        next: (response) => {
          const successMessage = response.message || `Notification envoyée à ${response.count} agent(s)`;
          this.snackBar.open(successMessage, 'Fermer', { duration: 3000 });
          this.notificationForm.reset();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de l\'envoi:', error);
          // Extraire le message d'erreur du backend (format: {"error": "message"})
          let errorMsg = 'Erreur lors de l\'envoi de la notification';
          if (error?.error) {
            if (typeof error.error === 'string') {
              errorMsg = error.error;
            } else if (error.error.error) {
              errorMsg = error.error.error;
            } else if (error.error.message) {
              errorMsg = error.error.message;
            }
          } else if (error?.message) {
            errorMsg = error.message;
          }
          this.snackBar.open(`Erreur: ${errorMsg}`, 'Fermer', { duration: 5000 });
          this.loading = false;
        }
      });
      return; // Important : arrêter l'exécution ici
    }

    // PRIORITÉ 3: SuperAdmin sans utilisateurs sélectionnés → envoyer à tous les utilisateurs
    if (this.isSuperAdmin && this.selectedUsers.length === 0) {
      console.log('✅ MODE: Envoi à tous les utilisateurs (aucun utilisateur sélectionné)');
      console.log('📋 selectedUsers est vide, envoi à tous');
      // Construire la requête en excluant les champs null/undefined
      const request: SendNotificationToAgentsRequest = {
        type: formValue.type,
        titre: formValue.titre,
        message: formValue.message
      };
      
      // Ajouter entiteId seulement s'il est défini et valide
      if (formValue.entiteId !== null && formValue.entiteId !== undefined && formValue.entiteId !== '') {
        const entiteIdNum = Number(formValue.entiteId);
        if (!isNaN(entiteIdNum) && entiteIdNum > 0) {
          request.entiteId = entiteIdNum;
        }
      }
      
      // Ajouter entiteType seulement s'il est défini
      if (formValue.entiteType !== null && formValue.entiteType !== undefined && formValue.entiteType !== '') {
        request.entiteType = formValue.entiteType;
      }
      
      this.notificationService.envoyerNotificationATous(request).subscribe({
        next: (response) => {
          const successMessage = response.message || `Notification envoyée à ${response.count} utilisateur(s)`;
          this.snackBar.open(successMessage, 'Fermer', { duration: 3000 });
          this.notificationForm.reset();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de l\'envoi:', error);
          // Extraire le message d'erreur du backend (format: {"error": "message"})
          let errorMsg = 'Erreur lors de l\'envoi de la notification';
          if (error?.error) {
            if (typeof error.error === 'string') {
              errorMsg = error.error;
            } else if (error.error.error) {
              errorMsg = error.error.error;
            } else if (error.error.message) {
              errorMsg = error.error.message;
            }
          } else if (error?.message) {
            errorMsg = error.message;
          }
          this.snackBar.open(`Erreur: ${errorMsg}`, 'Fermer', { duration: 5000 });
          this.loading = false;
        }
      });
      return; // Important : arrêter l'exécution ici
    }

    // Si aucune condition n'est remplie
    this.snackBar.open('Impossible d\'envoyer la notification. Vérifiez vos permissions.', 'Fermer', { duration: 3000 });
    this.loading = false;
  }

  /**
   * Convertit un ID string en number
   */
  toNumber(id: string | number): number {
    return Number(id);
  }
}
