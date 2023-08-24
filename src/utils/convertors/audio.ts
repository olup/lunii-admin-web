import { createFFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { state } from "../../store";
const baseURL = "https://unpkg.com/@ffmpeg/core@0.11.0/dist";

const ffmpeg = createFFmpeg({
  progress: (p) => {
    state.installation.audioFileGenerationProgress.conversionProgress.set(
      p.ratio * 100
    );
  },
  corePath: `${baseURL}/ffmpeg-core.js`,
  wasmPath: `${baseURL}/ffmpeg-core.wasm`,
  workerPath: `${baseURL}/ffmpeg-core.worker.js`,
});

const loadFFmpeg = async () => {
  console.log("Loading ffmpeg");
  await ffmpeg.load();
  console.log("FFmpeg loaded");
  state.isFfmpegLoaded.set(true);
};

loadFFmpeg();

// convert audio to mp3 44100Hz 129khz mono
export async function convertAudioToMP3(inputFile: File): Promise<Uint8Array> {
  await ffmpeg.FS("writeFile", inputFile.name, await fetchFile(inputFile));
  await ffmpeg
    .run(
      "-i",
      inputFile.name,
      "-ar",
      "44100",
      "-ac",
      "1",
      "-b:a",
      "128k",
      "-map_metadata",
      "-1",
      "output.mp3"
    )
    .catch((e) => {
      console.error(e);
      throw e;
    });
  const data = (await ffmpeg.FS("readFile", "output.mp3")) as Uint8Array;

  // cleaning
  await ffmpeg.FS("unlink", inputFile.name);
  await ffmpeg.FS("unlink", "output.mp3");

  return data;
}
