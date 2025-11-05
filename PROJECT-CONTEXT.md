# Paprika - Context Rapide

**Type**: Application mobile React Native (iOS/Android)
**Statut**: 📝 Documentation complète - Code pas encore développé
**Stack**: React Native + Expo + Supabase + Drizzle + Claude AI
**Modèle**: Freemium (€4.99/mois)

---

## 🎯 Qu'est-ce que Paprika ?

**Une application mobile qui simplifie la vie en cuisine grâce à l'IA :**
- 🤖 Import automatique de recettes depuis n'importe quel site web
- 🥗 Calculs nutritionnels automatiques (OpenFoodFacts + IA)
- 📅 Planning de repas hebdomadaire intelligent
- 🛒 Génération automatique de listes de courses
- 📚 Organisation en cookbooks thématiques

---

## 📚 Liens Rapides

### Pour Démarrer
- **[START-HERE.md](./START-HERE.md)** ⭐ Guide de démarrage (5 min)
- **[docs/00-INDEX.md](./docs/00-INDEX.md)** 📖 Index complet de la documentation
- **[docs/01-setup-guide.md](./docs/01-setup-guide.md)** 🚀 Installation (4-6h)

### Architecture & Technique
- **[docs/02-tech-stack.md](./docs/02-tech-stack.md)** 🔧 Stack technique complète
- **[docs/03-data-model.md](./docs/03-data-model.md)** 🗄️ Schéma base de données
- **[docs/08-frontend-guidelines.md](./docs/08-frontend-guidelines.md)** 💻 Guidelines React Native

### Business & Produit
- **[docs/04-product-vision.md](./docs/04-product-vision.md)** 🎯 Vision et marché
- **[docs/05-roadmap.md](./docs/05-roadmap.md)** 📅 Plan 12 semaines
- **[docs/06-freemium-strategy.md](./docs/06-freemium-strategy.md)** 💰 Monétisation

### Design & UI
- **[docs/07-ui-guidelines.md](./docs/07-ui-guidelines.md)** 🎨 Design System "Warm & Cozy"

---

## 📊 État du Projet

| Composant | Statut | Progression |
|-----------|--------|-------------|
| 📝 Documentation | ✅ Complète | 100% |
| 🗄️ Setup Base de Données | ⏳ À faire | 0% |
| ⚙️ Backend (Supabase + Edge Functions) | ⏳ À faire | 0% |
| 📱 Frontend (React Native + Expo) | ⏳ À faire | 0% |
| 🤖 Services IA (Import, Nutrition) | ⏳ À faire | 0% |
| 💳 Intégration Stripe | ⏳ À faire | 0% |
| 🧪 Tests & QA | ⏳ À faire | 0% |

**Dernière mise à jour** : 5 novembre 2025

---

## 🏗️ Architecture Simplifiée

```
┌─────────────────────────────────────────────────────────────┐
│                    📱 React Native App                       │
│              (Expo 52+ / TypeScript / NativeWind)            │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Supabase    │  │  Edge Funcs  │  │   Storage    │
│  PostgreSQL  │  │  (Deno)      │  │  (Images)    │
└──────────────┘  └──────┬───────┘  └──────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Claude AI    │  │ OpenFoodFacts│  │  Unsplash    │
│ (Import +    │  │ (Nutrition)  │  │  (Images)    │
│  Nutrition)  │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        ▼
┌──────────────┐
│   Stripe     │
│ (Paiements)  │
└──────────────┘
```

---

## 🗂️ Schéma Mental du Modèle de Données

```
User (Supabase Auth)
  │
  ├─── Cookbooks (1:N)
  │      └─── Recipes (1:N)
  │             ├─── ingredients (JSONB)
  │             ├─── steps (JSONB)
  │             └─── nutrition (JSONB, auto-calculé)
  │
  ├─── Meal Plans (1:N)
  │      └─── meals (JSONB: 7 jours × 4 repas)
  │
  └─── Grocery Lists (1:N)
         └─── Grocery Items (1:N)

Nutrition Cache (partagé, global)
  └─── Ingredient Library (images + nutrition)
```

---

## 🛠️ Stack Technique (Résumé)

### Frontend
- **React Native 0.76+** : Framework mobile cross-platform
- **Expo 52+** : Toolchain et infrastructure
- **TypeScript 5.x** : Type safety stricte
- **NativeWind** : Tailwind CSS pour React Native
- **TanStack Query** : State management serveur
- **Zustand** : State management client

### Backend
- **Supabase** : PostgreSQL + Auth + Storage + Realtime
- **Drizzle ORM** : ORM type-safe (40KB vs Prisma 300KB)
- **Edge Functions** : Serverless Deno runtime

### Intelligence Artificielle
- **Anthropic Claude 3.5 Sonnet** : Import recettes + Normalisation ingrédients
- **OpenFoodFacts API** : Base nutritionnelle gratuite (2M+ produits)
- **Unsplash API** : Images d'ingrédients HD

### Paiements & Business
- **Stripe** : Subscriptions récurrents (€4.99/mois)
- **Resend** : Emails transactionnels (React Email templates)

### Analytics & Monitoring
- **PostHog** : Analytics + Session replay + Feature flags
- **Sentry** : Error tracking production

---

## 💰 Modèle Économique

### Version Gratuite (Illimitée dans le temps)
- ✅ 2 cookbooks
- ✅ 20 recettes
- ✅ 5 imports IA/mois
- ✅ 1 liste de courses
- ✅ Meal planning illimité

### Version Premium (€4.99/mois ou €49.99/an)
- ♾️ Tout illimité
- ✅ Export PDF professionnel
- ✅ Sync multi-devices
- ✅ Sans publicité
- ✅ Support prioritaire

### Coûts
- **Par utilisateur** : ~€0.24-0.30/mois
- **Fixes mensuels** : €55 (Supabase + Domaine + Sentry)
- **Break-even** : 40-60 utilisateurs premium

---

## 🚀 Roadmap (12 Semaines)

| Phase | Semaines | Focus |
|-------|----------|-------|
| **Phase 1** | 1-4 | Refonte Import & Nutrition IA |
| **Phase 2** | 5-7 | UI/UX Polish |
| **Phase 3** | 8-9 | Monétisation & Business |
| **Phase 4** | 10-12 | Tests, Beta, Launch 🎉 |

[Voir la roadmap détaillée](./docs/05-roadmap.md)

---

## 🎨 Design System "Warm & Cozy"

**Philosophie** : Chaleureux, accueillant, confortable (comme la cuisine familiale)

### Palette de Couleurs
- **Primary** : `#FFB03A` (Orange doux)
- **Cream** : `#FFF9F0` (Crème chaleureux)
- **Warm Brown** : `#6B5847` (Marron texte)
- **Warm Gray** : `#8B7355` (Gris chaud)

### Typographie
- **Font** : Poppins / Inter
- **Hiérarchie** : 2xs (10px) → 5xl (48px)

[Voir le design system complet](./docs/07-ui-guidelines.md)

---

## 📋 Commandes Essentielles

```bash
# ⚠️ Projet pas encore initialisé

# Installation (future)
npm install

# Développement (future)
npm run start           # Dev server
npm run ios             # iOS simulator
npm run android         # Android emulator

# Base de données (future)
npx drizzle-kit generate  # Générer migrations
npx drizzle-kit push      # Appliquer migrations

# Tests (future)
npm run test            # Tests unitaires
npm run test:e2e        # Tests E2E

# Build (future)
eas build --platform all  # Build natif
eas submit                # Submit aux stores
```

---

## 🆘 Besoin d'Aide ?

### Je suis nouveau sur le projet
→ Commencez par [START-HERE.md](./START-HERE.md) (5 min)

### Je veux développer une feature
→ Consultez [docs/00-INDEX.md](./docs/00-INDEX.md) pour trouver la doc pertinente

### Je veux comprendre une décision technique
→ Lisez [DECISION-LOG.md](./DECISION-LOG.md)

### Je ne comprends pas un terme
→ Consultez [GLOSSARY.md](./GLOSSARY.md)

---

## 📞 Contact & Ressources

- 📧 **Email** : dev@paprika.app
- 📚 **Documentation** : Vous êtes au bon endroit !
- 🐛 **Issues** : GitHub Issues (quand le projet sera public)

---

**Version** : 1.0
**Dernière mise à jour** : 5 novembre 2025
**Mainteneur** : Équipe Paprika

---

*Prêt à commencer ? → [START-HERE.md](./START-HERE.md)* 🚀
