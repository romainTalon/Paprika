/**
 * Forgot Password Screen
 *
 * Request password reset email
 */

import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { AuthInput, AuthFormContainer } from "@/components/auth";
import { Text, Button } from "@/components/ui";
import { spacing } from "@/theme";

// Validation schema
const resetSchema = z.object({
  email: z.string().email("Email invalide"),
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof ResetForm, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async () => {
    try {
      // Validate form
      const result = resetSchema.safeParse({ email });

      if (!result.success) {
        const formattedErrors: Partial<Record<keyof ResetForm, string>> = {};
        result.error.issues.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as keyof ResetForm] = err.message;
          }
        });
        setErrors(formattedErrors);
        return;
      }

      setErrors({});
      setLoading(true);

      await requestPasswordReset({ email });

      // Show success message
      Alert.alert(
        "Email envoyé !",
        "Un lien de réinitialisation a été envoyé à votre adresse email. Vérifiez votre boîte de réception.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Reset request error:", error);
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Une erreur s'est produite. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormContainer>
      <View style={styles.header}>
        <Text style={styles.emoji}>🔑</Text>
        <Text variant="h1" color="primary" style={styles.title}>
          Mot de passe oublié ?
        </Text>
        <Text variant="body" color="neutral" style={styles.subtitle}>
          Entrez votre email pour recevoir un lien de réinitialisation
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

        <Button
          variant="primary"
          size="lg"
          onPress={handleResetRequest}
          loading={loading}
          style={styles.resetButton}
        >
          Envoyer le lien
        </Button>

        <Button
          variant="outline"
          size="lg"
          onPress={() => router.back()}
          disabled={loading}
        >
          Retour à la connexion
        </Button>
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
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },

  form: {
    marginTop: spacing.md,
  },

  resetButton: {
    marginBottom: spacing.md,
  },
});
