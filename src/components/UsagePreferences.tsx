import { Button, Container, Group, Paper, Text } from "@mantine/core";
import { useState } from "react";
import { getUsagePreference, saveUsagePreference } from "../usage-preference";
import type { UsageChoice } from "../usage-preference";

export function UsagePreferences() {
  const [expanded, setExpanded] = useState(() => !getUsagePreference());
  const [saveFailed, setSaveFailed] = useState(false);

  function choose(choice: UsageChoice) {
    const saved = saveUsagePreference(choice);
    setSaveFailed(!saved);
    if (saved) setExpanded(false);
  }

  return (
    <Container role="complementary" aria-label="Statistiques Porcupine" size="sm" mt="md">
      {expanded ? (
        <Paper withBorder p="md" radius="md">
          <Text weight={600} size="sm">Statistiques Porcupine</Text>
          <Text size="sm" mt={4}>
            Vous pouvez autoriser un identifiant aléatoire conservé six mois dans ce navigateur
            pour compter les visites répétées. Vous pouvez changer d’avis à tout moment.
          </Text>
          <Group mt="sm" spacing="xs">
            <Button variant="default" size="xs" onClick={() => choose("allowed")}>
              Autoriser
            </Button>
            <Button variant="default" size="xs" onClick={() => choose("declined")}>
              Refuser
            </Button>
          </Group>
          {saveFailed && (
            <Text role="status" size="sm" mt={4}>
              Ce navigateur ne peut pas enregistrer votre accord.
            </Text>
          )}
        </Paper>
      ) : (
        <Button variant="subtle" size="xs" onClick={() => setExpanded(true)}>
          Statistiques Porcupine
        </Button>
      )}
    </Container>
  );
}
