/**
 * Cookbooks Screen
 *
 * Displays user's cookbook collection with options to create, edit, and delete.
 * Implements freemium limits (2 cookbooks max for free users).
 *
 * @module screens/CookbooksScreen
 */

import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, Button, Container } from "@/components/ui";
import { colors, spacing, shadows, fontSizes } from "@/theme";
import {
  useCookbooks,
  useDeleteCookbook,
  type Cookbook,
} from "@/hooks/useCookbooks";
import { getCurrentUserId } from "@/lib/supabase";
import CreateCookbookModal from "@/components/modals/CreateCookbookModal";

/**
 * Cookbook Card Component
 */
interface CookbookCardProps {
  cookbook: Cookbook;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CookbookCard({ cookbook, onPress, onEdit, onDelete }: CookbookCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Cookbook: ${cookbook.name}`}
      accessibilityRole="button"
    >
      {/* Cover Image */}
      {cookbook.coverImageUrl ? (
        <Image
          source={{ uri: cookbook.coverImageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.placeholderIcon}>📚</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.cardContent}>
        <Text variant="h3" numberOfLines={2} style={styles.cardTitle}>
          {cookbook.name}
        </Text>

        {cookbook.description && (
          <Text
            variant="bodySmall"
            color="neutral"
            numberOfLines={2}
            style={styles.cardDescription}
          >
            {cookbook.description}
          </Text>
        )}

        {cookbook.isDefault && (
          <View style={styles.defaultBadge}>
            <Text variant="caption" color="white">
              Par défaut
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={styles.actionButton}
            accessibilityLabel="Edit cookbook"
          >
            <Text variant="bodySmall" color="primary">
              ✏️ Modifier
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={styles.actionButton}
            accessibilityLabel="Delete cookbook"
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

/**
 * Empty State Component
 */
function EmptyState({ onCreatePress }: { onCreatePress: () => void }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📖</Text>
      <Text variant="h2" style={styles.emptyStateTitle}>
        Aucun livre de recettes
      </Text>
      <Text variant="body" color="neutral" style={styles.emptyStateText}>
        Créez votre premier livre de recettes pour organiser vos recettes
        préférées !
      </Text>
      <Button
        variant="primary"
        size="lg"
        onPress={onCreatePress}
        style={styles.emptyStateButton}
      >
        Créer mon premier livre
      </Button>
    </View>
  );
}

/**
 * Main Cookbooks Screen Component
 */
export default function CookbooksScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCookbook, setEditingCookbook] = useState<Cookbook | null>(null);

  // Fetch current user ID on mount
  React.useEffect(() => {
    getCurrentUserId().then((id) => {
      // TODO: Remove this mock userId once auth is implemented
      // For now, use a test user ID if no auth user exists
      setUserId(id || "00000000-0000-0000-0000-000000000001");
    });
  }, []);

  // Fetch cookbooks
  const { data: cookbooks, isLoading, error, refetch } = useCookbooks(userId || undefined);

  // Delete mutation
  const deleteCookbook = useDeleteCookbook();

  // Handlers
  const handleCreatePress = useCallback(() => {
    setEditingCookbook(null);
    setIsModalVisible(true);
  }, []);

  const handleEditPress = useCallback((cookbook: Cookbook) => {
    setEditingCookbook(cookbook);
    setIsModalVisible(true);
  }, []);

  const handleDeletePress = useCallback(
    (cookbook: Cookbook) => {
      Alert.alert(
        "Supprimer le livre ?",
        `Êtes-vous sûr de vouloir supprimer "${cookbook.name}" ? Toutes les recettes seront conservées mais ne seront plus dans ce livre.`,
        [
          {
            text: "Annuler",
            style: "cancel",
          },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              if (!userId) return;

              try {
                await deleteCookbook.mutateAsync({
                  cookbookId: cookbook.id,
                  userId,
                });
              } catch (error) {
                Alert.alert(
                  "Erreur",
                  error instanceof Error
                    ? error.message
                    : "Impossible de supprimer le livre"
                );
              }
            },
          },
        ]
      );
    },
    [userId, deleteCookbook]
  );

  const handleCookbookPress = useCallback((cookbook: Cookbook) => {
    // TODO: Navigate to cookbook detail screen
    console.log("Open cookbook:", cookbook.id);
  }, []);

  // Check freemium limit (2 cookbooks max for free users)
  const canCreateCookbook = cookbooks && cookbooks.length < 2; // TODO: Check premium status

  // Loading state
  if (isLoading) {
    return (
      <Container centered>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text variant="body" color="neutral" style={{ marginTop: spacing.md }}>
          Chargement...
        </Text>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container centered>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text variant="h2" style={styles.errorTitle}>
          Erreur
        </Text>
        <Text variant="body" color="neutral" style={styles.errorText}>
          {error instanceof Error ? error.message : "Une erreur s'est produite"}
        </Text>
        <Button variant="primary" onPress={() => refetch()} style={styles.retryButton}>
          Réessayer
        </Button>
      </Container>
    );
  }

  // Empty state
  if (!cookbooks || cookbooks.length === 0) {
    return (
      <Container>
        <View style={styles.header}>
          <Text variant="h1">Mes Livres</Text>
        </View>
        <EmptyState onCreatePress={handleCreatePress} />

        {/* Create/Edit Cookbook Modal */}
        <CreateCookbookModal
          visible={isModalVisible}
          cookbook={editingCookbook}
          userId={userId}
          onClose={() => setIsModalVisible(false)}
        />
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h1">Mes Livres</Text>
        <Text variant="bodySmall" color="neutral">
          {cookbooks.length} livre{cookbooks.length > 1 ? "s" : ""}
        </Text>
      </View>

      {/* Cookbooks List */}
      <FlatList
        data={cookbooks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CookbookCard
            cookbook={item}
            onPress={() => handleCookbookPress(item)}
            onEdit={() => handleEditPress(item)}
            onDelete={() => handleDeletePress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          !canCreateCookbook && styles.fabDisabled,
        ]}
        onPress={canCreateCookbook ? handleCreatePress : () => {
          Alert.alert(
            "Limite atteinte",
            "Vous avez atteint la limite de 2 livres de recettes en version gratuite. Passez à Premium pour créer des livres illimités !",
            [
              { text: "Plus tard", style: "cancel" },
              { text: "Voir Premium", onPress: () => {
                // TODO: Navigate to premium screen
                console.log("Navigate to premium");
              }},
            ]
          );
        }}
        activeOpacity={0.8}
        accessibilityLabel="Create new cookbook"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Create/Edit Cookbook Modal */}
      <CreateCookbookModal
        visible={isModalVisible}
        cookbook={editingCookbook}
        userId={userId}
        onClose={() => setIsModalVisible(false)}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },

  listContent: {
    paddingBottom: spacing.xl + 60, // Extra padding for FAB
  },

  // Card Styles
  card: {
    backgroundColor: colors.cream.DEFAULT,
    borderRadius: spacing.md,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadows.md,
  },

  cardImage: {
    width: "100%",
    height: 150,
    backgroundColor: colors.gray[200],
  },

  cardImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderIcon: {
    fontSize: 48,
  },

  cardContent: {
    padding: spacing.md,
  },

  cardTitle: {
    marginBottom: spacing.xs,
  },

  cardDescription: {
    marginBottom: spacing.sm,
  },

  defaultBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: spacing.xs,
    marginBottom: spacing.sm,
  },

  cardActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },

  actionButton: {
    paddingVertical: spacing.xs,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },

  emptyStateIcon: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },

  emptyStateTitle: {
    marginBottom: spacing.sm,
    textAlign: "center",
  },

  emptyStateText: {
    marginBottom: spacing.xl,
    textAlign: "center",
  },

  emptyStateButton: {
    minWidth: 200,
  },

  // Error State
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },

  errorTitle: {
    marginBottom: spacing.sm,
    textAlign: "center",
  },

  errorText: {
    marginBottom: spacing.xl,
    textAlign: "center",
  },

  retryButton: {
    minWidth: 150,
  },

  // Floating Action Button
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
  },

  fabDisabled: {
    backgroundColor: colors.gray[400],
  },

  fabIcon: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
    lineHeight: 36,
  },
});
