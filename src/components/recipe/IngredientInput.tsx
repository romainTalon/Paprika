/**
 * Ingredient Input Component
 *
 * Input row for entering recipe ingredient details.
 * Includes name, quantity, unit, and remove button.
 * Supports fractions for quantities (e.g., "1/2", "3/4", "1 1/2")
 *
 * @module components/recipe/IngredientInput
 */

import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing, fontSizes } from "@/theme";
import type { RecipeIngredient } from "@/types/database";
import { parseFraction, formatFraction } from "@/utils/fractionParser";

interface IngredientInputProps {
  /** Ingredient data */
  ingredient: RecipeIngredient;
  /** Callback when ingredient changes */
  onChange: (ingredient: RecipeIngredient) => void;
  /** Callback when remove button is pressed */
  onRemove: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Show remove button (hide if only one ingredient) */
  showRemove?: boolean;
}

export default function IngredientInput({
  ingredient,
  onChange,
  onRemove,
  disabled = false,
  showRemove = true,
}: IngredientInputProps) {
  // Local state for quantity input (supports fractions)
  const [quantityText, setQuantityText] = useState("");

  // Initialize quantity text from ingredient
  useEffect(() => {
    if (ingredient.quantity === 0) {
      setQuantityText("");
    } else {
      setQuantityText(String(ingredient.quantity));
    }
  }, [ingredient.quantity]);

  // Handle quantity change with fraction parsing
  const handleQuantityChange = (text: string) => {
    setQuantityText(text);

    if (text === "") {
      onChange({ ...ingredient, quantity: 0 });
      return;
    }

    const parsed = parseFraction(text);
    if (parsed !== null) {
      onChange({ ...ingredient, quantity: parsed });
    }
  };

  return (
    <View style={styles.container}>
      {/* Name Input */}
      <TextInput
        style={[styles.input, styles.nameInput]}
        value={ingredient.name}
        onChangeText={(text) =>
          onChange({ ...ingredient, name: text })
        }
        placeholder="Ingrédient"
        placeholderTextColor={colors.gray[400]}
        editable={!disabled}
      />

      {/* Quantity Input with Fraction Support */}
      <TextInput
        style={[styles.input, styles.quantityInput]}
        value={quantityText}
        onChangeText={handleQuantityChange}
        placeholder="Qté"
        placeholderTextColor={colors.gray[400]}
        keyboardType="default"
        editable={!disabled}
      />

      {/* Unit Input (Optional) */}
      <TextInput
        style={[styles.input, styles.unitInput]}
        value={ingredient.unit || ""}
        onChangeText={(text) =>
          onChange({ ...ingredient, unit: text || undefined })
        }
        placeholder="Unité (opt.)"
        placeholderTextColor={colors.gray[400]}
        editable={!disabled}
      />

      {/* Remove Button */}
      {showRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          disabled={disabled}
          accessibilityLabel="Remove ingredient"
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
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },

  input: {
    backgroundColor: colors.cream.DEFAULT,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: spacing.xs,
    padding: spacing.sm,
    fontSize: fontSizes.base,
    color: colors.warm.brown,
  },

  nameInput: {
    flex: 2,
  },

  quantityInput: {
    flex: 1,
    minWidth: 70,
  },

  unitInput: {
    flex: 1,
    minWidth: 80,
  },

  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error + "20",
    justifyContent: "center",
    alignItems: "center",
  },

  removeIcon: {
    fontSize: 20,
    color: colors.error,
    fontWeight: "bold",
  },
});
