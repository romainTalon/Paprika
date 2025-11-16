/**
 * Login Screen
 *
 * Email/password authentication
 */

import React, { useState } from "react";
import { View, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { AuthInput, AuthFormContainer } from "@/components/auth";
import { Text, Button } from "@/components/ui";
import { colors, spacing } from "@/theme";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      console.log("🔐 Login attempt with:", email);

      // Validate form
      const result = loginSchema.safeParse({ email, password });

      if (!result.success) {
        console.log("❌ Validation failed:", result.error.issues);
        const formattedErrors: Partial<Record<keyof LoginForm, string>> = {};
        result.error.issues.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as keyof LoginForm] = err.message;
          }
        });
        setErrors(formattedErrors);
        return;
      }

      setErrors({});
      setLoading(true);

      console.log("✅ Validation passed, calling signIn...");
      await signIn({ email, password });
      console.log("✅ signIn completed successfully");

      // Navigate to cookbooks screen
      console.log("🚀 Navigating to cookbooks...");
      router.replace("/(tabs)/cookbooks");
    } catch (error: any) {
      console.error("❌ Login error:", error);

      // Parse Supabase error messages
      let errorMessage = "Une erreur s'est produite. Vérifiez vos identifiants.";

      if (error?.message) {
        const msg = error.message.toLowerCase();

        if (msg.includes("email not confirmed")) {
          errorMessage = "Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.";
        } else if (msg.includes("invalid login credentials") || msg.includes("invalid password")) {
          errorMessage = "Email ou mot de passe incorrect.";
        } else if (msg.includes("email") && msg.includes("invalid")) {
          errorMessage = "Format d'email invalide.";
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert("Erreur de connexion", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormContainer>
      <View style={styles.header}>
        <Text style={styles.emoji}>🍳</Text>
        <Text variant="h1" color="primary" style={styles.title}>
          Bon retour !
        </Text>
        <Text variant="body" color="neutral" style={styles.subtitle}>
          Connectez-vous pour continuer
        </Text>
      </View>

      <View style={styles.form}>
        <AuthInput
          label="Email"
          required
          value={email}
          onChangeText={setEmail}
          placeholder="votre@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
        />

        <AuthInput
          label="Mot de passe"
          required
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          error={errors.password}
        />

        <TouchableOpacity
          onPress={() => router.push("/(auth)/forgot-password")}
          style={styles.forgotPassword}
        >
          <Text variant="bodySmall" color="primary">
            Mot de passe oublié ?
          </Text>
        </TouchableOpacity>

        <Button
          variant="primary"
          size="lg"
          onPress={handleLogin}
          loading={loading}
          style={styles.loginButton}
        >
          Se connecter
        </Button>

        <View style={styles.signupPrompt}>
          <Text variant="body" color="neutral">
            Pas encore de compte ?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text variant="body" color="primary" style={styles.signupLink}>
              S'inscrire
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthFormContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },

  title: {
    marginBottom: spacing.xs,
  },

  subtitle: {
    textAlign: "center",
  },

  form: {
    marginTop: spacing.md,
  },

  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: spacing.lg,
  },

  loginButton: {
    marginBottom: spacing.lg,
  },

  signupPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  signupLink: {
    fontWeight: "600",
  },
});
