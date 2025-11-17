# Badges de Rôles - Guide d'utilisation

## Vue d'ensemble

Le système de badges de rôles fournit un affichage cohérent et coloré pour tous les rôles utilisateur dans l'application Carthage Créance.

## Couleurs et Styles

### Chefs de Département
Les rôles de chefs de département ont des couleurs distinctives avec des icônes et des effets visuels spéciaux :

- **Chef Département Dossier** : Orange avec icône 👑
- **Chef Département Recouvrement Juridique** : Violet avec icône ⚖️
- **Chef Département Finance** : Vert avec icône 💰
- **Chef Département Recouvrement Amiable** : Orange foncé avec icône 🤝

### Agents
Les rôles d'agents ont des couleurs plus douces :

- **Agent Dossier** : Bleu
- **Agent Recouvrement Juridique** : Violet clair
- **Agent Finance** : Vert clair
- **Agent Recouvrement Amiable** : Orange clair

### Super Admin
- **Super Admin** : Rouge vif avec bordure

## Utilisation

### 1. Utilisation directe avec les classes CSS

```html
<span class="role-badge role-chef-departement-dossier">
  Chef Département Dossier
</span>
```

### 2. Utilisation avec le composant RoleBadge

```html
<app-role-badge role="CHEF_DEPARTEMENT_DOSSIER"></app-role-badge>
```

### 3. Variantes de taille

```html
<!-- Version compacte -->
<app-role-badge role="CHEF_DEPARTEMENT_DOSSIER" [compact]="true"></app-role-badge>

<!-- Version normale -->
<app-role-badge role="CHEF_DEPARTEMENT_DOSSIER"></app-role-badge>

<!-- Version large -->
<app-role-badge role="CHEF_DEPARTEMENT_DOSSIER" [large]="true"></app-role-badge>
```

## Classes CSS disponibles

### Classes de rôles
- `.role-super-admin`
- `.role-chef-departement-dossier`
- `.role-chef-departement-recouvement-juridique`
- `.role-chef-departement-finance`
- `.role-chef-departement-recouvement-amiable`
- `.role-agent-dossier`
- `.role-agent-recouvement-juridique`
- `.role-agent-finance`
- `.role-agent-recouvement-amiable`

### Classes de variantes
- `.compact` - Version compacte
- `.large` - Version large
- `.icon-only` - Version avec icône seulement

## Effets visuels

### Animations
- **Hover** : Translation vers le haut avec ombre portée
- **Chefs de département** : Animation de pulsation avec effet de lueur

### Responsive
- Adaptation automatique de la taille sur mobile
- Support du mode sombre (si implémenté)

## Intégration dans les composants

### Dans les cartes utilisateur
```html
<span class="user-role" [class]="'role-' + (utilisateur.role || '').toLowerCase().replace('_', '-')">
  {{ getRoleDisplayName(utilisateur.role) }}
</span>
```

### Dans les tableaux
```html
<span class="role-badge" [class]="'role-' + (utilisateur.role || '').toLowerCase().replace('_', '-')">
  {{ getRoleDisplayName(utilisateur.role) }}
</span>
```

## Personnalisation

### Ajouter un nouveau rôle
1. Ajouter la classe CSS dans `role-badges.scss`
2. Ajouter le mapping dans le composant `RoleBadgeComponent`
3. Tester avec le composant de démonstration

### Modifier les couleurs
Les couleurs sont définies dans `role-badges.scss` avec des gradients CSS. Modifiez les valeurs `linear-gradient` pour changer les couleurs.

## Fichiers concernés

- `src/app/shared/styles/role-badges.scss` - Styles globaux
- `src/app/shared/components/role-badge/` - Composant réutilisable
- `src/styles.scss` - Import des styles globaux
- Composants de gestion d'utilisateurs - Utilisation des styles

## Exemple de démonstration

Utilisez le composant `RoleBadgeDemoComponent` pour voir tous les badges en action et tester les différentes variantes.























