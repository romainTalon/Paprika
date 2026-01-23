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
  /** Size of the avatar (default: 36) */
  size?: number;
  /** Background color to match parent (default: cream) */
  backgroundColor?: string;
}

export function IngredientImageAvatar({
  imageUrl,
  fallbackEmoji = "🍽️",
  isChecked = false,
  onPress,
  size = 36,
  backgroundColor = colors.cream.DEFAULT,
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
    backgroundColor,
  };

  const emojiSize = Math.max(16, Math.floor(size * 0.55));

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
        <View style={[styles.emojiContainer, containerStyle, { backgroundColor }]}>
          <Text style={[styles.emoji, { fontSize: emojiSize }]}>{fallbackEmoji}</Text>
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
    // backgroundColor set dynamically via imageStyle
  },
  emojiContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
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
