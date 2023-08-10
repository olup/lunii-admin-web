import { createFFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const ffmpeg = createFFmpeg();

const loadFFmpeg = async () => {
  console.log("Loading ffmpeg");
  await ffmpeg.load();
  console.log("FFmpeg loaded");
};

loadFFmpeg();

// convert audio to mp3 44100Hz 129khz mono
export async function convertAudioToMP3(inputFile: File): Promise<Uint8Array> {
  await ffmpeg.FS("writeFile", inputFile.name, await fetchFile(inputFile));
  await ffmpeg.run(
    "-i",
    inputFile.name,
    "-ar",
    "44100",
    "-ac",
    "1",
    "-b:a",
    "128k",
    "output.mp3"
  );
  const data = (await ffmpeg.FS("readFile", "output.mp3")) as Uint8Array;
  ffmpeg.FS("unlink", "output.mp3");
  return data;
}
