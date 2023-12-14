import {
  ActionIcon,
  Badge,
  Button,
  Flex,
  Popover,
  Space,
  Tooltip,
  Text,
} from "@mantine/core";
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
import { v3KeyPacks } from "../utils/lunii/v3KeyPacks";

export const Header = () => {
  const colorScheme = state.colorScheme.use();

  const doInstallPack = useInstallPack();
  const device = state.device.use();

  const keyPackReference = state.keyPackReference.use();
  const canInstallPack =
    device.version === "V2" ||
    (device.version === "V3" && keyPackReference !== null);

  const { mutate: syncMetadata } = useSyncMetadataMutation();

  return (
    <Flex py={5} align="center">
      <Popover width={500} position="bottom-start" shadow="md">
        <Popover.Target>
          <Button
            color={canInstallPack ? "blue" : "orange"}
            leftIcon={
              canInstallPack ? (
                <IconUpload size="1rem" />
              ) : (
                <IconAlertTriangle size="1rem" />
              )
            }
            onClick={() => canInstallPack && doInstallPack()}
          >
            Installer des packs
          </Button>
        </Popover.Target>
        <Popover.Dropdown style={{ border: "1px solid orange" }}>
          <Text mb="sm">
            Pour installer des packs custom sur une Lunii V3, l'un de ces packs
            officiel doit être installé:
          </Text>
          {v3KeyPacks.map((pack) => (
            <Text fw="bold">{pack.name}</Text>
          ))}
        </Popover.Dropdown>
      </Popover>

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

      {/* <Space w={10} />
      <ActionIcon
        variant="light"
        size="lg"
        component="a"
        href=""
        target="_blank"
      >
        <IconBrandDiscordFilled size="1rem" />
      </ActionIcon> */}
    </Flex>
  );
};
