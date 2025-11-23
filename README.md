# Paprika 🍳

> Application mobile de gestion de recettes avec IA

[![Status](https://img.shields.io/badge/Status-Documentation-blue)]()
[![License](https://img.shields.io/badge/License-Proprietary-red)]()
[![React Native](https://img.shields.io/badge/React_Native-0.76+-61DAFB?logo=react)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)]()

---

## 🎯 Vue d'Ensemble

**Paprika simplifie la vie en cuisine grâce à l'intelligence artificielle.**

Une application mobile iOS/Android qui permet d'importer automatiquement des recettes depuis n'importe quel site web, de les organiser en cookbooks thématiques, de planifier ses repas hebdomadaires et de générer automatiquement sa liste de courses avec calculs nutritionnels.

### Fonctionnalités Clés

- 🤖 **Import IA** - Importer des recettes depuis n'importe quel site (3 stratégies hybrides)
- 🥗 **Nutrition Auto** - Calculs nutritionnels automatiques (OpenFoodFacts + IA)
- 📅 **Meal Planning** - Planification hebdomadaire intelligente (7j × 4 repas)
- 🛒 **Listes de Courses** - Génération automatique avec images d'ingrédients
- 📚 **Cookbooks** - Organisation par thème personnalisé
- 💰 **Freemium** - Gratuit généreux, upgrade naturel vers premium

---

## 📊 État du Projet

| Composant | Statut | Progression |
|-----------|--------|-------------|
| 📝 Documentation | ✅ Complète | 100% |
| 🗄️ Base de Données | ✅ Opérationnelle | 85% |
| ⚙️ Backend Services | ✅ Fonctionnels | 60% |
| 📱 Frontend | 🚧 En cours | 75% |
| 🤖 Services IA | 🚧 En cours | 50% |
| 🔐 Authentification | ✅ Complète | 100% |
| 📚 Gestion Recettes | ✅ Complète | 100% |
| 💳 Paiements | ⏳ À faire | 0% |

**Phase 1 Setup complétée** ✅ :
- Expo 54 + React Native 0.81 + TypeScript 5.9
- Design System complet (StyleSheet natif + thème réutilisable)
- Composants UI de base (Text, Button, Container)
- Navigation Expo Router configurée (tabs + screens)
- TanStack Query Provider configuré

**Base de Données configurée** ✅ :
- Schéma SQL complet (7 tables avec RLS policies)
- Drizzle ORM configuré et testé
- Services TypeScript (Cookbook, Recipe, MealPlan, GroceryList)
- Limites freemium enforcées au niveau DB
- Trigger auto-création utilisateur configuré
- Edge Function reset mensuel déployée
- Documentation complète (supabase/README.md)
- Tests réussis (création user + cookbook)

**Services IA développés** 🚧 :
- RecipeImportService avec stratégie 3-tier (JSON-LD → Claude → Vision)
- NutritionService avec cache + OpenFoodFacts + fallback Claude
- ImageService avec Unsplash + Supabase Storage
- ⚠️ Services créés mais non exportés (dépendances Node.js incompatibles avec RN)
- 📝 Solution: Migration vers Supabase Edge Functions prévue

**Frontend fonctionnel** 🚧 :

**Cookbooks** ✅ :
- ✅ CookbooksScreen avec liste, création, édition, suppression
- ✅ CreateCookbookModal avec validation et gestion d'état
- ✅ Hooks TanStack Query (useCookbooks, useCreateCookbook, etc.)
- ✅ UI freemium (limite 2 cookbooks affichée)

**Recettes** ✅ (23 novembre 2025) :
- ✅ RecipeListScreen - Affichage des recettes d'un cookbook
- ✅ CreateRecipeScreen - Formulaire complet de création manuelle avec TimeStepper et fractions
- ✅ RecipeDetailScreen - Lecture interactive avec checkboxes et multiplier portions (23 nov)
- ✅ RecipeCard - Composant réutilisable avec actions (favori, éditer, supprimer)
- ✅ IngredientInput - Input dynamique avec support fractions et unité optionnelle
- ✅ StepInput - Input dynamique pour étapes numérotées
- ✅ TimeStepper - Composant stepper heures/minutes pour temps de préparation/cuisson
- ✅ Hooks TanStack Query (useRecipes, useCookbookRecipes, useCreateRecipe, useRecipe, etc.)
- ✅ Validation Zod complète avec messages en français
- ✅ Gestion toggle favori en temps réel (optimistic UI)
- ✅ Suppression avec confirmation
- ✅ Empty state, error state, loading state, not found state
- ✅ FAB pour création rapide
- ✅ Mapping snake_case ↔ camelCase (CookbookService + RecipeService)
- ⏳ RecipeEditScreen (à implémenter)

**Navigation & UI** :
- ✅ Navigation complète configurée (4 tabs + écrans stack)
- ✅ AppHeader custom avec profil cliquable
- ✅ PlaceholderScreen pour écrans en développement
- ✅ Protection des routes (redirection vers login si non authentifié)
- ✅ SettingsScreen complet (profil, abonnement, déconnexion)

**Authentification complète** ✅ :
- ✅ AuthContext avec Supabase Auth (session persistence via AsyncStorage)
- ✅ Écrans d'authentification (Login, Signup, Forgot Password)
- ✅ Onboarding multi-étapes (3 écrans) responsive avec emojis optimisés (23 novembre 2025)
- ✅ Validation de formulaires avec Zod
- ✅ Gestion d'erreurs détaillée (messages en français)
- ✅ Déconnexion avec confirmation
- ✅ Navigation automatique basée sur l'état d'authentification
- ✅ Token refresh automatique (AppState listener)
- ⏳ Deep links pour confirmation email (désactivée temporairement)

**Dernière mise à jour** : 23 novembre 2025

**Derniers changements** (23 novembre 2025) :

**Écran Détail Recette (RecipeDetailScreen)** :
- ✅ **Implémentation complète** - Remplacement du placeholder par écran fonctionnel complet (759 lignes)
- ✅ **Header interactif** - Image hero + titre + bouton favori (❤️/🤍) avec optimistic UI
- ✅ **Metadata bar** - Portions, temps (prep/cook/total formatés "2h30"), difficulté
- ✅ **Servings multiplier** - Stepper +/- 0.5 portions avec recalcul automatique ingrédients
  - useMemo pour performance (pas de re-calcul inutile)
  - Quantités ajustées en temps réel (4 portions → 2 portions divise tout par 2)
- ✅ **Checkboxes interactives** - Ingrédients et étapes cochables pendant la cuisine
  - State avec Set<number> pour performance O(1)
  - Visual feedback : strikethrough + opacity 0.5
  - Persiste pendant la session (réinitialise au unmount)
- ✅ **Sections optionnelles** - Description, nutrition (calories, protéines, glucides, lipides, fibres)
- ✅ **États complets** - Loading, error avec retry, not found (404 avec 🔍)
- ✅ **Actions utilisateur** - Modifier (placeholder), Supprimer (confirmation + navigation back)
- ✅ **Patterns avancés** - useCallback, useMemo, conditional rendering, formatTime utility
- ✅ **Accessibilité** - ARIA labels, touch targets 44×44px, accessibilityState pour checkboxes
- 📄 **Documentation complète** - DECISION-LOG.md (153 lignes) + docs/08-frontend-guidelines.md (section RecipeDetailScreen patterns)

**Amélioration UX Création de Recettes Manuelles** :
- ✅ **FAB croix centrée** - Fix lineHeight pour centrage vertical parfait du bouton "+"
- ✅ **TimeStepper Component** - Saisie temps intuitive (Heures / Minutes) avec boutons +/-
  - Conversion automatique : 2h30 → 150 min (stockage DB)
  - Touch targets 44×44px, accessibilité complète
- ✅ **Unité optionnelle pour ingrédients** - "1 carotte" sans unité awkward maintenant possible
  - Validation Zod mise à jour : `unit?.optional()`
  - Interface TypeScript : `unit?: string`
  - Exemples valides : "1 carotte" (sans unité), "200 g farine" (avec unité)
- ✅ **Support fractions pour quantités** - Utilitaire `fractionParser.ts` créé
  - Parse : "1/2" → 0.5, "3/4" → 0.75, "1 1/2" → 1.5
  - Support unicode : ½, ¼, ¾, ⅓, ⅔, ⅛, etc.
  - Intégration dans IngredientInput avec parsing temps réel
- ✅ **Validation en temps réel** - Feedback immédiat sur champ titre
  - Bordure rouge + message d'erreur sous le champ
  - Events : `onChangeText` + `onBlur`
  - Extensible à tous les champs du formulaire
- ✅ **Ajustements UI** - Interface épurée et alignée
  - Retrait hints redondants sous champs ingrédients
  - Alignement hauteur parfait des inputs
  - Fix bouton submit (unité optionnelle prise en compte)
- 📄 **Documentation complète** - DECISION-LOG.md + docs/08-frontend-guidelines.md (section 9.2)

**Écrans d'Onboarding Optimisés** :
- ✅ **Correction emojis croppés dans illustrations** - lineHeight ajouté aux 6 emojis manquants (📱✨, 🔗📋, 📅🛒)
- ✅ **Responsive design avec useWindowDimensions** - Adaptation automatique aux petits écrans (iPhone SE, Android compact)
- ✅ **Tailles adaptatives** - Emojis 80px→64px (-20%), illustrations 200px→160px (-20%) sur petits écrans
- ✅ **Pattern établi** - useWindowDimensions + lineHeight dynamique (fontSize + 8px) pour tous les futurs écrans
- ✅ **Documentation complète** - DECISION-LOG.md + docs/08-frontend-guidelines.md (sections 1.2.4 et 3.2)
- 📱 Testé sur iPhone SE (667px), iPhone 14 (844px), grands écrans

**Changements précédents** (19 novembre 2025) :

**Navigation inter-écrans** :
- ✅ **BackButton component** - Bouton "← Retour" réutilisable pour écrans standalone
- ✅ Ajouté à cookbooks/[id].tsx (tous les états : loading, error, empty, main)
- ✅ Ajouté à app/settings/index.tsx
- ✅ Ajouté à app/recipes/create.tsx
- ✅ Props flexibles (onPress personnalisé, label personnalisé)
- ✅ Accessible (accessibilityLabel, accessibilityRole)
- ✅ Documentation complète (DECISION-LOG.md + docs/08-frontend-guidelines.md section 2.4)

**Gestion des Safe Areas iOS/Android** (17 fichiers modifiés) :
- ✅ SafeAreaProvider global configuré dans app/_layout.tsx
- ✅ AppHeader avec SafeAreaView (respect notch/Dynamic Island)
- ✅ Container avec support useSafeArea (prop flexible)
- ✅ AuthFormContainer avec useSafeArea par défaut
- ✅ Tous les écrans standalone (Settings, Create Recipe, Recipe List) corrigés
- ✅ **Correction emojis croppés** - lineHeight ajouté partout (48px→56px, 64px→72px, 80px→88px)
- ✅ Documentation complète (DECISION-LOG.md + docs/08-frontend-guidelines.md section 3.3)
- ✅ Pattern clair selon type d'écran (tabs vs standalone)
- 📱 Support complet iPhone X/11/12/13/14/15 (notch + Dynamic Island)
- 📱 Support complet Android (status bar + navigation bar)

---

## ⚡ Quick Start

> ⚠️ **Le projet n'est pas encore initialisé. Seule la documentation est complète.**

### Pour Commencer

**Si vous êtes nouveau :**
1. 📄 Lire [PROJECT-CONTEXT.md](./PROJECT-CONTEXT.md) (2 min) - Vue d'ensemble rapide
2. 🎯 Lire [START-HERE.md](./START-HERE.md) (5 min) - Guide de démarrage
3. 🚀 Suivre [docs/01-setup-guide.md](./docs/01-setup-guide.md) (4-6h) - Installation (quand ready)

### Commandes

```bash
# Installation
npm install

# Développement
npm run start           # Dev server
npm run ios             # iOS simulator
npm run android         # Android emulator

# Base de données (Drizzle ORM)
npm run db:studio       # Open Drizzle Studio (visual DB browser)
npm run db:generate     # Generate migrations
npm run db:push         # Apply migrations
npm run db:introspect   # Sync schema from DB

# Type checking & Linting
npm run type-check      # TypeScript validation
npm run lint            # ESLint

# Build production (futur)
eas build --platform all  # Build natif
```

### Setup Initial de la Base de Données

1. **Créer un projet Supabase** sur [supabase.com](https://supabase.com)
2. **Copier vos credentials** dans `.env.local` (voir `.env.local.example`)
3. **Exécuter le schéma SQL** dans Supabase SQL Editor (copier/coller `supabase/schema.sql`)
4. **Tester la connexion** : `npm run db:studio`

**📖 Guides détaillés** :
- [supabase/README.md](./supabase/README.md) - Setup base de données
- [docs/12-environment-secrets.md](./docs/12-environment-secrets.md) - 🔐 Sync secrets multi-devices (Google Drive + Symlink)

---

## 📚 Documentation

| Pour qui ? | Commencer ici | Temps |
|-----------|---------------|-------|
| 🚀 **Nouveau** | [START-HERE.md](./START-HERE.md) | 5 min |
| 👨‍💻 **Développeur** | [docs/00-INDEX.md](./docs/00-INDEX.md#-je-suis-développeur) | - |
| 📊 **Product Manager** | [docs/04-product-vision.md](./docs/04-product-vision.md) | 20 min |
| 💰 **Investisseur** | [docs/05-roadmap.md](./docs/05-roadmap.md#budget-estimé) | 1h |
| 🎨 **Designer** | [docs/07-ui-guidelines.md](./docs/07-ui-guidelines.md) | 45 min |

### Documents Clés
- [📄 PROJECT-CONTEXT.md](./PROJECT-CONTEXT.md) - Vue d'ensemble rapide
- [📖 docs/00-INDEX.md](./docs/00-INDEX.md) - Index complet de la documentation
- [📝 DECISION-LOG.md](./DECISION-LOG.md) - Log des décisions architecturales
- [📘 GLOSSARY.md](./GLOSSARY.md) - Glossaire des termes

---

## 🏗️ Stack Technique

```yaml
Frontend:
  Framework: React Native 0.81+ / Expo 54+
  Langage: TypeScript 5.9 (strict mode)
  Styling: StyleSheet natif + Design System
  State: TanStack Query + Zustand

Backend:
  BaaS: Supabase (PostgreSQL + Auth + Storage)
  ORM: Drizzle (type-safe, 40KB)
  Functions: Edge Functions (Deno)

Intelligence Artificielle:
  LLM: Anthropic Claude 3.5 Sonnet
  Nutrition: OpenFoodFacts API (gratuit)
  Images: Unsplash API

Business:
  Paiements: Stripe (subscriptions)
  Emails: Resend + React Email
  Analytics: PostHog + Sentry
```

**[Voir la stack complète →](./docs/02-tech-stack.md)**

---

## 💰 Modèle Freemium

| | Version Gratuite | Version Premium |
|---|---|---|
| **Prix** | €0/mois | **€4.99/mois** ou €49.99/an |
| Cookbooks | 2 | ♾️ Illimité |
| Recettes | 20 | ♾️ Illimité |
| Imports IA/mois | 5 | ♾️ Illimité |
| Listes de courses | 1 | ♾️ Illimité |
| Meal planning | ✅ Illimité | ✅ Illimité |
| Nutrition | ✅ Basique | ✅ Avancée |
| Export PDF | ❌ | ✅ |
| Sync multi-devices | ❌ | ✅ |
| Publicités | ✅ Discrètes | ❌ Aucune |

**[Voir la stratégie complète →](./docs/06-freemium-strategy.md)**

---

## 📅 Roadmap

**12 semaines de la conception au lancement**

| Phase | Semaines | Focus | Statut |
|-------|----------|-------|--------|
| **Phase 1** | 1-4 | Refonte Import & Nutrition IA | ⏳ À venir |
| **Phase 2** | 5-7 | UI/UX Polish | ⏳ À venir |
| **Phase 3** | 8-9 | Monétisation & Business | ⏳ À venir |
| **Phase 4** | 10-12 | Tests, Beta, Launch 🎉 | ⏳ À venir |

**[Voir le plan détaillé →](./docs/05-roadmap.md)**

---

## 💵 Budget

### Coûts Initiaux
- **Setup & développement** : €500
- **Launch (stores, marketing)** : €800-1300
- **Total initial** : ~€1100-1600

### Coûts Mensuels
- **Fixes** : €55/mois (Supabase + Domaine + Sentry)
- **Variables** : €0.24-0.30/utilisateur actif
- **Break-even** : **40-60 utilisateurs premium**

**[Voir le budget détaillé →](./docs/05-roadmap.md#budget-estimé)**

---

## 🤝 Contributing

Ce projet est actuellement en développement privé. Les contributions seront ouvertes après le lancement public.

---

## 📄 License

**Proprietary** - Tous droits réservés © 2025 Paprika

---

## 📞 Contact & Support

- 📧 **Email** : dev@paprika.app
- 🐛 **Issues** : GitHub Issues (à venir)
- 📚 **Documentation** : [docs/](./docs/)

---

## 🚀 Prochaines Étapes

**Pour commencer immédiatement :**

1. 📄 Lire [PROJECT-CONTEXT.md](./PROJECT-CONTEXT.md) (2 min)
2. 🎯 Lire [START-HERE.md](./START-HERE.md) (5 min)
3. 📖 Explorer [docs/00-INDEX.md](./docs/00-INDEX.md) selon votre rôle
4. 🚀 Suivre [docs/01-setup-guide.md](./docs/01-setup-guide.md) quand prêt à développer

---

<div align="center">

**Paprika - Simplifiez votre cuisine avec l'IA** 🍳✨

[![Made with ❤️](https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F-red)]()
[![React Native](https://img.shields.io/badge/React_Native-0.76+-61DAFB)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)]()

*Version 1.0 - Documentation complète*

*Dernière mise à jour : 5 novembre 2025*

</div>
