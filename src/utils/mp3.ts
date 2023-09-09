// determine if the mp3 file contains ID3 tags
export const hasId3Tags = (mp3: Uint8Array) => {
  const id3Tag = mp3.slice(0, 3);
  return id3Tag[0] === 73 && id3Tag[1] === 68 && id3Tag[2] === 51;
};

export function readMP3Header(
  uint8Array: Uint8Array
): { channelCount: number; frameRate: number } | null {
  // Ensure the file starts with the MP3 header sync pattern (0xFF, 0xFB)
  if (uint8Array[0] !== 0xff || (uint8Array[1] & 0xe0) !== 0xe0) {
    console.error("The file does not start with the MP3 header sync pattern");
    return null;
  }

  // Extract channel count and frame rate from the header
  const channelCountIndex = (uint8Array[3] >> 6) & 0x03; // Bits 6-7
  const sampleRateIndex = (uint8Array[2] >> 2) & 0x03; // Bits 3-4

  const channelIndex = [2, 2, 2, 1];
  const sampleRates = [44100, 48000, 32000]; // Possible sample rates in Hz

  if (sampleRateIndex < 0 || sampleRateIndex >= sampleRates.length) {
    console.error("Invalid sample rate index in MP3 header");
    return null;
  }

  const frameRate = sampleRates[sampleRateIndex];
  const channelCount = channelIndex[channelCountIndex];

  return { channelCount, frameRate };
}

export function cleanMp3Header(uint8Array: Uint8Array): Uint8Array | null {
  let offset = 0;

  // Find the start of the first MP3 frame
  while (offset < uint8Array.length - 4) {
    if (
      uint8Array[offset] === 0xff &&
      (uint8Array[offset + 1] & 0xe0) === 0xe0
    ) {
      // This is the start of an MP3 frame
      break;
    } else {
      offset++;
    }
  }

  // Check if an MP3 frame was found
  if (offset >= uint8Array.length - 4) {
    return null; // No MP3 frame found
  }

  // Create a new Uint8Array with data starting from the first MP3 frame
  const newData = uint8Array.slice(offset);
  return newData;
}

export function isMP3CBR(
  uint8Array: Uint8Array,
  sampleRate: number,
  maxFrame?: number
): boolean {
  let offset = 0;
  const bitRates: number[] = [
    0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320,
  ];
  let frameCount = 0;
  let lastBitRate = 0;
  const tag = Date.now();
  console.time("isMP3CBR" + tag);

  console.log(uint8Array.length);

  while (
    offset < uint8Array.length - 4 &&
    (maxFrame === undefined || frameCount < maxFrame)
  ) {
    if (
      uint8Array[offset] === 0xff &&
      (uint8Array[offset + 1] & 0xe0) === 0xe0
    ) {
      // This is the start of an MP3 frame
      const bitRateIndex = (uint8Array[offset + 2] & 0xf0) >> 4;

      if (bitRateIndex === 0) {
        return false; // Invalid bit rate, not CBR
      }

      // in cse of bitrate code 15 (bad) we use the last bitrate in order to skip the frame and keep seeking.
      // this is not a perfect solution, it might not work.
      const bitRate = bitRates[bitRateIndex] || lastBitRate;

      // we'll ignore the first frame as it might be a LAME header
      // then check if the bitrate is consistent
      if (frameCount >= 2 && lastBitRate !== bitRate) {
        console.log("frameCount", frameCount);
        console.log("bitRate", bitRate);
        console.log("lastBitRate", lastBitRate);
        return false; // Inconsistent bit rate, not CBR
      }

      lastBitRate = bitRate;

      // Calculate frame size based on bit rate
      const frameSize = Math.floor((144 * (bitRate * 1000)) / sampleRate);

      offset += frameSize;
      frameCount++;
    } else {
      offset++;
    }
  }

  return true; // All frames checked and consistent, it's CBR
}
