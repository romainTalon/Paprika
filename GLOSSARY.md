# Glossaire Paprika

*Définitions des termes métier, techniques et acronymes*

---

## 📚 Concepts Métier

### **Cookbook**
Collection thématique de recettes organisées par l'utilisateur. Exemples : "Desserts", "Recettes d'Été", "Quick Meals", "Cuisine Italienne".

**Limites** :
- Free : 2 cookbooks maximum
- Premium : Illimité

### **Recipe (Recette)**
Entité principale contenant :
- Titre, description, image
- Liste d'ingrédients avec quantités
- Étapes de préparation
- Temps de préparation/cuisson
- Portions (ajustables)
- Valeurs nutritionnelles (auto-calculées)
- Tags et catégories

### **Meal Plan**
Planning hebdomadaire de repas sur **7 jours × 4 slots** :
- **Breakfast** (Petit-déjeuner)
- **Lunch** (Déjeuner)
- **Dinner** (Dîner)
- **Snack** (Collation)

Permet de planifier les repas de la semaine et génère automatiquement la liste de courses associée.

### **Grocery List (Liste de Courses)**
Liste d'ingrédients générée automatiquement depuis :
- Recettes individuelles
- Meal plan hebdomadaire
- Ajout manuel

**Features** :
- Regroupement intelligent (ex: 200g + 300g tomates = 500g)
- Catégorisation automatique (9 catégories)
- Images d'ingrédients automatiques
- Mode shopping avec checkboxes
- Partage possible

### **Import IA**
Processus d'extraction automatique d'une recette depuis une URL web via 3 stratégies :
1. **JSON-LD** : Extraction de métadonnées structurées (gratuit, 70% succès)
2. **LLM + HTML** : Parsing HTML via Claude (~€0.01, 20% succès)
3. **Vision AI** : Screenshot + OCR (~€0.03, 5% succès)

**Quota freemium** : 5 imports/mois

### **Nutrition Auto**
Calcul automatique des valeurs nutritionnelles d'une recette via :
1. Cache Supabase (lookup)
2. OpenFoodFacts API (2M+ produits)
3. IA estimation (ingrédients rares)

**Résultat** : Macros (protéines, glucides, lipides) + micros + calories par portion

---

## 🔧 Concepts Techniques

### **Drizzle ORM**
ORM (Object-Relational Mapping) TypeScript type-safe pour PostgreSQL.

**Avantages vs Prisma** :
- Plus léger (40KB vs 300KB)
- Inférence TypeScript automatique
- Queries optimisées

**Exemple** :
```typescript
const recipes = await db
  .select()
  .from(recipes)
  .where(eq(recipes.userId, userId));
// ✅ recipes est automatiquement typé
```

### **Row Level Security (RLS)**
Sécurité au niveau des lignes PostgreSQL qui garantit que les utilisateurs ne peuvent accéder qu'à leurs propres données.

**Exemple** :
```sql
CREATE POLICY "Users can only see own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);
```

### **Edge Function**
Fonction serverless déployée sur Supabase (runtime Deno) qui s'exécute au plus près des utilisateurs (CDN edge locations).

**Use cases** :
- Webhooks Stripe
- Appels APIs IA (Claude)
- Traitements asynchrones

**Limites** :
- 10s timeout
- 2MB payload max

### **JSON-LD (JSON for Linking Data)**
Format de données structurées intégré dans les pages HTML, souvent utilisé par les sites de recettes pour le SEO.

**Exemple** :
```html
<script type="application/ld+json">
{
  "@type": "Recipe",
  "name": "Pasta Carbonara",
  "recipeIngredient": ["200g pâtes", "100g lardons"],
  "recipeInstructions": [...]
}
</script>
```

Notre stratégie 1 d'import extrait automatiquement ces données.

### **JSONB (PostgreSQL)**
Type de colonne PostgreSQL pour stocker JSON binaire (indexable, queryable).

**Usage dans Paprika** :
- `recipes.ingredients` : Array d'objets JSON
- `recipes.steps` : Array d'instructions
- `meal_plans.meals` : Mapping jour/repas → recettes

**Avantages** :
- Flexibilité (schéma dynamique)
- Performance (index GIN)
- Queries SQL natives

### **NativeWind**
Librairie qui apporte Tailwind CSS à React Native.

**Exemple** :
```tsx
<View className="flex-1 bg-cream-100 p-4">
  <Text className="text-2xl font-bold text-warm-brown">
    Hello
  </Text>
</View>
```

**Avantages** :
- Syntax familière Tailwind
- Compilation au build (pas de runtime overhead)
- Bundle size réduit (~50KB)

### **TanStack Query (React Query)**
Librairie de gestion du state serveur (fetching, caching, synchronisation).

**Exemple** :
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['recipes', userId],
  queryFn: () => fetchRecipes(userId)
});
```

**Features** :
- Cache automatique
- Refetch en background
- Optimistic updates
- Retry automatique

### **Zustand**
Librairie minimaliste de state management client (UI state temporaire).

**Usage dans Paprika** :
- Theme (light/dark)
- UI states (modals open/close)
- Filters/search queries

**Exemple** :
```typescript
const useStore = create((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme })
}));
```

---

## 🤖 Concepts IA

### **LLM (Large Language Model)**
Modèle d'IA générative capable de comprendre et générer du texte.

**Notre LLM** : Anthropic Claude 3.5 Sonnet

**Use cases** :
- Parsing HTML de recettes
- Normalisation d'ingrédients
- Estimation nutritionnelle (fallback)

### **Vision AI**
Modèle d'IA capable d'analyser des images.

**Notre Vision AI** : Claude 3.5 Sonnet avec vision

**Use case** : Extraction de recettes depuis screenshot de page web (stratégie 3)

### **Prompt Engineering**
Art de rédiger des prompts optimisés pour obtenir les meilleurs résultats d'un LLM.

**Exemple Paprika** :
```typescript
const prompt = `Extrais la recette de ce HTML et retourne UNIQUEMENT un JSON valide avec cette structure exacte:
{
  "title": "string",
  "ingredients": [{"name": "string", "quantity": number, "unit": "string"}],
  ...
}

HTML:
${html}`;
```

### **Token**
Unité de mesure pour les LLMs (≈ 4 caractères).

**Coûts Claude 3.5 Sonnet** :
- Input : $3 / 1M tokens
- Output : $15 / 1M tokens

**Import HTML moyen** : ~4K tokens input + 1K output = ~€0.01

### **Context Window**
Nombre maximum de tokens qu'un LLM peut traiter en une fois.

**Claude 3.5 Sonnet** : 200K tokens (≈ 150K mots)
**GPT-4o** : 128K tokens

---

## 💼 Concepts Business

### **Freemium**
Modèle économique où le produit est gratuit avec des limitations, et les utilisateurs peuvent payer pour débloquer des features premium.

**Philosophie Paprika** : Freemium généreux sans demande de CB, conversion naturelle quand limite atteinte.

### **LTV (Lifetime Value)**
Revenu moyen généré par un utilisateur sur toute sa durée de vie.

**Target Paprika** : LTV > €50 (10+ mois d'abonnement moyen)

### **CAC (Customer Acquisition Cost)**
Coût moyen pour acquérir un nouvel utilisateur.

**Target Paprika** : CAC < €10

### **Churn**
Taux d'attrition (pourcentage d'utilisateurs qui annulent leur abonnement).

**Target Paprika** : Churn < 5%/mois

### **Conversion Rate**
Pourcentage d'utilisateurs gratuits qui passent premium.

**Target Paprika** : 10-15% après 30 jours

### **Break-even**
Seuil de rentabilité (nombre d'utilisateurs premium nécessaires pour couvrir les coûts fixes).

**Paprika** : 40-60 utilisateurs premium (€4.99/mois)

### **Paywall**
Écran/modal demandant à l'utilisateur de passer premium.

**Philosophie Paprika** : Paywalls "Warm & Cozy" (amicaux, pas agressifs, toujours dismissables)

**Types de paywalls** :
1. **Limite atteinte** (20 recettes, 5 imports)
2. **Découverte Premium** (J+7 utilisateur actif)
3. **Feature premium** (export PDF, sync)

---

## 📊 Concepts Produit

### **MVP (Minimum Viable Product)**
Version minimale du produit contenant uniquement les features essentielles pour valider le concept.

**MVP Paprika** :
- Cookbooks + Recettes CRUD
- Import IA (3 stratégies)
- Meal Planning
- Grocery Lists
- Nutrition Auto
- Freemium avec Stripe

### **OTA Update (Over-The-Air)**
Mise à jour de l'application sans passer par les stores (via Expo).

**Avantages** :
- Déploiement instantané
- Pas de validation Apple/Google
- Hotfixes rapides

**Limites** :
- Uniquement JavaScript (pas de code natif)
- Limité aux changements non-structurels

### **Onboarding**
Processus d'accueil d'un nouvel utilisateur pour lui faire découvrir l'app.

**Paprika Onboarding** :
1. Wizard 3 étapes
2. Création premier cookbook
3. Ajout première recette (guidé)

**Objectif** : 70%+ créent première recette en 24h

### **Retention**
Pourcentage d'utilisateurs qui reviennent après X jours.

**Targets Paprika** :
- D7 : 40%+ (7 jours)
- D30 : 25%+ (30 jours)

---

## 🔤 Acronymes

### **API** (Application Programming Interface)
Interface permettant à deux applications de communiquer.

**APIs Paprika** :
- Anthropic Claude
- OpenFoodFacts
- Unsplash
- Stripe

### **BaaS** (Backend-as-a-Service)
Service cloud offrant backend clé-en-main (DB, Auth, Storage).

**Paprika BaaS** : Supabase

### **CI/CD** (Continuous Integration / Continuous Deployment)
Processus automatisé de build, test et déploiement.

**Paprika CI/CD** : EAS (Expo Application Services)

### **DX** (Developer Experience)
Expérience développeur (qualité des outils, documentation, etc.).

### **E2E** (End-to-End)
Tests qui simulent le parcours utilisateur complet.

### **IAP** (In-App Purchase)
Achat intégré dans l'application (Apple/Google).

### **OCR** (Optical Character Recognition)
Reconnaissance de texte depuis images.

**Use case futur Paprika** : Scanner recettes de livres/magazines

### **ORM** (Object-Relational Mapping)
Couche d'abstraction entre code et base de données.

**Paprika ORM** : Drizzle

### **RLS** (Row Level Security)
Voir [Concepts Techniques](#row-level-security-rls)

### **SDK** (Software Development Kit)
Ensemble d'outils pour développer sur une plateforme.

**SDKs Paprika** :
- Expo SDK
- Supabase JS SDK
- Anthropic SDK
- Stripe SDK

### **SEO** (Search Engine Optimization)
Optimisation pour moteurs de recherche.

**JSON-LD** utilisé par sites de recettes pour le SEO.

### **UX** (User Experience)
Expérience utilisateur (facilité d'usage, plaisir, efficacité).

**Philosophie Paprika** : Design "Warm & Cozy" (chaleureux, confortable)

### **WCAG** (Web Content Accessibility Guidelines)
Standards d'accessibilité web.

**Paprika** : Objectif WCAG AA (contraste 4.5:1 minimum)

---

## 🎨 Termes Design

### **Design System**
Ensemble cohérent de composants, couleurs, typographies et règles de design.

**Paprika Design System** : "Warm & Cozy"
- Primary: `#FFB03A` (Orange doux)
- Cream: `#FFF9F0`
- Warm Brown: `#6B5847`

### **Atomic Design**
Méthodologie de design par composants :
- **Atoms** : Boutons, inputs, textes
- **Molecules** : Card, SearchBar
- **Organisms** : Header, RecipeList
- **Templates** : Layouts
- **Pages** : Screens complets

### **a11y** (Accessibility)
Raccourci pour "accessibility" (11 lettres entre 'a' et 'y').

**Standards Paprika** :
- Contraste minimum 4.5:1
- Touch targets 44x44px minimum
- Labels accessibles sur tous éléments interactifs

---

## 🛠️ Outils & Technologies

### **EAS** (Expo Application Services)
Service cloud Expo pour builds natifs et déploiement.

**Features** :
- EAS Build : Builds iOS/Android dans le cloud
- EAS Submit : Soumission automatique aux stores
- EAS Update : OTA updates

### **Deno**
Runtime JavaScript moderne (comme Node.js) utilisé par Supabase Edge Functions.

**Avantages** :
- TypeScript natif
- Sécurisé par défaut
- Import URLs (pas de npm)

### **PostHog**
Plateforme analytics open-source.

**Features utilisées** :
- Event tracking
- Session replay
- Feature flags
- A/B testing

### **Sentry**
Service de monitoring d'erreurs en production.

**Features** :
- Error tracking
- Performance monitoring
- Release tracking

---

## 📚 Ressources

### Pour approfondir un terme
- **Technique** : Voir [docs/02-tech-stack.md](./docs/02-tech-stack.md)
- **Business** : Voir [docs/06-freemium-strategy.md](./docs/06-freemium-strategy.md)
- **Design** : Voir [docs/07-ui-guidelines.md](./docs/07-ui-guidelines.md)

### Liens externes
- [React Native Docs](https://reactnative.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Anthropic Claude API](https://docs.anthropic.com)

---

**Version** : 1.0
**Dernière mise à jour** : 5 novembre 2025
**Mainteneur** : Équipe Paprika

---

*Glossaire vivant - Mis à jour régulièrement avec nouveaux termes*
