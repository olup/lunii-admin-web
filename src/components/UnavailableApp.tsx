import { Alert, Paper, Stack, Text, Title } from "@mantine/core";
import { IconDeviceDesktop } from "@tabler/icons-react";
export const UnavailableApp = () => (
  <Paper className="unavailable" withBorder p="xl" radius="lg">
    <Stack align="center" gap="lg">
      <IconDeviceDesktop size={48} stroke={1.4} />
      <Title order={1} size="h2">
        Continuons sur un ordinateur
      </Title>
      <Text ta="center" c="dimmed">
        Ce navigateur ne permet pas d’accéder aux fichiers de votre Lunii.
      </Text>
      <Alert title="Comment ouvrir votre bibliothèque" w="100%">
        Ouvrez cette page dans une version récente de Chrome ou Edge sur
        ordinateur, puis branchez votre Lunii par USB.
      </Alert>
    </Stack>
  </Paper>
);
