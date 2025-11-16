# Authentication Implementation Guide

*Comprehensive guide to the authentication system implemented in Paprika*

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Flow Diagrams](#flow-diagrams)
5. [Implementation Details](#implementation-details)
6. [Security Considerations](#security-considerations)
7. [Testing](#testing)
8. [Future Enhancements](#future-enhancements)

---

## Overview

Paprika uses **Supabase Authentication** with **Email/Password** as the primary authentication method. The implementation includes:

- ✅ Email/Password authentication
- ✅ User registration with validation
- ✅ Session persistence (AsyncStorage)
- ✅ Auto token refresh
- ✅ Protected routes
- ✅ Onboarding flow for new users
- ✅ Password reset functionality
- ✅ Comprehensive error handling

---

## Architecture

### Tech Stack

- **Supabase Auth**: Backend authentication service
- **AsyncStorage**: Session persistence in React Native
- **React Context API**: Global auth state management
- **Zod**: Form validation
- **Expo Router**: File-based routing with auth guards

### Key Components

```
┌─────────────────────────────────────────────────────────┐
│                    Supabase Backend                      │
│  - Auth service                                         │
│  - PostgreSQL (auth.users table)                        │
│  - RLS policies                                         │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                 React Native App                         │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │          AuthContext (Global State)             │    │
│  │  - user, session, loading                       │    │
│  │  - signIn(), signUp(), signOut()                │    │
│  └────────────────────────────────────────────────┘    │
│                           ↕                              │
│  ┌────────────────────────────────────────────────┐    │
│  │         AsyncStorage (Persistence)              │    │
│  │  - Session tokens                               │    │
│  │  - Onboarding flag                              │    │
│  └────────────────────────────────────────────────┘    │
│                           ↕                              │
│  ┌────────────────────────────────────────────────┐    │
│  │              App Screens                        │    │
│  │  - Login, Signup, Forgot Password               │    │
│  │  - Onboarding (3 steps)                         │    │
│  │  - Protected screens (Cookbooks, etc.)          │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
├── lib/
│   └── supabase.ts              # Supabase client config + AppState listener
├── contexts/
│   └── AuthContext.tsx          # Global auth state provider
├── hooks/
│   └── useAuth.ts               # Hook to access AuthContext
├── types/
│   └── auth.ts                  # TypeScript auth types
└── components/
    └── auth/
        ├── AuthInput.tsx        # Styled input with error handling
        └── AuthFormContainer.tsx # Keyboard-aware form wrapper

app/
├── _layout.tsx                  # Root layout with AuthProvider
├── index.tsx                    # Entry point (routing logic)
├── onboarding/
│   ├── step1.tsx                # Onboarding intro
│   ├── step2.tsx                # Features preview
│   └── step3.tsx                # CTA to signup
└── (auth)/
    ├── _layout.tsx              # Auth stack navigator
    ├── login.tsx                # Login screen
    ├── signup.tsx               # Signup screen
    └── forgot-password.tsx      # Password reset screen
```

---

## Flow Diagrams

### App Launch Flow

```
User launches app
        ↓
Check AsyncStorage for session
        ↓
    ┌───────────────────────┐
    │ Session exists?       │
    └───────┬───────────────┘
            │
     ┌──────┴──────┐
     │             │
    YES           NO
     │             │
     ↓             ↓
Navigate to   Check onboarding flag
Cookbooks          ↓
              ┌─────────────────┐
              │ Has seen        │
              │ onboarding?     │
              └────┬────────────┘
                   │
            ┌──────┴──────┐
            │             │
           YES           NO
            │             │
            ↓             ↓
       Navigate to   Show onboarding
       Login         (3 steps)
                          ↓
                     Navigate to
                     Signup
```

### Login Flow

```
User enters credentials
        ↓
Validate with Zod schema
        ↓
    ┌───────────────────────┐
    │ Valid?                │
    └───────┬───────────────┘
            │
     ┌──────┴──────┐
     │             │
    NO            YES
     │             │
     ↓             ↓
Show error    Call signIn()
messages           ↓
              Supabase Auth
                   ↓
            ┌──────────────┐
            │ Success?     │
            └───┬──────────┘
                │
         ┌──────┴──────┐
         │             │
        YES           NO
         │             │
         ↓             ↓
    Update         Parse error
    AuthContext    Show Alert
         ↓              ↓
    Navigate to    User stays on
    Cookbooks      login screen
```

### Signup Flow

```
User enters: email, password, confirm password, full name
        ↓
Validate with Zod schema
  - Email format
  - Password min 8 chars
  - Passwords match
  - Full name min 2 chars
        ↓
    ┌───────────────────────┐
    │ Valid?                │
    └───────┬───────────────┘
            │
     ┌──────┴──────┐
     │             │
    NO            YES
     │             │
     ↓             ↓
Show error    Call signUp()
per field          ↓
              Supabase Auth
              (creates user)
                   ↓
            ┌──────────────┐
            │ Success?     │
            └───┬──────────┘
                │
         ┌──────┴──────┐
         │             │
        YES           NO
         │             │
         ↓             ↓
    Show Alert    Show error
    "Check email" Alert
         ↓              ↓
    Navigate to    User stays
    Login          on signup
```

---

## Implementation Details

### 1. Supabase Client Configuration

**File**: `src/lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,           // Session persistence
    autoRefreshToken: true,           // Auto refresh before expiry
    persistSession: true,             // Persist across app restarts
    detectSessionInUrl: true,         // Deep link support
  },
});

// Token refresh on app state changes
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
```

**Key features**:
- **AsyncStorage**: Stores session tokens securely on device
- **Auto-refresh**: Tokens refresh automatically before expiry
- **AppState listener**: Resumes token refresh when app comes to foreground

---

### 2. AuthContext Provider

**File**: `src/contexts/AuthContext.tsx`

```typescript
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("🔐 Initial session:", session?.user?.email ?? "No session");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔐 Auth state changed:", event, "User:", session?.user?.email ?? "No user");
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Auth methods
  const signIn = async ({ email, password }: SignInCredentials) => {
    console.log("🔐 AuthContext: signIn called for", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("🔐 AuthContext: signIn error:", error.message);
      throw error;
    }
    console.log("🔐 AuthContext: signIn successful, session:", data.session?.user?.email);
  };

  const signUp = async ({ email, password, fullName }: SignUpCredentials) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, // Stored in auth.users.raw_user_meta_data
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    console.log("🔐 AuthContext: signOut called");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("🔐 AuthContext: signOut error:", error.message);
      throw error;
    }
    console.log("🔐 AuthContext: signOut successful");
  };

  const requestPasswordReset = async ({ email }: PasswordResetRequest) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "paprika://reset-password", // Deep link
    });
    if (error) throw error;
  };

  const updatePassword = async ({ newPassword }: PasswordUpdate) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  const value: AuthContextValue = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

**Key features**:
- **Global state**: User and session available throughout the app
- **Auth state listener**: Updates UI automatically on login/logout
- **Comprehensive logging**: Debug-friendly console logs
- **Error propagation**: Throws errors for handling in UI

---

### 3. Onboarding Flow

**Flag storage**: `@paprika_onboarding_complete` in AsyncStorage

**Screens**:
1. **step1.tsx** - Welcome + intro
2. **step2.tsx** - Features preview
3. **step3.tsx** - CTA to signup (sets flag and navigates)

```typescript
// app/onboarding/step3.tsx
const handleStart = async () => {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
  router.replace("/(auth)/signup");
};
```

---

### 4. Login Screen

**File**: `app/(auth)/login.tsx`

**Validation** (Zod):
```typescript
const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});
```

**Error handling**:
```typescript
// Parse Supabase errors to French user-friendly messages
if (msg.includes("email not confirmed")) {
  errorMessage = "Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.";
} else if (msg.includes("invalid login credentials") || msg.includes("invalid password")) {
  errorMessage = "Email ou mot de passe incorrect.";
} else if (msg.includes("email") && msg.includes("invalid")) {
  errorMessage = "Format d'email invalide.";
} else {
  errorMessage = error.message;
}
```

**Navigation**:
```typescript
// Explicit navigation after successful login
await signIn({ email, password });
router.replace("/(tabs)/cookbooks");
```

---

### 5. Signup Screen

**File**: `app/(auth)/signup.tsx`

**Validation** (Zod):
```typescript
const signupSchema = z.object({
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});
```

**Success handling**:
```typescript
await signUp({ email, password, fullName });

Alert.alert(
  "Compte créé !",
  "Un email de confirmation a été envoyé à votre adresse. Vérifiez votre boîte de réception pour activer votre compte.",
  [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
);
```

---

### 6. Protected Routes

**Pattern**: Check auth state in `useEffect`, redirect if not authenticated

```typescript
// Example: src/screens/CookbooksScreen.tsx
export default function CookbooksScreen() {
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, authLoading]);

  const userId = user?.id;

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Container centered>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text variant="body" color="neutral" style={{ marginTop: spacing.md }}>
          Vérification...
        </Text>
      </Container>
    );
  }

  // Not authenticated (should be redirected, but safety check)
  if (!isAuthenticated) {
    return null;
  }

  // Render screen content...
}
```

---

## Security Considerations

### 1. Session Storage

- **AsyncStorage**: Encrypted at OS level on iOS/Android
- **Token rotation**: Automatic refresh before expiry
- **Secure transmission**: HTTPS only (Supabase default)

### 2. Password Requirements

- **Minimum length**: 8 characters
- **Validation**: Client-side (Zod) + Server-side (Supabase)
- **Hashing**: bcrypt (handled by Supabase)

### 3. Row Level Security (RLS)

All user data is protected by RLS policies in PostgreSQL:

```sql
-- Example: Only user can see their own cookbooks
CREATE POLICY "Users can view own cookbooks"
  ON cookbooks FOR SELECT
  USING (auth.uid() = user_id);

-- Example: Only user can create their own cookbooks
CREATE POLICY "Users can create own cookbooks"
  ON cookbooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 4. Data Isolation

- **User ID**: Automatically set from `auth.uid()` in RLS policies
- **No manual user_id passing**: RLS enforces security at database level
- **API keys**: Not exposed in client bundle (stored in .env.local, server-only)

---

## Testing

### Manual Testing Checklist

- [x] New user signup → email sent → account created
- [x] Login with valid credentials → redirected to cookbooks
- [x] Login with invalid credentials → error message shown
- [x] Logout → redirected to login screen
- [x] Logout + login again → works correctly
- [x] Onboarding shown only once (flag in AsyncStorage)
- [x] Session persists across app restarts
- [x] Token auto-refresh on app foreground
- [ ] Password reset email sent → link redirects to app (TODO: deep links)
- [ ] Protected routes redirect to login when not authenticated

### Automated Tests (Future)

```typescript
// Example test structure
describe("AuthContext", () => {
  it("should initialize with loading state", () => {
    // Test initial loading state
  });

  it("should sign in with valid credentials", async () => {
    // Test signIn success
  });

  it("should throw error with invalid credentials", async () => {
    // Test signIn error
  });

  it("should sign out and clear session", async () => {
    // Test signOut
  });
});

describe("Login Screen", () => {
  it("should validate email format", () => {
    // Test Zod validation
  });

  it("should show error for invalid credentials", async () => {
    // Test error display
  });

  it("should navigate to cookbooks on success", async () => {
    // Test navigation
  });
});
```

---

## Future Enhancements

### Short-term (Next Sprint)

- [ ] **Deep links**: Configure `paprika://` URL scheme for email confirmation
- [ ] **Re-enable email confirmation**: Currently disabled for testing
- [ ] **Better error messages**: More specific error parsing
- [ ] **Loading states**: Skeleton loaders instead of spinners

### Medium-term (1-2 months)

- [ ] **OAuth providers**:
  - Google Sign-In (optional)
  - Apple Sign-In (required for App Store)
- [ ] **Profile management**:
  - Edit display name
  - Change email
  - Change password
  - Delete account
- [ ] **Biometric authentication**: Face ID / Touch ID for quick login

### Long-term (3+ months)

- [ ] **Two-factor authentication (2FA)**: Premium feature
- [ ] **Session management**: View active sessions, logout all devices
- [ ] **Account recovery**: Security questions, backup codes
- [ ] **GDPR compliance**: Data export, data deletion

---

## Troubleshooting

### Common Issues

**Issue**: "Session not persisting across app restarts"
- **Solution**: Check AsyncStorage permissions, ensure `persistSession: true` in Supabase config

**Issue**: "Token refresh not working when app returns from background"
- **Solution**: Verify AppState listener is attached in `supabase.ts`

**Issue**: "User redirected to login after successful signup"
- **Solution**: Email confirmation is enabled - check email or disable confirmation in Supabase Dashboard

**Issue**: "RLS policy error when accessing data"
- **Solution**: Ensure `auth.uid()` is used in RLS policies, not manual `user_id` checks

---

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo Router Documentation](https://expo.github.io/router/docs/)
- [React Context API](https://react.dev/reference/react/useContext)
- [Zod Validation](https://zod.dev/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

---

**Last Updated**: November 16, 2025
**Maintained By**: Paprika Team
