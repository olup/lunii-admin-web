import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsUp,
  IconDots,
  IconInfoCircle,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { PackShell } from "../utils/lunii/packs";
import { PackMetadataModal } from "./PackMetadataModal";
import { useRemovePackMutation, useReorderPackMutation } from "../queries";
import { state } from "../store";

export const Pack = ({
  pack,
  position,
  total,
  blocked,
  filtered,
}: {
  pack: PackShell;
  position: number;
  total: number;
  blocked: boolean;
  filtered: boolean;
}) => {
  const [details, setDetails] = useState(false);
  const move = useReorderPackMutation();
  const remove = useRemovePackMutation();
  const busy = state.isWriting.use();
  const disabled = busy || blocked;
  const title =
    pack.metadata?.title ||
    `Histoire sans titre · ${pack.uuid.slice(-8).toUpperCase()}`;
  const removePack = () =>
    modals.openConfirmModal({
      title: "Supprimer cette histoire ?",
      centered: true,
      children: (
        <Text size="sm">
          « {title} » sera retiré de la Lunii et ses fichiers seront supprimés.
          Cette action est irréversible.
        </Text>
      ),
      labels: { confirm: "Supprimer le pack", cancel: "Garder l’histoire" },
      confirmProps: { color: "red" },
      onConfirm: () => remove.mutate(pack.uuid),
    });
  return (
    <>
      <Paper className="pack-row" withBorder>
        <span className="pack-position" aria-label={`Position ${position + 1}`}>
          {String(position + 1).padStart(2, "0")}
        </span>
        <div className="pack-copy">
          <Button
            variant="transparent"
            className="pack-title"
            onClick={() => setDetails(true)}
          >
            {title}
          </Button>
          <Text size="sm" c="dimmed" lineClamp={2}>
            {pack.metadata?.description ||
              "Ajoutez un titre et une description pour retrouver cette histoire."}
          </Text>
          {pack.metadataError && (
            <Badge size="xs" variant="light" color="orange" mt={7}>
              Informations indisponibles
            </Badge>
          )}
          {!pack.metadata?.title && !pack.metadataError && (
            <Badge size="xs" variant="light" color="orange" mt={7}>
              Titre à compléter
            </Badge>
          )}
        </div>
        <Group gap="xs" className="pack-actions">
          <Stack gap={2}>
            <Tooltip label="Monter">
              <ActionIcon
                aria-label={`Monter ${title}`}
                variant="subtle"
                color="gray"
                disabled={disabled || filtered || position === 0}
                onClick={() =>
                  move.mutate({ uuid: pack.uuid, direction: "up" })
                }
              >
                <IconArrowUp size={17} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Descendre">
              <ActionIcon
                aria-label={`Descendre ${title}`}
                variant="subtle"
                color="gray"
                disabled={disabled || filtered || position === total - 1}
                onClick={() =>
                  move.mutate({ uuid: pack.uuid, direction: "down" })
                }
              >
                <IconArrowDown size={17} />
              </ActionIcon>
            </Tooltip>
          </Stack>
          <Menu position="bottom-end">
            <Menu.Target>
              <ActionIcon
                aria-label={`Actions pour ${title}`}
                variant="subtle"
                color="gray"
              >
                <IconDots size={19} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconInfoCircle size={16} />}
                onClick={() => setDetails(true)}
              >
                Détails et titre
              </Menu.Item>
              <Menu.Item
                leftSection={<IconArrowsUp size={16} />}
                disabled={disabled || filtered || position === 0}
                onClick={() =>
                  move.mutate({ uuid: pack.uuid, direction: "first" })
                }
              >
                Lire en premier
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconTrash size={16} />}
                color="red"
                disabled={disabled}
                onClick={removePack}
              >
                Supprimer
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Paper>
      {details && (
        <PackMetadataModal
          pack={pack}
          blocked={blocked}
          onClose={() => setDetails(false)}
        />
      )}
    </>
  );
};
