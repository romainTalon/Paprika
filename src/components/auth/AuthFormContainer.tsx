/**
 * Auth Form Container
 *
 * Wrapper for authentication forms with keyboard handling
 */

import React, { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Container } from "@/components/ui";
import { spacing } from "@/theme";

interface AuthFormContainerProps {
  children: ReactNode;
  useSafeArea?: boolean;
}

export function AuthFormContainer({ children, useSafeArea = true }: AuthFormContainerProps) {
  return (
    <Container useSafeArea={useSafeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: spacing["2xl"], // Plus d'espace vertical pour éviter le crop
    paddingTop: spacing["3xl"], // Espace supplémentaire en haut pour l'emoji
  },

  formContainer: {
    paddingHorizontal: spacing.lg,
  },
});
