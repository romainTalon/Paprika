/**
 * Premium Subscription Screen
 *
 * Displays premium features and subscription options.
 */

import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text, Button, Container } from "@/components/ui";
import { BackButton } from "@/components/navigation";
import { colors, spacing, fontSizes, fontWeights, shadows } from "@/theme";

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureContent}>
        <Text variant="h3" style={styles.featureTitle}>
          {title}
        </Text>
        <Text variant="bodySmall" color="neutral">
          {description}
        </Text>
      </View>
    </View>
  );
}

export default function PremiumScreen() {
  const handleSubscribe = () => {
    // TODO: Implement subscription flow
    console.log("Subscribe to Premium");
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <BackButton />

        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1" style={styles.title}>
            Paprika Premium
          </Text>
          <Text variant="body" color="neutral" style={styles.subtitle}>
            Débloquez toutes les fonctionnalités
          </Text>
        </View>

        {/* Price Card */}
        <View style={styles.priceCard}>
          <Text variant="h2" style={styles.price}>
            4,99 € / mois
          </Text>
          <Text variant="bodySmall" color="neutral">
            Annulez à tout moment
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Fonctionnalités Premium
          </Text>

          <FeatureItem
            icon="🤖"
            title="Imports IA illimités"
            description="Importez autant de recettes que vous voulez depuis n'importe quel site web"
          />

          <FeatureItem
            icon="📚"
            title="Livres de recettes illimités"
            description="Organisez vos recettes dans autant de livres que vous le souhaitez"
          />

          <FeatureItem
            icon="📝"
            title="Recettes illimitées"
            description="Créez et stockez un nombre illimité de recettes"
          />

          <FeatureItem
            icon="📅"
            title="Planning avancé"
            description="Planifiez vos repas sur plusieurs semaines avec rappels"
          />

          <FeatureItem
            icon="🛒"
            title="Listes de courses intelligentes"
            description="Génération automatique avec détection de doublons et optimisation"
          />

          <FeatureItem
            icon="📊"
            title="Analyse nutritionnelle"
            description="Informations nutritionnelles détaillées pour toutes vos recettes"
          />

          <FeatureItem
            icon="☁️"
            title="Synchronisation cloud"
            description="Accédez à vos recettes sur tous vos appareils"
          />

          <FeatureItem
            icon="🎨"
            title="Thèmes personnalisés"
            description="Personnalisez l'apparence de l'application selon vos goûts"
          />
        </View>

        {/* Free vs Premium Comparison */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            Comparaison
          </Text>

          <View style={styles.comparisonTable}>
            <View style={styles.comparisonRow}>
              <Text variant="bodySmall" style={styles.comparisonLabel}>
                Imports IA par mois
              </Text>
              <Text variant="bodySmall" style={styles.comparisonFree}>
                5
              </Text>
              <Text variant="bodySmall" style={styles.comparisonPremium}>
                Illimité
              </Text>
            </View>

            <View style={styles.comparisonRow}>
              <Text variant="bodySmall" style={styles.comparisonLabel}>
                Livres de recettes
              </Text>
              <Text variant="bodySmall" style={styles.comparisonFree}>
                2
              </Text>
              <Text variant="bodySmall" style={styles.comparisonPremium}>
                Illimité
              </Text>
            </View>

            <View style={styles.comparisonRow}>
              <Text variant="bodySmall" style={styles.comparisonLabel}>
                Recettes totales
              </Text>
              <Text variant="bodySmall" style={styles.comparisonFree}>
                20
              </Text>
              <Text variant="bodySmall" style={styles.comparisonPremium}>
                Illimité
              </Text>
            </View>

            <View style={styles.comparisonRow}>
              <Text variant="bodySmall" style={styles.comparisonLabel}>
                Planning de repas
              </Text>
              <Text variant="bodySmall" style={styles.comparisonFree}>
                1 semaine
              </Text>
              <Text variant="bodySmall" style={styles.comparisonPremium}>
                Illimité
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Subscribe Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleSubscribe}
          style={styles.subscribeButton}
        >
          S'abonner à Premium
        </Button>
        <TouchableOpacity onPress={() => router.back()}>
          <Text
            variant="bodySmall"
            color="neutral"
            style={styles.cancelText}
          >
            Peut-être plus tard
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream.DEFAULT,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: spacing["2xl"],
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },

  title: {
    color: colors.warm.brown,
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontSize: fontSizes.lg,
    lineHeight: 24,
  },

  // Price Card
  priceCard: {
    backgroundColor: colors.primary.DEFAULT,
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    borderRadius: spacing.md,
    alignItems: "center",
    marginBottom: spacing.xl,
    ...shadows.md,
  },

  price: {
    color: colors.white,
    marginBottom: spacing.xs,
  },

  // Section
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    color: colors.warm.brown,
    marginBottom: spacing.md,
  },

  // Feature Item
  featureItem: {
    flexDirection: "row",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },

  featureIcon: {
    fontSize: 28,
    marginRight: spacing.md,
    lineHeight: 32,
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    color: colors.warm.brown,
    marginBottom: spacing.xs / 2,
  },

  // Comparison Table
  comparisonTable: {
    backgroundColor: colors.white,
    borderRadius: spacing.md,
    overflow: "hidden",
    ...shadows.sm,
  },

  comparisonRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    padding: spacing.md,
  },

  comparisonLabel: {
    flex: 2,
    color: colors.warm.brown,
  },

  comparisonFree: {
    flex: 1,
    textAlign: "center",
    color: colors.gray[600],
  },

  comparisonPremium: {
    flex: 1,
    textAlign: "center",
    color: colors.primary.DEFAULT,
    fontWeight: fontWeights.semibold as any,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    ...shadows.lg,
  },

  subscribeButton: {
    marginBottom: spacing.md,
  },

  cancelText: {
    textAlign: "center",
  },
});
