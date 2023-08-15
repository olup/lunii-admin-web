import {
  ActionIcon,
  Badge,
  Box,
  Code,
  Flex,
  Menu,
  Paper,
  Space,
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
import { FC, useState } from "react";
import { PackShell } from "../utils/lunii/packs";
import { PackMetadataModal } from "./PackMetadataModal";
import { useRemovePackMutation, useReorderPackMutation } from "../queries";

export const Pack: FC<{
  pack: PackShell;
  position: number;
}> = ({ pack, position }) => {
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);

  const { mutate: movePack } = useReorderPackMutation();
  const { mutate: removePack } = useRemovePackMutation();

  const openRemoveModal = () =>
    modals.openConfirmModal({
      title: <Text>Supprimer un Pack</Text>,
      centered: true,
      children: (
        <Text size="sm">
          Êtes vous sûr de vouloir supprimer le pack{" "}
          <Code>{pack.metadata?.title}</Code> ? Cette action est irréversible.
        </Text>
      ),
      labels: { confirm: "Supprimer", cancel: "Annuler" },
      confirmProps: { color: "red", rightIcon: <IconTrash size="1rem" /> },
      onCancel: () => {},
      onConfirm: () => removePack(pack.uuid),
    });

  return (
    <>
      <Paper
        display="flex"
        p={10}
        shadow="xs"
        withBorder
        mb={10}
        pos="relative"
      >
        <Box>
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => movePack({ from: position, to: position - 1 })}
          >
            <IconArrowUp size="1rem" />
          </ActionIcon>
          <Space h={5} />
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => movePack({ from: position, to: position + 1 })}
          >
            <IconArrowDown size="1rem" />
          </ActionIcon>
        </Box>
        <Space w={20} />
        <Box>
          <Flex>
            <Badge>{pack.uuid}</Badge>
            {!pack.metadata ? (
              <Tooltip
                openDelay={500}
                multiline
                width={300}
                label={`Vous pouvez importer les métadonnées depuis le Lunii Store ou la base de donnée de STUdio. A faire une fois.`}
              >
                <Badge ml={5} color="yellow">
                  Métadonnée manquantes
                </Badge>
              </Tooltip>
            ) : null}
          </Flex>
          <Text>{pack.metadata?.title}</Text>
          <Text lineClamp={1} color="gray">
            {pack.metadata?.description}
          </Text>
        </Box>
        <Box pos="absolute" top={5} right={5}>
          <Menu position="bottom-start">
            <Menu.Target>
              <ActionIcon variant="subtle" color="blue">
                <IconDots size="1rem" />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                icon={<IconInfoCircle size="1rem" />}
                onClick={() => setMetadataModalOpen(true)}
              >
                Details
              </Menu.Item>
              <Menu.Item
                icon={<IconArrowsUp size="1rem" />}
                onClick={() => movePack({ from: position, to: 0 })}
              >
                Mettre en premier
              </Menu.Item>
              <Menu.Item
                color="red"
                icon={<IconTrash size="1rem" />}
                onClick={() => openRemoveModal()}
              >
                Supprimer
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Box>
      </Paper>
      {metadataModalOpen && (
        <PackMetadataModal
          packUuid={pack.uuid}
          onClose={() => setMetadataModalOpen(false)}
        />
      )}
    </>
  );
};
