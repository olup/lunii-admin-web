import { cipherBlockSpecificKey } from "../cipher";

export const generateBtBinary = (
  riBinaryEncrypted: Uint8Array,
  specificKey: Uint8Array
) => {
  const firstBlockLength = Math.min(64, riBinaryEncrypted.length);
  const firstBlock = riBinaryEncrypted.subarray(0, firstBlockLength);
  const block = cipherBlockSpecificKey(firstBlock, specificKey);
  if (block === null) {
    throw new Error("Ciphered block is null");
  }
  return block;
};
