import {
  Alert,
  Button,
  Code,
  Checkbox,
  Group,
  Image,
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import {
  useGetPackFirstRasterQuery,
  useSavePackMetadataMutation,
} from "../queries";
import { uuidToRef } from "../utils/generators";
import { toArrayBuffer } from "../utils/buffer";
import { PackShell } from "../utils/lunii/packs";
import { state } from "../store";
import { errorMessage } from "../device-operations";

export const PackMetadataModal = ({
  pack,
  onClose,
  blocked,
}: {
  pack: PackShell;
  onClose: () => void;
  blocked: boolean;
}) => {
  const image = useGetPackFirstRasterQuery(pack.uuid);
  const [imageUrl, setImageUrl] = useState<string>();
  const busy = state.isWriting.use();
  const [confirming, setConfirming] = useState(false);
  const [replaceInvalid, setReplaceInvalid] = useState(false);
  const cannotSave =
    pack.metadataError?.kind === "missing-content" ||
    (pack.metadataError?.kind === "invalid" && !replaceInvalid);
  const form = useForm({
    initialValues: {
      title: pack.metadata?.title || "",
      description: pack.metadata?.description || "",
    },
  });
  const save = useSavePackMetadataMutation();
  useEffect(() => {
    if (!image.data) return;
    const url = URL.createObjectURL(
      new Blob([toArrayBuffer(image.data)], { type: "image/bmp" }),
    );
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image.data]);
  function close() {
    if (save.isPending) return;
    if (!form.isDirty()) return onClose();
    if (confirming) return;
    setConfirming(true);
  }
  return (
    <>
      <Modal
        opened={!confirming}
        onClose={close}
        title="Les détails de l’histoire"
        centered
        size="md"
        closeButtonProps={{ "aria-label": "Fermer les détails" }}
        closeOnEscape={!save.isPending && !confirming}
        closeOnClickOutside={!save.isPending}
        withCloseButton={!save.isPending}
      >
        <form
          onSubmit={form.onSubmit(async (values) => {
            if (cannotSave || blocked) return;
            try {
              await save.mutateAsync({
                uuid: pack.uuid,
                metadata: {
                  ...pack.metadata,
                  ...values,
                  packType: pack.metadata?.packType || "unknown",
                  uuid: pack.uuid,
                  ref: uuidToRef(pack.uuid),
                },
              });
              form.resetDirty(values);
              notifications.show({
                title: "Modifications enregistrées",
                message: "Le titre et la description sont à jour.",
                color: "teal",
              });
            } catch {
              /* The mutation error remains visible beside the form. */
            }
          })}
        >
          <Stack>
            {pack.metadataError && (
              <Alert color="orange" title="Informations du pack indisponibles">
                {pack.metadataError.message}
              </Alert>
            )}
            {pack.metadataError?.kind === "invalid" && (
              <Checkbox
                checked={replaceInvalid}
                onChange={(event) =>
                  setReplaceInvalid(event.currentTarget.checked)
                }
                label="Remplacer les informations illisibles par ce titre et cette description"
              />
            )}
            {imageUrl && (
              <Image
                src={imageUrl}
                alt="Première image du pack"
                h={160}
                fit="contain"
                radius="md"
              />
            )}
            {image.isError && (
              <Text size="xs" c="dimmed">
                L’aperçu de cette histoire n’est pas disponible.
              </Text>
            )}
            <TextInput
              label="Titre"
              placeholder="Le nom de cette histoire"
              disabled={save.isPending}
              {...form.getInputProps("title")}
            />
            <Textarea
              label="Description"
              placeholder="Quelques mots pour s’en souvenir"
              autosize
              minRows={4}
              maxRows={10}
              disabled={save.isPending}
              {...form.getInputProps("description")}
            />
            <div>
              <Text size="xs" c="dimmed" mb={4}>
                Identifiant du pack
              </Text>
              <Code className="pack-id">{pack.uuid}</Code>
            </div>
            {save.isError && (
              <Alert color="red" role="alert" title="Enregistrement impossible">
                {errorMessage(save.error)}
              </Alert>
            )}
            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={close}
                disabled={save.isPending}
              >
                Fermer
              </Button>
              <Button
                type="submit"
                disabled={
                  !form.isDirty() ||
                  cannotSave ||
                  blocked ||
                  (busy && !save.isPending)
                }
                loading={save.isPending}
              >
                Enregistrer
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
      <Modal
        opened={confirming}
        onClose={() => setConfirming(false)}
        centered
        title="Quitter sans enregistrer ?"
        closeButtonProps={{ "aria-label": "Fermer la confirmation" }}
      >
        <Text size="sm">
          Vos modifications de titre et de description seront perdues.
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setConfirming(false)}>
            Continuer à modifier
          </Button>
          <Button color="red" onClick={onClose}>
            Quitter sans enregistrer
          </Button>
        </Group>
      </Modal>
    </>
  );
};
