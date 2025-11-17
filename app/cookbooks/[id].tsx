/**
 * Cookbook Detail Screen
 *
 * Shows all recipes from a specific cookbook.
 */

import { useLocalSearchParams } from "expo-router";
import { PlaceholderScreen } from "@/components/ui";

export default function CookbookDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <PlaceholderScreen
      title="Recettes du Livre"
      description={`Affichage des recettes du cookbook ${id}`}
      icon="📖"
    />
  );
}
