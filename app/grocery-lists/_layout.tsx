/**
 * Grocery Lists Layout
 *
 * Stack layout for the grocery-lists route group.
 */

import { Stack } from "expo-router";

export default function GroceryListsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
