import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Progress,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconCheck, IconDeviceGamepad2, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { resetInstallationState, state } from "../store";
import { TetrisBox } from "./Tetris";
const labels: Record<string, string> = {
  AUDIO_ENGINE: "Téléchargement et démarrage du moteur audio…",
  UNZIPPING: "Ouverture du fichier ZIP",
  PREPARING: "Préparation de l’histoire",
  IMAGES: "Préparation des images",
  CONVERTING: "Préparation des fichiers audio",
  COPYING: "Copie sur votre Lunii",
};
export const InstallModal = () => {
  const [showTetris, setShowTetris] = useState(false);
  const installation = state.installation.use();
  const running = installation.isInstalling;
  const results = installation.results;
  const audio = installation.audioFileGenerationProgress;
  const failed = results.some((result) => result.status === "error");
  const remaining =
    installation.packInstallationProgress.totalCount - results.length;
  const close = () => {
    if (!running) {
      resetInstallationState();
      setShowTetris(false);
    }
  };
  return (
    <Modal
      opened={running || results.length > 0}
      onClose={close}
      closeButtonProps={{
        "aria-label": "Fermer le résultat de l’installation",
      }}
      withCloseButton={!running}
      closeOnClickOutside={!running}
      closeOnEscape={!running}
      centered
      size="lg"
      title={
        running
          ? "Une nouvelle aventure arrive"
          : failed
            ? "Installation interrompue"
            : "Vos histoires sont prêtes"
      }
    >
      <Stack gap="lg">
        <div role="status" aria-live="polite">
          {running ? (
            <>
              <Badge variant="light" mb="sm">
                Pack {installation.packInstallationProgress.doneCount + 1} sur{" "}
                {installation.packInstallationProgress.totalCount}
              </Badge>
              <Title order={3} size="h4">
                {installation.pack?.title || "Préparation du pack…"}
              </Title>
              <Text c="dimmed" size="sm" mt="xs">
                {labels[installation.step] || "Préparation de l’installation"}
              </Text>
              {installation.step === "CONVERTING" && audio.totalCount > 0 ? (
                <>
                  <Progress
                    aria-label="Fichiers audio terminés"
                    mt="md"
                    value={(audio.doneCount / audio.totalCount) * 100}
                  />
                  <Text size="xs" c="dimmed" mt={6}>
                    {audio.doneCount} sur {audio.totalCount} fichiers audio
                  </Text>
                  <Progress
                    aria-label="Conversion du fichier audio actuel"
                    size="xs"
                    mt="sm"
                    value={audio.conversionProgress}
                  />
                </>
              ) : (
                <Progress
                  mt="md"
                  aria-label="Opération en cours"
                  value={100}
                  animated
                />
              )}
            </>
          ) : (
            <Text c="dimmed">
              {results.filter((result) => result.status === "success").length}{" "}
              pack(s) installé(s).
              {remaining > 0 &&
                ` ${remaining} pack(s) restant(s) n’ont pas été traités.`}
            </Text>
          )}
        </div>
        {running && (
          <Alert variant="light" color="teal">
            Gardez la Lunii branchée et cette page ouverte jusqu’à la fin de la
            copie.
          </Alert>
        )}
        {results.map((result, index) => (
          <Alert
            key={index}
            color={result.status === "error" ? "red" : "teal"}
            icon={
              result.status === "error" ? (
                <IconX size={18} />
              ) : (
                <IconCheck size={18} />
              )
            }
            title={result.name}
          >
            {result.message}
          </Alert>
        ))}
        {failed && (
          <Text size="sm">
            Fermez cette fenêtre. Si une récupération est nécessaire, elle sera
            proposée au-dessus de votre bibliothèque.
          </Text>
        )}
        {running && (
          <Button
            variant="subtle"
            leftSection={<IconDeviceGamepad2 size={19} />}
            onClick={() => setShowTetris(!showTetris)}
          >
            {showTetris ? "Masquer Tetris" : "Un peu de Tetris en attendant ?"}
          </Button>
        )}
        {running && showTetris && <TetrisBox />}
        {!running && !failed && (
          <Text size="sm">
            Éjectez la Lunii depuis votre ordinateur avant de la débrancher.
          </Text>
        )}
        {!running && (
          <Group justify="flex-end">
            <Button onClick={close}>Retour à mes histoires</Button>
          </Group>
        )}
      </Stack>
    </Modal>
  );
};
