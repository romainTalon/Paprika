-- =============================================================================
-- Paprika Database Schema v1.0
-- Complete Supabase PostgreSQL schema with RLS policies and freemium enforcement
-- =============================================================================

-- Enable required PostgreSQL extensions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS pg_trgm;          -- Fuzzy text search
-- CREATE EXTENSION IF NOT EXISTS pg_cron;       -- Scheduled jobs (requires Supabase Pro)

-- =============================================================================
-- TABLES
-- =============================================================================

-- Users Table
-- Extends Supabase Auth with app-specific fields and freemium counters
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,

  -- Premium Status
  is_premium BOOLEAN DEFAULT FALSE NOT NULL,
  premium_until TIMESTAMP WITH TIME ZONE,

  -- Freemium Counters (enforced at DB level)
  recipes_count INTEGER DEFAULT 0 NOT NULL CHECK (recipes_count >= 0),
  cookbooks_count INTEGER DEFAULT 0 NOT NULL CHECK (cookbooks_count >= 0),
  imports_this_month INTEGER DEFAULT 0 NOT NULL CHECK (imports_this_month >= 0),
  last_import_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Cookbooks Table
-- Organize recipes into themed collections
-- =============================================================================
CREATE TABLE IF NOT EXISTS cookbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description TEXT,
  cover_image_url TEXT,
  is_default BOOLEAN DEFAULT FALSE NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Recipes Table
-- Store recipe details with JSONB fields for flexible data
-- =============================================================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cookbook_id UUID REFERENCES cookbooks(id) ON DELETE SET NULL,

  -- Basic Information
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  description TEXT,
  cover_image_url TEXT,

  -- Characteristics
  servings INTEGER NOT NULL DEFAULT 4 CHECK (servings > 0),
  prep_time INTEGER CHECK (prep_time >= 0),  -- minutes
  cook_time INTEGER CHECK (cook_time >= 0),  -- minutes
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[],

  -- Structured JSONB Data
  -- ingredients: Array of {name, quantity, unit, notes?, imageUrl?}
  -- steps: Array of {order, instruction, duration?, imageUrl?}
  -- nutrition: {perServing: {calories, protein, carbs, fat, fiber, sugar}, calculatedAt, confidence}
  ingredients JSONB NOT NULL,
  steps JSONB NOT NULL,
  nutrition JSONB,

  -- Metadata
  is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE NOT NULL,
  views_count INTEGER DEFAULT 0 NOT NULL CHECK (views_count >= 0),

  -- Import Tracking
  import_source TEXT CHECK (import_source IN ('manual', 'web', 'ocr')),
  import_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Meal Plans Table
-- Weekly meal planning with JSONB for 7 days × 4 meals
-- =============================================================================
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  week_start DATE NOT NULL,  -- Always a Monday
  -- meals: {[day]-[meal]: {recipeId, servings, notes?, isCooked}}
  -- Example: {"monday-breakfast": {"recipeId": "uuid", "servings": 2}}
  meals JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, week_start)  -- One meal plan per week per user
);

-- Grocery Lists Table
-- Shopping lists that can be auto-generated from meal plans
-- =============================================================================
CREATE TABLE IF NOT EXISTS grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name TEXT NOT NULL DEFAULT 'Ma Liste' CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Grocery Items Table
-- Individual items in a grocery list
-- =============================================================================
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_list_id UUID NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,

  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 200),
  quantity DECIMAL(10, 2),
  unit TEXT,
  category TEXT,  -- '🥬 Légumes', '🍖 Viandes', etc.
  image_url TEXT,

  is_checked BOOLEAN DEFAULT FALSE NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,

  -- Traceability
  added_from TEXT CHECK (added_from IN ('manual', 'recipe', 'meal_plan')),
  source_id UUID,  -- recipe_id or meal_plan_id

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Nutrition Cache Table
-- Shared nutrition database for ingredient reuse (OpenFoodFacts + AI)
-- =============================================================================
CREATE TABLE IF NOT EXISTS nutrition_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  ingredient_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr',

  -- nutrition_per_100g: {calories, protein, carbohydrates, fat, fiber, sugar}
  nutrition_per_100g JSONB NOT NULL,
  image_url TEXT,

  source TEXT NOT NULL CHECK (source IN ('openfoodfacts', 'ai_estimate', 'manual')),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),

  usage_count INTEGER DEFAULT 0 NOT NULL CHECK (usage_count >= 0),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  UNIQUE(ingredient_name, language)
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_cache ENABLE ROW LEVEL SECURITY;

-- Users Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Cookbooks Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own cookbooks"
  ON cookbooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cookbooks"
  ON cookbooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cookbooks"
  ON cookbooks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cookbooks"
  ON cookbooks FOR DELETE
  USING (auth.uid() = user_id);

-- Recipes Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- Meal Plans Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage own meal plans"
  ON meal_plans FOR ALL
  USING (auth.uid() = user_id);

-- Grocery Lists Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage own grocery lists"
  ON grocery_lists FOR ALL
  USING (auth.uid() = user_id);

-- Grocery Items Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can manage own grocery items"
  ON grocery_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
        AND grocery_lists.user_id = auth.uid()
    )
  );

-- Nutrition Cache Policies (Public read, authenticated write)
-- -----------------------------------------------------------------------------
CREATE POLICY "Anyone can read nutrition cache"
  ON nutrition_cache FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert nutrition cache"
  ON nutrition_cache FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update nutrition cache"
  ON nutrition_cache FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- =============================================================================
-- POSTGRESQL FUNCTIONS
-- =============================================================================

-- Auto-create user profile when auth user is created
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at timestamp
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reset monthly import counter
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reset_imports_counter()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET imports_this_month = 0,
      last_import_reset = NOW()
  WHERE last_import_reset < date_trunc('month', NOW());
END;
$$ LANGUAGE plpgsql;

-- Check recipe limit (Freemium: 20 recipes max for free users)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_recipe_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_recipe_count INTEGER;
  user_is_premium BOOLEAN;
BEGIN
  SELECT recipes_count, is_premium
  INTO user_recipe_count, user_is_premium
  FROM users WHERE id = NEW.user_id;

  IF NOT user_is_premium AND user_recipe_count >= 20 THEN
    RAISE EXCEPTION 'Recipe limit reached (20/20). Upgrade to Premium for unlimited recipes.';
  END IF;

  UPDATE users SET recipes_count = recipes_count + 1
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Decrement recipe count on delete
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION decrement_recipe_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET recipes_count = GREATEST(recipes_count - 1, 0)
  WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Check cookbook limit (Freemium: 2 cookbooks max for free users)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_cookbook_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_cookbook_count INTEGER;
  user_is_premium BOOLEAN;
BEGIN
  SELECT cookbooks_count, is_premium
  INTO user_cookbook_count, user_is_premium
  FROM users WHERE id = NEW.user_id;

  IF NOT user_is_premium AND user_cookbook_count >= 2 THEN
    RAISE EXCEPTION 'Cookbook limit reached (2/2). Upgrade to Premium for unlimited cookbooks.';
  END IF;

  UPDATE users SET cookbooks_count = cookbooks_count + 1
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Decrement cookbook count on delete
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION decrement_cookbook_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET cookbooks_count = GREATEST(cookbooks_count - 1, 0)
  WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Check import limit (Freemium: 5 imports/month for free users)
-- Called from Edge Function before AI import
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_import_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_imports INTEGER;
  user_is_premium BOOLEAN;
BEGIN
  SELECT imports_this_month, is_premium
  INTO user_imports, user_is_premium
  FROM users WHERE id = p_user_id;

  IF NOT user_is_premium AND user_imports >= 5 THEN
    RETURN FALSE;  -- Import blocked
  END IF;

  RETURN TRUE;  -- Import allowed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment import counter after successful import
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_import_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET imports_this_month = imports_this_month + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check grocery list limit (Freemium: 1 active list for free users)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_grocery_list_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_lists_count INTEGER;
  user_is_premium BOOLEAN;
BEGIN
  SELECT is_premium INTO user_is_premium
  FROM users WHERE id = NEW.user_id;

  IF NOT user_is_premium AND NEW.is_active THEN
    SELECT COUNT(*) INTO active_lists_count
    FROM grocery_lists
    WHERE user_id = NEW.user_id
      AND is_active = TRUE
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF active_lists_count >= 1 THEN
      RAISE EXCEPTION 'Active grocery list limit reached (1/1). Upgrade to Premium or archive current list.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at on all tables
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER cookbooks_updated_at
  BEFORE UPDATE ON cookbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER grocery_lists_updated_at
  BEFORE UPDATE ON grocery_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER nutrition_cache_updated_at
  BEFORE UPDATE ON nutrition_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Freemium enforcement triggers
CREATE TRIGGER enforce_recipe_limit
  BEFORE INSERT ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION check_recipe_limit();

CREATE TRIGGER decrement_recipe_on_delete
  AFTER DELETE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_recipe_count();

CREATE TRIGGER enforce_cookbook_limit
  BEFORE INSERT ON cookbooks
  FOR EACH ROW
  EXECUTE FUNCTION check_cookbook_limit();

CREATE TRIGGER decrement_cookbook_on_delete
  AFTER DELETE ON cookbooks
  FOR EACH ROW
  EXECUTE FUNCTION decrement_cookbook_count();

CREATE TRIGGER enforce_grocery_list_limit
  BEFORE INSERT OR UPDATE ON grocery_lists
  FOR EACH ROW
  EXECUTE FUNCTION check_grocery_list_limit();

-- Auto-create user profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Recipes indexes
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_cookbook_id ON recipes(cookbook_id);
CREATE INDEX idx_recipes_favorite ON recipes(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_recipes_archived ON recipes(user_id, is_archived) WHERE is_archived = FALSE;
CREATE INDEX idx_recipes_created_at ON recipes(user_id, created_at DESC);

-- Full-text search on recipes (French language)
CREATE INDEX idx_recipes_search ON recipes
  USING gin(to_tsvector('french', title || ' ' || COALESCE(description, '')));

-- Cookbooks indexes
CREATE INDEX idx_cookbooks_user_id ON cookbooks(user_id);
CREATE INDEX idx_cookbooks_created_at ON cookbooks(user_id, created_at DESC);

-- Meal plans indexes
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_week ON meal_plans(user_id, week_start DESC);

-- Grocery lists indexes
CREATE INDEX idx_grocery_lists_user_id ON grocery_lists(user_id);
CREATE INDEX idx_grocery_lists_active ON grocery_lists(user_id, is_active) WHERE is_active = TRUE;

-- Grocery items indexes
CREATE INDEX idx_grocery_items_list_id ON grocery_items(grocery_list_id);
CREATE INDEX idx_grocery_items_checked ON grocery_items(grocery_list_id, is_checked);
CREATE INDEX idx_grocery_items_category ON grocery_items(grocery_list_id, category);

-- Nutrition cache fuzzy search
CREATE INDEX idx_nutrition_name_trgm ON nutrition_cache
  USING gin(ingredient_name gin_trgm_ops);
CREATE INDEX idx_nutrition_language ON nutrition_cache(language);

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

-- Ensure only one default cookbook per user
CREATE UNIQUE INDEX idx_one_default_cookbook_per_user
  ON cookbooks(user_id) WHERE is_default = TRUE;

-- =============================================================================
-- SCHEDULED JOBS (pg_cron - Requires Supabase Pro)
-- =============================================================================

-- Uncomment this if you have Supabase Pro with pg_cron enabled
-- This resets the monthly import counter daily at 00:01
/*
SELECT cron.schedule(
  'reset-monthly-imports',
  '1 0 * * *',  -- Daily at 00:01
  $$SELECT reset_imports_counter()$$
);
*/

-- =============================================================================
-- INITIAL SETUP COMPLETE
-- =============================================================================

-- You can now:
-- 1. Create a user via Supabase Auth
-- 2. User row will be created automatically via auth.users trigger (if configured)
-- 3. Or manually insert a user row: INSERT INTO users (id, email) VALUES (auth.uid(), 'user@example.com');
-- 4. Start creating cookbooks, recipes, meal plans, etc.

-- Verify the schema:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';
