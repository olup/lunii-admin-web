import { ActionIcon, Badge, Button, Flex, Space, Tooltip } from "@mantine/core";
import {
  IconBrandGithubFilled,
  IconExternalLink,
  IconMoon,
  IconRefresh,
  IconSun,
  IconUpload,
} from "@tabler/icons-react";
import { useInstallPackMutation, useSyncMetadataMutation } from "../queries";
import { state, switchColorScheme } from "../store";

export const Header = () => {
  const colorScheme = state.colorScheme.use();

  const { mutate: doInstallPack } = useInstallPackMutation();

  const { mutate: syncMetadata } = useSyncMetadataMutation();

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
      <ActionIcon variant="light" size="lg" onClick={switchColorScheme}>
        {colorScheme === "dark" ? (
          <IconSun size={18} />
        ) : (
          <IconMoon size={18} />
        )}
      </ActionIcon>
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
      {/* <Space w={10} />
      <ActionIcon
        variant="light"
        size="lg"
        component="a"
        href=""
        target="_blank"
      >
        <IconBrandDiscordFilled size={18} />
      </ActionIcon> */}
    </Flex>
  );
};
