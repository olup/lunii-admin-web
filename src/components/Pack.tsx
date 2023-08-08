import { ActionIcon, Badge, Box, Paper, Space, Text } from "@mantine/core";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";
import { FC } from "react";
import { PackMetadata } from "../utils/types";

export const Pack: FC<{
  pack: PackMetadata;
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
        <Badge>{pack.uuid}</Badge>
        <Text>{pack.title}</Text>
        <Text lineClamp={1} color="gray">
          {pack.description}
        </Text>
      </Box>
    </Paper>
  );
};
