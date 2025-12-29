/**
 * Grocery List Detail Screen
 *
 * Displays items in a grocery list, grouped by category.
 * Supports adding items, checking items, and swipe-to-delete.
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Text, Button } from "@/components/ui";
import { BackButton, AppHeader } from "@/components/navigation";
import { CategorySection, AddItemModal, EditItemModal } from "@/components/grocery";
import { colors, spacing, shadows } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import {
  useGroceryListItems,
  useToggleGroceryItem,
  useDeleteGroceryItem,
  useClearCheckedItems,
} from "@/hooks/useGroceryList";
import { GROCERY_CATEGORIES } from "@/constants/categories";
import type { GroceryItem } from "@/types";

export default function GroceryListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listId = id as string;
  const { user } = useAuth();

  // Data fetching
  const {
    data: items,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useGroceryListItems(listId);

  // Mutations
  const toggleItem = useToggleGroceryItem();
  const deleteItem = useDeleteGroceryItem();
  const clearChecked = useClearCheckedItems();

  // Local state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GroceryItem | null>(null);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    if (!items) return {};

    const grouped: Record<string, typeof items> = {};

    items.forEach((item) => {
      // Normalize category: handle both old format ("autres") and new format ("🛒 Autres")
      let category = item.category || "🛒 Autres";

      // If category is just an ID (old format), convert to full label
      if (!category.includes(" ")) {
        // It's an ID like "autres", "legumes", etc.
        const cat = GROCERY_CATEGORIES.find(c => c.id === category);
        category = cat ? `${cat.emoji} ${cat.label}` : "🛒 Autres";
      }

      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  }, [items]);

  // Get categories in the predefined order, only showing those with items
  const orderedCategories = useMemo(() => {
    return GROCERY_CATEGORIES.filter((cat) => {
      const fullLabel = `${cat.emoji} ${cat.label}`; // Match DB format
      return itemsByCategory[fullLabel] && itemsByCategory[fullLabel].length > 0;
    }).map((cat) => `${cat.emoji} ${cat.label}`); // Return full label
  }, [itemsByCategory]);

  // Stats
  const stats = useMemo(() => {
    if (!items) return { total: 0, checked: 0 };
    return {
      total: items.length,
      checked: items.filter((item) => item.isChecked).length,
    };
  }, [items]);

  // Handlers
  const handleToggleItem = useCallback(
    (itemId: string) => {
      toggleItem.mutate({ itemId, listId });
    },
    [toggleItem, listId]
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      Alert.alert(
        "Supprimer l'article",
        "Voulez-vous vraiment supprimer cet article ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => deleteItem.mutate({ itemId, listId }),
          },
        ]
      );
    },
    [deleteItem, listId]
  );

  const handleClearChecked = useCallback(() => {
    if (stats.checked === 0) return;

    Alert.alert(
      "Vider les articles cochés",
      `Voulez-vous supprimer les ${stats.checked} articles cochés ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => clearChecked.mutate({ listId }),
        },
      ]
    );
  }, [clearChecked, listId, stats.checked]);

  const handleOpenAddModal = useCallback(() => {
    setAddModalVisible(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setAddModalVisible(false);
  }, []);

  const handleEditItem = useCallback((item: GroceryItem) => {
    setSelectedItem(item);
    setEditModalVisible(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setEditModalVisible(false);
    setSelectedItem(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <>
        <AppHeader />
        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
          <View style={styles.header}>
            <BackButton />
            <Text variant="h2" style={styles.headerTitle}>
              Liste de courses
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            <Text variant="body" color="neutral" style={styles.loadingText}>
              Chargement...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <AppHeader />
        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
          <View style={styles.header}>
            <BackButton />
            <Text variant="h2" style={styles.headerTitle}>
              Liste de courses
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.centered}>
            <Text variant="h1" style={styles.errorEmoji}>
              😕
            </Text>
            <Text variant="h3" style={styles.errorTitle}>
              Erreur
            </Text>
            <Text variant="body" color="neutral" style={styles.errorMessage}>
              Impossible de charger la liste
            </Text>
            <Button variant="primary" onPress={() => refetch()}>
              Réessayer
            </Button>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Empty state
  const isEmpty = !items || items.length === 0;

  return (
    <>
      <AppHeader />
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text variant="h2" style={styles.headerTitle}>
          Liste de courses
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats Bar */}
      {!isEmpty && (
        <View style={styles.statsBar}>
          <Text variant="body" style={styles.statsText}>
            {stats.total === 1
              ? "1 article"
              : `${stats.total} articles`}
            {stats.checked > 0 && (
              <Text variant="body" style={styles.statsTextMuted}>
                {" "}({stats.checked} coché{stats.checked > 1 ? "s" : ""})
              </Text>
            )}
          </Text>
          {stats.checked > 0 && (
            <TouchableOpacity
              onPress={handleClearChecked}
              disabled={clearChecked.isPending}
              accessibilityRole="button"
              accessibilityLabel="Vider les articles cochés"
            >
              <Text variant="bodySmall" style={styles.clearButton}>
                Vider les cochés
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text variant="h1" style={styles.emptyEmoji}>
            🛒
          </Text>
          <Text variant="h3" style={styles.emptyTitle}>
            Liste vide
          </Text>
          <Text variant="body" color="neutral" style={styles.emptyMessage}>
            Ajoutez des articles à votre liste de courses
          </Text>
          <Button variant="primary" onPress={handleOpenAddModal}>
            Ajouter un article
          </Button>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary.DEFAULT}
            />
          }
        >
          {orderedCategories.map((categoryLabel) => (
            <CategorySection
              key={categoryLabel}
              categoryLabel={categoryLabel}
              items={itemsByCategory[categoryLabel] || []}
              onToggleItem={handleToggleItem}
              onDeleteItem={handleDeleteItem}
              onEditItem={handleEditItem}
            />
          ))}

          {/* Footer spacer for FAB */}
          <View style={styles.footerSpacer} />
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenAddModal}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un article"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Item Modal */}
      <AddItemModal
        visible={addModalVisible}
        listId={listId}
        onClose={handleCloseAddModal}
        onSuccess={handleCloseAddModal}
      />

      {/* Edit Item Modal */}
      {selectedItem && (
        <EditItemModal
          visible={editModalVisible}
          item={selectedItem}
          listId={listId}
          onClose={() => setEditModalVisible(false)}
          onSuccess={handleEditSuccess}
        />
      )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream.DEFAULT,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.warm.brown,
  },

  headerSpacer: {
    width: 44, // Same as BackButton for centering
  },

  // Stats Bar
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cream[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  statsText: {
    color: colors.warm.brown,
  },

  statsTextMuted: {
    color: colors.warm.gray,
  },

  clearButton: {
    color: colors.primary.DEFAULT,
    fontWeight: "600",
  },

  // Content
  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: spacing.md,
  },

  footerSpacer: {
    height: 100, // Space for FAB
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
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
  },

  fabIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: "300",
    lineHeight: 36,
  },
});
