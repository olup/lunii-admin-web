import { ActionIcon, Badge, Button, Flex, Space, Tooltip } from "@mantine/core";
import {
  IconBrandDiscordFilled,
  IconBrandGithubFilled,
  IconExternalLink,
  IconRefresh,
  IconUpload,
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "react-query";
import { state } from "../store";
import { installPack } from "../utils/lunii/installPack";
import { syncPacksMetadataFromStore } from "../utils/lunii/packs";
import { notifications } from "@mantine/notifications";

export const Header = () => {
  const client = useQueryClient();

  const { mutate: doInstallPack } = useMutation({
    mutationFn: async () => {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ accept: { "application/zip": [".zip"] } }],
        multiple: false,
      });
      const device = state.device.peek()!;
      await installPack(fileHandle, device.specificKey);
    },
    onSuccess: () =>
      notifications.show({
        title: "Installation terminée",
        message: "Le pack a été installé avec succès",
        color: "green",
      }),
    onSettled: () => {
      client.invalidateQueries("packs");
    },
  });

  const { mutate: syncMetadata } = useMutation({
    mutationFn: () => syncPacksMetadataFromStore(state.luniiHandle.peek()!),
    onSuccess: () =>
      notifications.show({
        title: "Synchronisation terminée",
        message: "Les métadonnées ont été synchronisées avec succès",
        color: "green",
      }),
    onSettled: () => {
      client.invalidateQueries("packs");
    },
  });

  return (
    <Flex py={5} align="center">
      <Button
        leftIcon={<IconUpload size={18} />}
        onClick={() => doInstallPack()}
      >
        Installer un pack
      </Button>
      <Space w={10} />
      <Tooltip
        openDelay={500}
        label="Téléchargez les métadonnée pour les packs officiels depuis le lunii-store"
      >
        <Button
          variant="outline"
          leftIcon={<IconRefresh size={18} />}
          onClick={() => syncMetadata()}
        >
          Synchroniser les métadonnées
        </Button>
      </Tooltip>
      <Space w={10} />
      <Button
        leftIcon={<IconExternalLink size={18} />}
        component="a"
        href="https://lunii-admin-builder.pages.dev"
        target="_blank"
        variant="subtle"
      >
        Créer un pack
      </Button>

      <Space style={{ flex: 1 }} />

      <Badge>{__COMMIT_HASH__}</Badge>
      <Space w={10} />
      <ActionIcon
        variant="light"
        size="lg"
        component="a"
        href="https://github.com/olup/lunii-admin-web"
        target="_blank"
      >
        <IconBrandGithubFilled size={18} />
      </ActionIcon>
      <Space w={10} />
      <ActionIcon
        variant="light"
        size="lg"
        component="a"
        href=""
        target="_blank"
      >
        <IconBrandDiscordFilled size={18} />
      </ActionIcon>
    </Flex>
  );
};
