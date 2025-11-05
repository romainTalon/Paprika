# **01 - Guide de Setup Paprika**

*Installation complète du projet - Durée estimée : 4-6 heures*

---

## 📋 **Pré-requis**

### **Logiciels Nécessaires**

```bash
# Vérifier les versions installées
node --version    # v18+ requis
npm --version     # v9+ requis
git --version     # v2.30+ recommandé

# Installer Expo CLI globalement
npm install -g expo-cli eas-cli
```

### **Comptes à Créer**

Avant de commencer, créez ces comptes (gratuits pour démarrer) :

- [ ] **Supabase** : https://supabase.com
- [ ] **Anthropic** : https://console.anthropic.com (Claude API)
- [ ] **Unsplash** : https://unsplash.com/developers
- [ ] **Stripe** : https://stripe.com
- [ ] **Resend** : https://resend.com
- [ ] **Expo** : https://expo.dev

**Temps estimé : 30-45 minutes**

---

## 🚀 **Phase 1 : Initialisation Projet (30 min)**

### **Étape 1.1 : Créer le Projet**

```bash
# Créer le projet Expo avec TypeScript
npx create-expo-app@latest Paprika --template blank-typescript

cd Paprika

# Structure de dossiers
mkdir -p src/{components,screens,services,hooks,types,utils}
mkdir -p src/services/{ai,nutrition,images,stripe}
mkdir -p db
mkdir -p assets/{images,fonts}
mkdir -p supabase/functions
```

### **Étape 1.2 : Configuration TypeScript**

Créer/modifier `tsconfig.json` :

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["ES2022"],
    "jsx": "react-native",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"],
      "@db/*": ["./db/*"],
      "@components/*": ["./src/components/*"],
      "@screens/*": ["./src/screens/*"],
      "@services/*": ["./src/services/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules"]
}
```

### **Étape 1.3 : Installer Dépendances**

```bash
# Core & Navigation
npm install expo-router react-native-safe-area-context react-native-screens

# UI & Styling
npm install nativewind clsx
npm install -D tailwindcss

# State Management & Data Fetching
npm install @tanstack/react-query zustand
npm install @react-native-async-storage/async-storage

# Database & Backend
npm install @supabase/supabase-js drizzle-orm postgres
npm install -D drizzle-kit

# AI & APIs
npm install @anthropic-ai/sdk axios cheerio

# Stripe
npm install @stripe/stripe-react-native stripe

# Utils & Validation
npm install zod date-fns react-native-url-polyfill

# Development Tools
npm install -D @types/react @types/react-native
npm install -D eslint prettier
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### **Étape 1.4 : Configuration NativeWind**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FFB03A",
          50: "#FFF8F0",
          100: "#FFEFD9",
          200: "#FFE0B2",
          300: "#FFD08A",
          400: "#FFC062",
          500: "#FFB03A",
          600: "#E69A34",
          700: "#CC842E",
          800: "#B36E28",
          900: "#995822",
        },
        cream: {
          DEFAULT: "#FFF9F0",
          50: "#FFFCF7",
          100: "#FFF9F0",
          200: "#FFF3E0",
          300: "#FFEFD1",
          400: "#FFEAC2",
          500: "#FFE4B3",
        },
        warm: {
          brown: "#6B5847",
          gray: "#8B7355",
        },
      },
    },
  },
  plugins: [],
};
```

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      "nativewind/babel",
    ],
  };
};
```

```typescript
// global.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### **Étape 1.5 : Configuration ESLint & Prettier**

```json
// .eslintrc.json
{
  "extends": [
    "expo",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off"
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

---

## 🗄️ **Phase 2 : Supabase + Drizzle (1-2h)**

### **Étape 2.1 : Créer Projet Supabase**

1. Aller sur https://supabase.com/dashboard
2. Cliquer "New Project"
3. Remplir :
   - **Name** : Paprika-production (ou Paprika-dev pour test)
   - **Database Password** : Générer un mot de passe fort
   - **Region** : EU West (Europe) ou US East (USA)
4. Attendre 2-3 minutes (création DB)
5. Noter les credentials :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **Anon key** : `eyJhbGc...` (public, OK côté client)
   - **Service role key** : `eyJhbGc...` (secret, backend uniquement)
   - **Database URL** : Settings > Database > Connection string (Direct)

### **Étape 2.2 : Variables d'Environnement**

```bash
# .env.example (template à versionner)
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# IA
ANTHROPIC_API_KEY=sk-ant-api03-...
UNSPLASH_ACCESS_KEY=...

# Paiements
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Emails
RESEND_API_KEY=re_...
```

```bash
# Créer .env.local (NE PAS versionner)
cp .env.example .env.local
# Éditer avec vos vraies valeurs
```

```bash
# .gitignore
.env.local
.env.production
.env
```

```typescript
// src/types/env.d.ts
declare module "@env" {
  export const EXPO_PUBLIC_SUPABASE_URL: string;
  export const EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
  export const DATABASE_URL: string;
  export const ANTHROPIC_API_KEY: string;
  export const UNSPLASH_ACCESS_KEY: string;
  export const STRIPE_PUBLISHABLE_KEY: string;
  export const STRIPE_SECRET_KEY: string;
  export const RESEND_API_KEY: string;
}
```

### **Étape 2.3 : Configuration Supabase Client**

```typescript
// src/lib/supabase.ts
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import {
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
} from "@env";

export const supabase = createClient(
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### **Étape 2.4 : Configuration Drizzle**

```typescript
// drizzle.config.ts
import type { Config } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default {
  schema: "./db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

```typescript
// db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DATABASE_URL } from "@env";

const queryClient = postgres(DATABASE_URL);
export const db = drizzle(queryClient);
```

### **Étape 2.5 : Schema Base de Données**

Voir le fichier séparé : [03-data-model.md](./03-data-model.md)

Copier le schema complet depuis ce fichier dans `db/schema.ts`.

### **Étape 2.6 : Générer Migrations**

```bash
# Générer les fichiers de migration
npx drizzle-kit generate

# Appliquer les migrations sur Supabase
npx drizzle-kit push

# Vérifier dans Supabase Dashboard
# Database > Tables - Toutes vos tables devraient apparaître
```

### **Étape 2.7 : Row Level Security (RLS)**

Dans Supabase SQL Editor, exécuter :

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Policies Users
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Policies Cookbooks
CREATE POLICY "Users can CRUD own cookbooks"
  ON cookbooks FOR ALL
  USING (auth.uid() = user_id);

-- Policies Recipes
CREATE POLICY "Users can CRUD own recipes"
  ON recipes FOR ALL
  USING (auth.uid() = user_id);

-- Policies Nutrition Cache (public read, auth write)
CREATE POLICY "Anyone can read nutrition cache"
  ON nutrition_cache FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert nutrition cache"
  ON nutrition_cache FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policies Grocery Lists
CREATE POLICY "Users can CRUD own grocery lists"
  ON grocery_lists FOR ALL
  USING (auth.uid() = user_id);

-- Policies Grocery Items
CREATE POLICY "Users can CRUD items of own lists"
  ON grocery_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
      AND grocery_lists.user_id = auth.uid()
    )
  );

-- Policies Meal Plans
CREATE POLICY "Users can CRUD own meal plans"
  ON meal_plans FOR ALL
  USING (auth.uid() = user_id);
```

---

## 🔐 **Phase 3 : Configuration Auth (30 min)**

### **Étape 3.1 : Activer Providers Supabase**

1. Dashboard Supabase > Authentication > Providers
2. **Email** : Déjà activé par défaut ✅
3. **Google** :
   - Aller sur [Google Cloud Console](https://console.cloud.google.com)
   - Créer un projet
   - APIs & Services > Credentials > Create OAuth 2.0 Client ID
   - Application type : Web application
   - Authorized redirect URIs : `https://[votre-projet].supabase.co/auth/v1/callback`
   - Copier Client ID et Client Secret dans Supabase
4. **Apple** (optionnel, nécessite Apple Developer Account)

### **Étape 3.2 : Hook d'Authentification**

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };
}
```

---

## 🤖 **Phase 4 : Configuration APIs IA (1h)**

### **Étape 4.1 : Anthropic Claude**

```bash
# Obtenir clé API
# 1. Aller sur https://console.anthropic.com
# 2. API Keys > Create Key
# 3. Copier dans .env.local
```

```typescript
// src/services/ai/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "@env";

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

export async function parseRecipeFromHTML(html: string) {
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Extrais la recette de ce HTML et retourne UNIQUEMENT un JSON valide:

HTML:
${html}

Format JSON:
{
  "title": "string",
  "description": "string",
  "servings": number,
  "prepTime": number,
  "cookTime": number,
  "difficulty": "easy" | "medium" | "hard",
  "ingredients": [{"name": "string", "quantity": number, "unit": "string"}],
  "steps": [{"order": number, "instruction": "string"}],
  "tags": ["string"],
  "imageUrl": "string"
}`,
      },
    ],
  });

  return JSON.parse(response.content[0].text);
}
```

### **Étape 4.2 : OpenFoodFacts**

```typescript
// src/services/nutrition/openfoodfacts.ts
import axios from "axios";

const API_URL = "https://world.openfoodfacts.org/cgi/search.pl";

export async function searchIngredientNutrition(
  ingredientName: string,
  language = "fr"
) {
  const response = await axios.get(API_URL, {
    params: {
      search_terms: ingredientName,
      search_simple: 1,
      json: 1,
      page_size: 5,
      lc: language,
      fields: "product_name,nutriments",
    },
  });

  const product = response.data.products?.[0];
  if (!product?.nutriments) return null;

  const n = product.nutriments;
  return {
    calories: n["energy-kcal_100g"] || 0,
    protein: n.proteins_100g || 0,
    carbohydrates: n.carbohydrates_100g || 0,
    fat: n.fat_100g || 0,
    fiber: n.fiber_100g,
    sugar: n.sugars_100g,
  };
}
```

### **Étape 4.3 : Unsplash**

```bash
npm install unsplash-js
```

```typescript
// src/services/images/unsplash.ts
import { createApi } from "unsplash-js";
import { UNSPLASH_ACCESS_KEY } from "@env";

const unsplash = createApi({
  accessKey: UNSPLASH_ACCESS_KEY,
});

export async function searchIngredientImage(
  ingredientName: string
): Promise<string | null> {
  try {
    const result = await unsplash.search.getPhotos({
      query: `${ingredientName} ingredient food`,
      perPage: 1,
      orientation: "squarish",
    });

    return result.response?.results[0]?.urls.small || null;
  } catch (error) {
    console.error("Unsplash error:", error);
    return null;
  }
}
```

---

## 💳 **Phase 5 : Configuration Stripe (1h)**

### **Étape 5.1 : Setup Stripe Dashboard**

1. Créer compte sur https://dashboard.stripe.com
2. Activer **mode test**
3. Products > Add product :
   - **Name** : Paprika Premium
   - **Price** : €4.99/mois (recurring monthly)
   - **Price** : €49.99/an (recurring yearly)
4. Noter les **Price IDs** : `price_xxxxx`
5. Developers > API keys :
   - **Publishable key** : `pk_test_...`
   - **Secret key** : `sk_test_...`

### **Étape 5.2 : Installation Stripe React Native**

```bash
npm install @stripe/stripe-react-native
```

```typescript
// App.tsx
import { StripeProvider } from "@stripe/stripe-react-native";
import { STRIPE_PUBLISHABLE_KEY } from "@env";

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {/* Votre app */}
    </StripeProvider>
  );
}
```

### **Étape 5.3 : Webhook Edge Function**

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.12.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature")!;
  const body = await req.text();

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const userId = customer.metadata.supabase_user_id;

        await supabase
          .from("users")
          .update({
            is_premium: true,
            premium_until: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("id", userId);
        break;

      case "customer.subscription.deleted":
        const deletedSub = event.data.object;
        const deletedCustomer = await stripe.customers.retrieve(deletedSub.customer as string);

        await supabase
          .from("users")
          .update({
            is_premium: false,
            premium_until: null,
          })
          .eq("id", deletedCustomer.metadata.supabase_user_id);
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
```

Déployer :
```bash
supabase functions deploy stripe-webhook
```

---

## 📱 **Phase 6 : Navigation (30 min)**

```typescript
// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
```

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="cookbooks"
        options={{
          title: "Cookbooks",
          tabBarIcon: ({ color }) => (
            <Ionicons name="book" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: "Meal Plan",
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Ajouter",
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle" size={32} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: "Courses",
          tabBarIcon: ({ color}) => (
            <Ionicons name="cart" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="data"
        options={{
          title: "Nutrition",
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

## ✅ **Phase 7 : Vérification (30 min)**

### **Checklist Complète**

```bash
# Démarrer l'app
npm run start

# Tests
[ ] App démarre sans erreur
[ ] Navigation fonctionne (tous les onglets)
[ ] Supabase connecté (tester auth)
[ ] Drizzle peut query la DB
[ ] Variables d'environnement chargées
[ ] NativeWind applique les styles

# APIs
[ ] Anthropic répond (tester parseRecipe)
[ ] OpenFoodFacts répond
[ ] Unsplash retourne des images
[ ] Stripe initialisé

# Database
[ ] Tables créées dans Supabase
[ ] RLS policies actives
[ ] Peut insérer/lire des données
```

---

## 🎉 **Terminé !**

Votre environnement de développement Paprika est maintenant prêt !

**Prochaines étapes :**
1. Consulter [02-tech-stack.md](./02-tech-stack.md) pour comprendre l'architecture
2. Suivre [05-roadmap.md](./05-roadmap.md) pour le plan de développement
3. Commencer à coder les features ! 🚀

**Temps total : 4-6 heures** ✅

---

*Guide de Setup v1.0 - Paprika*
*Dernière mise à jour : 3 novembre 2025*
