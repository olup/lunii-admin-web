import {
  Button,
  Center,
  Code,
  Flex,
  Overlay,
  Paper,
  Progress,
  Space,
  Text,
} from "@mantine/core";
import { IconClockCog } from "@tabler/icons-react";
import { useState } from "react";
import { state } from "../store";
import { TetrisBox } from "./Tetris";

const stepToLabel = (step: string) => {
  switch (step) {
    case "UNZIPPING":
      return "Extraction du pack";
    case "PREPARING":
      return "Préparation des fichiers";
    case "CONVERTING":
      return "Conversion des fichiers audio";
    case "COPYING":
      return "Copie sur l'appareil";
    default:
      return "Installation en cours";
  }
};
export const InstallModal = () => {
  const [showTetris, setShowTetris] = useState(false);

  const installation = state.installation.use();
  const audioProgress = installation.audioFileGenerationProgress;
  const audioProgressPercent =
    audioProgress.totalCount !== 0
      ? (audioProgress.doneCount / audioProgress.totalCount) * 100
      : 0;

  if (installation.isInstalling)
    return (
      <Overlay blur={3}>
        <Space h={100} />
        <Center>
          <Paper shadow="md" p="lg" radius="sm" w={500} withBorder>
            <Text>
              Installation du pack{" "}
              {installation.packInstallationProgress.doneCount + 1} /{" "}
              {installation.packInstallationProgress.totalCount}
            </Text>
            {installation.step !== "UNZIPPING" && (
              <Text>
                <Code>{installation.pack?.title}</Code>
              </Text>
            )}
            <Space h={10} />
            <Flex>
              <IconClockCog />
              <Space w={5} />
              <Text>{stepToLabel(installation.step)}</Text>
            </Flex>
            <Space h={10} />

            {installation.step === "CONVERTING" ? (
              <>
                <Text>
                  <Code>
                    {audioProgress.doneCount} sur {audioProgress.totalCount}{" "}
                    fichiers
                  </Code>
                </Text>
                <Space h={10} />
                <Progress
                  h={10}
                  value={audioProgress.conversionProgress}
                  radius="xs"
                />
                <Space h={10} />
                <Progress
                  h={10}
                  animate
                  value={audioProgressPercent}
                  radius="xs"
                />
              </>
            ) : (
              <Progress h={10} animate value={100} radius="xs" />
            )}

            <Space h={10} />
            <Center>
              <Button
                size="xs"
                variant="subtle"
                onClick={() => setShowTetris(!showTetris)}
              >
                Un peu long ? Essayez un Tetris
              </Button>
            </Center>
            {showTetris && (
              <Center>
                <Space h={10} />
                <TetrisBox />
              </Center>
            )}
          </Paper>
        </Center>
      </Overlay>
    );
  else return null;
};
