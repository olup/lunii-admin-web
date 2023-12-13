export async function encryptAes(
  fileChunk: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  // Ensure the key and IV lengths are appropriate for AES 128 CBC
  if (key.length !== 16 || iv.length !== 16) {
    throw new Error("Key and IV must be 16 bytes long for AES 128 CBC");
  }

  // Import key and IV as CryptoKey
  const importedKey = await crypto.subtle.importKey(
    "raw",
    key,
    "AES-CBC",
    false,
    ["encrypt"]
  );
  const importedIV = iv.buffer.slice(0, 16); // Take only the first 16 bytes of IV

  // Encrypt the file chunk
  const encryptedChunk = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: importedIV },
    importedKey,
    fileChunk
  );

  // Convert the result back to Uint8Array
  return new Uint8Array(encryptedChunk);
}
