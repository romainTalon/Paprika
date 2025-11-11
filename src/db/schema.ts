/**
 * Drizzle ORM Schema for Paprika
 * Corresponds to supabase/schema.sql
 */

import { pgTable, uuid, text, boolean, integer, timestamp, decimal, date, jsonb, uniqueIndex, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// =============================================================================
// TABLES
// =============================================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().references(() => sql`auth.users(id)`, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),

  // Premium Status
  isPremium: boolean("is_premium").default(false).notNull(),
  premiumUntil: timestamp("premium_until", { withTimezone: true }),

  // Freemium Counters
  recipesCount: integer("recipes_count").default(0).notNull(),
  cookbooksCount: integer("cookbooks_count").default(0).notNull(),
  importsThisMonth: integer("imports_this_month").default(0).notNull(),
  lastImportReset: timestamp("last_import_reset", { withTimezone: true }).defaultNow().notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cookbooks = pgTable("cookbooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  isDefault: boolean("is_default").default(false).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_cookbooks_user_id").on(table.userId),
  oneDefaultPerUser: uniqueIndex("idx_one_default_cookbook_per_user")
    .on(table.userId)
    .where(sql`${table.isDefault} = true`),
}));

export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cookbookId: uuid("cookbook_id").references(() => cookbooks.id, { onDelete: "set null" }),

  // Basic Information
  title: text("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),

  // Characteristics
  servings: integer("servings").default(4).notNull(),
  prepTime: integer("prep_time"), // minutes
  cookTime: integer("cook_time"), // minutes
  difficulty: text("difficulty"), // 'easy' | 'medium' | 'hard'
  tags: text("tags").array(),

  // Structured JSONB Data
  ingredients: jsonb("ingredients").notNull(),
  steps: jsonb("steps").notNull(),
  nutrition: jsonb("nutrition"),

  // Metadata
  isFavorite: boolean("is_favorite").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  viewsCount: integer("views_count").default(0).notNull(),

  // Import Tracking
  importSource: text("import_source"), // 'manual' | 'web' | 'ocr'
  importUrl: text("import_url"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_recipes_user_id").on(table.userId),
  cookbookIdIdx: index("idx_recipes_cookbook_id").on(table.cookbookId),
  favoriteIdx: index("idx_recipes_favorite").on(table.userId, table.isFavorite)
    .where(sql`${table.isFavorite} = true`),
  archivedIdx: index("idx_recipes_archived").on(table.userId, table.isArchived)
    .where(sql`${table.isArchived} = false`),
}));

export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  weekStart: date("week_start").notNull(), // Always a Monday
  meals: jsonb("meals").notNull().default(sql`'{}'::jsonb`),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_meal_plans_user_id").on(table.userId),
  weekIdx: index("idx_meal_plans_week").on(table.userId, table.weekStart),
  uniqueWeek: uniqueIndex("unique_user_week").on(table.userId, table.weekStart),
}));

export const groceryLists = pgTable("grocery_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  name: text("name").default("Ma Liste").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_grocery_lists_user_id").on(table.userId),
  activeIdx: index("idx_grocery_lists_active").on(table.userId, table.isActive)
    .where(sql`${table.isActive} = true`),
}));

export const groceryItems = pgTable("grocery_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  groceryListId: uuid("grocery_list_id").notNull().references(() => groceryLists.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unit: text("unit"),
  category: text("category"),
  imageUrl: text("image_url"),

  isChecked: boolean("is_checked").default(false).notNull(),
  checkedAt: timestamp("checked_at", { withTimezone: true }),
  notes: text("notes"),

  // Traceability
  addedFrom: text("added_from"), // 'manual' | 'recipe' | 'meal_plan'
  sourceId: uuid("source_id"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  listIdIdx: index("idx_grocery_items_list_id").on(table.groceryListId),
  checkedIdx: index("idx_grocery_items_checked").on(table.groceryListId, table.isChecked),
  categoryIdx: index("idx_grocery_items_category").on(table.groceryListId, table.category),
}));

export const nutritionCache = pgTable("nutrition_cache", {
  id: uuid("id").primaryKey().defaultRandom(),

  ingredientName: text("ingredient_name").notNull(),
  language: text("language").default("fr").notNull(),

  nutritionPer100g: jsonb("nutrition_per_100g").notNull(),
  imageUrl: text("image_url"),

  source: text("source").notNull(), // 'openfoodfacts' | 'ai_estimate' | 'manual'
  confidence: decimal("confidence", { precision: 3, scale: 2 }),

  usageCount: integer("usage_count").default(0).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueIngredient: uniqueIndex("unique_ingredient_language").on(table.ingredientName, table.language),
  languageIdx: index("idx_nutrition_language").on(table.language),
}));

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Cookbook = typeof cookbooks.$inferSelect;
export type NewCookbook = typeof cookbooks.$inferInsert;

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;

export type MealPlan = typeof mealPlans.$inferSelect;
export type NewMealPlan = typeof mealPlans.$inferInsert;

export type GroceryList = typeof groceryLists.$inferSelect;
export type NewGroceryList = typeof groceryLists.$inferInsert;

export type GroceryItem = typeof groceryItems.$inferSelect;
export type NewGroceryItem = typeof groceryItems.$inferInsert;

export type NutritionCache = typeof nutritionCache.$inferSelect;
export type NewNutritionCache = typeof nutritionCache.$inferInsert;
