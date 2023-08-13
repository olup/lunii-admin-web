import { observable } from "@legendapp/state";
import { Device } from "./utils/lunii/deviceInfo";
import { PackMetadata } from "./utils/lunii/types";
import {
  configureObservablePersistence,
  persistObservable,
} from "@legendapp/state/persist";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

export const state = observable({
  luniiHandle: null as FileSystemDirectoryHandle | null,
  device: null as Device | null,
  isFfmpegLoaded: false,
  colorScheme: "light" as "light" | "dark",

  installation: {
    isInstalling: false,
    pack: null as PackMetadata | null,
    audioFileGenerationProgress: {
      conversionProgress: 0,
      totalCount: 0,
      doneCount: 0,
    },
    step: "" as "" | "UNZIPPING" | "PREPARING" | "CONVERTING" | "COPYING",
  },
});

export const resetInstallationState = () => {
  state.installation.set({
    isInstalling: false,
    pack: null,
    audioFileGenerationProgress: {
      conversionProgress: 0,
      totalCount: 0,
      doneCount: 0,
    },
    step: "",
  });
};

// MAnage persistence of the theme

export const switchColorScheme = () => {
  state.colorScheme.set(
    state.colorScheme.peek() === "light" ? "dark" : "light"
  );
};

configureObservablePersistence({
  persistLocal: ObservablePersistLocalStorage,
});

persistObservable(state.colorScheme, {
  local: "colorScheme",
});
