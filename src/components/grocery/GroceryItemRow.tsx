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
import { colors, spacing, fontSizes } from "@/theme";
import type { GroceryItem } from "@/types";

interface GroceryItemRowProps {
  item: GroceryItem;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}

export function GroceryItemRow({ item, onToggle, onDelete }: GroceryItemRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleToggle = useCallback(() => {
    onToggle(item.id);
  }, [item.id, onToggle]);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(item.id);
  }, [item.id, onDelete]);

  // Format quantity display
  const quantityDisplay = (() => {
    if (!item.quantity && !item.unit) return null;

    const qty = item.quantity
      ? Number(item.quantity).toFixed(1).replace(/\.0$/, "")
      : "";
    const unit = item.unit || "";

    return `${qty} ${unit}`.trim();
  })();

  // Render right action (delete button)
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.deleteAction,
          { transform: [{ translateX }] },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Supprimer l'article"
        >
          <Text style={styles.deleteText}>Supprimer</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      <TouchableOpacity
        style={styles.container}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.isChecked }}
        accessibilityLabel={`${item.name}${quantityDisplay ? `, ${quantityDisplay}` : ""}`}
      >
        {/* Checkbox */}
        <View style={[styles.checkbox, item.isChecked && styles.checkboxChecked]}>
          {item.isChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>

        {/* Item Details */}
        <View style={styles.content}>
          <Text
            variant="body"
            style={[styles.name, item.isChecked && styles.nameChecked]}
            numberOfLines={2}
          >
            {item.name}
          </Text>

          {quantityDisplay && (
            <Text
              variant="bodySmall"
              style={[styles.quantity, item.isChecked && styles.quantityChecked]}
            >
              {quantityDisplay}
            </Text>
          )}
        </View>
      </TouchableOpacity>
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
    gap: spacing.xs,
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

  // Delete Action
  deleteAction: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.error,
  },

  deleteButton: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteText: {
    color: colors.white,
    fontSize: fontSizes.sm,
    fontWeight: "600",
  },
});
