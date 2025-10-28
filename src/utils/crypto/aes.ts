export const encryptAes =
  (key: Uint8Array, iv: Uint8Array) =>
  async (bytes: Uint8Array): Promise<Uint8Array> => {
    if (bytes.length < 512) {
      console.log("unjpadded bytes length", bytes.byteLength);

      const bytes16 = 16 - (bytes.length % 16);
      if (bytes16 < 16) {
        const liTmp = bytes;
        bytes = new Uint8Array(liTmp.length + bytes16).fill(0);
        bytes.set(liTmp);
      }
    }

    const sKey = await crypto.subtle.importKey(
      "raw",
      key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength),
      { name: "AES-CBC" },
      false,
      ["encrypt", "decrypt"]
    );

    const encryptedBytes = await crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength),
      },
      sKey,
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    );

    console.log("bytes length", bytes.byteLength);
    console.log("encryptedBytes length", encryptedBytes.byteLength);

    // remove the last 16 bytes which is a padding
    return new Uint8Array(encryptedBytes.slice(0, -16));
  };

export const decryptAes =
  (key: Uint8Array, iv: Uint8Array) =>
  async (encryptedBytes: Uint8Array): Promise<Uint8Array> => {
    const sKey = await crypto.subtle.importKey(
      "raw",
      key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength),
      { name: "AES-CBC", length: 128 },
      false,
      ["encrypt", "decrypt"]
    );

    // Add padding back to the encrypted bytes.
    // Todo: this is not the correct way to do it
    const paddedEncryptedBytes = new Uint8Array(encryptedBytes.length + 16);
    paddedEncryptedBytes.set(encryptedBytes);

    const decryptedBytes = await crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength),
        length: 128,
      },
      sKey,
      paddedEncryptedBytes.buffer.slice(
        paddedEncryptedBytes.byteOffset,
        paddedEncryptedBytes.byteOffset + paddedEncryptedBytes.byteLength
      )
    );

    return new Uint8Array(decryptedBytes);
  };
