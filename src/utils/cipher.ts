import {
  decryptUint32Array,
  encryptXXTEA,
  toUint32Array,
  toUint8Array,
} from "./crypto/xxtea";

const key: Uint8Array = new Uint8Array([
  0x91, 0xbd, 0x7a, 0x0a, 0xa7, 0x54, 0x40, 0xa9, 0xbb, 0xd4, 0x9d, 0x6c, 0xe0,
  0xdc, 0xc0, 0xe3,
]);

const keyUint32 = toUint32Array(key, false);

export function cipherFirstBlockCommonKey(data: Uint8Array): Uint8Array {
  const cipheredData = new Uint8Array(data);
  const firstBlockLength = Math.min(512, data.length);
  const firstBlock = data.subarray(0, firstBlockLength);

  const encryptedBlock = encryptXXTEA(firstBlock, key);

  if (encryptedBlock === null) {
    throw new Error("Encrypted block is null");
  }

  cipheredData.set(encryptedBlock);
  return cipheredData;
}

export function decipherFirstBlockCommonKey(data: Uint8Array): Uint8Array {
  const firstBlockLength = Math.min(512, data.length);
  const firstBlock = data.subarray(0, firstBlockLength);
  const dataInt = toUint32Array(firstBlock);
  const encryptedIntData = decryptUint32Array(dataInt, keyUint32);
  const decryptedBlock = toUint8Array(encryptedIntData);
  if (decryptedBlock === null) {
    throw new Error("Decrypted block is null");
  }
  const dataOut = new Uint8Array(data);
  dataOut.set(decryptedBlock);
  return dataOut;
}

export function computeSpecificKeyFromUUID(uuid: Uint8Array): Uint8Array {
  const specificKey = decipherFirstBlockCommonKey(uuid);
  const reorderedSpecificKey = new Uint8Array([
    specificKey[11],
    specificKey[10],
    specificKey[9],
    specificKey[8],
    specificKey[15],
    specificKey[14],
    specificKey[13],
    specificKey[12],
    specificKey[3],
    specificKey[2],
    specificKey[1],
    specificKey[0],
    specificKey[7],
    specificKey[6],
    specificKey[5],
    specificKey[4],
  ]);
  return reorderedSpecificKey;
}
