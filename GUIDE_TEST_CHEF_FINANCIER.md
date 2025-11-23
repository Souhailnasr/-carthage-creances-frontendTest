# 🧪 Guide de Test - Chef Financier

Ce guide détaille tous les scénarios de test pour valider les fonctionnalités du module Chef Financier.

---

## 📋 Prérequis

### 1. Configuration Backend
- ✅ Backend démarré sur `http://localhost:8089/carthage-creance`
- ✅ Base de données avec des données de test
- ✅ Utilisateur avec le rôle `CHEF_DEPARTEMENT_FINANCE` ou `AGENT_FINANCE`
- ✅ JWT token valide

### 2. Configuration Frontend
- ✅ Application Angular démarrée (`ng serve`)
- ✅ Navigateur avec console développeur ouverte (F12)
- ✅ Outils de développement réseau activés (Network tab)

### 3. Données de Test Recommandées
- Au moins 3-5 dossiers avec des frais
- Au moins 2-3 agents avec des actions
- Au moins 1-2 factures générées
- Au moins 5-10 frais en attente de validation
- Au moins 3-5 tarifs configurés

---

## 🎯 1. Dashboard Chef Financier

**Route:** `/finance/dashboard`

### Test 1.1 - Affichage des Métriques

**Objectif:** Vérifier que les cartes de métriques s'affichent correctement

**Étapes:**
1. Se connecter avec un compte Chef Financier
2. Naviguer vers `/finance/dashboard`
3. Vérifier l'affichage de 4 cartes :
   - ✅ **Total Frais Engagés** (valeur en TND)
   - ✅ **Montant Recouvré** (valeur en TND, couleur verte)
   - ✅ **Frais Récupérés** (valeur en TND)
   - ✅ **Net Généré** (valeur en TND, carte highlightée)

**Résultat attendu:**
- Les 4 cartes sont visibles
- Les valeurs sont formatées avec 2 décimales
- La carte "Net Généré" a un fond dégradé
- Les icônes sont présentes

**Vérification Backend:**
```bash
GET /api/finances/analytics/dashboard
```

---

### Test 1.2 - Graphique Camembert (Répartition des Frais)

**Objectif:** Vérifier l'affichage du graphique camembert

**Étapes:**
1. Sur le dashboard, localiser la section "Répartition des Frais par Catégorie"
2. Vérifier :
   - ✅ Le graphique camembert s'affiche
   - ✅ La légende montre les catégories avec montants et pourcentages
   - ✅ Les couleurs sont distinctes pour chaque catégorie

**Résultat attendu:**
- Graphique interactif avec Chart.js
- Légende à droite du graphique
- Tooltip au survol avec détails

**Vérification Backend:**
```bash
GET /api/finances/analytics/repartition
```

---

### Test 1.3 - Graphique Courbe (Évolution Mensuelle)

**Objectif:** Vérifier l'affichage de l'évolution mensuelle

**Étapes:**
1. Localiser la section "Évolution Mensuelle: Frais vs Recouvré"
2. Vérifier :
   - ✅ Le graphique courbe s'affiche
   - ✅ Deux lignes : Frais (rouge) et Recouvré (vert)
   - ✅ Légende en haut du graphique
   - ✅ Axes avec labels corrects

**Résultat attendu:**
- Graphique linéaire avec 2 séries
- Tooltip au survol avec valeurs
- Échelle Y en TND

**Vérification Backend:**
```bash
GET /api/finances/analytics/evolution?startDate=2024-01-01&endDate=2024-12-31
```

---

### Test 1.4 - Tableau ROI par Agent

**Objectif:** Vérifier l'affichage du classement ROI

**Étapes:**
1. Localiser la section "ROI par Agent"
2. Vérifier le tableau avec colonnes :
   - ✅ Agent (nom avec icône)
   - ✅ Montant Recouvré (vert)
   - ✅ Frais Engagés
   - ✅ ROI (chip coloré)
   - ✅ Performance (barre de progression)

**Résultat attendu:**
- Tableau avec données triées
- ROI > 50% = chip bleu
- ROI 20-50% = chip orange
- ROI < 20% = chip rouge
- Barre de progression correspondant au ROI

**Vérification Backend:**
```bash
GET /api/finances/analytics/roi-agents
```

---

### Test 1.5 - Section Alertes Financières

**Objectif:** Vérifier le système d'alertes

**Étapes:**
1. Localiser la section "Alertes Financières"
2. Tester les filtres :
   - ✅ Filtre par Type (Toutes, Frais Élevés, Dossier Inactif, etc.)
   - ✅ Filtre par Niveau (Tous, Info, Avertissement, Danger)
3. Vérifier l'affichage :
   - ✅ Tableau avec colonnes : Type, Message, Dossier, Niveau, Date, Actions
   - ✅ Chips colorés selon le niveau
   - ✅ Bouton "Voir dossier" fonctionnel
   - ✅ Pagination si > 10 alertes

**Résultat attendu:**
- Filtres fonctionnels
- Alertes triées par date (plus récentes en premier)
- Navigation vers le dossier au clic

**Vérification Backend:**
```bash
GET /api/finances/analytics/alerts
GET /api/finances/analytics/alerts?niveau=DANGER
GET /api/finances/analytics/alerts?phase=JURIDIQUE
```

---

### Test 1.6 - Bouton Actualiser

**Objectif:** Vérifier le rafraîchissement des données

**Étapes:**
1. Cliquer sur le bouton "Actualiser" en haut à droite
2. Vérifier :
   - ✅ Spinner de chargement s'affiche
   - ✅ Toutes les données sont rechargées
   - ✅ Aucune erreur dans la console

**Résultat attendu:**
- Données mises à jour
- Pas de perte de contexte (filtres conservés)

---

## 🎯 2. Onglet Finance dans Détail Dossier

**Route:** `/finance/dossier/{id}/finance` ou intégré dans `/dossier/{id}`

### Test 2.1 - Affichage de la Synthèse

**Objectif:** Vérifier la carte de synthèse financière

**Étapes:**
1. Ouvrir un dossier avec des frais
2. Naviguer vers l'onglet "Finance"
3. Vérifier la carte synthèse :
   - ✅ Montant Dû affiché
   - ✅ Ratio Frais/Montant Dû avec jauge colorée
   - ✅ Jauge verte si ratio < 20%
   - ✅ Jauge orange si ratio 20-40%
   - ✅ Jauge rouge si ratio > 40%

**Résultat attendu:**
- Jauge visuelle avec pourcentage
- Couleur adaptée au ratio
- Bouton "Générer Facture" visible

**Vérification Backend:**
```bash
GET /api/frais/dossier/{dossierId}
GET /api/finances/analytics/dossier/{dossierId}/stats
```

---

### Test 2.2 - Total par Phase

**Objectif:** Vérifier l'affichage des totaux par phase

**Étapes:**
1. Dans l'onglet Finance, localiser "Total par Phase"
2. Vérifier :
   - ✅ Cartes pour chaque phase (CREATION, AMIABLE, JURIDIQUE, ENQUETE)
   - ✅ Montant total par phase
   - ✅ Ratio vs Montant Dû
   - ✅ Chips colorés (success/warning/danger)

**Résultat attendu:**
- Une carte par phase présente dans le dossier
- Calculs corrects des totaux

---

### Test 2.3 - Tableau des Frais

**Objectif:** Vérifier le tableau détaillé des frais

**Étapes:**
1. Localiser le tableau "Détail des Frais"
2. Vérifier les colonnes :
   - ✅ Phase
   - ✅ Catégorie
   - ✅ Quantité
   - ✅ Tarif Unitaire
   - ✅ Montant (quantité × tarif)
   - ✅ Statut (chip coloré)
   - ✅ Justificatif (bouton download si présent)
   - ✅ Actions (Valider/Rejeter si EN_ATTENTE)

**Résultat attendu:**
- Tous les frais du dossier affichés
- Calculs corrects
- Actions disponibles selon le statut

---

### Test 2.4 - Actions Valider/Rejeter

**Objectif:** Tester la validation/rejet d'un frais

**Étapes:**
1. Trouver un frais avec statut "EN_ATTENTE"
2. Cliquer sur l'icône "Valider" (✓)
3. Vérifier :
   - ✅ Confirmation visuelle (snackbar)
   - ✅ Frais mis à jour (statut = VALIDE)
   - ✅ Boutons d'action disparaissent

4. Pour tester le rejet :
   - Trouver un autre frais EN_ATTENTE
   - Cliquer sur l'icône "Rejeter" (✗)
   - ✅ Dialog demande un commentaire
   - ✅ Saisir un commentaire et confirmer
   - ✅ Frais mis à jour (statut = REJETE)

**Résultat attendu:**
- Validation instantanée
- Rejet avec commentaire obligatoire
- Mise à jour en temps réel

**Vérification Backend:**
```bash
PUT /api/frais/{id}/valider
PUT /api/frais/{id}/rejeter
Body: { "motif": "Commentaire de rejet" }
```

---

### Test 2.5 - Génération de Facture

**Objectif:** Tester la génération de facture PDF

**Étapes:**
1. Cliquer sur "Générer Facture"
2. Vérifier :
   - ✅ Requête envoyée au backend
   - ✅ PDF téléchargé automatiquement
   - ✅ Nom du fichier : `facture_dossier_{id}.pdf`
   - ✅ Snackbar de confirmation

**Résultat attendu:**
- PDF généré et téléchargé
- Contenu PDF correct (montants, détails)

**Vérification Backend:**
```bash
POST /api/factures/dossier/{dossierId}/generer
Response: Facture object avec urlPdf
```

---

### Test 2.6 - Timeline des Factures

**Objectif:** Vérifier l'historique des factures

**Étapes:**
1. Localiser la section "Historique des Factures"
2. Vérifier :
   - ✅ Timeline verticale avec puces
   - ✅ Date de création
   - ✅ Période couverte
   - ✅ Montant
   - ✅ Statut (chip)
   - ✅ Bouton "Télécharger PDF" si disponible

**Résultat attendu:**
- Factures triées par date (plus récentes en premier)
- Design timeline clair
- Téléchargement PDF fonctionnel

**Vérification Backend:**
```bash
GET /api/factures/dossier/{dossierId}
```

---

## 🎯 3. Validation des Frais

**Route:** `/finance/validation-frais`

### Test 3.1 - Affichage des Indicateurs

**Objectif:** Vérifier les KPIs en haut de page

**Étapes:**
1. Naviguer vers `/finance/validation-frais`
2. Vérifier les 2 cartes :
   - ✅ "Frais à Valider" (nombre)
   - ✅ "Montant Total en Attente" (montant en TND)

**Résultat attendu:**
- Valeurs correctes
- Mise à jour après chaque action

**Vérification Backend:**
```bash
GET /api/frais/en-attente
```

---

### Test 3.2 - Filtres Avancés

**Objectif:** Tester tous les filtres

**Étapes:**
1. Tester le filtre "Phase" :
   - ✅ Sélectionner "AMIABLE"
   - ✅ Cliquer "Appliquer"
   - ✅ Vérifier que seuls les frais AMIABLE s'affichent

2. Tester le filtre "Agent ID" :
   - ✅ Saisir un ID d'agent
   - ✅ Appliquer
   - ✅ Vérifier le filtrage

3. Tester les filtres "Montant Min/Max" :
   - ✅ Saisir min = 50, max = 200
   - ✅ Appliquer
   - ✅ Vérifier que seuls les frais dans cette plage s'affichent

4. Tester "Réinitialiser" :
   - ✅ Cliquer sur "Réinitialiser"
   - ✅ Vérifier que tous les filtres sont effacés

**Résultat attendu:**
- Filtres fonctionnels individuellement
- Combinaison de filtres fonctionnelle
- Réinitialisation complète

---

### Test 3.3 - Tableau des Frais en Attente

**Objectif:** Vérifier l'affichage du tableau

**Étapes:**
1. Vérifier les colonnes :
   - ✅ Dossier (ID)
   - ✅ Phase
   - ✅ Catégorie
   - ✅ Montant
   - ✅ Demandeur
   - ✅ Créé le
   - ✅ Actions (Voir détail, Valider, Rejeter)

**Résultat attendu:**
- Tous les frais EN_ATTENTE affichés
- Tri possible
- Actions disponibles

---

### Test 3.4 - Modale de Détail

**Objectif:** Tester l'affichage du détail d'un frais

**Étapes:**
1. Cliquer sur l'icône "Voir détail" (👁️) d'un frais
2. Vérifier la modale :
   - ✅ Dossier ID
   - ✅ Phase
   - ✅ Catégorie
   - ✅ Montant
   - ✅ Demandeur
   - ✅ Date de création
   - ✅ Bouton "Télécharger" justificatif si présent

**Résultat attendu:**
- Modale centrée et lisible
- Toutes les informations affichées
- Téléchargement justificatif fonctionnel

---

### Test 3.5 - Validation en Masse (si implémenté)

**Objectif:** Tester la validation de plusieurs frais

**Étapes:**
1. Sélectionner plusieurs frais (checkbox si disponible)
2. Cliquer sur "Valider sélection"
3. Vérifier :
   - ✅ Confirmation demandée
   - ✅ Tous les frais validés
   - ✅ Tableau mis à jour

**Note:** Cette fonctionnalité peut ne pas être implémentée. À vérifier.

---

## 🎯 4. Gestion des Tarifs

**Route:** `/finance/tarifs`

### Test 4.1 - Affichage du Catalogue

**Objectif:** Vérifier la liste des tarifs

**Étapes:**
1. Naviguer vers `/finance/tarifs`
2. Vérifier le tableau avec colonnes :
   - ✅ Phase
   - ✅ Catégorie
   - ✅ Tarif (avec devise)
   - ✅ Devise
   - ✅ Date Effet
   - ✅ Date Fin (si applicable)
   - ✅ Actif (chip Oui/Non)
   - ✅ Actions (Modifier, Supprimer)

**Résultat attendu:**
- Tous les tarifs affichés
- Tri possible
- Filtres fonctionnels

**Vérification Backend:**
```bash
GET /api/tarifs
```

---

### Test 4.2 - Création d'un Nouveau Tarif

**Objectif:** Tester le formulaire de création

**Étapes:**
1. Cliquer sur "Nouveau Tarif"
2. Remplir le formulaire :
   - ✅ Phase (select ou input)
   - ✅ Catégorie (input avec autocomplétion si disponible)
   - ✅ Tarif (nombre > 0)
   - ✅ Devise (TND, EUR, USD)
   - ✅ Date Début (datepicker)
   - ✅ Date Fin (optionnel, datepicker)
3. Cliquer "Enregistrer"
4. Vérifier :
   - ✅ Snackbar de confirmation
   - ✅ Nouveau tarif dans le tableau
   - ✅ Tarif marqué comme actif

**Résultat attendu:**
- Formulaire valide les champs obligatoires
- Création réussie
- Mise à jour immédiate du tableau

**Vérification Backend:**
```bash
POST /api/tarifs
Body: {
  "phase": "AMIABLE",
  "categorie": "APPEL",
  "tarifUnitaire": 10.50,
  "devise": "TND",
  "dateDebut": "2024-01-01",
  "actif": true
}
```

---

### Test 4.3 - Modification d'un Tarif

**Objectif:** Tester la modification

**Étapes:**
1. Cliquer sur l'icône "Modifier" (✏️) d'un tarif
2. Modifier le tarif (ex: changer le montant)
3. Cliquer "Enregistrer"
4. Vérifier :
   - ✅ Snackbar de confirmation
   - ✅ Tarif mis à jour dans le tableau

**Résultat attendu:**
- Formulaire pré-rempli
- Modification réussie

**Vérification Backend:**
```bash
PUT /api/tarifs/{id}
Body: { ... }
```

---

### Test 4.4 - Suppression d'un Tarif

**Objectif:** Tester la suppression

**Étapes:**
1. Cliquer sur l'icône "Supprimer" (🗑️) d'un tarif
2. Confirmer la suppression dans le dialog
3. Vérifier :
   - ✅ Snackbar de confirmation
   - ✅ Tarif retiré du tableau

**Résultat attendu:**
- Confirmation demandée
- Suppression réussie

**Vérification Backend:**
```bash
DELETE /api/tarifs/{id}
```

---

### Test 4.5 - Simulation de Coût

**Objectif:** Tester le calculateur de coût

**Étapes:**
1. Cliquer sur "Simuler Coût"
2. Remplir le formulaire :
   - ✅ Phase
   - ✅ Catégorie
   - ✅ Nombre d'occurrences
3. Cliquer "Calculer"
4. Vérifier :
   - ✅ Résultat affiché (Coût Total Estimé)
   - ✅ Calcul correct (tarif × occurrences)

**Résultat attendu:**
- Calcul instantané
- Résultat formaté en TND
- Message si tarif non trouvé

---

### Test 4.6 - Planification de Tarif

**Objectif:** Tester la planification avec dates

**Étapes:**
1. Créer un nouveau tarif
2. Définir :
   - ✅ Date Début : date future
   - ✅ Date Fin : date future ultérieure
3. Enregistrer
4. Vérifier :
   - ✅ Tarif créé mais pas encore actif
   - ✅ Devient actif à la date de début

**Résultat attendu:**
- Planification fonctionnelle
- Gestion automatique de l'activation

---

## 🎯 5. Import CSV des Frais

**Route:** `/finance/import-frais`

### Test 5.1 - Workflow MatStepper

**Objectif:** Vérifier le stepper en 4 étapes

**Étapes:**
1. Naviguer vers `/finance/import-frais`
2. Vérifier le stepper :
   - ✅ Étape 1 : Upload Fichier
   - ✅ Étape 2 : Mapping Colonnes
   - ✅ Étape 3 : Aperçu et Validation
   - ✅ Étape 4 : Résultat

**Résultat attendu:**
- Navigation entre étapes fluide
- Boutons "Précédent" et "Suivant" fonctionnels

---

### Test 5.2 - Étape 1 : Upload

**Objectif:** Tester l'upload de fichier CSV

**Étapes:**
1. Préparer un fichier CSV avec colonnes :
   ```
   dossier_id,phase,categorie,quantite,tarif_unitaire,fournisseur,date_action
   1,AMIABLE,APPEL,2,5.00,Fournisseur A,2024-01-15
   2,JURIDIQUE,HUISSIER,1,200.00,Cabinet B,2024-01-16
   ```
2. Cliquer "Choisir un fichier CSV"
3. Sélectionner le fichier
4. Vérifier :
   - ✅ Nom du fichier affiché
   - ✅ Bouton "Suivant" activé

**Résultat attendu:**
- Upload réussi
- Validation du format CSV

---

### Test 5.3 - Étape 2 : Mapping

**Objectif:** Tester le mapping des colonnes

**Étapes:**
1. Après upload, arriver à l'étape Mapping
2. Vérifier les selects pour chaque champ :
   - ✅ Dossier ID → colonne du CSV
   - ✅ Phase → colonne du CSV
   - ✅ Catégorie → colonne du CSV
   - ✅ Quantité → colonne du CSV
   - ✅ Tarif Unitaire → colonne du CSV
   - ✅ Fournisseur → colonne du CSV
   - ✅ Date → colonne du CSV
3. Mapper toutes les colonnes
4. Cliquer "Valider et Aperçu"

**Résultat attendu:**
- Toutes les colonnes CSV disponibles dans les selects
- Mapping sauvegardé

---

### Test 5.4 - Étape 3 : Aperçu

**Objectif:** Vérifier l'aperçu et la validation

**Étapes:**
1. Vérifier le tableau d'aperçu :
   - ✅ Colonnes : Dossier ID, Phase, Catégorie, Quantité, Tarif, Fournisseur, Date
   - ✅ Colonne "Valide" (chip Oui/Non)
   - ✅ Colonne "Erreurs" (liste des erreurs si présentes)
2. Vérifier la validation :
   - ✅ Dossiers existants
   - ✅ Tarifs cohérents
   - ✅ Formats de date corrects
3. Cliquer "Importer"

**Résultat attendu:**
- Aperçu des 10 premières lignes (ou toutes)
- Validation en temps réel
- Erreurs clairement identifiées

**Vérification Backend:**
```bash
POST /api/frais/import-csv
Content-Type: multipart/form-data
Body: FormData avec file
```

---

### Test 5.5 - Étape 4 : Résultat

**Objectif:** Vérifier le rapport d'intégration

**Étapes:**
1. Après import, vérifier le rapport :
   - ✅ Total lignes
   - ✅ Succès (nombre et couleur verte)
   - ✅ Erreurs (nombre et couleur rouge)
   - ✅ Liste détaillée des erreurs (ligne + message)
2. Vérifier les actions :
   - ✅ Bouton "Nouvel Import" pour recommencer

**Résultat attendu:**
- Rapport clair et détaillé
- Erreurs expliquées
- Possibilité de télécharger le rapport d'erreurs (si implémenté)

---

## 🎯 6. Reporting Financier

**Route:** `/finance/reporting`

### Test 6.1 - Sélection des Paramètres

**Objectif:** Tester les sélecteurs de rapport

**Étapes:**
1. Naviguer vers `/finance/reporting`
2. Remplir le formulaire :
   - ✅ Type de Rapport : MENSUEL, CLIENT, AGENT, SECTEUR
   - ✅ Date Début (datepicker)
   - ✅ Date Fin (datepicker)
   - ✅ Filtres additionnels selon le type :
     - CLIENT → Client ID
     - AGENT → Agent ID
     - SECTEUR → Secteur
3. Cliquer "Aperçu"

**Résultat attendu:**
- Formulaire valide les champs obligatoires
- Filtres conditionnels selon le type

---

### Test 6.2 - Génération d'Aperçu

**Objectif:** Tester l'aperçu du rapport

**Étapes:**
1. Après avoir cliqué "Aperçu", vérifier :
   - ✅ Spinner de chargement
   - ✅ Tableau de données affiché
   - ✅ Graphique affiché (si applicable)
2. Vérifier le contenu :
   - ✅ Données cohérentes avec les paramètres
   - ✅ Totaux corrects

**Résultat attendu:**
- Aperçu généré rapidement
- Données correctes

**Vérification Backend:**
```bash
GET /api/finances/analytics/stats?startDate=2024-01-01&endDate=2024-12-31
```

---

### Test 6.3 - Export Excel

**Objectif:** Tester l'export Excel

**Étapes:**
1. Après avoir généré un aperçu
2. Cliquer "Export Excel"
3. Vérifier :
   - ✅ Spinner pendant la génération
   - ✅ Fichier téléchargé automatiquement
   - ✅ Nom : `rapport_{type}_{startDate}_{endDate}.xlsx`
   - ✅ Snackbar de confirmation
4. Ouvrir le fichier Excel et vérifier :
   - ✅ Données présentes
   - ✅ Formatage correct

**Résultat attendu:**
- Export réussi
- Fichier Excel valide

**Vérification Backend:**
```bash
GET /api/finances/analytics/export-excel?typeRapport=MENSUEL&startDate=2024-01-01&endDate=2024-12-31
Response: Blob (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
```

---

### Test 6.4 - Export PDF (si implémenté)

**Objectif:** Tester l'export PDF

**Étapes:**
1. Cliquer "Export PDF"
2. Vérifier :
   - ✅ PDF téléchargé
   - ✅ Contenu correct
   - ✅ Mise en page professionnelle

**Note:** Cette fonctionnalité peut ne pas être implémentée. À vérifier.

---

### Test 6.5 - Historique des Rapports

**Objectif:** Vérifier l'historique

**Étapes:**
1. Localiser la section "Historique des Rapports Générés"
2. Vérifier le tableau :
   - ✅ Colonnes : Type, Début, Fin, Utilisateur, Créé le, Actions
   - ✅ Rapports triés par date (plus récents en premier)
   - ✅ Boutons de téléchargement (PDF/Excel) si disponibles

**Résultat attendu:**
- Historique complet
- Téléchargements fonctionnels

**Vérification Backend:**
```bash
GET /api/finances/reports/history
```

---

## 🎯 7. Insights Financiers

**Route:** `/finance/insights`

### Test 7.1 - Affichage des Insights

**Objectif:** Vérifier la liste des suggestions

**Étapes:**
1. Naviguer vers `/finance/insights`
2. Vérifier :
   - ✅ Cards groupées par catégorie
   - ✅ 3 catégories : Optimisation Coûts, Risques Dossier, Performance Agent
   - ✅ Chaque card contient :
     - Icône selon la catégorie
     - Message
     - Action suggérée
     - Métadonnées (Dossier, Agent, Montant potentiel)
     - Bouton "Marquer comme traité"

**Résultat attendu:**
- Cards bien organisées
- Design cohérent
- Informations complètes

**Vérification Backend:**
```bash
GET /api/finances/analytics/insights
```

---

### Test 7.2 - Filtre par Catégorie

**Objectif:** Tester le filtre

**Étapes:**
1. Utiliser le filtre "Filtrer par catégorie"
2. Sélectionner "Optimisation Coûts"
3. Vérifier :
   - ✅ Seuls les insights de cette catégorie s'affichent
4. Sélectionner "Toutes"
5. Vérifier :
   - ✅ Tous les insights s'affichent

**Résultat attendu:**
- Filtre fonctionnel
- Mise à jour instantanée

---

### Test 7.3 - Marquage comme Traité

**Objectif:** Tester le marquage

**Étapes:**
1. Cliquer "Marquer comme traité" sur un insight
2. Vérifier :
   - ✅ Snackbar de confirmation
   - ✅ Insight disparaît de la liste (ou marqué visuellement)
   - ✅ Liste mise à jour

**Résultat attendu:**
- Marquage réussi
- Mise à jour immédiate

**Vérification Backend:**
```bash
PUT /api/finances/analytics/insights/{insightId}/traite
```

---

### Test 7.4 - Affichage des Métadonnées

**Objectif:** Vérifier les informations supplémentaires

**Étapes:**
1. Pour un insight avec Dossier ID :
   - ✅ Vérifier l'affichage "Dossier #X"
   - ✅ Lien vers le dossier (si cliquable)
2. Pour un insight avec Agent ID :
   - ✅ Vérifier l'affichage "Agent #X"
3. Pour un insight avec Montant Potentiel :
   - ✅ Vérifier l'affichage en TND (formaté)

**Résultat attendu:**
- Métadonnées clairement affichées
- Navigation possible vers les entités liées

---

## 🎯 8. Tests d'Intégration Globaux

### Test 8.1 - Navigation entre Modules

**Objectif:** Vérifier la navigation fluide

**Étapes:**
1. Tester les liens entre modules :
   - ✅ Dashboard → Détail Dossier (via alerte)
   - ✅ Détail Dossier → Validation Frais
   - ✅ Validation Frais → Détail Dossier
   - ✅ Dashboard → Reporting
   - ✅ Dashboard → Insights

**Résultat attendu:**
- Navigation sans erreur
- Contexte préservé (ID de dossier, etc.)

---

### Test 8.2 - Gestion des Erreurs

**Objectif:** Vérifier la gestion d'erreurs

**Étapes:**
1. Simuler des erreurs :
   - ✅ Backend arrêté → Vérifier messages d'erreur
   - ✅ Endpoint inexistant → Vérifier gestion
   - ✅ Données invalides → Vérifier validation
   - ✅ Timeout → Vérifier gestion

**Résultat attendu:**
- Messages d'erreur clairs
- Pas de crash de l'application
- Snackbars informatifs

---

### Test 8.3 - Performance

**Objectif:** Vérifier les performances

**Étapes:**
1. Tester avec de grandes quantités de données :
   - ✅ 100+ frais en attente
   - ✅ 50+ dossiers
   - ✅ 20+ agents
2. Vérifier :
   - ✅ Temps de chargement acceptable (< 3s)
   - ✅ Pagination fonctionnelle
   - ✅ Pas de ralentissement

**Résultat attendu:**
- Performance acceptable
- Pagination efficace

---

### Test 8.4 - Responsive Design

**Objectif:** Vérifier l'adaptation mobile/tablette

**Étapes:**
1. Tester sur différentes tailles d'écran :
   - ✅ Desktop (1920x1080)
   - ✅ Tablette (768x1024)
   - ✅ Mobile (375x667)
2. Vérifier :
   - ✅ Layout adaptatif
   - ✅ Graphiques redimensionnés
   - ✅ Tableaux scrollables
   - ✅ Boutons accessibles

**Résultat attendu:**
- Design responsive
- Utilisabilité préservée

---

## 📊 Checklist de Validation Complète

### Dashboard
- [ ] Métriques affichées correctement
- [ ] Graphique camembert fonctionnel
- [ ] Graphique courbe fonctionnel
- [ ] Tableau ROI avec barres de performance
- [ ] Alertes avec filtres fonctionnels
- [ ] Bouton actualiser fonctionnel

### Détail Dossier Finance
- [ ] Synthèse avec jauge colorée
- [ ] Total par phase
- [ ] Tableau des frais complet
- [ ] Actions Valider/Rejeter fonctionnelles
- [ ] Génération facture PDF
- [ ] Timeline des factures

### Validation Frais
- [ ] Indicateurs KPIs
- [ ] Filtres avancés fonctionnels
- [ ] Tableau avec actions
- [ ] Modale de détail
- [ ] Validation/Rejet avec commentaire

### Gestion Tarifs
- [ ] Catalogue complet
- [ ] CRUD fonctionnel
- [ ] Simulation de coût
- [ ] Planification avec dates

### Import CSV
- [ ] Stepper 4 étapes
- [ ] Upload fichier
- [ ] Mapping colonnes
- [ ] Aperçu avec validation
- [ ] Rapport d'intégration

### Reporting
- [ ] Sélecteurs de paramètres
- [ ] Aperçu généré
- [ ] Export Excel fonctionnel
- [ ] Historique des rapports

### Insights
- [ ] Liste des insights
- [ ] Filtre par catégorie
- [ ] Marquage comme traité
- [ ] Métadonnées affichées

### Intégration
- [ ] Navigation fluide
- [ ] Gestion d'erreurs
- [ ] Performance acceptable
- [ ] Design responsive

---

## 🐛 Problèmes Courants et Solutions

### Problème 1 : Graphiques ne s'affichent pas
**Solution:**
- Vérifier que Chart.js est installé : `npm list chart.js`
- Vérifier la console pour erreurs JavaScript
- Vérifier que les données sont au bon format

### Problème 2 : Erreur 401 (Non autorisé)
**Solution:**
- Vérifier que le token JWT est valide
- Vérifier le rôle utilisateur (CHEF_DEPARTEMENT_FINANCE)
- Se reconnecter si nécessaire

### Problème 3 : Erreur 404 (Endpoint non trouvé)
**Solution:**
- Vérifier l'URL du backend dans `environment.ts`
- Vérifier que le backend est démarré
- Vérifier les routes dans le backend

### Problème 4 : Données ne se chargent pas
**Solution:**
- Ouvrir la console développeur (F12)
- Vérifier les requêtes réseau (Network tab)
- Vérifier les erreurs dans la console
- Vérifier les CORS si nécessaire

### Problème 5 : PDF ne se télécharge pas
**Solution:**
- Vérifier que file-saver est installé
- Vérifier les permissions du navigateur
- Vérifier le format de réponse du backend (Blob)

---

## 📝 Notes de Test

### Données de Test Recommandées

**Dossiers:**
- Au moins 5 dossiers avec différents statuts
- Dossiers avec frais variés (création, amiable, juridique)

**Frais:**
- 10+ frais EN_ATTENTE pour tester la validation
- Frais avec justificatifs
- Frais de différentes phases

**Agents:**
- 3+ agents avec actions et frais associés
- Agents avec ROI variés (élevé, moyen, faible)

**Factures:**
- 3+ factures générées
- Factures avec différents statuts

**Tarifs:**
- 5+ tarifs actifs
- Tarifs pour différentes phases et catégories

---

## ✅ Critères de Succès

Un test est considéré comme **réussi** si :
1. ✅ L'interface s'affiche correctement
2. ✅ Les données sont chargées depuis le backend
3. ✅ Les actions utilisateur fonctionnent
4. ✅ Les mises à jour sont visibles immédiatement
5. ✅ Aucune erreur dans la console
6. ✅ Les messages de confirmation sont affichés
7. ✅ La navigation est fluide

---

## 📞 Support

En cas de problème :
1. Vérifier la console développeur (F12)
2. Vérifier les requêtes réseau (Network tab)
3. Vérifier les logs backend
4. Consulter la documentation API backend

---

**Date de création:** 2025-01-XX  
**Version:** 1.0  
**Auteur:** Équipe Développement

