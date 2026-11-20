import { Alert, Badge, Button, Center, Container, Text } from "@mantine/core";
import { getLuniiHandle } from "../utils";
import { getDeviceInfo } from "../utils/lunii/deviceInfo";
import { state } from "../store";
import { IconFolderOpen } from "@tabler/icons-react";
import { captureUsage } from "../usage";

export const UnconnectedApp = () => {
  return (
    <Container h="80vh">
      <Center h="100%" style={{ flexDirection: "column" }}>
        <Badge mb={20}>{__COMMIT_HASH__}</Badge>
        <Text mb={20}>
          Pour utiliser Lunii Admin Web il faut donner les permissions au
          navigateur d'accéder à votre appareil.
        </Text>

        <Button
          mb="xl"
          leftIcon={<IconFolderOpen size="1rem" />}
          onClick={async () => {
            captureUsage("lunii_device_connect_started");
            const handle = await getLuniiHandle();
            if (!handle) return;

            const device = await getDeviceInfo(handle);

            await state.device.set(device);
            await state.luniiHandle.set(handle);
            captureUsage("lunii_device_connected", { device_generation: device.version });
          }}
        >
          Ouvrir ma Lunii
        </Button>
        <Alert my="lg" radius="md" p="xl">
          <Text mb="md">🔨 Créé par Olup</Text>
          <Text mb="sm">Rendu possible grace au travail incroyable de </Text>
          <Text>🥇 R. Daneel Olivaw</Text>
          <Text>🥇 Frederir</Text>
          <Text mb="md"> ❤️ Et tout le support de la communauté Lunii</Text>
        </Alert>
      </Center>
    </Container>
  );
};
