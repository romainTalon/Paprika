/**
 * Tab Navigation Layout
 *
 * Sets up the bottom tab navigation for the app.
 */

import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/theme";
import { AppHeader } from "@/components/navigation";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[200],
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        headerStyle: {
          backgroundColor: colors.cream.DEFAULT,
        },
        header: () => <AppHeader />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>{color === colors.primary.DEFAULT ? "🏠" : "🏡"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="cookbooks"
        options={{
          title: "Livres",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>{color === colors.primary.DEFAULT ? "📚" : "📖"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: "Planning",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>{color === colors.primary.DEFAULT ? "📅" : "📆"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="grocery-lists"
        options={{
          title: "Courses",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>{color === colors.primary.DEFAULT ? "🛒" : "🛍️"}</Text>
          ),
        }}
      />
    </Tabs>
  );
}
