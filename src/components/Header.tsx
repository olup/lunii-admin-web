import { Box, Button } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { installPack } from "../utils/lunii/installPack";
import { state } from "../store";

export const Header = () => {
  const onInstallPack = async () => {
    const [fileHandle] = await window.showOpenFilePicker();
    const device = state.device.peek();
    if (!device) return;
    await installPack(fileHandle, device.specificKey);
  };

  return (
    <Box py={5}>
      <Button leftIcon={<IconUpload size={18} />} onClick={onInstallPack}>
        Installer un pack
      </Button>
    </Box>
  );
};
