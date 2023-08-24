import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { state } from "../../store";

const ffmpeg = new FFmpeg();

ffmpeg.on("progress", (p) => {
  state.installation.audioFileGenerationProgress.conversionProgress.set(
    p.progress * 100
  );
});

const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.2/dist/esm";
const loadFFmpeg = async () => {
  console.log("Loading ffmpeg");
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    workerURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.worker.js`,
      "text/javascript"
    ),
  });
  console.log("FFmpeg loaded");
  state.isFfmpegLoaded.set(true);
};

loadFFmpeg();

// convert audio to mp3 44100Hz 129khz mono
export async function convertAudioToMP3(inputFile: File): Promise<Uint8Array> {
  await ffmpeg.writeFile(inputFile.name, await fetchFile(inputFile));
  await ffmpeg.exec([
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
    "output.mp3",
  ]);
  const data = (await ffmpeg.readFile("output.mp3")) as Uint8Array;

  // cleaning
  await ffmpeg.deleteFile(inputFile.name);
  await ffmpeg.deleteFile("output.mp3");

  // control
  console.log(await ffmpeg.listDir("."));

  return data;
}
