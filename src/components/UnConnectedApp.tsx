import { Alert, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import {
  IconFolderOpen,
  IconPlugConnected,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useState } from "react";
import { getLuniiHandle } from "../utils";
import { getDeviceInfo } from "../utils/lunii/deviceInfo";
import { state } from "../store";
import { captureUsage } from "../usage";
import { errorMessage, isPickerCancelled } from "../device-operations";

export const UnconnectedApp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function connect() {
    setLoading(true);
    setError("");
    captureUsage("lunii_device_connect_started");
    try {
      const handle = await getLuniiHandle();
      const device = await getDeviceInfo(handle);
      state.device.set(device);
      state.connectionId.set(crypto.randomUUID());
      state.luniiHandle.set(handle);
      captureUsage("lunii_device_connected", {
        device_generation: device.version,
      });
    } catch (error) {
      if (!isPickerCancelled(error)) setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }
  return (
    <section className="welcome">
      <div className="welcome-copy">
        <Title order={1}>Connecter votre Lunii</Title>
        <Text className="intro" c="dimmed" size="lg" mt="lg">
          Retrouvez les packs de votre Lunii, choisissez leur ordre et ajoutez
          de nouvelles aventures.
        </Text>
        <Button
          mt="xl"
          size="lg"
          leftSection={<IconFolderOpen size={21} />}
          loading={loading}
          onClick={connect}
        >
          Connecter ma Lunii
        </Button>
        <Text size="sm" c="dimmed" mt="md">
          Branchez votre Lunii par USB pour commencer.
        </Text>
        {error && (
          <Alert mt="lg" color="red" title="Connexion impossible" role="alert">
            {error}
          </Alert>
        )}
      </div>
      <Paper className="connection-card" p="xl" withBorder radius="lg">
        <Title order={2} size="h3" mb="lg">
          Pour commencer
        </Title>
        <Stack gap="lg">
          <div className="connection-step">
            <span>1</span>
            <div>
              <Text fw={650}>Branchez la Lunii</Text>
              <Text size="sm" c="dimmed">
                Attendez qu’elle apparaisse sur votre ordinateur.
              </Text>
            </div>
          </div>
          <div className="connection-step">
            <span>2</span>
            <div>
              <Text fw={650}>Choisissez son dossier principal</Text>
              <Text size="sm" c="dimmed">
                Sélectionnez le lecteur Lunii dans la fenêtre qui s’ouvre.
              </Text>
            </div>
          </div>
          <div className="connection-step">
            <span>3</span>
            <div>
              <Text fw={650}>Autorisez l’accès aux fichiers</Text>
              <Text size="sm" c="dimmed">
                Le navigateur pourra lire et modifier vos packs.
              </Text>
            </div>
          </div>
        </Stack>
        <Group gap="xs" mt="xl" className="connection-note">
          <IconShieldCheck size={18} />
          <Text size="xs">
            Les fichiers des packs sont traités dans votre navigateur.
          </Text>
        </Group>
      </Paper>
      <Group className="welcome-credit" gap="xs">
        <IconPlugConnected size={16} />
        <Text size="xs" c="dimmed">
          Merci à R. Daneel Olivaw, Frederir et à la communauté.
        </Text>
      </Group>
    </section>
  );
};
