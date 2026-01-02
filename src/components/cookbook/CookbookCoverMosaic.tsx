/**
 * CookbookCoverMosaic Component
 *
 * Displays a mosaic of recipe images from a cookbook.
 * If no recipes with images, shows a placeholder.
 *
 * Layout: 1 large image (left 60%) + 3 small images (right 40%, stacked)
 */

import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing } from "@/theme";
import type { Recipe } from "@/hooks/useRecipes";

interface CookbookCoverMosaicProps {
  recipes: Recipe[] | undefined;
  isLoading: boolean;
}

export function CookbookCoverMosaic({ recipes, isLoading }: CookbookCoverMosaicProps) {
  // Filter recipes that have cover images
  const recipesWithImages = recipes?.filter((r) => r.coverImageUrl) || [];

  // If loading, show placeholder
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>⏳</Text>
        </View>
      </View>
    );
  }

  // If no recipes with images, show book icon
  if (recipesWithImages.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📚</Text>
        </View>
      </View>
    );
  }

  // If only 1 recipe, show it full size
  if (recipesWithImages.length === 1) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: recipesWithImages[0].coverImageUrl! }}
          style={styles.singleImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  // If 2-3 recipes, show them in a layout
  if (recipesWithImages.length <= 3) {
    return (
      <View style={styles.container}>
        <View style={styles.mosaicContainer}>
          {/* Main image (left) */}
          <Image
            source={{ uri: recipesWithImages[0].coverImageUrl! }}
            style={styles.mainImage}
            resizeMode="cover"
          />

          {/* Small images (right) */}
          <View style={styles.smallImagesContainer}>
            {recipesWithImages.slice(1).map((recipe, index) => (
              <Image
                key={recipe.id}
                source={{ uri: recipe.coverImageUrl! }}
                style={[
                  styles.smallImage,
                  index < recipesWithImages.length - 2 && styles.smallImageSpacing,
                ]}
                resizeMode="cover"
              />
            ))}
            {/* Fill empty slots with placeholder */}
            {recipesWithImages.length === 2 && (
              <>
                <View style={[styles.smallImage, styles.emptySlot, styles.smallImageSpacing]} />
                <View style={[styles.smallImage, styles.emptySlot]} />
              </>
            )}
            {recipesWithImages.length === 3 && (
              <View style={[styles.smallImage, styles.emptySlot]} />
            )}
          </View>
        </View>
      </View>
    );
  }

  // If 4+ recipes, show full mosaic (1 large + 3 small)
  return (
    <View style={styles.container}>
      <View style={styles.mosaicContainer}>
        {/* Main image (left 60%) */}
        <Image
          source={{ uri: recipesWithImages[0].coverImageUrl! }}
          style={styles.mainImage}
          resizeMode="cover"
        />

        {/* Small images (right 40%, stacked) */}
        <View style={styles.smallImagesContainer}>
          {recipesWithImages.slice(1, 4).map((recipe, index) => (
            <Image
              key={recipe.id}
              source={{ uri: recipe.coverImageUrl! }}
              style={[
                styles.smallImage,
                index < 2 && styles.smallImageSpacing,
              ]}
              resizeMode="cover"
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const IMAGE_HEIGHT = 140;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: IMAGE_HEIGHT,
    borderRadius: spacing.md,
    overflow: "hidden",
    backgroundColor: colors.gray[100],
  },

  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.cream.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderIcon: {
    fontSize: 48,
    lineHeight: 56,
  },

  singleImage: {
    width: "100%",
    height: "100%",
  },

  mosaicContainer: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
  },

  mainImage: {
    width: "60%",
    height: "100%",
  },

  smallImagesContainer: {
    flex: 1,
    marginLeft: 2,
  },

  smallImage: {
    width: "100%",
    height: (IMAGE_HEIGHT - 4) / 3, // Divide by 3 with 2px spacing
    backgroundColor: colors.gray[200],
  },

  smallImageSpacing: {
    marginBottom: 2,
  },

  emptySlot: {
    backgroundColor: colors.cream.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
  },
});
