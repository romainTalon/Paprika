import { Container, Text, Button } from "@/components/ui";
import { spacing } from "@/theme";

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
        onPress={() => console.log("Get Started pressed")}
      >
        Commencer
      </Button>
    </Container>
  );
}
