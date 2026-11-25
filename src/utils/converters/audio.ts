import { FFmpeg } from "@ffmpeg/ffmpeg";
import { state } from "../../store";
import { cleanMp3Header } from "../mp3";

let ready: Promise<FFmpeg> | undefined;
async function deadline<T>(
  task: Promise<T>,
  milliseconds: number,
  expired: () => void,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          expired();
          reject(new Error("Délai du moteur audio dépassé."));
        }, milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function download(
  url: string,
  type: string,
  signal: AbortSignal,
): Promise<string> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) controller.abort();
  let timer = setTimeout(abort, 30_000);
  const parts: ArrayBuffer[] = [];
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok || !response.body)
      throw new Error("Téléchargement audio indisponible.");
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(new Uint8Array(value).buffer);
      clearTimeout(timer);
      timer = setTimeout(abort, 30_000);
    }
    return URL.createObjectURL(new Blob(parts, { type }));
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}

async function loadFFmpeg() {
  if (ready) return ready;
  const ffmpeg = new FFmpeg();
  ffmpeg.on("progress", ({ progress }) =>
    state.installation.audioFileGenerationProgress.conversionProgress.set(
      Math.max(0, Math.min(100, progress * 100)),
    ),
  );
  ready = (async () => {
    const controller = new AbortController();
    const urls: string[] = [];
    state.installation.step.set("AUDIO_ENGINE");
    try {
      const base = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
      // Sequential downloads make ownership and revocation explicit on failure.
      const coreURL = await download(
        `${base}/ffmpeg-core.js`,
        "text/javascript",
        controller.signal,
      );
      urls.push(coreURL);
      const wasmURL = await download(
        `${base}/ffmpeg-core.wasm`,
        "application/wasm",
        controller.signal,
      );
      urls.push(wasmURL);
      await deadline(
        ffmpeg.load({ coreURL, wasmURL }, { signal: controller.signal }),
        60_000,
        () => {
          controller.abort();
          ffmpeg.terminate();
        },
      );
      return ffmpeg;
    } catch (error) {
      controller.abort();
      ffmpeg.terminate();
      ready = undefined;
      throw new Error(
        "Le moteur audio est indisponible. Vérifiez votre connexion puis relancez l’installation.",
        { cause: error },
      );
    } finally {
      urls.forEach((url) => URL.revokeObjectURL(url));
    }
  })();
  return ready;
}

// Require two complete MPEG-1 Layer III frames at the device's sample rate.
export function isLuniiMp3(bytes: Uint8Array) {
  let offset = 0;
  const bitrates = [
    0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320,
  ];
  for (let frame = 0; frame < 2; frame++) {
    if (
      offset + 4 > bytes.length ||
      bytes[offset] !== 0xff ||
      (bytes[offset + 1] & 0xfe) !== 0xfa
    )
      return false;
    const bitrate = bitrates[bytes[offset + 2] >> 4];
    if (
      !bitrate ||
      (bytes[offset + 2] & 0x0c) !== 0 ||
      bytes[offset + 3] >> 6 !== 3
    )
      return false;
    const size =
      Math.floor((144_000 * bitrate) / 44100) + ((bytes[offset + 2] >> 1) & 1);
    offset += size;
    if (offset > bytes.length) return false;
  }
  return true;
}

export async function convertAudioToMP3(inputFile: File): Promise<Uint8Array> {
  const bytes = new Uint8Array(await inputFile.arrayBuffer());
  const isMp3 =
    inputFile.type === "audio/mpeg" || /\.mp3$/i.test(inputFile.name);
  const cleaned = isMp3 ? cleanMp3Header(bytes) : null;
  if (cleaned && isLuniiMp3(cleaned)) return cleaned;
  const ffmpeg = await loadFFmpeg();
  state.installation.step.set("CONVERTING");
  state.installation.audioFileGenerationProgress.conversionProgress.set(0);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let renew = () => {};
  const stalled = new Promise<never>((_, reject) => {
    renew = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        ffmpeg.terminate();
        reject(new Error("La conversion ne progresse plus."));
      }, 120_000);
    };
    renew();
  });
  ffmpeg.on("progress", renew);
  try {
    return await Promise.race([
      stalled,
      (async () => {
        await ffmpeg.writeFile("input", bytes);
        const code = await ffmpeg.exec([
          "-i",
          "input",
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
          "output.mp3",
        ]);
        if (code !== 0) throw new Error("Conversion refusée.");
        const data = await ffmpeg.readFile("output.mp3");
        if (!(data instanceof Uint8Array) || !isLuniiMp3(data))
          throw new Error("Le fichier audio converti est invalide.");
        await ffmpeg.deleteFile("input");
        await ffmpeg.deleteFile("output.mp3");
        return data;
      })(),
    ]);
  } catch (error) {
    ffmpeg.terminate();
    ready = undefined;
    throw new Error(
      "La conversion audio a échoué ou n’a plus progressé depuis deux minutes. Vérifiez le fichier audio, puis réessayez.",
      { cause: error },
    );
  } finally {
    clearTimeout(timer);
    ffmpeg.off("progress", renew);
  }
}
