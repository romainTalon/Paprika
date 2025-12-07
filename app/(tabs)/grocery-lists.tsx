/**
 * Grocery Lists Tab Screen
 *
 * Main screen for managing grocery lists.
 * Shows active list and allows navigation to detail view.
 * Supports creating new lists (with freemium limit).
 */

import React, { useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, Href } from "expo-router";
import { Text, Button, Container } from "@/components/ui";
import { colors, spacing, shadows, fontSizes } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import {
  useActiveGroceryList,
  useGroceryListItems,
  useCreateGroceryList,
} from "@/hooks/useGroceryList";

export default function GroceryListsScreen() {
  const { user } = useAuth();

  // Fetch active list
  const {
    data: activeList,
    isLoading: isLoadingList,
    error: listError,
    refetch: refetchList,
  } = useActiveGroceryList(user?.id);

  // Fetch items count for the active list
  const { data: items } = useGroceryListItems(activeList?.id);

  // Create list mutation
  const createList = useCreateGroceryList();

  // Stats
  const stats = useMemo(() => {
    if (!items) return { total: 0, checked: 0 };
    return {
      total: items.length,
      checked: items.filter((item) => item.isChecked).length,
    };
  }, [items]);

  // Handlers
  const handleOpenList = useCallback(() => {
    if (activeList) {
      router.push(`/grocery-lists/${activeList.id}` as Href);
    }
  }, [activeList]);

  const handleCreateList = useCallback(async () => {
    if (!user?.id) return;

    try {
      const list = await createList.mutateAsync({
        userId: user.id,
        name: "Ma Liste",
      });

      // Navigate to the new list
      router.push(`/grocery-lists/${list.id}` as Href);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de créer la liste";

      // Check for freemium limit error
      if (message.includes("limit reached")) {
        Alert.alert(
          "Limite atteinte",
          "Vous avez atteint la limite de listes actives (1). Passez à Premium pour des listes illimitées ou archivez votre liste actuelle.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Erreur", message);
      }
    }
  }, [user?.id, createList]);

  // Loading state
  if (isLoadingList) {
    return (
      <Container>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text variant="body" color="neutral" style={styles.loadingText}>
            Chargement...
          </Text>
        </View>
      </Container>
    );
  }

  // Error state
  if (listError) {
    return (
      <Container>
        <View style={styles.centered}>
          <Text variant="h1" style={styles.errorEmoji}>
            😕
          </Text>
          <Text variant="h3" style={styles.errorTitle}>
            Erreur
          </Text>
          <Text variant="body" color="neutral" style={styles.errorMessage}>
            Impossible de charger vos listes
          </Text>
          <Button variant="primary" onPress={() => refetchList()}>
            Réessayer
          </Button>
        </View>
      </Container>
    );
  }

  // No active list - show empty state
  if (!activeList) {
    return (
      <Container>
        <View style={styles.emptyContainer}>
          <Text variant="h1" style={styles.emptyEmoji}>
            🛒
          </Text>
          <Text variant="h3" style={styles.emptyTitle}>
            Aucune liste
          </Text>
          <Text variant="body" color="neutral" style={styles.emptyMessage}>
            Créez une liste de courses pour commencer à organiser vos achats
          </Text>
          <Button
            variant="primary"
            onPress={handleCreateList}
            loading={createList.isPending}
          >
            Créer une liste
          </Button>
        </View>
      </Container>
    );
  }

  // Has active list - show card
  return (
    <Container>

      <View style={styles.content}>
        {/* Active List Card */}
        <TouchableOpacity
          style={styles.listCard}
          onPress={handleOpenList}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${activeList.name}, ${stats.total} articles`}
        >
          <View style={styles.listCardHeader}>
            <Text style={styles.listIcon}>🛒</Text>
            <View style={styles.listInfo}>
              <Text variant="h3" style={styles.listName}>
                {activeList.name}
              </Text>
              <Text variant="bodySmall" color="neutral">
                {stats.total === 0
                  ? "Liste vide"
                  : stats.total === 1
                  ? "1 article"
                  : `${stats.total} articles`}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>

          {/* Progress bar */}
          {stats.total > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(stats.checked / stats.total) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text variant="bodySmall" color="neutral" style={styles.tipText}>
            Astuce : Exportez les ingrédients d'une recette directement vers
            votre liste de courses depuis la fiche recette.
          </Text>
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  // Centered states
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },

  loadingText: {
    marginTop: spacing.md,
  },

  // Error
  errorEmoji: {
    fontSize: 64,
    lineHeight: 72,
  },

  errorTitle: {
    color: colors.warm.brown,
  },

  errorMessage: {
    textAlign: "center",
    marginBottom: spacing.md,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },

  emptyEmoji: {
    fontSize: 64,
    lineHeight: 72,
  },

  emptyTitle: {
    color: colors.warm.brown,
  },

  emptyMessage: {
    textAlign: "center",
    marginBottom: spacing.md,
    maxWidth: 280,
  },

  // Content
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },

  // List Card
  listCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.md,
    padding: spacing.lg,
    ...shadows.md,
  },

  listCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  listIcon: {
    fontSize: 32,
    lineHeight: 40,
  },

  listInfo: {
    flex: 1,
    gap: spacing.xs,
  },

  listName: {
    color: colors.warm.brown,
  },

  chevron: {
    fontSize: 24,
    color: colors.gray[400],
    fontWeight: "300",
  },

  progressContainer: {
    marginTop: spacing.md,
  },

  progressBackground: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 3,
  },

  // Tip Card
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.cream[50],
    borderRadius: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },

  tipEmoji: {
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg + 8,
  },

  tipText: {
    flex: 1,
  },
});
