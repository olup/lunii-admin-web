import { observable } from "@legendapp/state";
import { Device } from "./utils/lunii/deviceInfo";

export const state = observable({
  luniiHandle: null as FileSystemDirectoryHandle | null,
  device: null as Device | null,
  isFfmpegLoaded: false,
});
