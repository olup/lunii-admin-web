import { Box, Button } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { installPack } from "../utils/lunii/installPack";

export const Header = () => {
  const onInstallPack = async () => {
    const [fileHandle] = await window.showOpenFilePicker();
    await installPack(fileHandle);
  };

  return (
    <Box py={5}>
      <Button leftIcon={<IconUpload size={18} />} onClick={onInstallPack}>
        Installer un pack
      </Button>
    </Box>
  );
};
