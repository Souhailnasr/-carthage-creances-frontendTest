# 🤖 Prompts Cursor AI - Intégration Frontend et Interfaces Chefs

## 📋 Table des Matières

1. [Prompts pour l'Intégration des APIs](#1-prompts-pour-lintégration-des-apis)
2. [Prompts pour les Interfaces Chefs Recouvrement Amiable](#2-prompts-pour-les-interfaces-chefs-recouvrement-amiable)
3. [Prompts pour les Tests et Validation](#3-prompts-pour-les-tests-et-validation)
4. [Prompts pour la Gestion des Erreurs](#4-prompts-pour-la-gestion-des-erreurs)

---

## 1. Prompts pour l'Intégration des APIs

### 📋 PROMPT 1 : Mettre à Jour le Service DossierService

```
Dans le projet Angular, localisez le service DossierService (src/app/services/dossier.service.ts ou src/app/core/services/dossier-api.service.ts).

Ajoutez les méthodes suivantes pour consommer les nouvelles APIs d'affectation et de filtrage :

1. getDossiersRecouvrementAmiable(params?: {page?: number, size?: number, sort?: string}): Observable<Page<DossierApi>>
   - GET /api/dossiers/recouvrement-amiable
   - Paramètres optionnels : page (défaut: 0), size (défaut: 10), sort (défaut: "dateCreation")
   - Retourne un objet Page<DossierApi> avec la liste des dossiers et les métadonnées de pagination
   - Filtre automatiquement : typeRecouvrement = AMIABLE, valide = true, dossierStatus = ENCOURSDETRAITEMENT
   - Gère les erreurs : 400 (paramètres invalides), 500 (erreur serveur)
   - Implémente un fallback vers getAllDossiers() avec filtre côté client si l'endpoint n'existe pas

2. getDossiersRecouvrementJuridique(params?: {page?: number, size?: number, sort?: string}): Observable<Page<DossierApi>>
   - GET /api/dossiers/recouvrement-juridique
   - Même logique que pour amiable mais pour le recouvrement juridique
   - Filtre automatiquement : typeRecouvrement = JURIDIQUE, valide = true, dossierStatus = ENCOURSDETRAITEMENT

3. affecterAuRecouvrementAmiable(dossierId: number): Observable<DossierApi>
   - PUT /api/dossiers/{dossierId}/affecter/recouvrement-amiable
   - Retourne le dossier mis à jour
   - Gère les erreurs : 400 (dossier non validé, chef non trouvé, avocat/huissier présent), 404 (dossier non trouvé), 500
   - Affiche des messages d'erreur clairs en français

4. affecterAuRecouvrementJuridique(dossierId: number): Observable<DossierApi>
   - PUT /api/dossiers/{dossierId}/affecter/recouvrement-juridique
   - Retourne le dossier mis à jour
   - Gère les erreurs : 400 (dossier non validé, chef non trouvé), 404 (dossier non trouvé), 500

5. cloturerDossier(dossierId: number): Observable<DossierApi>
   - PUT /api/dossiers/{dossierId}/cloturer
   - Retourne le dossier clôturé
   - Gère les erreurs : 400 (dossier non validé), 404 (dossier non trouvé), 500

6. getDossiersValidesDisponibles(params?: {page?: number, size?: number, sort?: string, direction?: string, search?: string}): Observable<Page<DossierApi>>
   - GET /api/dossiers/valides-disponibles
   - Paramètres optionnels pour pagination, tri et recherche
   - Retourne un objet Page<DossierApi> avec la liste des dossiers et les métadonnées de pagination
   - Implémente un fallback vers getAllDossiers() avec filtre côté client si l'endpoint n'existe pas

IMPORTANT :
- Utilisez HttpClient avec les headers Authorization si nécessaire
- Ajoutez la gestion d'erreurs avec catchError et throwError
- Utilisez des messages d'erreur en français
- Loggez les erreurs avec console.error pour le débogage
- Retournez des Observables typés
- Implémentez un mécanisme de fallback pour les endpoints qui n'existent pas encore
```

---

### 📋 PROMPT 2 : Créer le Modèle TypeRecouvrement

```
Dans le projet Angular, vérifiez et mettez à jour le modèle TypeRecouvrement :

1. Vérifiez si l'enum TypeRecouvrement existe dans src/app/shared/models/dossier-api.model.ts
   - Si oui, vérifiez qu'il contient : NON_AFFECTE = 'NON_AFFECTE', AMIABLE = 'AMIABLE', JURIDIQUE = 'JURIDIQUE'
   - Si non, créez-le avec ces valeurs

2. Vérifiez que l'interface DossierApi dans le même fichier inclut :
   - typeRecouvrement?: TypeRecouvrement
   - Tous les champs nécessaires : id, titre, description, numeroDossier, montantCreance
   - statut, valide, dossierStatus
   - agentCreateur, agentResponsable
   - dateCreation, dateCloture
   - creancier, debiteur, urgence
   - avocat, huissier (optionnels)

3. Vérifiez que l'interface DossierRequest inclut aussi :
   - typeRecouvrement?: TypeRecouvrement

4. Exportez TypeRecouvrement depuis le fichier pour qu'il soit utilisable dans tout le projet
```

---

### 📋 PROMPT 3 : Créer le Composant Liste Dossiers Recouvrement Amiable

```
Dans le projet Angular, créez ou mettez à jour le composant pour afficher les dossiers de recouvrement amiable :

Fichier : src/app/dossier/components/dossiers-amiable/dossiers-amiable.component.ts

Fonctionnalités requises :

1. Propriétés :
   - dossiers: DossierApi[] = []
   - page: number = 0
   - size: number = 10
   - totalElements: number = 0
   - totalPages: number = 0
   - loading: boolean = false
   - error: string | null = null
   - searchTerm: string = ''
   - sortBy: string = 'dateCreation'
   - sortDirection: 'asc' | 'desc' = 'desc'

2. Méthodes :
   - ngOnInit(): void - Charge les dossiers au démarrage
   - loadDossiers(): void - Charge les dossiers avec pagination
   - onPageChange(page: number): void - Gère le changement de page
   - onSizeChange(size: number): void - Gère le changement de taille de page
   - onSearchChange(term: string): void - Gère la recherche avec debounce
   - onSortChange(field: string): void - Gère le tri
   - refreshDossiers(): void - Rafraîchit la liste
   - getStatutBadgeClass(statut: string): string - Retourne la classe CSS pour le badge de statut
   - getUrgenceBadgeClass(urgence: Urgence | string): string - Retourne la classe CSS pour le badge d'urgence
   - formatAmount(amount: number): string - Formate le montant en devise
   - formatDate(date: string | Date): string - Formate la date

3. Intégration :
   - Utilisez DossierApiService pour charger les dossiers
   - Affichez un loader pendant le chargement
   - Affichez les erreurs de manière user-friendly avec MatSnackBar
   - Implémentez la pagination avec mat-paginator
   - Implémentez le tri avec mat-sort
   - Utilisez debounceTime pour la recherche

4. Template HTML :
   - Tableau avec colonnes : Numéro, Titre, Montant, Créancier, Débiteur, Statut, Urgence, Date Création, Actions
   - Bouton "Rafraîchir"
   - Champ de recherche avec debounce
   - Pagination en bas
   - Messages d'erreur et de chargement
   - Statistiques en haut (total dossiers, montant total, etc.)
```

---

### 📋 PROMPT 4 : Créer le Template HTML pour Liste Dossiers Amiable

```
Dans le projet Angular, créez ou mettez à jour le template HTML pour le composant dossiers-amiable :

Fichier : src/app/dossier/components/dossiers-amiable/dossiers-amiable.component.html

Structure requise :

1. En-tête :
   - Titre "Dossiers Affectés au Recouvrement Amiable"
   - Statistiques (cards) : Total dossiers, Montant total, En cours, Urgents
   - Bouton "Rafraîchir" avec icône
   - Bouton "Exporter" (optionnel)

2. Zone de recherche et filtres :
   - Champ de recherche avec placeholder "Rechercher un dossier..."
   - Filtres avancés (mat-expansion-panel) :
     * Filtre par statut
     * Filtre par urgence
     * Filtre par date
   - Bouton "Réinitialiser les filtres"

3. Tableau des dossiers :
   - Colonnes : Numéro, Titre, Montant, Créancier, Débiteur, Statut, Urgence, Date Création, Actions
   - Lignes cliquables pour voir les détails
   - Badges colorés pour statut et urgence
   - Format de date lisible (ex: "15 Nov 2025")
   - Format de montant avec devise (ex: "1 500,00 TND")

4. Actions par ligne :
   - Bouton "Voir Détails" (icône visibility)
   - Bouton "Clôturer" (icône check_circle) - si le dossier est validé et non clôturé
   - Bouton "Réaffecter au Juridique" (icône gavel) - si nécessaire

5. Pagination :
   - Utilisez mat-paginator
   - Affichez "Page X sur Y"
   - Options de taille de page : 5, 10, 25, 50

6. États :
   - Message "Aucun dossier trouvé" si la liste est vide
   - Spinner de chargement (mat-spinner) pendant le chargement
   - Message d'erreur en cas d'erreur (mat-snack-bar)

7. Styles :
   - Utilisez Angular Material
   - Responsive design
   - Couleurs cohérentes avec le thème de l'application
   - Classes CSS pour les badges de statut et urgence
```

---

### 📋 PROMPT 5 : Créer le Composant Détails Dossier avec Actions

```
Dans le projet Angular, créez ou mettez à jour le composant de détails de dossier :

Fichier : src/app/dossier/components/dossier-details/dossier-details.component.ts

Fonctionnalités requises :

1. Propriétés :
   - dossier: DossierApi | null = null
   - dossierId: number | null = null
   - loading: boolean = false
   - error: string | null = null
   - canCloturer: boolean = false
   - canReaffecter: boolean = false
   - canAffecterAmiable: boolean = false
   - canAffecterJuridique: boolean = false

2. Méthodes :
   - ngOnInit(): void - Charge le dossier si dossierId est fourni
   - loadDossier(id: number): void - Charge un dossier par ID
   - cloturerDossier(): void - Clôture le dossier avec confirmation
   - affecterAuRecouvrementAmiable(): void - Affecte au recouvrement amiable avec confirmation
   - affecterAuRecouvrementJuridique(): void - Affecte au recouvrement juridique avec confirmation
   - confirmerAction(message: string, title: string, warning?: boolean): Promise<boolean> - Affiche un dialog de confirmation
   - afficherMessage(type: 'success' | 'error', message: string): void - Affiche un message avec MatSnackBar
   - formatAmount(amount: number): string - Formate le montant
   - formatDate(date: string | Date): string - Formate la date

3. Logique métier :
   - canCloturer = dossier.valide && !dossier.dateCloture && dossier.statut !== 'CLOTURE'
   - canAffecterAmiable = dossier.valide && dossier.statut === 'VALIDE' && !dossier.dateCloture && !dossier.avocat && !dossier.huissier
   - canAffecterJuridique = dossier.valide && dossier.statut === 'VALIDE' && !dossier.dateCloture
   - canReaffecter = dossier.typeRecouvrement === TypeRecouvrement.AMIABLE && dossier.valide && !dossier.dateCloture

4. Intégration :
   - Utilisez DossierApiService pour les opérations
   - Utilisez MatDialog pour les confirmations (ConfirmationDialogComponent)
   - Utilisez MatSnackBar pour les messages
   - Redirigez après clôture réussie si nécessaire
   - Émettez un événement après affectation pour rafraîchir les listes
```

---

### 📋 PROMPT 6 : Créer le Template Détails Dossier avec Actions

```
Dans le projet Angular, créez ou mettez à jour le template HTML pour les détails de dossier :

Fichier : src/app/dossier/components/dossier-details/dossier-details.component.html

Structure requise :

1. En-tête :
   - Titre du dossier (mat-card-title)
   - Badge du statut (VALIDÉ, EN_ATTENTE, CLÔTURÉ) avec classe CSS
   - Badge du type de recouvrement (AMIABLE, JURIDIQUE, NON_AFFECTÉ) avec classe CSS
   - Badge d'urgence avec icône et classe CSS

2. Informations principales (mat-card) :
   - Numéro de dossier
   - Montant de créance (formaté en devise avec mat-chip)
   - Date de création (formatée)
   - Date de clôture (si applicable, formatée)
   - Agent créateur (nom et email)
   - Agent responsable (nom et email, si présent)

3. Informations complémentaires (mat-expansion-panel) :
   - Description (expandable)
   - Créancier (nom, email, téléphone, adresse)
   - Débiteur (nom, email, téléphone, adresse)
   - Documents joints (contrat, pouvoir) avec liens de téléchargement

4. Section Actions (mat-card-actions) :
   - Bouton "Clôturer" (si canCloturer = true)
     * Couleur : warn
     * Icône : lock
     * Confirmation requise avec dialog
   - Bouton "Affecter au Recouvrement Amiable" (si canAffecterAmiable = true)
     * Couleur : primary
     * Icône : handshake
     * Confirmation requise
   - Bouton "Affecter au Recouvrement Juridique" (si canAffecterJuridique = true)
     * Couleur : accent
     * Icône : gavel
     * Confirmation requise
   - Bouton "Réaffecter au Juridique" (si canReaffecter = true)
     * Couleur : accent
     * Icône : swap_horiz
     * Confirmation requise avec warning
   - Bouton "Retour à la liste"
   - Bouton "Imprimer" (optionnel)

5. États :
   - Spinner (mat-spinner) pendant le chargement
   - Message d'erreur si erreur (mat-snack-bar)
   - Message "Dossier non trouvé" si null

6. Styles :
   - Utilisez des cards Material Design (mat-card)
   - Sections bien séparées avec espacement
   - Responsive avec flexbox/grid
   - Couleurs cohérentes pour les badges
```

---

## 2. Prompts pour les Interfaces Chefs Recouvrement Amiable

### 📋 PROMPT 7 : Créer le Module Dashboard Chef Recouvrement Amiable

```
Dans le projet Angular, vérifiez et mettez à jour le module pour le dashboard du chef de recouvrement amiable :

Fichier : src/app/chef-amiable/chef-amiable.module.ts

Structure requise :

1. Vérifiez que le module existe et contient :
   - CommonModule
   - FormsModule, ReactiveFormsModule
   - HttpClientModule (ou HttpClient dans le root)
   - RouterModule
   - Angular Material modules :
     * MatTableModule, MatPaginatorModule, MatSortModule
     * MatButtonModule, MatCardModule
     * MatDialogModule, MatSnackBarModule
     * MatIconModule, MatBadgeModule
     * MatProgressSpinnerModule
     * MatFormFieldModule, MatInputModule, MatSelectModule
     * MatExpansionModule, MatChipsModule

2. Components (standalone ou déclarés) :
   - ChefAmiableDashboardComponent (dashboard principal)
   - DossiersAmiableComponent (liste des dossiers)
   - GestionActionsComponent (gestion des actions)
   - ChefAmiableLayoutComponent (layout avec sidebar)

3. Routes (dans chef-amiable-routing.module.ts) :
   - /chef-amiable/dashboard
   - /chef-amiable/gestion-actions
   - /chef-amiable/dossiers (redirige vers /dossiers/amiable)
   - /chef-amiable/gestion-utilisateurs
   - /chef-amiable/taches
   - /chef-amiable/notifications

4. Guards :
   - AuthGuard (vérifie l'authentification)
   - RoleGuard (vérifie que l'utilisateur est chef amiable) - optionnel

5. Services :
   - ChefAmiableService (service dédié)
   - DossierApiService (injecté)
   - UtilisateurService (injecté)
```

---

### 📋 PROMPT 8 : Créer le Service Chef Recouvrement Amiable

```
Dans le projet Angular, vérifiez et mettez à jour le service dédié pour le chef de recouvrement amiable :

Fichier : src/app/chef-amiable/services/chef-amiable.service.ts

Fonctionnalités requises :

1. Méthodes pour les dossiers :
   - getDossiersAvecActions(): Observable<DossierApi[]>
     - Charge les dossiers affectés au recouvrement amiable
     - Utilise DossierApiService.getDossiersRecouvrementAmiable()
     - Retourne les dossiers avec leurs actions associées

   - getDossierById(id: number): Observable<DossierApi>
     - Charge un dossier par ID
     - Utilise DossierApiService.getDossierById()

   - getDossiersParAgent(agentId: number): Observable<DossierApi[]>
     - Charge les dossiers assignés à un agent spécifique
     - Filtre les dossiers par agentResponsable

   - getDossiersEnAttente(): Observable<DossierApi[]>
     - Charge les dossiers en attente d'assignation

   - getDossiersEnCours(): Observable<DossierApi[]>
     - Charge les dossiers en cours de traitement

   - getDossiersClotures(): Observable<DossierApi[]>
     - Charge les dossiers clôturés

2. Méthodes pour les actions :
   - assignerDossierAagent(dossierId: number, agentId: number): Observable<DossierApi>
     - PUT /api/dossiers/{dossierId}/assign/agent?agentId={agentId}
     - Assigne un dossier à un agent
     - Retourne le dossier mis à jour

   - cloturerDossier(dossierId: number): Observable<DossierApi>
     - Utilise DossierApiService.cloturerDossier()
     - Retourne le dossier clôturé

   - reaffecterAuJuridique(dossierId: number): Observable<DossierApi>
     - Utilise DossierApiService.affecterAuRecouvrementJuridique()
     - Réaffecte un dossier au recouvrement juridique

3. Méthodes pour les statistiques :
   - getStatistiques(): Observable<StatistiqueAmiable>
     - Calcule les statistiques depuis les dossiers réels
     - Utilise DossierApiService.getDossiersRecouvrementAmiable()
     - Calcule : totalDossiers, dossiersEnCours, dossiersClotures, montantEnCours, etc.

4. Méthodes pour les agents :
   - getMesAgents(): Observable<User[]>
     - Charge les agents du département recouvrement amiable
     - Utilise UtilisateurService.getUtilisateursByRole('AGENT_RECOUVREMENT_AMIABLE')

   - getAgentsDisponibles(): Observable<User[]>
     - Charge les agents avec moins de dossiers assignés
     - Trie par nombre de dossiers croissant

5. Gestion d'erreurs :
   - Messages d'erreur en français
   - Logging pour débogage
   - Retry logic pour les erreurs réseau (optionnel)
```

---

### 📋 PROMPT 9 : Créer le Composant Dashboard Chef Recouvrement Amiable

```
Dans le projet Angular, vérifiez et mettez à jour le composant principal du dashboard du chef :

Fichier : src/app/chef-amiable/components/chef-amiable-dashboard/chef-amiable-dashboard.component.ts

Fonctionnalités requises :

1. Structure du dashboard :
   - Statistiques en haut (cards)
   - Liste des agents avec leurs performances
   - Graphiques et tableaux (optionnel)

2. Propriétés :
   - currentUser: User | null = null
   - statistiques: StatistiqueAmiable = new StatistiqueAmiable()
   - agentsActifs: User[] = []
   - totalDossiers: number = 0
   - totalMontant: number = 0
   - dossiersEnCours: number = 0
   - dossiersUrgents: number = 0
   - loading: boolean = false

3. Méthodes :
   - ngOnInit(): void - Charge les données initiales
   - loadCurrentUser(): void - Charge l'utilisateur connecté
   - loadAgents(): void - Charge les agents actifs
   - loadDossiersStats(): void - Charge et calcule les statistiques depuis les dossiers réels
   - getRoleDisplayName(): string - Retourne le nom d'affichage du rôle
   - formatAmount(amount: number): string - Formate le montant

4. Intégration :
   - Utilisez JwtAuthService pour l'utilisateur connecté
   - Utilisez ChefAmiableService pour les statistiques et agents
   - Utilisez DossierApiService pour charger les dossiers réels
   - Calculez les statistiques depuis les données réelles, pas depuis des données mockées

5. Template :
   - Affichez le nom et le rôle du chef connecté
   - Affichez les statistiques réelles (totalDossiers, totalMontant, etc.)
   - Affichez la liste des agents avec leurs informations
   - Utilisez des cards Material Design
```

---

### 📋 PROMPT 10 : Créer le Template Dashboard Chef avec Navigation

```
Dans le projet Angular, vérifiez et mettez à jour le template HTML pour le dashboard du chef :

Fichier : src/app/chef-amiable/components/chef-amiable-dashboard/chef-amiable-dashboard.component.html

Structure requise :

1. Section Welcome :
   - Message de bienvenue avec le nom du chef
   - Badge du rôle (Chef Département Recouvrement Amiable)
   - Date du jour

2. Statistiques (cards en grid) :
   - Total Dossiers (avec icône folder)
   - Montant Total (avec icône money, formaté en devise)
   - En Cours (avec icône clock)
   - Urgents (avec icône warning, couleur rouge)
   - Clôturés (avec icône check_circle)
   - Taux de Réussite (avec icône percent, formaté en pourcentage)

3. Section Agents :
   - Titre "Agents Actifs"
   - Liste des agents en grid ou cards :
     * Avatar avec initiales
     * Nom et prénom
     * Email
     * Badge du rôle
     * Nombre de dossiers assignés (optionnel)

4. Section Performances (optionnel) :
   - Graphiques ou tableaux de performance
   - Top agents par performance

5. Actions rapides :
   - Bouton "Voir tous les dossiers" (lien vers /dossiers/amiable)
   - Bouton "Gérer les actions" (lien vers /chef-amiable/gestion-actions)
   - Bouton "Gérer les agents" (lien vers /chef-amiable/gestion-utilisateurs)

6. Styles :
   - Utilisez Angular Material
   - Grid responsive
   - Cards avec ombres
   - Couleurs cohérentes
   - Espacement approprié
```

---

### 📋 PROMPT 11 : Créer le Composant Liste Dossiers avec Filtres et Actions

```
Dans le projet Angular, vérifiez et mettez à jour le composant avancé pour la liste des dossiers :

Fichier : src/app/dossier/components/dossiers-amiable/dossiers-amiable.component.ts

Fonctionnalités requises :

1. Filtres :
   - Par statut (Tous, En cours, Clôturés) - mat-select
   - Par agent (Tous, ou sélection d'un agent) - mat-select avec autocomplete
   - Par urgence (Tous, Faible, Moyenne, Très Urgent) - mat-select
   - Par date (création, clôture) - mat-datepicker
   - Recherche textuelle (numéro, titre, description) - mat-input avec debounce

2. Tri :
   - Par date de création (croissant/décroissant) - mat-sort
   - Par montant (croissant/décroissant) - mat-sort
   - Par urgence - mat-sort
   - Par statut - mat-sort

3. Actions en masse (optionnel) :
   - Sélection multiple de dossiers - mat-checkbox
   - Clôture en masse (avec confirmation)
   - Export Excel/PDF (optionnel)

4. Actions par dossier :
   - Voir détails (navigation)
   - Clôturer (avec confirmation)
   - Réaffecter au juridique (avec confirmation)
   - Assigner à un agent (dialog)

5. Affichage :
   - Tableau avec colonnes configurables - mat-table
   - Pagination avancée - mat-paginator
   - Export des résultats (CSV, Excel) - optionnel

6. Propriétés :
   - dossiers: DossierApi[] = []
   - filteredDossiers: DossierApi[] = []
   - selectedDossiers: DossierApi[] = []
   - filters: { statut?: string, agent?: number, urgence?: Urgence, dateDebut?: Date, dateFin?: Date } = {}
   - sortBy: string = 'dateCreation'
   - sortDirection: 'asc' | 'desc' = 'desc'
   - searchTerm: string = ''

7. Méthodes :
   - applyFilters(): void - Applique les filtres
   - clearFilters(): void - Réinitialise les filtres
   - sortDossiers(field: string): void - Trie les dossiers
   - toggleSelection(dossier: DossierApi): void - Sélectionne/désélectionne un dossier
   - selectAll(): void - Sélectionne tous les dossiers
   - deselectAll(): void - Désélectionne tous les dossiers
   - exportToCSV(): void - Exporte en CSV
   - exportToExcel(): void - Exporte en Excel (optionnel)
```

---

### 📋 PROMPT 12 : Créer le Composant Assignation Dossier à Agent

```
Dans le projet Angular, créez un composant dialog pour assigner un dossier à un agent :

Fichier : src/app/shared/components/dialogs/assign-dossier-agent/assign-dossier-agent.component.ts

Fonctionnalités requises :

1. Dialog Material (standalone component) :
   - Titre : "Assigner le dossier à un agent"
   - Liste des agents disponibles avec recherche
   - Affichage des statistiques de chaque agent (nombre de dossiers)
   - Boutons : Annuler, Assigner

2. Propriétés :
   - dossier: DossierApi (injecté via MAT_DIALOG_DATA)
   - agents: User[] = []
   - selectedAgent: User | null = null
   - searchTerm: string = ''
   - loading: boolean = false
   - agentStats: Map<number, number> = new Map() // agentId -> nombre de dossiers

3. Méthodes :
   - ngOnInit(): void - Charge les agents et leurs statistiques
   - loadAgents(): void - Charge la liste des agents disponibles
   - loadAgentStats(): void - Charge les statistiques (nombre de dossiers par agent)
   - filterAgents(): User[] - Filtre les agents par recherche
   - selectAgent(agent: User): void - Sélectionne un agent
   - assigner(): void - Confirme l'assignation et ferme le dialog avec le résultat
   - cancel(): void - Annule le dialog

4. Affichage des agents :
   - Nom et prénom
   - Email
   - Nombre de dossiers en cours (badge)
   - Disponibilité (badge vert si < 10 dossiers, orange si 10-20, rouge si > 20)
   - Charge de travail (barre de progression visuelle)

5. Validation :
   - Un agent doit être sélectionné avant de pouvoir assigner
   - Afficher un message si aucun agent disponible
   - Désactiver le bouton "Assigner" si aucun agent sélectionné

6. Template :
   - Utilisez mat-autocomplete pour la recherche
   - Liste des agents avec mat-list
   - Cards pour chaque agent avec informations
   - Boutons d'action en bas
```

---

### 📋 PROMPT 13 : Créer le Composant Statistiques Recouvrement Amiable

```
Dans le projet Angular, créez ou mettez à jour le composant pour afficher les statistiques :

Fichier : src/app/chef-amiable/components/statistiques-recouvrement-amiable/statistiques-recouvrement-amiable.component.ts

Fonctionnalités requises :

1. Statistiques globales (cards) :
   - Total dossiers en cours
   - Dossiers clôturés ce mois
   - Montant total en cours (formaté)
   - Taux de clôture (pourcentage)
   - Dossiers urgents
   - Actions effectuées (si disponible)

2. Graphiques (optionnel, nécessite une bibliothèque) :
   - Répartition par statut (pie chart)
   - Évolution mensuelle (line chart)
   - Répartition par agent (bar chart)
   - Répartition par urgence (bar chart)

3. Tableaux :
   - Top 5 agents par performance (nombre de dossiers clôturés)
   - Dossiers les plus anciens (non clôturés depuis > 30 jours)
   - Dossiers avec montant le plus élevé

4. Filtres temporels :
   - Période (semaine, mois, trimestre, année) - mat-select
   - Date de début / Date de fin - mat-datepicker

5. Propriétés :
   - statistiques: StatistiqueAmiable | null = null
   - period: 'week' | 'month' | 'quarter' | 'year' = 'month'
   - startDate: Date = new Date()
   - endDate: Date = new Date()
   - topAgents: Array<{agent: User, dossiersClotures: number, montantRecupere: number}> = []
   - loading: boolean = false

6. Méthodes :
   - ngOnInit(): void - Charge les statistiques
   - loadStatistiques(): void - Charge les statistiques depuis les dossiers réels
   - updatePeriod(period: string): void - Met à jour la période et recharge
   - exportStatistiques(): void - Exporte en CSV/Excel
   - refresh(): void - Rafraîchit les données
   - calculateTopAgents(): void - Calcule le top des agents

7. Intégration :
   - Utilisez DossierApiService pour charger les dossiers
   - Calculez les statistiques depuis les données réelles
   - Utilisez UtilisateurService pour les informations des agents
```

---

## 3. Prompts pour les Tests et Validation

### 📋 PROMPT 14 : Créer les Tests Unitaires pour les Services

```
Dans le projet Angular, créez des tests unitaires pour les services :

Fichier : src/app/core/services/dossier-api.service.spec.ts

Tests à créer :

1. Tests pour getDossiersRecouvrementAmiable :
   - Doit appeler GET /api/dossiers/recouvrement-amiable avec les bons paramètres
   - Doit retourner les données paginées
   - Doit gérer les erreurs 404/500 et utiliser le fallback
   - Doit filtrer correctement côté client si le fallback est utilisé

2. Tests pour affecterAuRecouvrementAmiable :
   - Doit appeler PUT /api/dossiers/{id}/affecter/recouvrement-amiable
   - Doit retourner le dossier mis à jour
   - Doit gérer les erreurs 400, 404, 500 avec messages appropriés

3. Tests pour cloturerDossier :
   - Doit appeler PUT /api/dossiers/{id}/cloturer
   - Doit retourner le dossier clôturé
   - Doit gérer les erreurs appropriées

4. Tests pour getDossiersValidesDisponibles :
   - Doit appeler GET /api/dossiers/valides-disponibles
   - Doit utiliser le fallback si l'endpoint n'existe pas
   - Doit filtrer correctement les dossiers validés

Utilisez :
- HttpClientTestingModule
- TestBed
- jasmine.createSpy
- fakeAsync et tick pour les observables
- of() et throwError() pour simuler les réponses
```

---

### 📋 PROMPT 15 : Créer les Tests E2E pour les Interfaces Chef

```
Dans le projet Angular, créez des tests E2E avec Cypress ou Protractor :

Fichier : e2e/chef-recouvrement-amiable.cy.ts (Cypress) ou e2e/chef-recouvrement-amiable.e2e-spec.ts (Protractor)

Scénarios à tester :

1. Connexion en tant que chef recouvrement amiable :
   - Se connecter avec un compte chef amiable
   - Vérifier la redirection vers le dashboard
   - Vérifier l'affichage du menu et des statistiques

2. Affichage de la liste des dossiers :
   - Naviguer vers "Gestion des Actions" ou "/dossiers/amiable"
   - Vérifier l'affichage des dossiers affectés
   - Vérifier la pagination
   - Vérifier les statistiques affichées

3. Filtrage des dossiers :
   - Appliquer un filtre par statut
   - Vérifier que seuls les dossiers filtrés s'affichent
   - Réinitialiser les filtres
   - Tester la recherche textuelle

4. Affectation d'un dossier :
   - Cliquer sur "Affecter au Recouvrement Amiable" pour un dossier validé
   - Confirmer dans le dialog
   - Vérifier le message de succès
   - Vérifier que le dossier apparaît dans la liste des dossiers amiable

5. Clôture d'un dossier :
   - Cliquer sur "Clôturer" pour un dossier
   - Confirmer dans le dialog
   - Vérifier le message de succès
   - Vérifier que le dossier disparaît de la liste (ou change de statut)

6. Navigation :
   - Tester tous les liens du menu
   - Vérifier que le contenu change correctement
   - Vérifier que les breadcrumbs sont corrects

7. Gestion des erreurs :
   - Simuler une erreur réseau
   - Vérifier l'affichage du message d'erreur
   - Vérifier que l'application ne plante pas
```

---

## 4. Prompts pour la Gestion des Erreurs

### 📋 PROMPT 16 : Créer un Service de Gestion d'Erreurs Centralisé

```
Dans le projet Angular, créez ou mettez à jour un service centralisé pour la gestion des erreurs :

Fichier : src/app/core/services/error-handler.service.ts

Fonctionnalités requises :

1. Méthodes :
   - handleHttpError(error: HttpErrorResponse): Observable<never>
     - Analyse le code d'erreur HTTP
     - Retourne un message d'erreur en français
     - Log l'erreur pour le débogage avec console.error
     - Extrait le message d'erreur du backend si disponible

   - getErrorMessage(error: any): string
     - Convertit les erreurs en messages lisibles
     - Gère les erreurs HTTP, les erreurs réseau, les erreurs inconnues
     - Retourne des messages en français

   - showError(message: string, duration?: number): void
     - Affiche un message d'erreur avec MatSnackBar
     - Utilise la classe 'error-snackbar' pour le style

   - showSuccess(message: string, duration?: number): void
     - Affiche un message de succès avec MatSnackBar
     - Utilise la classe 'success-snackbar' pour le style

   - showWarning(message: string, duration?: number): void
     - Affiche un message d'avertissement avec MatSnackBar
     - Utilise la classe 'warning-snackbar' pour le style

2. Mapping des erreurs :
   - 400 : "Requête invalide" + message du backend si disponible
   - 401 : "Non autorisé. Veuillez vous reconnecter."
   - 403 : "Accès interdit. Vous n'avez pas les permissions nécessaires."
   - 404 : "Ressource non trouvée" + détails si disponibles
   - 500 : "Erreur serveur. Veuillez réessayer plus tard."
   - 0 (erreur réseau) : "Problème de connexion. Vérifiez votre connexion internet."
   - Messages spécifiques selon le contexte (ex: "Dossier non trouvé", "Chef non trouvé")

3. Intégration :
   - Service injectable dans tous les composants
   - Utilise MatSnackBar (injecté)
   - Configuration centralisée des messages
   - Logging pour le débogage
```

---

### 📋 PROMPT 17 : Créer un Intercepteur HTTP pour la Gestion des Erreurs

```
Dans le projet Angular, vérifiez et mettez à jour l'intercepteur HTTP existant :

Fichier : src/app/core/interceptors/auth.interceptor.ts ou error.interceptor.ts

Fonctionnalités requises :

1. Intercepte toutes les requêtes HTTP :
   - Ajoute le token d'authentification si présent (déjà fait dans auth.interceptor.ts)
   - Gère les erreurs HTTP globalement
   - Retry logic pour les erreurs réseau (optionnel, avec retry de RxJS)

2. Gestion des erreurs :
   - 401 : 
     * Supprime le token du localStorage
     * Redirige vers la page de connexion
     * Affiche un message "Session expirée"
   - 403 : 
     * Affiche un message d'erreur "Accès interdit"
     * Log l'erreur pour le débogage
   - 404 : 
     * Affiche un message spécifique selon l'endpoint
     * Log l'erreur
   - 500 : 
     * Affiche un message générique "Erreur serveur"
     * Log l'erreur complète pour le débogage
   - Erreurs réseau (0) : 
     * Affiche "Problème de connexion"
     * Propose de réessayer

3. Logging :
   - Log toutes les erreurs avec console.error
   - Inclut l'URL, la méthode HTTP, le statut, le message
   - N'envoie pas d'informations sensibles (tokens, mots de passe)

4. Configuration :
   - Enregistrez l'intercepteur dans app.config.ts ou app.module.ts
   - Utilisez HTTP_INTERCEPTORS
   - Ordre important : auth interceptor avant error interceptor

5. Exceptions :
   - Certaines routes peuvent être exclues de la gestion d'erreur globale
   - Utilisez un header personnalisé pour exclure certaines requêtes
```

---

## 📝 Checklist d'Intégration

### ✅ Avant de Commencer

- [ ] Vérifier que toutes les APIs backend sont fonctionnelles (utiliser les prompts backend)
- [ ] Tester les endpoints avec Postman ou un client REST
- [ ] Vérifier les modèles de données (interfaces TypeScript)
- [ ] S'assurer que l'authentification JWT fonctionne
- [ ] Vérifier que les routes sont correctement configurées

### ✅ Intégration des Services

- [ ] Créer/mettre à jour DossierApiService avec toutes les méthodes
- [ ] Créer/mettre à jour ChefAmiableService
- [ ] Créer/mettre à jour ErrorHandlerService
- [ ] Tester chaque méthode du service individuellement
- [ ] Vérifier que les fallbacks fonctionnent correctement

### ✅ Création des Composants

- [ ] Composant dashboard chef (chef-amiable-dashboard)
- [ ] Composant liste dossiers (dossiers-amiable)
- [ ] Composant gestion actions (gestion-actions)
- [ ] Composant détails dossier (optionnel)
- [ ] Composant assignation agent (optionnel)
- [ ] Composant statistiques (optionnel)

### ✅ Intégration des Routes

- [ ] Configurer les routes dans le module
- [ ] Créer les guards de sécurité
- [ ] Tester la navigation
- [ ] Vérifier les redirections

### ✅ Tests

- [ ] Tests unitaires pour les services
- [ ] Tests unitaires pour les composants
- [ ] Tests E2E pour les scénarios principaux
- [ ] Tests de régression

### ✅ Déploiement

- [ ] Vérifier que tout fonctionne en production
- [ ] Tester avec des données réelles
- [ ] Documenter les fonctionnalités
- [ ] Former les utilisateurs

---

## 🎯 Résumé des Prompts

1. **PROMPT 1** : Mettre à jour DossierApiService avec toutes les APIs
2. **PROMPT 2** : Vérifier/Créer le modèle TypeRecouvrement
3. **PROMPT 3** : Créer/Mettre à jour le composant liste dossiers amiable
4. **PROMPT 4** : Créer/Mettre à jour le template HTML pour la liste
5. **PROMPT 5** : Créer/Mettre à jour le composant détails avec actions
6. **PROMPT 6** : Créer/Mettre à jour le template détails avec actions
7. **PROMPT 7** : Vérifier/Mettre à jour le module dashboard chef
8. **PROMPT 8** : Créer/Mettre à jour le service chef recouvrement amiable
9. **PROMPT 9** : Créer/Mettre à jour le composant dashboard principal
10. **PROMPT 10** : Créer/Mettre à jour le template dashboard avec navigation
11. **PROMPT 11** : Créer/Mettre à jour le composant liste avancée avec filtres
12. **PROMPT 12** : Créer le composant assignation agent
13. **PROMPT 13** : Créer/Mettre à jour le composant statistiques
14. **PROMPT 14** : Créer les tests unitaires
15. **PROMPT 15** : Créer les tests E2E
16. **PROMPT 16** : Créer/Mettre à jour le service gestion d'erreurs
17. **PROMPT 17** : Créer/Mettre à jour l'intercepteur HTTP

---

## 📚 Ressources Supplémentaires

- Documentation Angular Material : https://material.angular.io/
- Documentation RxJS : https://rxjs.dev/
- Guide Angular HTTP : https://angular.io/guide/http
- Guide Angular Routing : https://angular.io/guide/router
- Guide Angular Testing : https://angular.io/guide/testing

---

**Note** : Utilisez ces prompts dans l'ordre pour une intégration progressive et complète. Testez chaque étape avant de passer à la suivante. Les prompts sont adaptés au code existant et utilisent les services et composants déjà créés.

