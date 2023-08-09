import { Box, Button } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { unzipToOpfs } from "../utils/zip";

export const Header = () => {
  const onInstallPack = async () => {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    await unzipToOpfs(file);
  };

  return (
    <Box py={5}>
      <Button leftIcon={<IconUpload size={18} />} onClick={onInstallPack}>
        Installer un pack
      </Button>
    </Box>
  );
};
