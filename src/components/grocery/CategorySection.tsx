/**
 * CategorySection Component
 *
 * Displays a category header with items grouped under it.
 * Shows emoji, category name, and item count.
 * Items are sorted with unchecked items first.
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { GroceryItemRow } from "./GroceryItemRow";
import { colors, spacing, fontSizes } from "@/theme";
import type { GroceryItem } from "@/types";

interface CategorySectionProps {
  categoryLabel: string; // Full label with emoji: "🥬 Légumes"
  items: GroceryItem[];
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onEditItem: (item: GroceryItem) => void;
}

export function CategorySection({
  categoryLabel,
  items,
  onToggleItem,
  onDeleteItem,
  onEditItem,
}: CategorySectionProps) {
  // Sort items: unchecked first, then checked
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.isChecked === b.isChecked) return 0;
      return a.isChecked ? 1 : -1;
    });
  }, [items]);

  // Count unchecked items
  const uncheckedCount = useMemo(() => {
    return items.filter((item) => !item.isChecked).length;
  }, [items]);

  const totalCount = items.length;

  // Parse emoji and label from full label "🥬 Légumes"
  const emojiMatch = categoryLabel.match(/^(\p{Emoji})\s+(.+)$/u);
  const emoji = emojiMatch ? emojiMatch[1] : "🛒";
  const label = emojiMatch ? emojiMatch[2] : categoryLabel;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text variant="h4" style={styles.title}>
          {label}
        </Text>
        <Text variant="bodySmall" style={styles.count}>
          {uncheckedCount}/{totalCount}
        </Text>
      </View>

      {/* Items */}
      <View style={styles.items}>
        {sortedItems.map((item) => (
          <GroceryItemRow
            key={item.id}
            item={item}
            onToggle={onToggleItem}
            onDelete={onDeleteItem}
            onEdit={onEditItem}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cream[50],
    gap: spacing.sm,
  },

  emoji: {
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg + 8,
  },

  title: {
    flex: 1,
    color: colors.warm.brown,
  },

  count: {
    color: colors.warm.gray,
  },

  items: {
    backgroundColor: colors.white,
  },
});
