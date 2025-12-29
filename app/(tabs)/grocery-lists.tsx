/**
 * Grocery Lists Tab Screen
 *
 * Shows all grocery lists for the user with stats.
 * Supports creating, editing, archiving, and deleting lists.
 * Premium users can create unlimited lists (free users limited to 1 active list).
 */

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router } from "expo-router";
import { Text, Button } from "@/components/ui";
import {
  GroceryListCard,
  CreateListModal,
} from "@/components/grocery";
import { colors, spacing, shadows } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import {
  useGroceryListsWithStats,
  useUpdateGroceryList,
  useDeleteGroceryList,
} from "@/hooks/useGroceryList";
import type { GroceryList } from "@/types";

export default function GroceryListsScreen() {
  const { user } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingList, setEditingList] = useState<GroceryList | null>(null);

  // Fetch all lists WITH stats (optimized query)
  const {
    data: lists,
    isLoading,
    error,
    refetch,
  } = useGroceryListsWithStats(user?.id, false);

  // Mutations
  const updateList = useUpdateGroceryList();
  const deleteList = useDeleteGroceryList();

  // Freemium check
  const isPremium = user?.isPremium ?? false;
  const activeListsCount =
    lists?.filter((l) => l.isActive && !l.isArchived).length ?? 0;
  const canCreateList = isPremium || activeListsCount < 1;

  // Handlers
  const handleCreatePress = useCallback(() => {
    if (!canCreateList) {
      Alert.alert(
        "Limite atteinte",
        "Vous avez atteint la limite de listes actives (1/1). Passez à Premium pour créer plusieurs listes ou archivez votre liste actuelle.",
        [{ text: "OK" }]
      );
      return;
    }

    setEditingList(null);
    setIsModalVisible(true);
  }, [canCreateList]);

  const handleEditPress = useCallback((list: GroceryList) => {
    setEditingList(list);
    setIsModalVisible(true);
  }, []);

  const handleDeletePress = useCallback(
    (list: GroceryList) => {
      Alert.alert(
        "Supprimer la liste",
        `Voulez-vous vraiment supprimer "${list.name}" ? Cette action est irréversible.`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              if (!user?.id) return;

              try {
                await deleteList.mutateAsync({ listId: list.id, userId: user.id });
              } catch (error) {
                Alert.alert(
                  "Erreur",
                  error instanceof Error
                    ? error.message
                    : "Impossible de supprimer la liste"
                );
              }
            },
          },
        ]
      );
    },
    [user?.id, deleteList]
  );

  const handleListPress = useCallback((list: GroceryList) => {
    router.push(`/grocery-lists/${list.id}`);
  }, []);

  const handleModalSuccess = useCallback(() => {
    setIsModalVisible(false);
    setEditingList(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text variant="body" color="neutral" style={styles.loadingText}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
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
          <Button variant="primary" onPress={() => refetch()}>
            Réessayer
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (!lists || lists.length === 0) {
    return (
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
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
          <Button variant="primary" onPress={handleCreatePress}>
            Créer une liste
          </Button>
        </View>

        <CreateListModal
          visible={isModalVisible}
          userId={user?.id || null}
          onClose={() => setIsModalVisible(false)}
          onSuccess={handleModalSuccess}
        />
      </SafeAreaView>
    );
  }

  // Has lists - show cards
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h1">Mes Listes</Text>
        <Text variant="bodySmall" color="neutral">
          {lists.length} liste{lists.length > 1 ? "s" : ""}
        </Text>
      </View>

      {/* Lists Grid */}
      <GestureHandlerRootView style={{ flex: 1, paddingHorizontal: 0 }}>
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GroceryListCard
              list={item}
              itemsCount={item.itemCount}
              checkedCount={item.checkedCount}
              onPress={() => handleListPress(item)}
              onEdit={() => handleEditPress(item)}
              onDelete={() => handleDeletePress(item)}
            />
          )}
          style={{ paddingHorizontal: 0 }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </GestureHandlerRootView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, !canCreateList && styles.fabDisabled]}
        onPress={handleCreatePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Créer une nouvelle liste"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      <CreateListModal
        visible={isModalVisible}
        list={editingList}
        userId={user?.id || null}
        onClose={() => setIsModalVisible(false)}
        onSuccess={handleModalSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream.DEFAULT,
    paddingHorizontal: 0,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.cream.DEFAULT,
    paddingHorizontal: 0,
  },

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

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  // List Content
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: 100, // Space for FAB
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: spacing["2xl"],
    right: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
    elevation: 8,
  },

  fabDisabled: {
    backgroundColor: colors.gray[400],
  },

  fabIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: "bold",
    lineHeight: 36,
  },
});
