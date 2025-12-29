/**
 * Home/Discover Tab Screen
 *
 * Main landing screen with quick actions and recent activity.
 */

import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Text, Container } from "@/components/ui";
import { colors, spacing, fontSizes, fontWeights, shadows } from "@/theme";
import { useAuth } from "@/hooks/useAuth";

interface QuickActionCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  color?: string;
}

function QuickActionCard({
  icon,
  title,
  description,
  onPress,
  color = colors.primary.DEFAULT,
}: QuickActionCardProps) {
  return (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.actionContent}>
        <Text variant="h3" style={styles.actionTitle}>
          {title}
        </Text>
        <Text variant="bodySmall" color="neutral" style={styles.actionDescription}>
          {description}
        </Text>
      </View>
      <Text style={styles.actionChevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <Container>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text variant="h1" style={styles.welcomeTitle}>
            Bonjour {user?.email?.split("@")[0] || "Chef"} 👋
          </Text>
          <Text variant="body" color="neutral" style={styles.welcomeSubtitle}>
            Qu'allez-vous cuisiner aujourd'hui ?
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Actions rapides
          </Text>

          <QuickActionCard
            icon="🤖"
            title="Importer depuis un lien"
            description="Collez une URL et l'IA extrait la recette automatiquement"
            onPress={() => router.push("/recipes/import")}
            color={colors.primary.DEFAULT}
          />

          <QuickActionCard
            icon="✍️"
            title="Créer une recette"
            description="Ajoutez une recette manuellement"
            onPress={() => router.push("/recipes/create")}
            color={colors.primary[600]}
          />

          <QuickActionCard
            icon="📚"
            title="Mes livres de recettes"
            description="Organisez vos recettes par thème"
            onPress={() => router.push("/(tabs)/cookbooks")}
            color={colors.warm.brown}
          />

          <QuickActionCard
            icon="📅"
            title="Planifier mes repas"
            description="Organisez votre semaine culinaire"
            onPress={() => router.push("/(tabs)/meal-plan")}
            color={colors.warning}
          />
        </View>

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <Text variant="h3" style={styles.tipsTitle}>
            💡 Le saviez-vous ?
          </Text>
          <Text variant="bodySmall" color="neutral" style={styles.tipsText}>
            L'import automatique fonctionne avec la plupart des sites de recettes français : Marmiton, 750g, Cuisine AZ, etc.
          </Text>
          <View style={styles.tipsBadge}>
            <Text variant="caption" style={styles.tipsBadgeText}>
              Gratuit: 5 imports/mois
            </Text>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: spacing["2xl"],
  },

  // Welcome Section
  welcomeSection: {
    marginBottom: spacing.xl,
  },

  welcomeTitle: {
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  welcomeSubtitle: {
    fontSize: fontSizes.lg,
    lineHeight: 24,
  },

  // Section
  section: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    color: colors.warm.brown,
    marginBottom: spacing.md,
  },

  // Action Card
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },

  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },

  iconText: {
    fontSize: 24,
    lineHeight: 28,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    color: colors.warm.brown,
    marginBottom: spacing.xs / 2,
  },

  actionDescription: {
    lineHeight: 18,
  },

  actionChevron: {
    fontSize: 28,
    color: colors.gray[400],
    fontWeight: "300" as any,
    lineHeight: 32,
    marginLeft: spacing.sm,
  },

  // Tips Card
  tipsCard: {
    backgroundColor: colors.primary[100],
    borderRadius: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },

  tipsTitle: {
    color: colors.warm.brown,
    marginBottom: spacing.sm,
  },

  tipsText: {
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  tipsBadge: {
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    padding: spacing.sm,
    alignSelf: "flex-start",
  },

  tipsBadgeText: {
    color: colors.primary.DEFAULT,
    fontWeight: fontWeights.semibold as any,
  },
});
