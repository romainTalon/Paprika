/**
 * Step Input Component
 *
 * Input for entering recipe step instructions.
 * Includes order badge, multiline text input, and remove button.
 *
 * @module components/recipe/StepInput
 */

import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing, fontSizes, fontWeights } from "@/theme";
import type { RecipeStep } from "@/types/database";

interface StepInputProps {
  /** Step data */
  step: RecipeStep;
  /** Callback when step changes */
  onChange: (step: RecipeStep) => void;
  /** Callback when remove button is pressed */
  onRemove: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Show remove button (hide if only one step) */
  showRemove?: boolean;
}

export default function StepInput({
  step,
  onChange,
  onRemove,
  disabled = false,
  showRemove = true,
}: StepInputProps) {
  return (
    <View style={styles.container}>
      {/* Step Number Badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{step.order}</Text>
      </View>

      {/* Instruction Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={step.instruction}
          onChangeText={(text) =>
            onChange({ ...step, instruction: text })
          }
          placeholder="Décrivez l'étape..."
          placeholderTextColor={colors.gray[400]}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!disabled}
        />
      </View>

      {/* Remove Button */}
      {showRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          disabled={disabled}
          accessibilityLabel="Remove step"
        >
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },

  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xs,
  },

  badgeText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold as any,
    color: colors.white,
  },

  inputContainer: {
    flex: 1,
  },

  input: {
    backgroundColor: colors.cream.DEFAULT,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: spacing.sm,
    padding: spacing.md,
    fontSize: fontSizes.base,
    color: colors.warm.brown,
    minHeight: 80,
    maxHeight: 150,
  },

  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error + "20",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xs,
  },

  removeIcon: {
    fontSize: 20,
    color: colors.error,
    fontWeight: "bold",
  },
});
