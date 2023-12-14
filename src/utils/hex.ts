export function hexStringToUint8Array(hexString: string): Uint8Array {
  const byteArray = new Uint8Array(hexString.length / 2);

  for (let i = 0; i < byteArray.length; i++) {
    byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }

  return byteArray;
}

export function uint8ArrayToHexString(uint8Array: Uint8Array): string {
  return Array.from(uint8Array, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}
