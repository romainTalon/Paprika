/**
 * GroceryItemRow Component
 *
 * Swipeable row for displaying a grocery item.
 * Includes checkbox, name, quantity/unit, and swipe-to-delete action.
 */

import React, { useCallback, useRef } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Text } from "@/components/ui";
import { IngredientImageAvatar } from "@/components/recipe/IngredientImageAvatar";
import { colors, spacing, fontSizes } from "@/theme";
import type { GroceryItem } from "@/types";

interface GroceryItemRowProps {
  item: GroceryItem;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onEdit: (item: GroceryItem) => void;
}

/**
 * Extract emoji from category string
 * Categories are formatted as "🥬 Légumes", extract just the emoji
 */
function getCategoryEmoji(category?: string | null): string {
  if (!category) return "🛒";
  const match = category.match(/^(\p{Emoji})/u);
  return match ? match[1] : "🛒";
}

export function GroceryItemRow({ item, onToggle, onDelete, onEdit }: GroceryItemRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleToggle = useCallback(() => {
    onToggle(item.id);
  }, [item.id, onToggle]);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(item.id);
  }, [item.id, onDelete]);

  const handleEdit = useCallback(() => {
    swipeableRef.current?.close();
    onEdit(item);
  }, [item, onEdit]);

  // Format quantity display
  const quantityDisplay = (() => {
    if (!item.quantity && !item.unit) return null;

    const qty = item.quantity
      ? Number(item.quantity).toFixed(1).replace(/\.0$/, "")
      : "";
    const unit = item.unit || "";

    return `${qty} ${unit}`.trim();
  })();

  // Render right actions (edit and delete buttons)
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-160, 0],
      outputRange: [0, 160],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.actionsContainer,
          { transform: [{ translateX }] },
        ]}
      >
        {/* Edit Button */}
        <TouchableOpacity
          style={styles.editAction}
          onPress={handleEdit}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Modifier l'article"
        >
          <Text style={styles.actionText}>Modifier</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={handleDelete}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Supprimer l'article"
        >
          <Text style={styles.actionText}>Supprimer</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={80}
      overshootRight={false}
    >
      <View style={styles.container}>
        {/* Ingredient Image Avatar */}
        <IngredientImageAvatar
          imageUrl={item.imageUrl}
          fallbackEmoji={getCategoryEmoji(item.category)}
          isChecked={item.isChecked}
          onPress={handleToggle}
          size={48}
        />

        {/* Item Details */}
        <View style={styles.content}>
          <Text
            variant="body"
            style={[styles.name, item.isChecked && styles.nameChecked]}
            numberOfLines={1}
          >
            {item.name}
            {quantityDisplay && (
              <Text
                variant="bodySmall"
                style={[styles.quantity, item.isChecked && styles.quantityChecked]}
              >
                {" "}· {quantityDisplay}
              </Text>
            )}
          </Text>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  // Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: spacing.xs,
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },

  checkboxChecked: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },

  checkmark: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.white,
    lineHeight: 18,
  },

  // Content
  content: {
    flex: 1,
  },

  name: {
    color: colors.warm.brown,
  },

  nameChecked: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },

  quantity: {
    color: colors.warm.gray,
  },

  quantityChecked: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },

  // Swipe Actions
  actionsContainer: {
    flexDirection: "row",
    width: 160,
  },

  editAction: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary.DEFAULT,
  },

  deleteAction: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.error,
  },

  actionText: {
    color: colors.white,
    fontSize: fontSizes.sm,
    fontWeight: "600",
  },
});
