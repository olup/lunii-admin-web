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
      key,
      { name: "AES-CBC" },
      false,
      ["encrypt", "decrypt"]
    );

    const encryptedBytes = await crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv,
      },
      sKey,
      bytes
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
      key,
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
        iv,
        length: 128,
      },
      sKey,
      paddedEncryptedBytes
    );

    return new Uint8Array(decryptedBytes);
  };
