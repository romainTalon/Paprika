/**
 * Signup Screen
 *
 * User registration with email, password, and name
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
const signupSchema = z.object({
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof SignupForm, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    try {
      // Validate form
      const result = signupSchema.safeParse({
        fullName,
        email,
        password,
        confirmPassword,
      });

      if (!result.success) {
        const formattedErrors: Partial<Record<keyof SignupForm, string>> = {};
        result.error.issues.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as keyof SignupForm] = err.message;
          }
        });
        setErrors(formattedErrors);
        return;
      }

      setErrors({});
      setLoading(true);

      await signUp({ email, password, fullName });

      // Show success message
      Alert.alert(
        "Compte créé !",
        "Un email de confirmation a été envoyé à votre adresse. Vérifiez votre boîte de réception pour activer votre compte.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert(
        "Erreur d'inscription",
        error instanceof Error
          ? error.message
          : "Une erreur s'est produite lors de l'inscription."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormContainer>
      <View style={styles.header}>
        <Text style={styles.emoji}>👋</Text>
        <Text variant="h1" color="primary" style={styles.title}>
          Créer un compte
        </Text>
        <Text variant="body" color="neutral" style={styles.subtitle}>
          Rejoignez Paprika gratuitement
        </Text>
      </View>

      <View style={styles.form}>
        <AuthInput
          label="Nom complet"
          required
          value={fullName}
          onChangeText={setFullName}
          placeholder="Jean Dupont"
          autoCapitalize="words"
          autoComplete="name"
          error={errors.fullName}
        />

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
          autoComplete="password-new"
          error={errors.password}
        />

        <AuthInput
          label="Confirmer le mot de passe"
          required
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
          error={errors.confirmPassword}
        />

        <Text variant="caption" color="neutral" style={styles.terms}>
          En créant un compte, vous acceptez nos conditions d'utilisation et
          notre politique de confidentialité.
        </Text>

        <Button
          variant="primary"
          size="lg"
          onPress={handleSignup}
          loading={loading}
          style={styles.signupButton}
        >
          Créer mon compte
        </Button>

        <View style={styles.loginPrompt}>
          <Text variant="body" color="neutral">
            Déjà un compte ?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text variant="body" color="primary" style={styles.loginLink}>
              Se connecter
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

  terms: {
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 20,
  },

  signupButton: {
    marginBottom: spacing.lg,
  },

  loginPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  loginLink: {
    fontWeight: "600",
  },
});
