---
name: supabase-patterns
description: Apply Paprika Supabase patterns when working with database, services, or backend code. Use for RLS policies, service layer methods, hooks with TanStack Query, and snake_case to camelCase mapping.
---

# Paprika Supabase Patterns

## When to Use This Skill

Apply this skill automatically when:
- Creating or modifying database tables
- Writing RLS (Row Level Security) policies
- Implementing service layer methods
- Creating TanStack Query hooks
- Working with Supabase client calls

## Core Patterns

### 1. Service Layer Pattern

All services use static methods returning `{data, error}` tuples:

```typescript
// src/services/example.service.ts
import { supabase } from '@/lib/supabase';

export class ExampleService {
  static async getItems(userId: string): Promise<{
    data: Item[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}
```

### 2. snake_case ↔ camelCase Mapping

Database uses `snake_case`, TypeScript uses `camelCase`:

```typescript
// Map from DB (snake_case) to TypeScript (camelCase)
const mapFromDb = (dbItem: DbItem): Item => ({
  id: dbItem.id,
  userId: dbItem.user_id,
  cookbookId: dbItem.cookbook_id,
  createdAt: dbItem.created_at,
  updatedAt: dbItem.updated_at,
  isArchived: dbItem.is_archived,
  isFavorite: dbItem.is_favorite,
});

// Map from TypeScript (camelCase) to DB (snake_case)
const mapToDb = (item: Partial<Item>): Partial<DbItem> => ({
  ...(item.userId && { user_id: item.userId }),
  ...(item.cookbookId && { cookbook_id: item.cookbookId }),
  ...(item.isFavorite !== undefined && { is_favorite: item.isFavorite }),
});
```

### 3. TanStack Query Hook Pattern

```typescript
// src/hooks/useItems.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ItemService } from '@/services/item.service';

export const useItems = (userId: string) => {
  const queryClient = useQueryClient();

  // Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['items', userId],
    queryFn: async () => {
      const { data, error } = await ItemService.getItems(userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: async (newItem: CreateItemInput) => {
      const { data, error } = await ItemService.createItem(userId, newItem);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', userId] });
    },
  });

  return {
    items: data ?? [],
    isLoading,
    error,
    refetch,
    createItem: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
};
```

### 4. RLS Policy Pattern

Always enforce user isolation:

```sql
-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only see their own data
CREATE POLICY "Users can view own items"
  ON items FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only create for themselves
CREATE POLICY "Users can insert own items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own data
CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own data
CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  USING (auth.uid() = user_id);
```

### 5. Freemium Tier Enforcement

Free tier limits enforced at DB level:
- 2 cookbooks max
- 20 recipes max
- 5 AI imports/month

```sql
-- Example: Enforce cookbook limit
CREATE POLICY "Free tier cookbook limit"
  ON cookbooks FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      (SELECT subscription_plan FROM users WHERE id = auth.uid()) = 'premium'
      OR (SELECT COUNT(*) FROM cookbooks WHERE user_id = auth.uid() AND is_archived = false) < 2
    )
  );
```

### 6. Soft Deletes

Never hard delete user data:

```typescript
// ❌ NEVER hard delete
await supabase.from('items').delete().eq('id', itemId);

// ✅ Always soft delete
await supabase.from('items').update({ is_archived: true }).eq('id', itemId);
```

### 7. Table Schema Pattern

Standard columns for all tables:

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- ... other columns
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index on user_id (required for RLS performance)
CREATE INDEX idx_items_user_id ON items(user_id);

-- Updated_at trigger
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Important: Supabase Client

Always import from centralized location:

```typescript
// ✅ Correct
import { supabase } from '@/lib/supabase';

// ❌ Wrong - creates new client without auth context
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(...);
```

## Query Key Conventions

```typescript
// Pattern: [entity, ...identifiers]
['cookbooks', userId]
['recipes', userId]
['recipes', userId, cookbookId]
['recipe', recipeId]
['meal-plan', userId, weekStart]
['grocery-list', userId]
```
