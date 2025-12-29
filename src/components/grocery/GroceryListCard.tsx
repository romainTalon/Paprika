/**
 * GroceryListCard Component
 *
 * Card displaying a grocery list with stats (item count, checked count).
 * Swipe left to reveal edit and delete actions.
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Text } from "@/components/ui";
import { colors, spacing, shadows } from "@/theme";
import type { GroceryList } from "@/types";

interface GroceryListCardProps {
  list: GroceryList;
  itemsCount: number;
  checkedCount: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function GroceryListCard({
  list,
  itemsCount,
  checkedCount,
  onPress,
  onEdit,
  onDelete,
}: GroceryListCardProps) {
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="Modifier la liste"
        >
          <Text style={styles.actionText}>Modifier</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Supprimer la liste"
        >
          <Text style={styles.actionText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${list.name}, ${itemsCount} articles`}
      >
        <View style={styles.cardContent}>
          {/* List Info */}
          <View style={styles.listInfo}>
            <Text variant="h3" style={styles.listName}>
              {list.name}
            </Text>
            <Text variant="bodySmall" color="neutral">
              {itemsCount === 0
                ? "Aucun article"
                : itemsCount === 1
                ? "1 article"
                : `${itemsCount} articles`}
            </Text>
          </View>

          {/* Chevron */}
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  listInfo: {
    flex: 1,
  },

  listName: {
    color: colors.warm.brown,
    marginBottom: spacing.xs / 2,
  },

  chevron: {
    fontSize: 28,
    color: colors.gray[400],
    fontWeight: "300",
    lineHeight: 32,
  },

  // Swipe Actions
  actionsContainer: {
    flexDirection: "row",
    width: 160,
  },

  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },

  editButton: {
    backgroundColor: colors.primary.DEFAULT,
  },

  deleteButton: {
    backgroundColor: colors.error,
  },

  actionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
});
