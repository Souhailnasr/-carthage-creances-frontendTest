# ✅ Checklist Rapide - Tests Chef Financier

## 🚀 Démarrage Rapide

1. **Backend démarré** : `http://localhost:8089/carthage-creance`
2. **Frontend démarré** : `ng serve`
3. **Connexion** : Utilisateur avec rôle `CHEF_DEPARTEMENT_FINANCE`

---

## 📋 Tests Essentiels (15 minutes)

### ✅ Dashboard (`/finance/dashboard`)
- [ ] 4 cartes métriques affichées avec valeurs
- [ ] Graphique camembert visible
- [ ] Graphique courbe visible
- [ ] Tableau ROI avec au moins 1 agent
- [ ] Section alertes avec filtres fonctionnels
- [ ] Bouton "Actualiser" fonctionne

### ✅ Détail Dossier Finance (`/finance/dossier/{id}/finance`)
- [ ] Synthèse avec jauge colorée
- [ ] Total par phase affiché
- [ ] Tableau des frais avec actions
- [ ] Valider un frais EN_ATTENTE → Statut change
- [ ] Rejeter un frais EN_ATTENTE → Commentaire demandé
- [ ] Générer facture → PDF téléchargé
- [ ] Timeline des factures visible

### ✅ Validation Frais (`/finance/validation-frais`)
- [ ] 2 cartes KPIs en haut
- [ ] Filtres (Phase, Agent, Montant) fonctionnels
- [ ] Tableau des frais EN_ATTENTE
- [ ] Modale détail s'ouvre
- [ ] Valider → Snackbar + mise à jour
- [ ] Rejeter avec commentaire → Snackbar + mise à jour

### ✅ Gestion Tarifs (`/finance/tarifs`)
- [ ] Catalogue affiché
- [ ] Créer nouveau tarif → Apparaît dans le tableau
- [ ] Modifier tarif → Changement visible
- [ ] Supprimer tarif → Disparaît du tableau
- [ ] Simuler coût → Résultat affiché

### ✅ Import CSV (`/finance/import-frais`)
- [ ] Stepper 4 étapes visible
- [ ] Upload fichier CSV → Étape suivante activée
- [ ] Mapping colonnes → Tous les champs mappés
- [ ] Aperçu → Tableau avec validation
- [ ] Import → Rapport d'intégration affiché

### ✅ Reporting (`/finance/reporting`)
- [ ] Formulaire avec sélecteurs
- [ ] Aperçu généré → Tableau + graphique
- [ ] Export Excel → Fichier téléchargé
- [ ] Historique affiché

### ✅ Insights (`/finance/insights`)
- [ ] Cards d'insights affichées
- [ ] Filtre par catégorie fonctionne
- [ ] Marquer comme traité → Insight disparaît

---

## 🔍 Vérifications Techniques

### Console Navigateur (F12)
- [ ] Aucune erreur JavaScript
- [ ] Aucune erreur 404 (endpoints)
- [ ] Aucune erreur 401 (authentification)
- [ ] Aucune erreur 500 (serveur)

### Network Tab
- [ ] Requêtes vers `/api/finances/*` réussies (200)
- [ ] Requêtes vers `/api/frais/*` réussies (200)
- [ ] Requêtes vers `/api/tarifs/*` réussies (200)
- [ ] Requêtes vers `/api/factures/*` réussies (200)

### Performance
- [ ] Chargement dashboard < 3 secondes
- [ ] Chargement liste frais < 2 secondes
- [ ] Graphiques rendus < 1 seconde

---

## 🐛 Tests d'Erreurs

### Erreurs Backend
- [ ] Backend arrêté → Message d'erreur clair
- [ ] Endpoint inexistant → Gestion gracieuse
- [ ] Données invalides → Validation frontend

### Erreurs Utilisateur
- [ ] Formulaire incomplet → Validation affichée
- [ ] Fichier CSV invalide → Message d'erreur
- [ ] Commentaire manquant (rejet) → Validation

---

## 📱 Responsive

- [ ] Desktop (1920px) → Layout complet
- [ ] Tablette (768px) → Layout adapté
- [ ] Mobile (375px) → Layout empilé, scrollable

---

## ✅ Critères de Validation

**Test réussi si :**
- ✅ Interface s'affiche
- ✅ Données chargées
- ✅ Actions fonctionnent
- ✅ Pas d'erreurs console
- ✅ Messages de confirmation
- ✅ Navigation fluide

---

## ⏱️ Temps Estimé

- **Tests essentiels** : 15 minutes
- **Tests complets** : 45 minutes
- **Tests approfondis** : 2 heures

---

**Note:** Pour les tests détaillés, voir `GUIDE_TEST_CHEF_FINANCIER.md`

