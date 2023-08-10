import { Asset } from ".";
import { asciiStringToUint8Array } from "..";

export const generateBinaryFromAssetIndex = (assets: Asset[]) => {
  let bin = "";
  for (let i = 0; i < assets.length; i++) {
    const path = "000\\" + i.toString().padStart(8, "0");
    bin += path;
  }
  return asciiStringToUint8Array(bin);
};
