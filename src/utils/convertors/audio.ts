import { createFFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { state } from "../../store";
import { parseBlob } from "music-metadata-browser";

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

const isPropperAudioFormat = async (inputFile: File) => {
  if (inputFile.type !== "audio/mpeg") return false;

  const details = await parseBlob(inputFile);
  if (details.format.codec !== "MPEG 1 Layer 3") return false;
  if (details.format.sampleRate != 44100) return false;
  if (details.format.numberOfChannels != 1) return false;
  if (details.format.codecProfile !== "CBR") return false;

  console.log(details.native);

  if (details.native) return false;
  return true;
};

// convert audio to mp3 44100Hz 129khz mono
export async function convertAudioToMP3(inputFile: File): Promise<Uint8Array> {
  // check if file is already of proper format
  if (await isPropperAudioFormat(inputFile)) {
    console.log("File is already of proper format - copying as-is");
    return new Uint8Array(await inputFile.arrayBuffer());
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
