/**
 * IngredientImageAvatar Component
 *
 * Displays ingredient images in a circular avatar format.
 * Shows TheMealDB images or falls back to emoji.
 *
 * @module components/recipe/IngredientImageAvatar
 */

import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing } from "@/theme";

interface IngredientImageAvatarProps {
  /** Image URL from TheMealDB or null */
  imageUrl?: string | null;
  /** Fallback emoji if no image (default: 🍽️) */
  fallbackEmoji?: string;
  /** Whether the ingredient is checked */
  isChecked?: boolean;
  /** Callback when avatar is pressed */
  onPress?: () => void;
  /** Size of the avatar (default: 48) */
  size?: number;
}

export function IngredientImageAvatar({
  imageUrl,
  fallbackEmoji = "🍽️",
  isChecked = false,
  onPress,
  size = 48,
}: IngredientImageAvatarProps) {
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const imageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, containerStyle]}
      activeOpacity={0.7}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, imageStyle]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.emojiContainer, containerStyle]}>
          <Text style={styles.emoji}>{fallbackEmoji}</Text>
        </View>
      )}

      {isChecked && (
        <View style={styles.checkmarkOverlay}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  image: {
    backgroundColor: colors.white,
  },
  emojiContainer: {
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 24,
    textAlign: "center",
  },
  checkmarkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(76, 175, 80, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
});
