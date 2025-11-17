# 🧭 Navigation Structure - Paprika

*Guide de la structure de navigation de l'application*

---

## 📱 Bottom Tabs (4 tabs)

### 1. 🏠 **Home** (`/`)
- **Fichier** : `app/(tabs)/index.tsx`
- **Description** : Écran d'accueil avec recettes populaires et suggestions
- **Status** : 🚧 Placeholder

### 2. 📚 **Cookbooks** (`/cookbooks`)
- **Fichier** : `app/(tabs)/cookbooks/index.tsx`
- **Description** : Liste des livres de recettes
- **Status** : ✅ Fonctionnel
- **Navigation** :
  - Click sur cookbook → `/cookbooks/[id]` (détail)

### 3. 📅 **Meal Plan** (`/meal-plan`)
- **Fichier** : `app/(tabs)/meal-plan/index.tsx`
- **Description** : Planning hebdomadaire (7j × 4 repas)
- **Status** : 🚧 Placeholder

### 4. 🛒 **Grocery Lists** (`/grocery-lists`)
- **Fichier** : `app/(tabs)/grocery-lists/index.tsx`
- **Description** : Listes de courses
- **Status** : 🚧 Placeholder

---

## 📄 Stack Screens (sans tabs)

### Cookbooks

#### `/cookbooks/[id]` - Détail d'un Cookbook
- **Fichier** : `app/cookbooks/[id].tsx`
- **Description** : Liste des recettes d'un cookbook spécifique
- **Paramètres** : `id` (UUID du cookbook)
- **Status** : 🚧 Placeholder
- **Navigation depuis** : CookbooksScreen
- **Navigation vers** : `/recipes/[id]` (détail recette)

---

### Recipes

#### `/recipes/[id]` - Détail d'une Recette
- **Fichier** : `app/recipes/[id].tsx`
- **Description** : Affichage complet (ingrédients, étapes, nutrition)
- **Paramètres** : `id` (UUID de la recette)
- **Status** : 🚧 Placeholder
- **Navigation depuis** : CookbookDetail
- **Actions** : Edit, Delete, Add to Meal Plan

#### `/recipes/create` - Créer une Recette
- **Fichier** : `app/recipes/create.tsx`
- **Description** : Formulaire de création manuelle
- **Status** : 🚧 Placeholder
- **Navigation depuis** : FAB ou header action

#### `/recipes/import` - Importer une Recette
- **Fichier** : `app/recipes/import.tsx`
- **Description** : Import depuis URL (IA : JSON-LD → Claude → Vision)
- **Status** : 🚧 Placeholder
- **Navigation depuis** : FAB ou header action

---

### Settings

#### `/settings` - Paramètres
- **Fichier** : `app/settings/index.tsx`
- **Description** : Profil, préférences, abonnement, déconnexion
- **Status** : ✅ Fonctionnel
- **Navigation depuis** : AppHeader (icône profil)

---

## 🎨 Header

### AppHeader Component
- **Fichier** : `src/components/navigation/AppHeader.tsx`
- **Affichage** : Logo "Paprika" + Avatar utilisateur
- **Action** : Click sur avatar → `/settings`
- **Visible sur** : Tous les tabs

---

## 🔄 Flow de Navigation Principal

```
┌─────────────┐
│   Home      │ (Tab 1)
└─────────────┘

┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Cookbooks  │────>│ CookbookDetail   │────>│  RecipeDetail   │
│   (Tab 2)   │     │  /cookbooks/[id] │     │  /recipes/[id]  │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │
       └──────────> CreateCookbookModal

┌─────────────┐
│ Meal Plan   │ (Tab 3)
└─────────────┘

┌─────────────┐
│Grocery Lists│ (Tab 4)
└─────────────┘

Header Avatar ──────> Settings (/settings)
                         │
                         └──> Sign Out → Onboarding/Login
```

---

## 📂 Structure de Fichiers

```
app/
├── (tabs)/                      # Tab navigation group
│   ├── _layout.tsx             # Tabs config + AppHeader
│   ├── index.tsx               # 🏠 Home
│   ├── cookbooks/
│   │   └── index.tsx           # 📚 Cookbooks (fonctionnel)
│   ├── meal-plan/
│   │   └── index.tsx           # 📅 Meal Plan
│   └── grocery-lists/
│       └── index.tsx           # 🛒 Grocery Lists
│
├── cookbooks/
│   └── [id].tsx                # Cookbook Detail
│
├── recipes/
│   ├── [id].tsx                # Recipe Detail
│   ├── create.tsx              # Create Recipe
│   └── import.tsx              # Import Recipe (IA)
│
└── settings/
    └── index.tsx               # ⚙️ Settings (fonctionnel)
```

---

## 🧩 Composants de Navigation

### PlaceholderScreen
- **Fichier** : `src/components/ui/PlaceholderScreen.tsx`
- **Usage** : Écrans vides temporaires pour tester navigation
- **Props** : `title`, `description`, `icon`, `actionLabel`, `onAction`

### AppHeader
- **Fichier** : `src/components/navigation/AppHeader.tsx`
- **Usage** : Header custom avec logo + avatar
- **Actions** : Click avatar → `/settings`

---

## ✅ Status des Écrans

| Écran | Status | Description |
|-------|--------|-------------|
| Home | 🚧 Placeholder | À implémenter |
| Cookbooks | ✅ Fonctionnel | Liste + CRUD |
| CookbookDetail | 🚧 Placeholder | À implémenter |
| RecipeDetail | 🚧 Placeholder | À implémenter |
| CreateRecipe | 🚧 Placeholder | À implémenter |
| ImportRecipe | 🚧 Placeholder | À implémenter |
| MealPlan | 🚧 Placeholder | À implémenter |
| GroceryLists | 🚧 Placeholder | À implémenter |
| Settings | ✅ Fonctionnel | Profil + déconnexion |

---

## 🔜 Prochaines Étapes

1. **CookbookDetail** → Implémenter liste des recettes d'un cookbook
2. **RecipeDetail** → Implémenter affichage complet d'une recette
3. **CreateRecipe** → Formulaire création manuelle
4. **ImportRecipe** → Intégration Edge Functions (IA)
5. **MealPlan** → Calendrier hebdomadaire
6. **GroceryLists** → Gestion listes de courses
7. **Home** → Suggestions et recettes populaires

---

**Version** : 1.0
**Dernière mise à jour** : 17 novembre 2025
