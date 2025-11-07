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
| 🗄️ Base de Données | ⏳ À faire | 0% |
| ⚙️ Backend | ⏳ À faire | 0% |
| 📱 Frontend | 🚧 En cours | 15% |
| 🤖 Services IA | ⏳ À faire | 0% |
| 💳 Paiements | ⏳ À faire | 0% |

**Phase 1 Setup complétée** ✅ :
- Expo 54 + React Native 0.81 + TypeScript 5.9
- Design System complet (StyleSheet natif + thème réutilisable)
- Composants UI de base (Text, Button, Container)
- Navigation Expo Router configurée

**Dernière mise à jour** : 7 novembre 2025

---

## ⚡ Quick Start

> ⚠️ **Le projet n'est pas encore initialisé. Seule la documentation est complète.**

### Pour Commencer

**Si vous êtes nouveau :**
1. 📄 Lire [PROJECT-CONTEXT.md](./PROJECT-CONTEXT.md) (2 min) - Vue d'ensemble rapide
2. 🎯 Lire [START-HERE.md](./START-HERE.md) (5 min) - Guide de démarrage
3. 🚀 Suivre [docs/01-setup-guide.md](./docs/01-setup-guide.md) (4-6h) - Installation (quand ready)

### Commandes (futures)

```bash
# Installation
npm install

# Développement
npm run start           # Dev server
npm run ios             # iOS simulator
npm run android         # Android emulator

# Base de données
npx drizzle-kit generate  # Générer migrations
npx drizzle-kit push      # Appliquer migrations

# Build production
eas build --platform all  # Build natif
```

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
