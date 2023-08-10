export const getLuniiHandle = async () => {
  try {
    const dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    await dirHandle.getFileHandle(".pi");
    return dirHandle;
  } catch (e) {
    console.error(
      "Could not find the pack index file. Is that really a Lunii mount point?"
    );
  }
};

export function asciiStringToUint8Array(inputString: string) {
  const uint8Array = new Uint8Array(inputString.length);

  for (let i = 0; i < inputString.length; i++) {
    const asciiCode = inputString.charCodeAt(i);
    if (asciiCode > 127) {
      throw new Error("Input contains non-ASCII characters.");
    }
    uint8Array[i] = asciiCode;
  }

  return uint8Array;
}
