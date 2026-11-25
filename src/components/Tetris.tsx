import { Button, Group, Text } from "@mantine/core";
import { Suspense, lazy } from "react";
const Tetris = lazy(() => import("react-tetris"));
const noGlobalKeys = {};
export const TetrisBox = () => (
  <Suspense fallback={<Text size="sm">Chargement du jeu…</Text>}>
    <Tetris keyboardControls={noGlobalKeys}>
      {({ Gameboard, points, state, controller }) => (
        <div className="tetris">
          <div
            tabIndex={0}
            role="group"
            aria-label="Tetris : flèches pour déplacer et tourner, espace pour déposer, P pour mettre en pause"
            className="tetris-board"
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              const controls: Record<string, () => void> = {
                ArrowLeft: controller.moveLeft,
                ArrowRight: controller.moveRight,
                ArrowDown: controller.moveDown,
                ArrowUp: controller.flipClockwise,
                " ": controller.hardDrop,
                p: state === "PLAYING" ? controller.pause : controller.resume,
              };
              const action = controls[event.key];
              if (action) {
                event.preventDefault();
                action();
              }
            }}
          >
            <Gameboard />
          </div>
          <Text ta="center" size="sm" mt="sm">
            {points} points ·{" "}
            {state === "LOST"
              ? "Partie terminée"
              : state === "PAUSED"
                ? "En pause"
                : "À vous de jouer"}
          </Text>
          <Text ta="center" size="xs" c="dimmed" mt={5}>
            Cliquez sur le jeu. Flèches pour jouer, espace pour déposer.
          </Text>
          <Group justify="center" mt="sm">
            <Button
              size="xs"
              variant="default"
              onClick={
                state === "PLAYING" ? controller.pause : controller.resume
              }
            >
              {state === "PLAYING" ? "Pause" : "Reprendre"}
            </Button>
            <Button size="xs" variant="subtle" onClick={controller.restart}>
              Recommencer
            </Button>
          </Group>
        </div>
      )}
    </Tetris>
  </Suspense>
);
