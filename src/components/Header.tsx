import { ActionIcon, Badge, Button, Flex, Space, Tooltip } from "@mantine/core";
import {
  IconAlertTriangle,
  IconBrandGithubFilled,
  IconExternalLink,
  IconMoon,
  IconRefresh,
  IconSun,
  IconUpload,
} from "@tabler/icons-react";
import { useInstallPack, useSyncMetadataMutation } from "../queries";
import { state, switchColorScheme } from "../store";

export const Header = () => {
  const colorScheme = state.colorScheme.use();
  const device = state.device.peek();

  const doInstallPack = useInstallPack();
  const { mutate: syncMetadata } = useSyncMetadataMutation();

  return (
    <Flex py={5} align="center">
      <Button
        leftIcon={<IconUpload size="1rem" />}
        onClick={() => doInstallPack()}
      >
        Installer des packs
      </Button>

      <Space w={10} />
      <Tooltip
        openDelay={500}
        label="Téléchargez les métadonnée pour les packs officiels depuis le lunii-store"
      >
        <Button
          variant="outline"
          leftIcon={<IconRefresh size="1rem" />}
          onClick={() => syncMetadata()}
        >
          Synchroniser les métadonnées
        </Button>
      </Tooltip>
      <Space w={10} />
      <Button
        leftIcon={<IconExternalLink size="1rem" />}
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
      {device.version === "V2" && !device.stable && (
        <ActionIcon variant="light" color="orange" size="lg">
          <IconAlertTriangle size="1rem" />
        </ActionIcon>
      )}
      <ActionIcon variant="light" size="lg" onClick={switchColorScheme}>
        {colorScheme === "dark" ? (
          <IconSun size="1rem" />
        ) : (
          <IconMoon size="1rem" />
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
        <IconBrandGithubFilled size="1rem" />
      </ActionIcon>
    </Flex>
  );
};
