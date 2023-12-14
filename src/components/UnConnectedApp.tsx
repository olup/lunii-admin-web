import { Badge, Button, Center, Container, Text } from "@mantine/core";
import { getLuniiHandle } from "../utils";
import { getDeviceInfo } from "../utils/lunii/deviceInfo";
import { state } from "../store";

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
          onClick={async () => {
            const handle = await getLuniiHandle();
            if (!handle) return;

            const device = await getDeviceInfo(handle);

            await state.device.set(device);
            await state.luniiHandle.set(handle);
          }}
        >
          Ouvrir ma Lunii
        </Button>

        <Text mb="md">Un logiciel de Olup</Text>
        <Text>Rendu possible grace au travail extraordinaire de </Text>
        <Text>🥇 R. Daneel Olivaw 🥇</Text>
        <Text mb="md">🥇 Frederir 🥇</Text>
        <Text mb="md">Et tout le support de la communauté Lunii</Text>
      </Center>
    </Container>
  );
};
