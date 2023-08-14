import { Box, Image, Modal, Space, TextInput, Textarea } from "@mantine/core";
import { FC } from "react";
import { useGetPackFirstRasterQuery, useGetPacksQuery } from "../queries";
import { uuidToRef } from "../utils/generators";

export const PackMetadataModal: FC<{
  packUuid: string;
  onClose: () => void;
}> = ({ packUuid, onClose }) => {
  const { data: imageUint8 } = useGetPackFirstRasterQuery(packUuid);

  // get pack details from the list of all pack (should be cached)
  const { data } = useGetPacksQuery();
  const pack = data?.find((pack) => pack.uuid === packUuid);

  if (!pack) return null;

  return (
    <Modal
      overlayProps={{
        blur: 3,
      }}
      opened={true}
      onClose={onClose}
      title={`Detail du pack ` + uuidToRef(pack.uuid)}
    >
      {imageUint8 && (
        <Box p={10} px={40}>
          <Image
            radius="md"
            src={URL.createObjectURL(new Blob([imageUint8]))}
            style={{ width: "100%", height: "auto" }}
          />
        </Box>
      )}
      <TextInput readOnly label="Titre" value={pack.metadata?.title} />
      <Space h={10} />
      <Textarea
        readOnly
        autosize
        label="Description"
        value={pack.metadata?.description}
      />
    </Modal>
  );
};
