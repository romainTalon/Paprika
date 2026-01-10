/**
 * TagPicker Component
 *
 * Multi-select tag picker with horizontal category tabs.
 * Allows users to select tags across different categories.
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing, fontSizes } from "@/theme";
import {
  RECIPE_TAG_CATEGORIES,
  RecipeTagCategoryId,
} from "@/constants/recipeTags";

interface TagPickerProps {
  /** Currently selected tags */
  selectedTags: string[];
  /** Callback when tags change */
  onTagsChange: (tags: string[]) => void;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Show selected count */
  showCount?: boolean;
}

export function TagPicker({
  selectedTags,
  onTagsChange,
  maxTags = 10,
  showCount = false,
}: TagPickerProps) {
  const [activeTab, setActiveTab] = useState<RecipeTagCategoryId>("cuisine");

  // Get active category
  const activeCategory = useMemo(
    () => RECIPE_TAG_CATEGORIES.find((c) => c.id === activeTab),
    [activeTab]
  );

  // Count selected tags in each category
  const getSelectedCountInCategory = useCallback(
    (categoryId: string) => {
      const category = RECIPE_TAG_CATEGORIES.find((c) => c.id === categoryId);
      if (!category) return 0;
      return selectedTags.filter((tag) =>
        (category.tags as readonly string[]).includes(tag)
      ).length;
    },
    [selectedTags]
  );

  // Handle tag toggle
  const handleToggleTag = useCallback(
    (tag: string) => {
      if (selectedTags.includes(tag)) {
        // Remove tag
        onTagsChange(selectedTags.filter((t) => t !== tag));
      } else {
        // Add tag (if not at max)
        if (selectedTags.length >= maxTags) {
          Alert.alert(
            "Limite atteinte",
            `Vous pouvez sélectionner maximum ${maxTags} tags. Retirez-en un pour en ajouter un autre.`
          );
          return;
        }
        onTagsChange([...selectedTags, tag]);
      }
    },
    [selectedTags, onTagsChange, maxTags]
  );

  // Render category tab
  const renderTab = useCallback(
    (category: (typeof RECIPE_TAG_CATEGORIES)[number]) => {
      const isActive = activeTab === category.id;
      const selectedCount = getSelectedCountInCategory(category.id);

      return (
        <TouchableOpacity
          key={category.id}
          style={[styles.tab, isActive && styles.tabActive]}
          onPress={() => setActiveTab(category.id)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ selected: isActive }}
          accessibilityLabel={`${category.emoji} ${category.label}`}
        >
          <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
            {category.emoji} {category.label}
          </Text>
          {selectedCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{selectedCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [activeTab, getSelectedCountInCategory]
  );

  // Render tag item
  const renderTagItem = useCallback(
    ({ item: tag }: { item: string }) => {
      const isSelected = selectedTags.includes(tag);

      return (
        <TouchableOpacity
          style={[styles.tagItem, isSelected && styles.tagItemSelected]}
          onPress={() => handleToggleTag(tag)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          accessibilityLabel={tag}
        >
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
          <Text
            style={[styles.tagText, isSelected && styles.tagTextSelected]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {tag}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedTags, handleToggleTag]
  );

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {RECIPE_TAG_CATEGORIES.map(renderTab)}
      </ScrollView>

      {/* Warning Banner */}
      {selectedTags.length >= maxTags && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Maximum de {maxTags} tags atteint
          </Text>
        </View>
      )}

      {/* Tags Grid */}
      {activeCategory && (
        <FlatList
          data={activeCategory.tags as unknown as string[]}
          renderItem={renderTagItem}
          keyExtractor={(item) => item}
          numColumns={2}
          columnWrapperStyle={styles.tagRow}
          contentContainerStyle={styles.tagsContainer}
          scrollEnabled={false}
        />
      )}

      {/* Selected Count */}
      {showCount && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {selectedTags.length}/{maxTags} tags sélectionnés
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  tabsContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.xl,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary.DEFAULT,
  },
  tabText: {
    fontSize: fontSizes.sm,
    color: colors.warm.gray,
    fontWeight: "500",
  },
  tabTextActive: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  tabBadge: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  tabBadgeText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "bold",
  },
  warningBanner: {
    backgroundColor: "#FEF3C7",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  warningText: {
    fontSize: fontSizes.sm,
    color: "#92400E",
    textAlign: "center",
  },
  tagsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  tagRow: {
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  tagItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs / 2,
    borderRadius: spacing.md,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: spacing.xs,
  },
  tagItemSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary.DEFAULT,
    borderWidth: 2,
  },
  checkmark: {
    fontSize: 16,
    color: colors.primary.DEFAULT,
    fontWeight: "bold",
  },
  tagText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.warm.gray,
  },
  tagTextSelected: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  countContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  countText: {
    fontSize: fontSizes.sm,
    color: colors.warm.gray,
    textAlign: "center",
  },
});
