import { observable } from "@legendapp/state";
import { Device } from "./utils/lunii/deviceInfo";
import { PackMetadata } from "./utils/lunii/types";

export const state = observable({
  luniiHandle: null as FileSystemDirectoryHandle | null,
  device: null as Device | null,
  isFfmpegLoaded: false,

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
