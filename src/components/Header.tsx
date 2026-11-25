import { Button, Group, Menu, Text } from "@mantine/core";
import {
  IconChevronDown,
  IconExternalLink,
  IconRefresh,
  IconUpload,
} from "@tabler/icons-react";
import { useInstallPack, useSyncMetadataMutation } from "../queries";
import { state } from "../store";
export const Header = ({ blocked }: { blocked: boolean }) => {
  const install = useInstallPack();
  const sync = useSyncMetadataMutation();
  const busy = state.isWriting.use();
  return (
    <Group justify="space-between" className="library-toolbar">
      <Text size="sm" c="dimmed">
        Les histoires sont lues dans l’ordre de cette liste.
      </Text>
      <Group gap="sm">
        <Menu position="bottom-end">
          <Menu.Target>
            <Button
              variant="default"
              rightSection={<IconChevronDown size={15} />}
              disabled={busy || blocked || sync.isPending}
            >
              {sync.isPending ? "Actualisation des titres…" : "Outils"}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconRefresh size={16} />}
              onClick={() => sync.mutate()}
            >
              Actualiser les titres officiels
            </Menu.Item>
            <Menu.Item
              component="a"
              href="https://lunii-admin-builder.pages.dev"
              target="_blank"
              rel="noreferrer"
              leftSection={<IconExternalLink size={16} />}
            >
              Créer un pack
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
        <Button
          leftSection={<IconUpload size={18} />}
          disabled={busy || blocked}
          onClick={install}
        >
          Installer des packs
        </Button>
      </Group>
    </Group>
  );
};
