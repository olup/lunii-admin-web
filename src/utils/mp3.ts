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
