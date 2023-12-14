import { decryptXxtea } from "./crypto/xxtea";

export const v2CommonKey: Uint8Array = new Uint8Array([
  0x91, 0xbd, 0x7a, 0x0a, 0xa7, 0x54, 0x40, 0xa9, 0xbb, 0xd4, 0x9d, 0x6c, 0xe0,
  0xdc, 0xc0, 0xe3,
]);

export async function encryptFirstBlock(
  data: Uint8Array,
  encrypt: (data: Uint8Array) => Promise<Uint8Array | null>,
  size = 512
): Promise<Uint8Array> {
  console.log("datalength", data.length);

  const firstBlockLength = Math.min(size, data.length);
  const firstBlock = data.subarray(0, firstBlockLength);

  const encryptedBlock = await encrypt(firstBlock);

  if (encryptedBlock === null) {
    throw new Error("Encrypted block is null");
  }

  if (encryptedBlock.length > data.length) return encryptedBlock;

  const output = new Uint8Array(data);
  output.set(encryptedBlock);

  return output;
}

export function decryptFirstBlock(
  data: Uint8Array,
  decrypt: (data: Uint8Array) => Uint8Array | null,
  size = 512
): Uint8Array {
  const firstBlockLength = Math.min(size, data.length);
  const firstBlock = data.subarray(0, firstBlockLength);
  const decryptedBlock = decrypt(firstBlock);

  if (decryptedBlock === null) {
    throw new Error("Decrypted block is null");
  }
  const dataOut = new Uint8Array(data);
  dataOut.set(decryptedBlock);
  return dataOut;
}

export function v2ComputeSpecificKeyFromUUID(uuid: Uint8Array): Uint8Array {
  const specificKey = decryptFirstBlock(uuid, decryptXxtea(v2CommonKey)); // todo
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
