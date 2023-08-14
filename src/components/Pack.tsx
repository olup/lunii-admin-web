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
  IconDots,
  IconInfoCircle,
  IconTrash,
} from "@tabler/icons-react";
import { FC, useState } from "react";
import { PackShell } from "../utils/lunii/packs";
import { PackMetadataModal } from "./PackMetadataModal";

export const Pack: FC<{
  pack: PackShell;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
}> = ({ pack, onMoveDown, onMoveUp, onRemove }) => {
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);

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
      confirmProps: { color: "red", rightIcon: <IconTrash size={14} /> },
      onCancel: () => {},
      onConfirm: () => onRemove?.(),
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
          <ActionIcon variant="subtle" color="blue" onClick={onMoveUp}>
            <IconArrowUp size={18} />
          </ActionIcon>
          <Space h={5} />
          <ActionIcon variant="subtle" color="blue" onClick={onMoveDown}>
            <IconArrowDown size={18} />
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
        {onRemove && (
          <Box pos="absolute" top={5} right={5}>
            <Menu position="bottom-start">
              <Menu.Target>
                <ActionIcon variant="subtle" color="blue">
                  <IconDots size={18} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  icon={<IconInfoCircle size={12} />}
                  onClick={() => setMetadataModalOpen(true)}
                >
                  Details
                </Menu.Item>
                <Menu.Item
                  color="red"
                  icon={<IconTrash size={12} />}
                  onClick={() => openRemoveModal()}
                >
                  Supprimer
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Box>
        )}
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
