/**
 * Recipe Detail Screen
 *
 * Full recipe display with ingredients, steps, and nutrition.
 */

import { useLocalSearchParams } from "expo-router";
import { PlaceholderScreen } from "@/components/ui";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <PlaceholderScreen
      title="Détail de la Recette"
      description={`Affichage complet de la recette ${id} (ingrédients, étapes, nutrition)`}
      icon="🍳"
    />
  );
}
