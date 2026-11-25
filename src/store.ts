import { observable } from "@legendapp/state";
import { PackMetadata } from "./utils/lunii/types";
import { DeviceV2, DeviceV3 } from "./utils/lunii/deviceInfo";

export const state = observable({
  luniiHandle: null as FileSystemDirectoryHandle | null,
  device: null as DeviceV2 | DeviceV3 | null,
  keyPackReference: null as {
    uuid: string;
    key: string;
    iv: string;
  } | null,

  isWriting: false,
  connectionId: "",

  installation: {
    results: [] as {
      name: string;
      status: "success" | "error";
      message: string;
    }[],
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
    step: "" as
      | ""
      | "UNZIPPING"
      | "PREPARING"
      | "CONVERTING"
      | "COPYING"
      | "IMAGES"
      | "AUDIO_ENGINE",
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
    results: [],
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
