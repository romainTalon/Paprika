# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 📚 Getting Started - READ THIS FIRST

### For Your First Session
When you start working in this codebase for the first time, read these files **in this order**:

1. **This file (CLAUDE.md)** - You're reading it now ✓
2. **PROJECT-CONTEXT.md** (2 min) - Quick project overview
3. **START-HERE.md** (5 min) - Onboarding guide
4. **docs/00-INDEX.md** - Complete documentation index
5. **.claude/SETUP.md** - Understanding Claude Code configuration for this project
6. **.claude/system.md** - System rules that are automatically loaded each session

### Key Documentation Files
After your initial read, these are the most important references:
- **DECISION-LOG.md** - Understand WHY technical decisions were made
- **docs/03-data-model.md** - Database schema and relationships
- **docs/08-frontend-guidelines.md** - React Native patterns and best practices
- **docs/09-design-system.md** - Design system implementation details
- **docs/02-tech-stack.md** - Full technology stack details

### Quick Reference
- **Design patterns?** → docs/08-frontend-guidelines.md
- **Database schema?** → docs/03-data-model.md
- **Why was X chosen?** → DECISION-LOG.md
- **Business requirements?** → docs/04-product-vision.md
- **Available slash commands?** → .claude/commands/README.md

---

## 🤖 Claude Code Configuration & Agents

This project has a **sophisticated Claude Code setup** in the `.claude/` directory. Understanding this is CRITICAL for productivity.

### Automatic Session Initialization
**IMPORTANT**: The `.claude/system.md` file is **automatically read at the start of each session**. It contains:
- Project architecture overview
- Code patterns to follow
- Security and data rules
- References to essential documentation
- List of available development agents

**You don't need to manually read system.md** - it's loaded automatically when you start a session.

**⚠️ Note on Referenced Documentation**: The `system.md` file references several `docs/Paprika-*.md` files (Paprika-status-report.md, Paprika-data-model.md, Paprika-vision.md, Paprika-design-system.md) that **don't exist yet**. These were planned for an older project structure. Instead, use the actual documentation files:
- **Status** → README.md (see "État du Projet" section)
- **Data Model** → docs/03-data-model.md
- **Vision** → docs/04-product-vision.md
- **Design System** → docs/09-design-system.md

### Available Slash Commands (Agents)

This project has specialized development agents to accelerate your work:

#### `/frontend-dev` - Frontend Developer
**Use when**: Creating React Native screens, UI components, or implementing frontend features
```
/frontend-dev
Create a ProfileScreen where users can edit their display name and avatar
```

#### `/supabase-dev` - Backend Developer
**Use when**: Creating database tables, RLS policies, Edge Functions, or backend services
```
/supabase-dev
Create the grocery_lists table with RLS policies and TypeScript service layer
```

#### `/test-dev` - Test Engineer
**Use when**: Setting up tests or writing test cases for components, hooks, or services
```
/test-dev
Write tests for the RecipeService and useRecipes hook
```

#### `/lead-review` - Code Reviewer
**Use when**: Reviewing code quality, architecture compliance, or identifying improvements
```
/lead-review
Review the RecipeDetailScreen implementation for quality and performance
```

#### `/build-feature` - Feature Orchestrator
**Use when**: Building a complete feature that requires backend + frontend + tests
```
/build-feature
Implement the complete recipe sharing feature with link generation
```
**This agent coordinates all other agents automatically!**

#### `/update-status` - Documentation Updater
**Use when**: After completing a significant feature or milestone
```
/update-status
I've implemented the grocery list feature with auto-generation from meal plans
```
**Note**: This updates project status documentation. Only use after completing features.

**📖 Learn more**: Read `.claude/commands/README.md` for detailed agent usage guide

---

## Project Overview

**Paprika** is a React Native mobile application (iOS/Android) for recipe management powered by AI. It allows users to automatically import recipes from any website, organize them in themed cookbooks, plan weekly meals, and generate shopping lists with nutritional calculations.

**Current Status**:
- 📝 Documentation: 100% complete
- 🗄️ Database: 85% complete (fully operational, tested)
- ⚙️ Backend: 30% complete (services layer created)
- 📱 Frontend: 25% complete (basic UI components)

**Stack**: React Native 0.81 + Expo 54 + TypeScript 5.9 + Supabase + Drizzle ORM + Anthropic Claude AI

---

## Essential Commands

### Development
```bash
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run on web (not primary target)
```

### Type Checking & Linting
```bash
npm run type-check     # TypeScript type checking (tsc --noEmit)
npm run lint           # ESLint code linting
```

### Database (Supabase + Drizzle ORM)
```bash
npm run db:studio           # Open Drizzle Studio (visual DB browser)
npm run db:generate         # Generate migration files from schema
npm run db:push             # Push schema changes to database
npm run db:introspect       # Sync schema from existing database
```

**Note**: The database is fully configured and operational. See `supabase/README.md` for detailed setup.

### Testing (when implemented)
```bash
npm test               # Run unit tests
npm run test:e2e       # Run end-to-end tests
```

### Building (when implemented)
```bash
eas build --platform all    # Build for iOS and Android
eas submit                  # Submit to app stores
```

---

## Architecture & Code Organization

### Directory Structure
```
src/
├── components/
│   └── ui/              # Reusable UI components (Text, Button, Container)
├── theme/               # Design system tokens (colors, spacing, typography, shadows)
├── screens/             # Full-page screen components (when added)
├── hooks/               # Custom React hooks (when added)
├── services/            # API/Backend service layer (when added)
├── types/               # TypeScript type definitions
└── utils/               # Utility functions (when added)

app/                     # Expo Router file-based routing
├── _layout.tsx         # Root layout configuration
└── index.tsx           # Home screen

docs/                    # Comprehensive project documentation
```

### TypeScript Path Aliases
Use these configured path aliases for imports:
- `@/*` - Maps to `./src/*`
- `@components/*` - Maps to `./src/components/*`
- `@screens/*` - Maps to `./src/screens/*`
- `@services/*` - Maps to `./src/services/*`
- `@hooks/*` - Maps to `./src/hooks/*`
- `@types/*` - Maps to `./src/types/*`
- `@utils/*` - Maps to `./src/utils/*`
- `@lib/*` - Maps to `./src/lib/*`
- `@db/*` - Maps to `./db/*`

**Example**: `import { colors, spacing } from "@/theme"` instead of `import { colors, spacing } from "../../theme"`

---

## Design System - "Warm & Cozy"

**CRITICAL**: This project uses a custom Design System with React Native's native StyleSheet. **NEVER hardcode values directly in styles.**

### Design System Location
All design tokens are in `src/theme/`:
- `colors.ts` - Complete color palette (primary, neutral, semantic colors)
- `spacing.ts` - Spacing scale (4px base system)
- `typography.ts` - Font sizes, weights, line heights
- `shadows.ts` - Pre-defined shadow styles (iOS + Android elevation)

### Usage Pattern
```typescript
// ✅ CORRECT - Always import from theme
import { colors, spacing, fontSizes, fontWeights, shadows } from "@/theme";

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warm.cream,
    padding: spacing.lg,           // 16px
    borderRadius: spacing.md,      // 8px
  },
  text: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.warm.brown,
  },
});

// ❌ WRONG - Never hardcode values
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF9F0",
    padding: 16,
    borderRadius: 8,
  },
});
```

### UI Components
Use the pre-built UI components from `src/components/ui/`:

```typescript
import { Text, Button, Container } from "@/components/ui";
import { spacing } from "@/theme";

<Container centered>
  <Text variant="h1" color="primary">Title</Text>
  <Text variant="body" style={{ marginTop: spacing.md }}>
    Body text
  </Text>
  <Button
    variant="primary"
    size="lg"
    onPress={handlePress}
  >
    Click Me
  </Button>
</Container>
```

**Available components**:
- `Text` - Typography with variants (h1-h4, body, bodyLarge, bodySmall, caption)
- `Button` - Buttons with variants (primary, secondary, outline, ghost)
- `Container` - Layout container with optional centering

---

## Key Technical Decisions

### React Native Styling Approach
- **Decision**: Native StyleSheet + Design System instead of NativeWind/Tailwind
- **Reason**: NativeWind v4 unstable with Expo 54, StyleSheet provides maximum stability and performance
- **Impact**: Use design tokens from `src/theme/` and reusable UI components

### Database & Backend
- **Supabase**: PostgreSQL database + Auth + Storage + Edge Functions
- **Drizzle ORM**: Type-safe ORM (40KB vs Prisma 300KB) - chosen for bundle size and TypeScript inference
- **Schema**: ✅ Fully implemented and operational
  - 7 tables: users, cookbooks, recipes, meal_plans, grocery_lists, grocery_items, nutrition_cache
  - 14 RLS policies for data isolation
  - 11 triggers for freemium enforcement
  - 8 PostgreSQL functions
  - 13 performance indexes (full-text search, fuzzy search)
  - Auto-user creation trigger (auth.users → public.users)
  - Monthly import reset via Edge Function
- **Services**: TypeScript service layer created (CookbookService, RecipeService, MealPlanService, GroceryListService)
- **Detailed docs**: See `supabase/README.md` and `docs/03-data-model.md`

### AI Integration Strategy
The app uses a **3-tier hybrid approach** for recipe imports:
1. **JSON-LD extraction** (free, 70% success rate)
2. **LLM + HTML scraping** (Claude 3.5 Sonnet, 20% success rate, ~€0.01/import)
3. **Vision AI screenshot** (Claude Vision, 10% success rate, ~€0.03/import)

**Cost optimization**: Most requests hit free tier first, expensive AI only as fallback.

### State Management (planned)
- **TanStack Query**: Server state (API calls, caching)
- **Zustand**: Client state (UI state, temporary data)
- **Local state**: `useState` for component-specific state

---

## Code Standards & Patterns

### File Naming Conventions
- **Screens**: `PascalCase` + `Screen.tsx` → `CookbooksScreen.tsx`
- **Components**: `PascalCase.tsx` → `RecipeCard.tsx`
- **Hooks**: `camelCase` with `use` prefix → `useRecipes.ts`
- **Services**: `camelCase` + `.service.ts` → `recipe.service.ts`
- **Types**: `index.ts` (centralized exports)

### Component Structure Pattern
```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';

interface MyComponentProps {
  title: string;
  onPress?: () => void;
}

export function MyComponent({ title, onPress }: MyComponentProps) {
  // 1. Hooks (state, navigation, custom hooks)
  const [loading, setLoading] = useState(false);

  // 2. Effects
  useEffect(() => {
    // Side effects
  }, []);

  // 3. Handlers (with useCallback for optimization)
  const handlePress = useCallback(() => {
    if (onPress) onPress();
  }, [onPress]);

  // 4. JSX
  return (
    <View style={styles.container}>
      {/* Content */}
    </View>
  );
}

// 5. Styles (always at bottom of file)
const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.warm.cream,
  },
});
```

### TypeScript Strict Mode
- **strictNullChecks**: Always enabled
- **noImplicitAny**: Never use `any` - use proper types or `unknown`
- **strict**: All strict checks enabled

### Performance Considerations
- Use `FlatList` for lists with >50 items (never `ScrollView` with `.map()`)
- Memoize expensive computations with `useMemo`
- Memoize callbacks passed to child components with `useCallback`
- Wrap heavy components in `React.memo()` to prevent unnecessary re-renders

---

## Important Documentation References

### Before Starting Any Task
1. **Architecture Decisions**: Read `DECISION-LOG.md` to understand why certain technologies/patterns were chosen
2. **Design System**: Review `docs/09-design-system.md` for implementation details
3. **Frontend Guidelines**: Check `docs/08-frontend-guidelines.md` for React Native best practices
4. **Data Model**: See `docs/03-data-model.md` for database schema (when implementing backend features)

### Key Documentation Files
- `PROJECT-CONTEXT.md` - Quick project overview (2 min read)
- `START-HERE.md` - Onboarding guide for new developers
- `docs/00-INDEX.md` - Complete documentation index
- `docs/02-tech-stack.md` - Full technology stack details
- `docs/04-product-vision.md` - Product requirements and business model
- `docs/05-roadmap.md` - 12-week development roadmap
- `docs/06-freemium-strategy.md` - Monetization strategy (€4.99/month premium)
- `docs/07-ui-guidelines.md` - Visual design language and guidelines

---

## Working with This Codebase

### When Adding New Screens
1. Create screen file in `app/` directory (Expo Router uses file-based routing)
2. Import and use existing UI components from `@/components/ui`
3. **Always** use design tokens from `@/theme` - never hardcode colors/spacing
4. Add proper TypeScript types for props and state
5. Consider responsive design (mobile-first, test on various screen sizes)
6. Add accessibility props (`accessibilityLabel`, `accessibilityRole`, etc.)

### When Creating New Components
1. Place in `src/components/ui/` (generic) or `src/components/recipe/` (domain-specific)
2. Export from `index.ts` for clean imports
3. Use `StyleSheet.create()` with design tokens
4. Make components controlled (pass state via props) when possible
5. Add TypeScript interface for props with JSDoc comments
6. Use `React.memo()` for components that receive complex props

### When Implementing API Calls
1. Create service file in `src/services/` (e.g., `recipe.service.ts`)
2. Use TanStack Query for data fetching and caching (when implemented)
3. Handle loading, error, and empty states
4. Add proper TypeScript types for API responses
5. Consider offline-first architecture (cache data locally)

### When Working with Forms
1. Use controlled components (`value` + `onChange`)
2. Implement proper validation (consider Zod for schema validation)
3. Show clear error messages
4. Disable submit button during submission
5. Handle keyboard management (`KeyboardAvoidingView` on iOS)

---

## Common Pitfalls & Gotchas

### React Native Specifics
- **Never nest ScrollView**: Use FlatList instead or refactor layout
- **SafeAreaView**: Always use `react-native-safe-area-context` (not RN's built-in)
- **Android shadows**: Use `elevation` property instead of `shadow*` properties
- **Text wrapping**: All text must be inside `<Text>` components (can't put text directly in `<View>`)
- **Flexbox differences**: Default `flexDirection` is `column` (not `row` like web)

### Design System
- **Never hardcode colors**: Always use `colors.*` from theme
- **Never hardcode spacing**: Always use `spacing.*` from theme
- **Color references**: Use `colors.warm.brown`, `colors.primary`, not hex codes
- **Responsive spacing**: Consider using different spacing values for tablet/desktop if needed

### TypeScript
- Import types from React: `import type { ViewStyle, TextStyle } from 'react-native'`
- Use `interface` for component props (convention in this project)
- Use `type` for unions, intersections, or mapped types
- Never use `any` - use `unknown` and narrow with type guards if needed

### Performance
- Avoid inline functions in render: `onPress={() => handle()}` → use `useCallback`
- Avoid inline styles: `style={{ padding: 16 }}` → use `StyleSheet.create()`
- Optimize images: Use appropriate dimensions, consider `FastImage` for remote images
- FlatList: Always provide `keyExtractor` and consider `getItemLayout` for fixed-height items

---

## Branching & Git Workflow

**Main Branch**: `main` - Production-ready code
**Development Branch**: `develop` - Active development

### Commit Message Conventions
Follow conventional commits format:
```
feat: add recipe import screen
fix: correct spacing in Button component
docs: update CLAUDE.md with new patterns
chore: update dependencies
refactor: extract common logic to hook
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## Testing Guidelines (When Implemented)

### Unit Tests
- Test custom hooks in isolation
- Test utility functions thoroughly
- Mock external dependencies (API calls, navigation)
- Use React Native Testing Library

### Component Tests
- Test component rendering with different props
- Test user interactions (button presses, text input)
- Test conditional rendering and state changes
- Snapshot tests for UI components

### E2E Tests
- Test critical user flows (import recipe, create cookbook, add to meal plan)
- Use Detox or Maestro for E2E testing
- Run on real devices/emulators, not just simulators

---

## Development Environment Notes

- **Node Version**: Use LTS version (check `.nvmrc` if present)
- **Package Manager**: npm (use `npm install`, not yarn or pnpm)
- **iOS Development**: Requires macOS with Xcode
- **Android Development**: Requires Android Studio and SDK
- **Expo Go**: Can be used for quick testing, but custom native code requires dev builds

---

## Questions or Issues?

- Check existing documentation in `docs/` folder first
- Review `DECISION-LOG.md` to understand past architectural choices
- Check `GLOSSARY.md` for domain-specific terminology
- For technical questions: Refer to official React Native, Expo, and Supabase docs

---

**Version**: 1.0
**Last Updated**: November 2025
**Maintained By**: Paprika Team
