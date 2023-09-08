import { createFFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { state } from "../../store";
import { hasId3Tags, readMP3Header } from "../mp3";
const ffmpeg = createFFmpeg({
  progress: (p) => {
    state.installation.audioFileGenerationProgress.conversionProgress.set(
      p.ratio * 100
    );
  },
});

const loadFFmpeg = async () => {
  console.log("Loading ffmpeg");
  await ffmpeg.load();
  console.log("FFmpeg loaded");
  state.isFfmpegLoaded.set(true);
};

loadFFmpeg();

const isPropperAudioFormat = (byteArray: Uint8Array) => {
  if (hasId3Tags(byteArray)) return false;
  const details = readMP3Header(byteArray);

  if (details === null) return false;
  if (details.channelCount !== 1) return false;
  if (details.frameRate !== 44100) return false;

  // todo check CBR mode - here we just assume it

  return true;
};

// convert audio to mp3 44100Hz 129khz mono
export async function convertAudioToMP3(inputFile: File): Promise<Uint8Array> {
  if (inputFile.type !== "audio/mpeg") {
    const byteArray = new Uint8Array(await inputFile.arrayBuffer());
    if (isPropperAudioFormat(byteArray)) {
      console.log("File is already in the correct format, copying as-is");
      return byteArray;
    }
  }

  await ffmpeg.FS("writeFile", inputFile.name, await fetchFile(inputFile));
  await ffmpeg
    .run(
      "-i",
      inputFile.name,
      "-map",
      "0:a",
      "-ar",
      "44100",
      "-ac",
      "1",
      "-b:a",
      "64k",
      "-map_metadata",
      "-1",
      "-write_xing",
      "0",
      "-id3v2_version",
      "0",
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
