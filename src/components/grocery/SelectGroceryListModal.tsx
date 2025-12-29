/**
 * SelectGroceryListModal Component
 *
 * Modal for selecting a grocery list when importing ingredients from a recipe.
 * Shows all active lists and allows creating a new one.
 */

import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Text, Button } from "@/components/ui";
import { colors, spacing, shadows, fontSizes } from "@/theme";
import { useGroceryLists } from "@/hooks/useGroceryList";

interface SelectGroceryListModalProps {
  visible: boolean;
  userId: string | null;
  onClose: () => void;
  onSelect: (listId: string) => void;
  onCreateNew: () => void;
}

export function SelectGroceryListModal({
  visible,
  userId,
  onClose,
  onSelect,
  onCreateNew,
}: SelectGroceryListModalProps) {
  const { data: lists, isLoading } = useGroceryLists(userId || undefined, false);

  // Filter to only active, non-archived lists
  const activeLists = lists?.filter((l) => l.isActive && !l.isArchived) || [];

  const handleListPress = (listId: string) => {
    onSelect(listId);
    onClose();
  };

  const handleCreatePress = () => {
    onCreateNew();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h3">Choisir une liste</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Fermer"
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            <Text variant="body" color="neutral" style={styles.loadingText}>
              Chargement des listes...
            </Text>
          </View>
        ) : activeLists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="body" color="neutral" style={styles.emptyText}>
              Aucune liste active trouvée.
              {"\n"}
              Créez une nouvelle liste pour commencer.
            </Text>
          </View>
        ) : (
          <FlatList
            data={activeLists}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => handleListPress(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Ajouter à ${item.name}`}
              >
                <Text style={styles.listIcon}>🛒</Text>
                <Text variant="body" style={styles.listName}>
                  {item.name}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Create New Button */}
        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleCreatePress}
            style={styles.createButton}
          >
            + Créer une nouvelle liste
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  modal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    maxHeight: "70%",
    ...shadows.lg,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  closeIcon: {
    fontSize: 24,
    color: colors.gray[600],
  },

  // Loading
  loadingContainer: {
    padding: spacing["2xl"],
    alignItems: "center",
    gap: spacing.md,
  },

  loadingText: {
    marginTop: spacing.md,
  },

  // Empty State
  emptyContainer: {
    padding: spacing["2xl"],
    alignItems: "center",
  },

  emptyText: {
    textAlign: "center",
    lineHeight: 24,
  },

  // List
  list: {
    flex: 1,
  },

  listContent: {
    paddingVertical: spacing.sm,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },

  listIcon: {
    fontSize: 24,
    lineHeight: 28,
    marginRight: spacing.md,
  },

  listName: {
    flex: 1,
    color: colors.warm.brown,
  },

  chevron: {
    fontSize: 24,
    color: colors.gray[400],
    fontWeight: "300",
    lineHeight: 28,
  },

  // Footer
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },

  createButton: {
    width: "100%",
  },
});
