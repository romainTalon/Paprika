# Paprika Development Agents

This directory contains specialized development agents (slash commands) for the Paprika iOS application. These agents help accelerate development while maintaining code quality and architectural consistency.

## Available Agents

### 1. `/frontend-dev` - Frontend Developer Agent
**Purpose**: Create React Native screens and UI components

**Use when you need to:**
- Create a new screen component
- Build custom UI components
- Integrate screens with navigation
- Implement frontend features following the design system

**Example usage:**
```
/frontend-dev
```

Then tell it: "Create a ProfileScreen where users can edit their display name, avatar, and preferences"

---

### 2. `/supabase-dev` - Supabase Backend Developer Agent
**Purpose**: Design and implement database schemas, RLS policies, and services

**Use when you need to:**
- Create new database tables
- Add Row Level Security (RLS) policies
- Create PostgreSQL functions
- Implement TypeScript service layer
- Update database schema

**Example usage:**
```
/supabase-dev
```

Then tell it: "Create the grocery_lists and grocery_items tables with RLS policies and a service layer"

---

### 3. `/test-dev` - Test Engineer Agent
**Purpose**: Set up testing infrastructure and write comprehensive tests

**Use when you need to:**
- Configure Jest and Testing Library (first time)
- Write unit tests for services
- Create component tests
- Test custom hooks
- Add integration tests

**Example usage:**
```
/test-dev
```

Then tell it: "Write tests for the RecipeService class and useRecipes hook"

---

### 4. `/lead-review` - Lead Developer / Code Reviewer Agent
**Purpose**: Review code quality, architecture, and standards compliance

**Use when you need to:**
- Review code before merging
- Check architectural consistency
- Validate design system usage
- Identify performance issues
- Get improvement suggestions

**Example usage:**
```
/lead-review
```

Then tell it: "Review the RecipeDetailScreen and its related components"

---

### 5. `/build-feature` - Feature Builder Orchestrator Agent
**Purpose**: Orchestrate complete feature development from start to finish

**Use when you need to:**
- Build a complete feature (backend + frontend + tests)
- Coordinate multiple development tasks
- Ensure proper development sequence
- Get a full end-to-end implementation

**Example usage:**
```
/build-feature
```

Then tell it: "I want to implement the grocery list feature with auto-generation from meal plans"

**This agent coordinates all other agents automatically!**

---

## How to Use These Agents

### Basic Workflow

1. **Choose the right agent** for your task:
   - Need backend? → `/supabase-dev`
   - Need frontend? → `/frontend-dev`
   - Need tests? → `/test-dev`
   - Need review? → `/lead-review`
   - Need complete feature? → `/build-feature`

2. **Invoke the agent** by typing the slash command in your Claude Code chat

3. **Describe what you need** - Be specific about:
   - What you want to build
   - Any specific requirements
   - Constraints or preferences

4. **Review the plan** - The agent will propose an implementation plan
   - Agents work in **semi-autonomous mode**
   - They propose actions and wait for your approval
   - You can modify the plan before proceeding

5. **Approve and execute** - Give the go-ahead for implementation

6. **Review the results** - The agent will show you what was created

### Example: Building a Complete Feature

**User:**
```
/build-feature
```

**User:**
```
I want to add a recipe sharing feature where users can share recipes
with other users via a unique link
```

**Agent response:**
```
I'll orchestrate the complete development. Here's my plan:

Phase 1: Backend
- Create recipe_shares table
- Add RLS policies
- Create service methods for generating/consuming share links

Phase 2: Frontend
- Add "Share" button to RecipeDetailScreen
- Create ShareRecipeModal component
- Implement link generation and copying

Phase 3: Testing
- Test share link generation
- Test share link consumption
- Test UI interactions

Phase 4: Review
- Code quality check
- Security validation

Should I proceed?
```

**User:** "Yes, proceed"

**Agent:** Executes each phase, waiting for approval between phases...

---

## Agent Capabilities

### What Agents Can Do ✅

- ✅ Analyze existing code and patterns
- ✅ Propose implementation plans
- ✅ Create new files (screens, services, tests, migrations)
- ✅ Modify existing files
- ✅ Ensure consistency with established patterns
- ✅ Follow TypeScript strict mode
- ✅ Use the design system
- ✅ Generate comprehensive tests
- ✅ Review code quality
- ✅ Suggest improvements

### What Agents Won't Do ❌

- ❌ Make changes without your approval
- ❌ Skip important steps (like testing)
- ❌ Hardcode values (they use theme constants)
- ❌ Use `any` types
- ❌ Violate architectural patterns
- ❌ Make security compromises

---

## Best Practices

### 1. Start Small
Don't try to build everything at once. Start with:
```
/frontend-dev
Create the ProfileScreen
```

Then:
```
/test-dev
Add tests for ProfileScreen
```

Then:
```
/lead-review
Review the ProfileScreen implementation
```

### 2. Use the Orchestrator for Complex Features
For multi-part features, use `/build-feature` to coordinate everything:
```
/build-feature
Implement the recipe import from URL feature
```

### 3. Review Agent Proposals
Agents will propose plans before executing. Review these carefully:
- Check that the approach makes sense
- Verify no existing functionality is duplicated
- Ensure proper integration with existing code

### 4. Iterate and Refine
Don't expect perfection on the first try:
1. Build the feature
2. Use `/lead-review` to identify improvements
3. Use the appropriate agent to implement improvements
4. Repeat as needed

### 5. Keep Documentation Updated
After agents create new features, update your documentation if needed.

---

## Configuration

### Current Agent Configuration

All agents are configured for:
- **Project**: Paprika iOS (React Native + Expo)
- **Backend**: Supabase (PostgreSQL)
- **Testing**: Jest + React Native Testing Library
- **Mode**: Semi-autonomous (propose → approve → execute)

### Customization

To modify an agent's behavior, edit its markdown file:
- `.claude/commands/frontend-dev.md`
- `.claude/commands/supabase-dev.md`
- `.claude/commands/test-dev.md`
- `.claude/commands/lead-review.md`
- `.claude/commands/build-feature.md`

---

## Troubleshooting

### Agent doesn't understand my request
**Solution**: Be more specific. Instead of "add grocery feature", say:
```
Create a GroceryScreen that displays a list of grocery items
with checkboxes, allows adding new items via an input field,
and has a button to generate items from the current meal plan
```

### Agent proposes too much work
**Solution**: Break it down. Instead of building everything, do it in phases:
```
/frontend-dev
Just create the basic GroceryScreen layout with a list view first
```

### Agent's plan doesn't match expectations
**Solution**: Modify the plan before approving:
```
I like the plan, but instead of creating a new hook,
let's use the existing useGroceryList hook. Can you update the plan?
```

### Something doesn't work after implementation
**Solution**: Use the review agent:
```
/lead-review
Review the GroceryScreen and identify any issues
```

---

## Tips for Success

1. **Read the Plans**: Always read agent proposals before approving
2. **Ask Questions**: If something is unclear, ask the agent to explain
3. **Start Simple**: Begin with small features to understand agent behavior
4. **Use Orchestrator**: For complex features, let `/build-feature` coordinate
5. **Test Often**: Use `/test-dev` regularly to maintain quality
6. **Review Regularly**: Use `/lead-review` to catch issues early
7. **Iterate**: Build → Review → Improve → Repeat

---

## Quick Reference

| I want to... | Use this agent |
|-------------|----------------|
| Create a new screen | `/frontend-dev` |
| Add a database table | `/supabase-dev` |
| Write tests | `/test-dev` |
| Review my code | `/lead-review` |
| Build a complete feature | `/build-feature` |
| Fix TypeScript errors | `/lead-review` (identify) + `/frontend-dev` (fix) |
| Optimize performance | `/lead-review` |
| Add RLS policies | `/supabase-dev` |
| Create a custom hook | `/frontend-dev` |
| Set up testing (first time) | `/test-dev` |

---

## Support

If you encounter issues with agents:
1. Check this README
2. Read the agent's markdown file for detailed instructions
3. Try rephrasing your request
4. Break down complex requests into smaller tasks
5. Ask the agent to explain its approach

---

**Happy building! 🚀**

The agents are here to help you build Paprika faster while maintaining high code quality and consistency.
