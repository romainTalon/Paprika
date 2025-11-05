# Paprika Project - System Rules & Session Initialization

## 📚 Session Initialization - READ FIRST

**IMPORTANT:** At the start of each new session, you MUST read the following documents to understand the current state of the project:

### 1. **Project Status Report** (CRITICAL - READ FIRST)
```
docs/Paprika-status-report.md
```
**Why:** Contains current completion percentages, implemented features, what's missing, and priorities.

### 2. **Database Schema** (ESSENTIAL)
```
docs/Paprika-data-model.md
```
**Why:** Defines all Supabase tables, relationships, RLS policies, and data structures.

### 3. **Project Vision & Objectives** (CONTEXT)
```
docs/Paprika-vision.md
```
**Why:** Understanding user personas, competitive positioning, and product goals.

### 4. **Design System** (UI/UX REFERENCE)
```
docs/Paprika-design-system.md
```
**Why:** Defines theme, colors, typography, component patterns to follow.

---

## 🏗️ Project Architecture Overview

### Tech Stack
- **Frontend:** React Native 0.81.5 + Expo 54.0.20
- **Language:** TypeScript 5.9.2 (strict mode)
- **Navigation:** React Navigation (Bottom Tabs + Stack)
- **State:** Custom React Hooks
- **Backend:** Supabase (PostgreSQL + Auth)
- **Testing:** Jest + React Native Testing Library (to be configured)

### Folder Structure
```
src/
├── components/ui/      # Reusable UI components (Button, Card, PaprikaText)
├── hooks/              # Custom hooks (useAuth, useRecipes, useCookbooks, useMealPlans)
├── navigation/         # React Navigation setup (MainNavigator)
├── screens/            # App screens (Auth, Cookbooks, Recipes, MealPlan, etc.)
├── services/           # Backend API layer (auth, recipes, cookbooks, meal_plans)
├── theme/              # Design system (colors, typography, spacing)
└── types/              # TypeScript type definitions
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
- `PaprikaText` - For all text (variants: heading, body, caption, label)
- `Button` - For buttons (variants: solid, outline, ghost; sizes: xs, sm, md, lg)
- `Card` - For containers (variants: elevated, outlined, filled)
- `RecipeCard` - For recipe previews
- `MealSlot` - For meal planning slots

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
- ✅ Current status: **Partially configured** (see status report)
- ✅ Some tables may be missing - check with user before assuming they exist
- ✅ Always use RLS policies
- ✅ Always reference auth.users for user_id

---

## 🎯 Current Priorities (Check Status Report for Updates)

Based on the last status report:

### CRITICAL
1. Complete Supabase database schema
2. Implement RLS policies and triggers

### HIGH
3. Finish grocery list functionality
4. Implement recipe import from URL

### MEDIUM
5. Add nutritional calculations
6. Implement testing suite

---

## 🚀 Development Workflow

When starting work:
1. ✅ Read the 4 essential documents (status, data model, vision, design)
2. ✅ Understand current project state
3. ✅ Check what's already implemented
4. ✅ Use appropriate agent for the task
5. ✅ Follow established patterns
6. ✅ Update status report when done

---

## 📋 Quick Reference

| Need to... | Command/Path |
|-----------|-------------|
| Check project status | Read `docs/Paprika-status-report.md` |
| See database schema | Read `docs/Paprika-data-model.md` |
| Create a screen | `/frontend-dev` |
| Create database tables | `/supabase-dev` |
| Add tests | `/test-dev` |
| Review code | `/lead-review` |
| Build complete feature | `/build-feature` |
| Update documentation | `/update-status` |
| Check theme values | `src/theme/index.ts` |
| Check types | `src/types/index.ts` |

---

**Remember:** This is a well-architected project with high code quality standards. Maintain consistency, follow patterns, and always update the status report after implementing features!
