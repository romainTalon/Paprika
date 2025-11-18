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
| 📱 Frontend | 🚧 En cours | 70% |
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

**Recettes** ✅ (18 novembre 2025) :
- ✅ RecipeListScreen - Affichage des recettes d'un cookbook
- ✅ CreateRecipeScreen - Formulaire complet de création manuelle
- ✅ RecipeCard - Composant réutilisable avec actions (favori, éditer, supprimer)
- ✅ IngredientInput - Input dynamique pour ingrédients (nom, quantité, unité)
- ✅ StepInput - Input dynamique pour étapes numérotées
- ✅ Hooks TanStack Query (useRecipes, useCookbookRecipes, useCreateRecipe, etc.)
- ✅ Validation Zod complète avec messages en français
- ✅ Gestion toggle favori en temps réel
- ✅ Suppression avec confirmation
- ✅ Empty state, error state, loading state
- ✅ FAB pour création rapide
- ✅ Mapping snake_case ↔ camelCase (CookbookService + RecipeService)
- ⏳ RecipeDetailScreen (placeholder - à implémenter)

**Navigation & UI** :
- ✅ Navigation complète configurée (4 tabs + écrans stack)
- ✅ AppHeader custom avec profil cliquable
- ✅ PlaceholderScreen pour écrans en développement
- ✅ Protection des routes (redirection vers login si non authentifié)
- ✅ SettingsScreen complet (profil, abonnement, déconnexion)

**Authentification complète** ✅ :
- ✅ AuthContext avec Supabase Auth (session persistence via AsyncStorage)
- ✅ Écrans d'authentification (Login, Signup, Forgot Password)
- ✅ Onboarding multi-étapes (3 écrans) pour nouveaux utilisateurs
- ✅ Validation de formulaires avec Zod
- ✅ Gestion d'erreurs détaillée (messages en français)
- ✅ Déconnexion avec confirmation
- ✅ Navigation automatique basée sur l'état d'authentification
- ✅ Token refresh automatique (AppState listener)
- ⏳ Deep links pour confirmation email (désactivée temporairement)

**Dernière mise à jour** : 18 novembre 2025

**Derniers changements** (18 novembre 2025) :
- ✅ Implémentation complète de la gestion des recettes (liste + création)
- ✅ 7 nouveaux fichiers créés (~2,000 lignes de code)
- ✅ Correction bug hooks React (order of hooks)
- ✅ Mapping snake_case/camelCase dans RecipeService
- ✅ Flow complet : Cookbook → RecipeList → CreateRecipe → (RecipeDetail)

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
