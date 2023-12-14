import { state } from "../../store";
import { encryptXxtea } from "../crypto/xxtea";

export const v2GenerateBtBinary = (
  riBinaryEncrypted: Uint8Array,
  specificKey: Uint8Array
) => {
  const firstBlockLength = Math.min(64, riBinaryEncrypted.length);
  const firstBlock = riBinaryEncrypted.subarray(0, firstBlockLength);
  const block = encryptXxtea(specificKey)(firstBlock);
  if (block === null) {
    throw new Error("Ciphered block is null");
  }
  return block;
};

export const v3GenerateBtBinary = async () => {
  const device = state.device.peek();
  if (device.version !== "V3") throw new Error("Device is not V3");
  return device.btBin;
};
