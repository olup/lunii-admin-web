import { observable } from "@legendapp/state";
import { PackMetadata } from "./utils/lunii/types";
import {
  configureObservablePersistence,
  persistObservable,
} from "@legendapp/state/persist";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { DeviceV2, DeviceV3 } from "./utils/lunii/deviceInfo";

export const state = observable({
  luniiHandle: null as FileSystemDirectoryHandle | null,
  device: null as DeviceV2 | DeviceV3 | null,
  keyPackReference: null as {
    uuid: string;
    key: string;
    iv: string;
  } | null,

  isFfmpegLoaded: false,
  colorScheme: "light" as "light" | "dark",

  installation: {
    isInstalling: false,
    packInstallationProgress: {
      totalCount: 0,
      doneCount: 0,
    },
    pack: null as PackMetadata | null,
    audioFileGenerationProgress: {
      conversionProgress: 0,
      totalCount: 0,
      doneCount: 0,
    },
    step: "" as "" | "UNZIPPING" | "PREPARING" | "CONVERTING" | "COPYING",
  },
});

// reset installation values for the pack
export const resetPackInstallationState = () => {
  state.installation.assign({
    pack: null,
    audioFileGenerationProgress: {
      conversionProgress: 0,
      totalCount: 0,
      doneCount: 0,
    },
    step: "",
  });
};

// reset installation values for the complete process (multiple packs)
export const resetInstallationState = () => {
  state.installation.set({
    packInstallationProgress: {
      totalCount: 0,
      doneCount: 0,
    },
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

export const switchColorScheme = () => {
  state.colorScheme.set(
    state.colorScheme.peek() === "light" ? "dark" : "light"
  );
};

// MAnage persistence of the theme

configureObservablePersistence({
  persistLocal: ObservablePersistLocalStorage,
});

persistObservable(state.colorScheme, {
  local: "colorScheme",
});
