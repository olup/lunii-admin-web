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
    audioFileGenerationProgress: [0, 0],
    imageFileGenerationProgress: [0, 0],
    step: "" as "" | "PREPARING" | "CONVERTING" | "COPYING",
  },
});
