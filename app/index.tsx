import { Container, Text, Button } from "@/components/ui";
import { spacing } from "@/theme";
import { router } from "expo-router";

export default function Index() {
  return (
    <Container centered>
      <Text variant="h1" color="primary">
        🍳 Paprika
      </Text>
      <Text variant="bodyLarge" style={{ marginTop: spacing.md }}>
        Votre assistant culinaire intelligent
      </Text>

      <Button
        variant="primary"
        size="lg"
        style={{ marginTop: spacing.xl }}
        onPress={() => router.push("/(tabs)/cookbooks")}
      >
        Commencer
      </Button>
    </Container>
  );
}
