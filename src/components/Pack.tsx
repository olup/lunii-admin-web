import {
  ActionIcon,
  Badge,
  Box,
  Flex,
  Paper,
  Space,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";
import { FC } from "react";
import { PackShell } from "../utils/packs";

export const Pack: FC<{
  pack: PackShell;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}> = ({ pack, onMoveDown, onMoveUp }) => {
  return (
    <Paper display="flex" p={10} shadow="xs" withBorder mb={10}>
      <Box>
        <ActionIcon variant="subtle" color="blue" onClick={onMoveUp}>
          <IconArrowUp size={18} />
        </ActionIcon>
        <Space h={5} />
        <ActionIcon variant="subtle" color="blue" onClick={onMoveDown}>
          <IconArrowDown size={18} />
        </ActionIcon>
      </Box>
      <Space w={10} />
      <Box>
        <Flex>
          <Badge>{pack.uuid}</Badge>
          {!pack.metadata ? (
            <Tooltip
              openDelay={500}
              multiline
              width={300}
              label={`Vous pouvez importer les métadonnées depuis le Lunii Store ou la base de donnée de STUdio. A faire une fois. (Coming soon)`}
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
    </Paper>
  );
};
