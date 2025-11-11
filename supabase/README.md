# Supabase Database Setup for Paprika

This directory contains the complete database schema for the Paprika application.

## 📋 What's Inside

- **schema.sql** - Complete PostgreSQL schema with:
  - 7 tables (users, cookbooks, recipes, meal_plans, grocery_lists, grocery_items, nutrition_cache)
  - Row Level Security (RLS) policies
  - PostgreSQL functions and triggers
  - Freemium limit enforcement
  - Performance indexes
  - Constraints and validations

## 🚀 Initial Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose an organization and project name (e.g., "paprika-prod")
4. Set a strong database password (save it!)
5. Choose a region close to your users
6. Wait for project to be provisioned (~2 minutes)

### Step 2: Get Your Credentials

1. In your Supabase Dashboard, go to **Settings** > **API**
2. Copy the following values:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
   - **service_role key**: Another long string (keep secret!)

3. For the database connection string (Drizzle):
   - Go to **Settings** > **Database**
   - Scroll down to **Connection string** section
   - Select the **URI** tab
   - Copy the connection string (it will look like: `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`)
   - **⚠️ Important**: Replace `[YOUR-PASSWORD]` with your actual database password (the one you set when creating the project)

   Alternative if you don't see it:
   - The format is: `postgresql://postgres:[YOUR-DB-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - Replace `[YOUR-DB-PASSWORD]` with your database password
   - Replace `[PROJECT-REF]` with your project reference (found in Project URL)

### Step 3: Configure Environment Variables

1. In the project root, create `.env.local`:

```bash
# Copy from .env.local.example
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres
```

**⚠️ IMPORTANT**: Never commit `.env.local` to git!

### Step 4: Execute the Schema

1. In Supabase Dashboard, click on **SQL Editor** (sidebar)
2. Click **New Query**
3. Open `supabase/schema.sql` in your code editor
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)
7. Wait for execution to complete (~10-20 seconds)

You should see: ✅ **Success. No rows returned**

### Step 5: Verify Installation

Run this query in the SQL Editor to verify all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see 7 tables:
- cookbooks
- grocery_items
- grocery_lists
- meal_plans
- nutrition_cache
- recipes
- users

**✨ Automatic User Profile Creation**

The schema includes a trigger that automatically creates an entry in the `users` table whenever someone signs up via Supabase Auth. This means:
- When a user signs up → Entry in `auth.users` is created
- Trigger automatically creates corresponding entry in `public.users`
- You can immediately use the user_id in cookbooks, recipes, etc.

No manual intervention needed! 🎉

### Step 6: Test Drizzle Connection

In your terminal:

```bash
npm run db:studio
```

This should open Drizzle Studio at `https://local.drizzle.studio`. If you see your tables, congratulations! 🎉

## 🔐 Row Level Security (RLS)

All tables have RLS enabled to ensure users can only access their own data.

### Testing RLS

1. Create a test user via Supabase Auth:

```sql
-- In SQL Editor (this bypasses auth for testing)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  gen_random_uuid(),
  'test@paprika.app',
  crypt('password123', gen_salt('bf')),
  NOW()
);
```

2. The `users` table row should be created automatically (or insert manually)

3. Try creating a cookbook:

```sql
INSERT INTO cookbooks (user_id, name)
VALUES ('[USER-UUID]', 'Test Cookbook');
```

4. Verify you can't see other users' data:

```sql
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '[DIFFERENT-UUID]';

SELECT * FROM cookbooks; -- Should return empty
```

## 💰 Freemium Limits

Limits are enforced at the **database level** via triggers:

| Limit | Free Tier | Premium | Enforcement |
|-------|-----------|---------|-------------|
| Cookbooks | 2 | Unlimited | `check_cookbook_limit()` trigger |
| Recipes | 20 | Unlimited | `check_recipe_limit()` trigger |
| AI Imports/month | 5 | Unlimited | `check_import_limit()` function + Edge Function |
| Active Grocery Lists | 1 | Unlimited | `check_grocery_list_limit()` trigger |

### Testing Freemium Limits

Try creating 3 cookbooks (should fail on the 3rd):

```sql
-- This will work (1/2)
INSERT INTO cookbooks (user_id, name)
VALUES ('[USER-UUID]', 'Cookbook 1');

-- This will work (2/2)
INSERT INTO cookbooks (user_id, name)
VALUES ('[USER-UUID]', 'Cookbook 2');

-- This will FAIL with error message
INSERT INTO cookbooks (user_id, name)
VALUES ('[USER-UUID]', 'Cookbook 3');
-- ERROR: Cookbook limit reached (2/2). Upgrade to Premium for unlimited cookbooks.
```

### Bypassing Limits (Premium Users)

Update user to premium:

```sql
UPDATE users
SET is_premium = TRUE,
    premium_until = NOW() + INTERVAL '1 year'
WHERE id = '[USER-UUID]';
```

Now limits won't apply!

## 🔄 Monthly Import Reset

The `reset_imports_counter()` function resets the `imports_this_month` counter at the start of each month.

### Option 1: pg_cron (Supabase Pro)

If you have Supabase Pro, uncomment the pg_cron section in `schema.sql`:

```sql
SELECT cron.schedule(
  'reset-monthly-imports',
  '1 0 * * *',  -- Daily at 00:01
  $$SELECT reset_imports_counter()$$
);
```

### Option 2: Supabase Edge Function (Free Tier)

Create a scheduled Edge Function:

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Create function: `supabase functions new reset-imports`
4. Deploy: `supabase functions deploy reset-imports`
5. Schedule via Supabase Dashboard

### Option 3: Manual Reset (Development)

Run this query monthly:

```sql
SELECT reset_imports_counter();
```

## 📊 Indexes & Performance

The schema includes 13 optimized indexes:

- **User-based queries**: `idx_recipes_user_id`, `idx_cookbooks_user_id`, etc.
- **Filtering**: `idx_recipes_favorite`, `idx_recipes_archived`
- **Full-text search**: `idx_recipes_search` (French language)
- **Fuzzy search**: `idx_nutrition_name_trgm` (requires `pg_trgm`)

### Testing Full-Text Search

```sql
-- Search recipes by title/description (French)
SELECT title, description
FROM recipes
WHERE to_tsvector('french', title || ' ' || COALESCE(description, ''))
  @@ to_tsquery('french', 'pâtes & tomates');
```

### Testing Fuzzy Search

```sql
-- Find similar ingredient names
SELECT ingredient_name, similarity(ingredient_name, 'tomate')
FROM nutrition_cache
WHERE ingredient_name % 'tomate'  -- % is similarity operator
ORDER BY similarity DESC
LIMIT 5;
```

## 🛠️ Drizzle ORM Workflow

### Generate Migrations (Future Changes)

After modifying `src/db/schema.ts`:

```bash
npm run db:generate
```

This creates migration files in `drizzle/` directory.

### Apply Migrations

```bash
npm run db:push
```

This applies pending migrations to your database.

### Introspect Database

To sync Drizzle schema with existing database:

```bash
npx drizzle-kit introspect
```

### Drizzle Studio

Visual database browser:

```bash
npm run db:studio
```

## 🧪 Testing Services

Test your TypeScript services:

```typescript
import { CookbookService } from "@/services/cookbook.service";

// Get user cookbooks
const { data, error } = await CookbookService.getUserCookbooks("[USER-UUID]");

if (error) {
  console.error("Error:", error.message);
} else {
  console.log("Cookbooks:", data);
}
```

## 🐛 Troubleshooting

### Issue: "relation 'auth.users' does not exist"

**Solution**: Supabase Auth is not enabled. Go to **Authentication** > **Providers** in dashboard and enable Email auth.

### Issue: "permission denied for table users"

**Solution**: RLS policies not applied correctly. Re-run the schema.sql file.

### Issue: "cannot connect to database"

**Solution**: Check your `DATABASE_URL` in `.env.local`. Make sure password is correct and properly URL-encoded.

### Issue: pg_cron not available

**Solution**: pg_cron requires Supabase Pro. Use Edge Function or manual reset instead.

### Issue: Drizzle Studio won't open

**Solution**: Make sure port 4983 is not in use. Close and retry: `npm run db:studio`

## 📚 Next Steps

Once your database is set up:

1. ✅ **Test the schema** - Create some test data manually
2. ✅ **Test RLS policies** - Verify users can't see each other's data
3. ✅ **Test freemium limits** - Try exceeding limits to see errors
4. ✅ **Create React hooks** - `useCookbooks`, `useRecipes`, etc.
5. ✅ **Build UI screens** - CookbooksScreen, RecipesScreen, etc.
6. ✅ **Test end-to-end** - Full user flow from signup to creating recipes

## 📖 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Paprika Project Docs](../docs/03-data-model.md)

## ⚠️ Important Notes

- **Backup your database** before making schema changes
- **Test RLS policies** thoroughly before production
- **Monitor freemium limits** to prevent abuse
- **Never commit** `.env.local` or credentials to git
- **Use migrations** (Drizzle) for schema changes in production

---

**Need help?** Check the [main documentation](../docs/) or create an issue.

**Database setup complete!** 🎉 You're ready to start building features.
