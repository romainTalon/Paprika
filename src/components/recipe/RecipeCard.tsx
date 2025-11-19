/**
 * Recipe Card Component
 *
 * Reusable card component for displaying recipe in lists.
 * Shows image, title, metadata, and action buttons.
 *
 * @module components/recipe/RecipeCard
 */

import React from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing, shadows, fontSizes } from "@/theme";
import type { Recipe } from "@/hooks/useRecipes";

interface RecipeCardProps {
  /** Recipe data */
  recipe: Recipe;
  /** Callback when card is pressed */
  onPress: () => void;
  /** Callback to toggle favorite status */
  onToggleFavorite: () => void;
  /** Callback when edit button is pressed */
  onEdit: () => void;
  /** Callback when delete button is pressed */
  onDelete: () => void;
}

export default function RecipeCard({
  recipe,
  onPress,
  onToggleFavorite,
  onEdit,
  onDelete,
}: RecipeCardProps) {
  const handleDeletePress = () => {
    Alert.alert(
      "Supprimer la recette",
      `Êtes-vous sûr de vouloir supprimer "${recipe.title}" ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          onPress: onDelete,
          style: "destructive",
        },
      ]
    );
  };

  // Calculate total time
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Recipe: ${recipe.title}`}
      accessibilityRole="button"
    >
      {/* Cover Image */}
      {recipe.coverImageUrl ? (
        <Image
          source={{ uri: recipe.coverImageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.placeholderIcon}>🍽️</Text>
        </View>
      )}

      {/* Favorite Badge */}
      {recipe.isFavorite && (
        <View style={styles.favoriteBadge}>
          <Text style={styles.favoriteIcon}>❤️</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.cardContent}>
        <Text variant="h3" numberOfLines={2} style={styles.cardTitle}>
          {recipe.title}
        </Text>

        {recipe.description && (
          <Text
            variant="bodySmall"
            color="neutral"
            numberOfLines={2}
            style={styles.cardDescription}
          >
            {recipe.description}
          </Text>
        )}

        {/* Metadata */}
        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Text variant="caption" color="neutral">
              👥 {recipe.servings} pers
            </Text>
          </View>

          {recipe.prepTime && (
            <View style={styles.metadataItem}>
              <Text variant="caption" color="neutral">
                ⏱️ {recipe.prepTime} min
              </Text>
            </View>
          )}

          {recipe.cookTime && (
            <View style={styles.metadataItem}>
              <Text variant="caption" color="neutral">
                🔥 {recipe.cookTime} min
              </Text>
            </View>
          )}

          {totalTime > 0 && (
            <View style={styles.metadataItem}>
              <Text variant="caption" color="neutral">
                Total: {totalTime} min
              </Text>
            </View>
          )}
        </View>

        {/* Difficulty Badge */}
        {recipe.difficulty && (
          <View style={styles.difficultyContainer}>
            <View
              style={[
                styles.difficultyBadge,
                recipe.difficulty === "easy" && styles.difficultyEasy,
                recipe.difficulty === "medium" && styles.difficultyMedium,
                recipe.difficulty === "hard" && styles.difficultyHard,
              ]}
            >
              <Text variant="caption" style={styles.difficultyText}>
                {recipe.difficulty === "easy" && "Facile"}
                {recipe.difficulty === "medium" && "Moyen"}
                {recipe.difficulty === "hard" && "Difficile"}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            style={styles.actionButton}
            accessibilityLabel={
              recipe.isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Text variant="bodySmall" color={recipe.isFavorite ? "error" : "neutral"}>
              {recipe.isFavorite ? "❤️" : "🤍"} Favori
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={styles.actionButton}
            accessibilityLabel="Edit recipe"
          >
            <Text variant="bodySmall" color="primary">
              ✏️ Modifier
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDeletePress();
            }}
            style={styles.actionButton}
            accessibilityLabel="Delete recipe"
          >
            <Text variant="bodySmall" color="error">
              🗑️ Supprimer
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadows.md,
  },

  cardImage: {
    width: "100%",
    height: 180,
    backgroundColor: colors.gray[200],
  },

  cardImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.cream.DEFAULT,
  },

  placeholderIcon: {
    fontSize: 64,
    lineHeight: 72, // Line height plus grande pour éviter le clip vertical
  },

  favoriteBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },

  favoriteIcon: {
    fontSize: 24,
  },

  cardContent: {
    padding: spacing.md,
  },

  cardTitle: {
    marginBottom: spacing.xs,
    color: colors.warm.brown,
  },

  cardDescription: {
    marginBottom: spacing.sm,
    lineHeight: 20,
  },

  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },

  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  difficultyContainer: {
    marginBottom: spacing.sm,
  },

  difficultyBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.xs,
  },

  difficultyEasy: {
    backgroundColor: colors.success + "20", // 20% opacity
  },

  difficultyMedium: {
    backgroundColor: colors.warning + "20",
  },

  difficultyHard: {
    backgroundColor: colors.error + "20",
  },

  difficultyText: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
  },

  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },

  actionButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
});
