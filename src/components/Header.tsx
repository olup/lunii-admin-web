import { ActionIcon, Button, Flex, Space } from "@mantine/core";
import {
  IconBrandDiscordFilled,
  IconBrandGithubFilled,
  IconExternalLink,
  IconUpload,
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "react-query";
import { state } from "../store";
import { installPack } from "../utils/lunii/installPack";

export const Header = () => {
  const client = useQueryClient();

  const { mutate: doInstallPack } = useMutation({
    mutationFn: async () => {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ accept: { "application/zip": [".zip"] } }],
        multiple: false,
      });
      const device = state.device.peek();
      if (!device) return;
      await installPack(fileHandle, device.specificKey);
      await client.invalidateQueries("packs");
    },

    onSettled: () => {
      client.invalidateQueries("packs");
    },
  });

  return (
    <Flex py={5}>
      <Button
        leftIcon={<IconUpload size={18} />}
        onClick={() => doInstallPack()}
      >
        Installer un pack
      </Button>
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
