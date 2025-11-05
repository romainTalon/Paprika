# **03 - Modèle de Données Paprika**

*Schéma PostgreSQL avec Drizzle ORM*

---

## 📊 **Vue d'Ensemble**

**7 tables principales + relations**

```
users (Supabase Auth)
  ↓ 1:N
cookbooks
  ↓ 1:N
recipes
  
users
  ↓ 1:N
meal_plans → recipes (N:N via JSONB)
  
users
  ↓ 1:N
grocery_lists
  ↓ 1:N
grocery_items

nutrition_cache (partagé, cache global)
```

---

## 🗂️ **Tables**

### **1. users**

```typescript
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // Supabase Auth UUID
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  
  // Premium
  isPremium: boolean("is_premium").default(false),
  premiumUntil: timestamp("premium_until"),
  
  // Freemium counters
  recipesCount: integer("recipes_count").default(0),
  cookbooksCount: integer("cookbooks_count").default(0),
  importsThisMonth: integer("imports_this_month").default(0),
  lastImportReset: timestamp("last_import_reset").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### **2. cookbooks**

```typescript
export const cookbooks = pgTable("cookbooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  name: text("name").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  isDefault: boolean("is_default").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### **3. recipes**

```typescript
export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cookbookId: uuid("cookbook_id").references(() => cookbooks.id, { onDelete: "set null" }),
  
  // Informations de base
  title: text("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  
  // Caractéristiques
  servings: integer("servings").notNull().default(4),
  prepTime: integer("prep_time"), // minutes
  cookTime: integer("cook_time"), // minutes
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }),
  tags: text("tags").array(),
  
  // Données structurées JSONB
  ingredients: jsonb("ingredients").$type<Ingredient[]>().notNull(),
  steps: jsonb("steps").$type<Step[]>().notNull(),
  nutrition: jsonb("nutrition").$type<Nutrition>(),
  
  // Métadonnées
  isFavorite: boolean("is_favorite").default(false),
  isArchived: boolean("is_archived").default(false),
  viewsCount: integer("views_count").default(0),
  
  // Import
  importSource: text("import_source"), // "manual" | "web" | "ocr"
  importUrl: text("import_url"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types TypeScript
interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  imageUrl?: string;
}

interface Step {
  order: number;
  instruction: string;
  duration?: number;
  imageUrl?: string;
}

interface Nutrition {
  perServing: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  };
  calculatedAt: string;
  confidence: number; // 0-1
}
```

### **4. meal_plans**

```typescript
export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  weekStart: timestamp("week_start").notNull(), // Lundi
  meals: jsonb("meals").$type<MealPlanMeals>().notNull(),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Structure JSONB meals
interface MealPlanMeals {
  [key: string]: { // "monday-breakfast", "tuesday-lunch", etc.
    recipeId: string;
    servings: number;
    notes?: string;
    isCooked?: boolean;
  };
}
```

### **5. grocery_lists**

```typescript
export const groceryLists = pgTable("grocery_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  name: text("name").notNull().default("Ma Liste"),
  isActive: boolean("is_active").default(true),
  isArchived: boolean("is_archived").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### **6. grocery_items**

```typescript
export const groceryItems = pgTable("grocery_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  groceryListId: uuid("grocery_list_id").notNull().references(() => groceryLists.id, { onDelete: "cascade" }),
  
  name: text("name").notNull(),
  quantity: decimal("quantity"),
  unit: text("unit"),
  category: text("category"), // "🥬 Légumes", "🍖 Viandes", etc.
  imageUrl: text("image_url"),
  
  isChecked: boolean("is_checked").default(false),
  checkedAt: timestamp("checked_at"),
  notes: text("notes"),
  
  // Traçabilité
  addedFrom: text("added_from"), // "manual" | "recipe" | "meal_plan"
  sourceId: uuid("source_id"), // recipe_id ou meal_plan_id
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### **7. nutrition_cache**

```typescript
export const nutritionCache = pgTable("nutrition_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  ingredientName: text("ingredient_name").notNull().unique(),
  language: text("language").notNull().default("fr"),
  
  nutritionPer100g: jsonb("nutrition_per_100g").notNull(),
  imageUrl: text("image_url"),
  
  source: text("source").notNull(), // "openfoodfacts" | "ai_estimate" | "manual"
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00-1.00
  
  usageCount: integer("usage_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## 🔐 **Row Level Security (RLS)**

```sql
-- Users
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Cookbooks
CREATE POLICY "Users CRUD own cookbooks" ON cookbooks FOR ALL USING (auth.uid() = user_id);

-- Recipes
CREATE POLICY "Users CRUD own recipes" ON recipes FOR ALL USING (auth.uid() = user_id);

-- Nutrition Cache (public read, auth write)
CREATE POLICY "Anyone can read" ON nutrition_cache FOR SELECT USING (true);
CREATE POLICY "Auth users can write" ON nutrition_cache FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Grocery Lists
CREATE POLICY "Users CRUD own lists" ON grocery_lists FOR ALL USING (auth.uid() = user_id);

-- Grocery Items
CREATE POLICY "Users CRUD own items" ON grocery_items FOR ALL USING (
  EXISTS (SELECT 1 FROM grocery_lists WHERE grocery_lists.id = grocery_items.grocery_list_id AND grocery_lists.user_id = auth.uid())
);

-- Meal Plans
CREATE POLICY "Users CRUD own plans" ON meal_plans FOR ALL USING (auth.uid() = user_id);
```

---

## 📇 **Indexes**

```sql
-- Performance
CREATE INDEX idx_recipes_user ON recipes(user_id);
CREATE INDEX idx_recipes_cookbook ON recipes(cookbook_id);
CREATE INDEX idx_recipes_favorite ON recipes(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_recipes_search ON recipes USING gin(to_tsvector('french', title || ' ' || COALESCE(description, '')));

CREATE INDEX idx_grocery_items_list ON grocery_items(grocery_list_id);
CREATE INDEX idx_grocery_items_checked ON grocery_items(grocery_list_id, is_checked);

CREATE INDEX idx_meal_plans_week ON meal_plans(user_id, week_start);

-- Nutrition cache fuzzy search
CREATE INDEX idx_nutrition_name_trgm ON nutrition_cache USING gin(ingredient_name gin_trgm_ops);
```

---

## 🔄 **Triggers**

```sql
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Reset imports counter monthly
CREATE OR REPLACE FUNCTION reset_imports_counter()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET imports_this_month = 0, last_import_reset = NOW()
  WHERE last_import_reset < date_trunc('month', NOW());
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 **Exemples de Queries**

### **Récupérer recettes d'un user**

```typescript
const recipes = await db
  .select()
  .from(recipes)
  .where(eq(recipes.userId, userId))
  .orderBy(desc(recipes.createdAt));
```

### **Recherche full-text**

```typescript
const results = await db
  .select()
  .from(recipes)
  .where(
    and(
      eq(recipes.userId, userId),
      sql`to_tsvector('french', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('french', ${query})`
    )
  );
```

### **Meal plan avec recettes**

```typescript
const mealPlan = await db
  .select()
  .from(mealPlans)
  .where(
    and(
      eq(mealPlans.userId, userId),
      eq(mealPlans.weekStart, weekStart)
    )
  )
  .limit(1);

// Récupérer les recettes
const recipeIds = Object.values(mealPlan.meals).map(m => m.recipeId);
const recipes = await db
  .select()
  .from(recipes)
  .where(inArray(recipes.id, recipeIds));
```

---

*Modèle de Données v1.0 - Paprika*
*Dernière mise à jour : 3 novembre 2025*
