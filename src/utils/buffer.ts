export const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const { buffer, byteOffset, byteLength } = bytes;

  if (buffer instanceof ArrayBuffer) {
    if (byteOffset === 0 && byteLength === buffer.byteLength) {
      return buffer;
    }
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }

  // Fallback for SharedArrayBuffer or unknown implementations: copy into a fresh ArrayBuffer
  return bytes.slice().buffer;
};
