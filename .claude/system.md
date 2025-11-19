# Paprika Project - System Rules & Session Initialization

## 📚 Session Initialization - READ FIRST

**IMPORTANT:** At the start of each new session, you MUST read the following documents to understand the current state of the project:

### 1. **Project Status & Overview** (CRITICAL - READ FIRST)
```
README.md
```
**Why:** Contains current completion percentages, implemented features, what's missing, and recent changes.

### 2. **Database Schema** (ESSENTIAL)
```
docs/03-data-model.md
```
**Why:** Defines all Supabase tables, relationships, RLS policies, and data structures.

### 3. **Project Vision & Objectives** (CONTEXT)
```
docs/04-product-vision.md
```
**Why:** Understanding user personas, competitive positioning, and product goals.

### 4. **Design System** (UI/UX REFERENCE)
```
docs/09-design-system.md
```
**Why:** Defines theme implementation, colors, typography, component patterns to follow.

### 5. **Frontend Guidelines** (DEVELOPMENT STANDARDS)
```
docs/08-frontend-guidelines.md
```
**Why:** React Native best practices, component patterns, and code standards.

### 6. **Decision Log** (ARCHITECTURAL CONTEXT)
```
DECISION-LOG.md
```
**Why:** Understand WHY technical decisions were made (critical for maintaining consistency).

---

## 🏗️ Project Architecture Overview

### Tech Stack
- **Frontend:** React Native 0.81+ / Expo 54+
- **Language:** TypeScript 5.9 (strict mode)
- **Styling:** StyleSheet natif + Design System (NOT NativeWind)
- **Navigation:** Expo Router (file-based routing)
- **State:** TanStack Query v5 (server state) + Zustand (client state - future)
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **ORM:** Drizzle (type-safe, 40KB)
- **Testing:** Jest + React Native Testing Library (to be configured)

### Folder Structure
```
app/                     # Expo Router - file-based navigation
├── _layout.tsx         # Root layout with TanStack Query Provider
├── index.tsx           # Entry point (routing logic based on auth state)
├── onboarding/         # 3-step onboarding flow
├── (auth)/             # Auth group (login, signup, forgot-password)
└── (tabs)/             # Main app tabs
    ├── cookbooks/      # Cookbooks management
    ├── recipes/        # Recipe screens (create, import, detail)
    ├── meal-plan/      # Meal planning
    └── grocery/        # Grocery lists

src/
├── components/
│   ├── ui/             # Reusable UI (Text, Button, Container)
│   ├── auth/           # Auth components (AuthInput, AuthFormContainer)
│   └── cookbook/       # Cookbook components (CookbookCard, CreateCookbookModal)
├── contexts/           # React Contexts (AuthContext)
├── hooks/              # TanStack Query hooks (useCookbooks, useRecipes, etc.)
├── services/           # Backend services (CookbookService, RecipeService, etc.)
├── theme/              # Design system tokens (colors, spacing, typography, shadows)
├── types/              # TypeScript definitions
└── lib/                # Utilities (supabase client, validations)
```

### Key Patterns to Follow

#### 1. Component Structure
```typescript
// Order: Imports → Types → Component → Handlers → Render → Styles
import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Recipe } from '../types';

type ScreenProps = { /* navigation types */ };

export const ScreenName = ({ navigation, route }: ScreenProps) => {
  // 1. State
  const [state, setState] = useState();

  // 2. Hooks
  const { data, loading } = useCustomHook();

  // 3. Effects
  useEffect(() => { /* ... */ }, []);

  // 4. Handlers (with useCallback)
  const handleAction = useCallback(() => { /* ... */ }, [deps]);

  // 5. Render
  return <View style={styles.container}>...</View>;
};

// 6. Styles (using theme)
const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.neutral.white,
  },
});
```

#### 2. Service Layer Pattern
```typescript
// Static methods returning {data, error} tuples
export class ServiceName {
  static async getData(userId: string): Promise<{
    data: Type[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('table')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}
```

#### 3. Custom Hook Pattern
```typescript
export const useCustomHook = (userId: string) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await Service.getData(userId);
    if (error) setError(error);
    else setData(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, loadData };
};
```

---

## 🎨 Design System Rules

### Always Use Theme Constants
❌ **NEVER DO THIS:**
```typescript
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFF9F5',
    borderRadius: 8,
  },
});
```

✅ **ALWAYS DO THIS:**
```typescript
const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.md,
  },
});
```

### Use Existing Components
Before creating a new component, check if these exist:
- `Text` (from `@/components/ui`) - For all text (variants: h1-h4, body, bodyLarge, bodySmall, caption)
- `Button` (from `@/components/ui`) - For buttons (variants: primary, secondary, outline, ghost)
- `Container` (from `@/components/ui`) - For layout containers (optional centered prop)
- `CookbookCard` - For cookbook previews
- `RecipeCard` - For recipe previews
- `CreateCookbookModal` - For creating new cookbooks
- `AuthInput` - For auth form inputs
- `AuthFormContainer` - For auth screen layouts

---

## 🔒 Security & Data Rules

### 1. Always Validate User ID
```typescript
// Every service method must check user_id
.eq('user_id', userId)
```

### 2. Use Soft Deletes
```typescript
// Never hard delete user data
.update({ is_archived: true })
```

### 3. Enforce Freemium Limits
```typescript
// Free tier: 2 cookbooks, 20 recipes
if (subscription_plan === 'free' && count >= limit) {
  return { data: null, error: new Error('Limit reached') };
}
```

---

## 🤖 Available Development Agents

Use these slash commands for specialized tasks:

- `/frontend-dev` - Create React Native screens and components
- `/supabase-dev` - Design database schemas and services
- `/test-dev` - Write comprehensive tests
- `/lead-review` - Review code quality and architecture
- `/build-feature` - Orchestrate complete feature development
- `/update-status` - Update the status report after new features

---

## 📝 After Implementing New Features

**MANDATORY:** After implementing any new feature, you MUST:

1. **Update Status Report**
   ```
   /update-status
   ```

2. **Describe what was implemented:**
   - Which screens/services/components were created/modified
   - What functionality is now complete
   - Updated completion percentages
   - Any new tasks that emerged

3. **The agent will:**
   - Analyze the changes
   - Update `docs/Paprika-status-report.md`
   - Adjust completion percentages
   - Add new metrics
   - Update the task list

---

## ⚠️ Critical Reminders

### TypeScript
- ✅ Strict mode enabled - NO `any` types
- ✅ Explicit return types on all functions
- ✅ Proper interfaces for all props and state

### Performance
- ✅ Use `useCallback` for event handlers
- ✅ Use `useMemo` for expensive computations
- ✅ Use `FlatList` for lists, not `ScrollView` + `.map()`
- ✅ Proper dependency arrays in hooks

### Code Quality
- ✅ Error handling on all async operations
- ✅ Loading states for all data fetching
- ✅ Empty states when no data
- ✅ No hardcoded values - use theme constants
- ✅ Reuse existing components

### Database
- ✅ Current status: **85% complete and operational** (see README.md)
- ✅ Schema fully implemented with 7 tables, RLS policies, triggers, and indexes
- ✅ Drizzle ORM configured and tested
- ✅ Always use RLS policies for data isolation
- ✅ Always reference auth.users for user_id
- ✅ Use snake_case in DB, map to camelCase in services (see DECISION-LOG.md)

---

## 🎯 Current Priorities (Check README.md for Latest Updates)

Based on current project status (see README.md):

### COMPLETED ✅
- Supabase database schema (85% - fully operational)
- Authentication system (100% - Supabase Auth + Onboarding)
- Cookbooks management (100% - CRUD operations)
- Recipe management (100% - Create, list, toggle favorite, delete)

### IN PROGRESS 🚧
1. RecipeDetailScreen (currently placeholder)
2. Recipe import from URL (services created, needs Edge Functions migration)
3. Nutritional calculations (services created, needs Edge Functions migration)

### HIGH PRIORITY
4. Migrate IA services to Supabase Edge Functions
5. Implement meal planning functionality
6. Implement grocery list functionality
7. Implement testing suite (Jest + Testing Library)

### MEDIUM PRIORITY
8. Stripe integration for payments
9. Recipe sharing feature
10. Export PDF functionality

---

## 🚀 Development Workflow

When starting work:
1. ✅ Read the essential documents (README.md, data model, vision, design, decision log)
2. ✅ Understand current project state from README.md
3. ✅ Check what's already implemented
4. ✅ Review DECISION-LOG.md to understand WHY decisions were made
5. ✅ Use appropriate agent for the task
6. ✅ Follow established patterns (see Frontend Guidelines)
7. ✅ Update README.md when major features are completed

---

## 📋 Quick Reference

| Need to... | Command/Path |
|-----------|-------------|
| Check project status | Read `README.md` |
| See database schema | Read `docs/03-data-model.md` |
| Understand a decision | Read `DECISION-LOG.md` |
| Frontend best practices | Read `docs/08-frontend-guidelines.md` |
| Design system specs | Read `docs/09-design-system.md` |
| Create a screen | `/frontend-dev` |
| Create database tables | `/supabase-dev` |
| Add tests | `/test-dev` |
| Review code | `/lead-review` |
| Build complete feature | `/build-feature` |
| Update documentation | Update `README.md` manually or use `/update-status` |
| Check theme values | `src/theme/` (colors, spacing, typography, shadows) |
| Check types | `src/types/` |
| Auth context | `src/contexts/AuthContext.tsx` |
| Supabase client | `src/lib/supabase.ts` |

---

**Remember:** This is a well-architected project with high code quality standards. Maintain consistency, follow patterns, and always update the status report after implementing features!
