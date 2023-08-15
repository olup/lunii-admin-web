import {
  Box,
  Button,
  Code,
  Flex,
  Image,
  Modal,
  Space,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck } from "@tabler/icons-react";
import { FC } from "react";
import {
  useGetPackFirstRasterQuery,
  useGetPacksQuery,
  useSavePackMetadataMutation,
} from "../queries";
import { uuidToRef } from "../utils/generators";
import { PackMetadata } from "../utils/lunii/types";

export const PackMetadataModal: FC<{
  packUuid: string;
  onClose: () => void;
}> = ({ packUuid, onClose }) => {
  const { data: imageUint8 } = useGetPackFirstRasterQuery(packUuid);

  // get pack details from the list of all pack (should be cached)
  const { data } = useGetPacksQuery();
  const pack = data?.find((pack) => pack.uuid === packUuid);

  const form = useForm({
    initialValues: {
      title: pack?.metadata?.title || "",
      description: pack?.metadata?.description || "",
    },
  });

  const { mutate: saveMetadata, isLoading } = useSavePackMetadataMutation();

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
      <Code>{pack.uuid}</Code>
      <TextInput label="Titre" {...form.getInputProps("title")} />
      <Space h={10} />
      <Textarea
        autosize
        label="Description"
        {...form.getInputProps("description")}
      />
      <Space h={10} />
      <Flex justify="flex-end">
        <Button
          disabled={!form.isDirty()}
          color="green"
          loading={isLoading}
          leftIcon={<IconCheck size="1rem" />}
          onClick={async () => {
            const metadata: PackMetadata = {
              title: form.values.title,
              description: form.values.description,
              packType: pack.metadata?.packType || "unknown",
              uuid: pack.metadata?.uuid || pack.uuid,
              ref: pack.metadata?.ref || uuidToRef(pack.uuid),
            };
            await saveMetadata({
              uuid: pack.uuid,
              metadata,
              shouldCreate: true,
            });
            form.resetDirty();
          }}
        >
          Enregistrer
        </Button>
      </Flex>
    </Modal>
  );
};
