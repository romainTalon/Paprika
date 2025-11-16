/**
 * Auth Input Component
 *
 * Styled TextInput for authentication forms with error states
 */

import React from "react";
import { View, TextInput, TextInputProps, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing, fontSizes } from "@/theme";

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export function AuthInput({
  label,
  error,
  required,
  style,
  ...props
}: AuthInputProps) {
  return (
    <View style={styles.container}>
      <Text variant="bodySmall" style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.gray[400]}
        {...props}
      />
      {error && (
        <Text variant="caption" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },

  label: {
    marginBottom: spacing.xs,
    color: colors.warm.brown,
    fontWeight: "600",
  },

  required: {
    color: colors.error,
  },

  input: {
    backgroundColor: colors.cream.DEFAULT,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: spacing.sm,
    padding: spacing.md,
    fontSize: fontSizes.base,
    color: colors.warm.brown,
    fontFamily: "Poppins",
  },

  inputError: {
    borderColor: colors.error,
  },

  errorText: {
    color: colors.error,
    marginTop: spacing.xs,
  },
});
