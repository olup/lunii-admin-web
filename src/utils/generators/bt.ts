import { state } from "../../store";
import { encryptXxtea } from "../crypto/xxtea";
import { getFileHandleFromPath } from "../fs";

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
  const deviceHandle = state.luniiHandle.peek();
  const keyPackReference = state.keyPackReference.peek();
  if (!keyPackReference) throw new Error("No key pack reference");

  const keyPackUuid = keyPackReference.uuid;

  const btHandle = await getFileHandleFromPath(
    deviceHandle,
    `.content/${keyPackUuid.slice(-8)}/bt`
  );
  const btBinary = await btHandle.getFile();
  return new Uint8Array(await btBinary.arrayBuffer());
};
