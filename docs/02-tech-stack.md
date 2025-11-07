# **02 - Stack Technique Paprika**

*Architecture et technologies utilisées*

---

## 🎯 **Philosophie Technique**

**Principes de conception :**
1. ✅ **Type-safety maximale** : TypeScript strict + Drizzle ORM
2. ✅ **Simplicité de setup** : Time-to-market < 1 semaine
3. ✅ **Scalabilité** : Support 100k+ utilisateurs
4. ✅ **Coûts maîtrisés** : ~€0.30/utilisateur/mois
5. ✅ **Maintenabilité** : Code propre, bien documenté

---

## 📱 **Frontend**

### **React Native 0.81+**
- **Pourquoi** : Code partagé iOS + Android
- **Avantages** :
  - Performance native
  - Écosystème mature
  - Hot reload excellent

### **Expo 54+**
- **Pourquoi** : Simplification développement mobile
- **Features utilisées** :
  - OTA Updates (déploiement sans stores)
  - EAS Build (CI/CD intégré)
  - Expo Router (navigation file-based)
  - Expo Modules (accès fonctionnalités natives)

### **TypeScript 5.x (Strict Mode)**
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true
}
```

### **Design System - StyleSheet Natif**
- **Pourquoi** : Stabilité maximale et performances optimales
- **Avantages** :
  - Zero setup, natif React Native
  - Type-safety complète avec TypeScript
  - Performance native optimale
  - Pas de dépendances tierces

**Architecture :**
```typescript
// src/theme/ - Tokens de design réutilisables
import { colors, spacing, fontSizes, shadows } from "@/theme";

// src/components/ui/ - Composants UI stylisés
import { Text, Button, Container } from "@/components/ui";

// Exemple d'utilisation
<Container centered>
  <Text variant="h1" color="primary">
    Mes Recettes
  </Text>
  <Button variant="primary" size="lg">
    Ajouter une recette
  </Button>
</Container>
```

**Documentation complète :** [docs/09-design-system.md](./09-design-system.md)

---

## 🗄️ **Backend & Database**

### **Supabase (PostgreSQL 15+)**

**Services utilisés :**

1. **Database** : PostgreSQL relationnel
   - JSONB pour données flexibles
   - Full-text search
   - Triggers automatiques
   
2. **Auth** : Authentification complète
   - Email/Password
   - OAuth (Google, Apple)
   - Magic Links
   - Session management
   
3. **Storage** : Fichiers utilisateurs
   - Images recettes
   - Photos de profil
   - Bucket public/privé
   
4. **Edge Functions** : Serverless
   - Webhooks Stripe
   - Traitements IA
   - API endpoints custom
   
5. **Realtime** : WebSocket natif
   - Changements DB en temps réel
   - Sync multi-devices

### **Drizzle ORM**

**Pourquoi Drizzle :**
- ✅ Type-safety excellente (inférence auto)
- ✅ Performance (queries optimisées)
- ✅ Lightweight (~40KB vs Prisma ~300KB)
- ✅ Migrations versionnées
- ✅ SQL-like syntax

**Exemple :**
```typescript
// db/schema.ts
export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  ingredients: jsonb("ingredients").$type<Ingredient[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Utilisation
const userRecipes = await db
  .select()
  .from(recipes)
  .where(eq(recipes.userId, userId));
// userRecipes est automatiquement typé !
```

### **Approche Hybride : Drizzle + Supabase Client**

```typescript
// Queries complexes → Drizzle (type-safe)
const recipes = await db
  .select()
  .from(recipes)
  .leftJoin(cookbooks, eq(recipes.cookbookId, cookbooks.id));

// Auth → Supabase
const { data: { user } } = await supabase.auth.getUser();

// Storage → Supabase
await supabase.storage.from("recipes").upload(path, file);

// Realtime → Supabase
supabase
  .channel("updates")
  .on("postgres_changes", { table: "recipes" }, handleChange)
  .subscribe();
```

---

## 🤖 **Intelligence Artificielle**

### **Anthropic Claude 3.5 Sonnet**

**Cas d'usage :**

1. **Parsing HTML de recettes**
```typescript
const recipe = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 4096,
  messages: [{
    role: "user",
    content: `Extrais la recette de ce HTML:\n${html}`
  }]
});
```

2. **Vision AI (screenshots)**
```typescript
const recipe = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  messages: [{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", data: imageBase64 } },
      { type: "text", text: "Extrais cette recette en JSON" }
    ]
  }]
});
```

3. **Normalisation ingrédients**
```typescript
const normalized = await anthropic.messages.create({
  messages: [{
    role: "user",
    content: `Normalise: "2 grosses tomates" → JSON`
  }]
});
// → { name: "tomate", quantity: 300, unit: "g" }
```

**Budget :**
- Import HTML : ~$0.01/recette
- Vision AI : ~$0.03/screenshot
- Normalisation : ~$0.001/ingrédient

---

## 📊 **Données Nutritionnelles**

### **OpenFoodFacts API**

**Pourquoi :**
- ✅ Gratuit et open-source
- ✅ 2M+ produits (excellent FR)
- ✅ Données détaillées (macros + micros)
- ✅ Pas de limite d'API

**Exemple :**
```typescript
const nutrition = await fetch(
  `https://world.openfoodfacts.org/cgi/search.pl?` +
  `search_terms=tomate&json=1&lc=fr`
);

// Retourne :
{
  "energy-kcal_100g": 18,
  "proteins_100g": 0.9,
  "carbohydrates_100g": 3.9,
  "fat_100g": 0.2,
  "fiber_100g": 1.2
}
```

**Stratégie :**
1. Cache Supabase (table `nutrition_cache`)
2. Recherche OpenFoodFacts
3. Si non trouvé → Estimation IA
4. Stockage permanent du résultat

---

## 🖼️ **Images**

### **Unsplash API**

**Pour :** Images d'ingrédients

**Gratuit :** 50 requêtes/heure

```typescript
const image = await unsplash.search.getPhotos({
  query: `${ingredient} ingredient food`,
  perPage: 1,
  orientation: "squarish"
});
```

### **DALL-E 3 (Fallback)**

**Pour :** Ingrédients rares non trouvés

**Coût :** $0.04/image

```typescript
const image = await openai.images.generate({
  model: "dall-e-3",
  prompt: `Photo professionnelle de ${ingredient} sur fond blanc`,
  size: "1024x1024"
});
```

### **Supabase Storage**

**Pour :** Photos utilisateurs (recettes)

```typescript
const { data } = await supabase.storage
  .from("recipes")
  .upload(`${userId}/${recipeId}.jpg`, file);
  
const publicUrl = supabase.storage
  .from("recipes")
  .getPublicUrl(data.path).data.publicUrl;
```

---

## 💳 **Paiements**

### **Stripe**

**Services utilisés :**
- Subscriptions (récurrent)
- Webhooks (sync premium status)
- Customer Portal (gestion abonnement)
- Apple Pay / Google Pay (natif)

**Configuration :**
```typescript
// Frontend
import { useStripe } from "@stripe/stripe-react-native";

const { initPaymentSheet, presentPaymentSheet } = useStripe();

await initPaymentSheet({
  merchantDisplayName: "Paprika",
  paymentIntentClientSecret: clientSecret,
  applePay: { merchantCountryCode: "FR" },
  googlePay: { merchantCountryCode: "FR" }
});
```

**Pricing :**
- Freemium : €0/mois
- Premium : €4.99/mois ou €49.99/an
- Fees : 2.9% + €0.30/transaction

---

## 📧 **Emails**

### **Resend**

**Avec React Email (templates JSX) :**

```typescript
// emails/welcome.tsx
export default function WelcomeEmail({ name }) {
  return (
    <Html>
      <Text>Bonjour {name},</Text>
      <Text>Bienvenue sur Paprika ! 🎉</Text>
      <Button href="https://Paprika.app">
        Découvrir l'app
      </Button>
    </Html>
  );
}

// Envoi
await resend.emails.send({
  from: "Paprika <hello@Paprika.app>",
  to: user.email,
  subject: "Bienvenue !",
  react: WelcomeEmail({ name: user.name })
});
```

**Séquences :**
- Onboarding : J+0, J+1, J+3, J+7
- Réengagement : J+14, J+30, J+60
- Newsletter : Hebdomadaire (optionnel)

---

## 📈 **Analytics & Monitoring**

### **PostHog**

**Features utilisées :**
- Event tracking
- Session replay
- Feature flags
- A/B testing

**Gratuit :** 1M events/mois

```typescript
posthog.capture("recipe_created", {
  recipe_id: recipe.id,
  source: "manual",
  has_image: !!recipe.imageUrl
});
```

### **Sentry**

**Pour :** Error tracking production

```typescript
Sentry.init({
  dsn: SENTRY_DSN,
  environment: __DEV__ ? "development" : "production",
  tracesSampleRate: 0.1
});
```

---

## 🔄 **State Management**

### **TanStack Query (React Query)**

**Pour :** State serveur (API calls)

```typescript
const { data: recipes, isLoading } = useQuery({
  queryKey: ["recipes", userId],
  queryFn: async () => {
    return await db.select().from(recipes).where(eq(recipes.userId, userId));
  }
});
```

### **Zustand**

**Pour :** State client (UI, temporary)

```typescript
const useStore = create((set) => ({
  theme: "light",
  setTheme: (theme) => set({ theme })
}));
```

---

## 🛠️ **Outils de Développement**

### **Obligatoires**
- **ESLint** : Linting TypeScript/React
- **Prettier** : Formatage automatique
- **Husky** : Git hooks (pre-commit)
- **Jest** : Tests unitaires
- **Drizzle Studio** : UI base de données

### **Recommandés**
- **Zod** : Validation runtime
- **date-fns** : Manipulation dates
- **clsx** : Gestion classes CSS conditionnelles

---

## 📦 **Dependencies Complètes**

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@stripe/stripe-react-native": "^0.37.0",
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.5",
    "cheerio": "^1.0.0-rc.12",
    "clsx": "^2.1.0",
    "date-fns": "^3.0.0",
    "drizzle-orm": "^0.29.3",
    "expo": "~54.0.0",
    "expo-router": "~4.0.0",
    "postgres": "^3.4.3",
    "react": "18.2.0",
    "react-native": "0.76.0",
    "react-native-safe-area-context": "^4.9.0",
    "react-native-screens": "^3.29.0",
    "react-native-url-polyfill": "^2.0.0",
    "resend": "^3.0.0",
    "stripe": "^14.12.0",
    "unsplash-js": "^7.0.19",
    "zod": "^3.22.4",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "~18.2.45",
    "drizzle-kit": "^0.20.10",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "typescript": "^5.9.0"
  }
}
```

---

## 💰 **Coûts Mensuels**

### **Par Utilisateur Actif**

| Service | Usage | Coût |
|---------|-------|------|
| Supabase | DB + Auth + Storage | €0.05 |
| Anthropic | 10 imports/mois | €0.10 |
| OpenFoodFacts | Gratuit | €0 |
| Unsplash | Gratuit | €0 |
| DALL-E 3 | 1-2 images rares | €0.04-0.08 |
| Resend | 10 emails | €0.007 |
| PostHog | Analytics | €0 |
| **Total** | | **€0.20-0.30** |

### **Coûts Fixes**

| Service | Coût Mensuel |
|---------|--------------|
| Supabase Production | €25 |
| Domaine (.app) | €4 |
| Sentry | €26 |
| **Total** | **€55** |

**Break-even : 40-60 utilisateurs premium** (€4.99/mois)

---

## 🚀 **Performance**

### **Targets**

| Métrique | Objectif | Comment |
|----------|----------|---------|
| App size | < 50MB | Code splitting, compression |
| Cold start | < 3s | Lazy loading, cache |
| TTI | < 2s | Optimistic UI |
| API P95 | < 500ms | Edge functions, indexes |
| Offline | Queries read | AsyncStorage cache |

### **Optimisations**

```typescript
// 1. Images optimisées
<Image
  source={{ uri: imageUrl }}
  style={{ width: 300, height: 200 }}
  resizeMode="cover"
  cache="force-cache" // Cache agressif
/>

// 2. Lazy loading
const LazyScreen = lazy(() => import("./HeavyScreen"));

// 3. Memoization
const ExpensiveComponent = memo(({ data }) => {
  const processed = useMemo(() => heavyComputation(data), [data]);
  return <View>{processed}</View>;
});

// 4. Pagination
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ["recipes"],
  queryFn: ({ pageParam = 0 }) => 
    fetchRecipes({ offset: pageParam, limit: 20 })
});
```

---

## 🔒 **Sécurité**

### **Best Practices**

1. **Row Level Security (RLS)**
```sql
CREATE POLICY "Users own data"
  ON recipes FOR ALL
  USING (auth.uid() = user_id);
```

2. **API Keys Protection**
```typescript
// ❌ JAMAIS côté client
const API_KEY = "sk-secret-key";

// ✅ Backend uniquement (Edge Function)
const API_KEY = Deno.env.get("SECRET_KEY");
```

3. **Input Validation**
```typescript
const recipeSchema = z.object({
  title: z.string().min(3).max(100),
  servings: z.number().min(1).max(50),
  ingredients: z.array(ingredientSchema)
});

const validated = recipeSchema.parse(userInput);
```

4. **Rate Limiting**
```typescript
// Edge Function
const rateLimiter = new RateLimiter({
  max: 100,
  window: "1h"
});

await rateLimiter.check(userId);
```

---

## 📱 **Build & Déploiement**

### **Development**
```bash
npm run start         # Dev server
npm run android       # Android emulator
npm run ios           # iOS simulator
npm run web           # Web preview
```

### **Production**
```bash
# Build natif avec EAS
eas build --platform all

# Submit aux stores
eas submit --platform ios
eas submit --platform android

# OTA Update (sans rebuild)
eas update --branch production
```

---

## 🧪 **Tests**

```bash
# Tests unitaires
npm run test

# Tests composants
npm run test:components

# Coverage
npm run test:coverage

# E2E (Detox)
npm run test:e2e
```

---

*Stack Technique v1.0 - Paprika*
*Dernière mise à jour : 7 novembre 2025*
