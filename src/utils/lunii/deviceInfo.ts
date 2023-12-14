import { v2ComputeSpecificKeyFromUUID } from "../cipher";

export type modelVersion = "V2" | "V3";
export type DeviceV2 = {
  version: "V2";
  uuid: Uint8Array;
  specificKey: Uint8Array;
  serialNumber: string;
  firmwareVersion: string;
};

export type DeviceV3 = {
  version: "V3";
  serialNumber: string;
  firmwareVersion: string;
  btBin: Uint8Array;
  easKey: Uint8Array;
  iv: Uint8Array;
};

export const getDeviceModel = (mdFile: Uint8Array): modelVersion => {
  const modelKey = mdFile.slice(0, 2);

  if (modelKey[0] === 3 && modelKey[1] === 0) {
    return "V2";
  }
  if (modelKey[0] === 6 && modelKey[1] === 0) {
    return "V3";
  } else throw new Error("Unknown device model");
};

const getDeviceInfoV2 = (mdFile: Uint8Array): DeviceV2 => {
  const view = new DataView(mdFile.buffer);

  const firmwareVersionMajor = view.getInt16(6, true);
  const firmwareVersionMinor = view.getInt16(8, true);
  const firmwareVersion = `${firmwareVersionMajor}.${firmwareVersionMinor}`;

  // Manually extract a 64-bit integer using two 32-bit parts (big-endian byte order)
  const highBits = view.getInt32(10, false); // Assuming offset is 10
  const lowBits = view.getInt32(14, false); // Assuming offset is 14

  // Combine the two 32-bit parts into a single 64-bit integer
  const serialNumberRaw = (BigInt(highBits) << 32n) + BigInt(lowBits);

  // Convert the serial number to a formatted string
  const serialNumber = serialNumberRaw.toString().padStart(14, "0");

  const uuid = new Uint8Array(mdFile.slice(256, 256 + 256));

  const specificKey = v2ComputeSpecificKeyFromUUID(uuid);

  return {
    version: "V2",
    uuid,
    serialNumber,
    firmwareVersion,
    specificKey,
  } as DeviceV2;
};

function reverseUint8ArrayBlocks(inputArray: Uint8Array): Uint8Array {
  if (inputArray.length % 4 !== 0) {
    throw new Error("Input array length must be a multiple of 4.");
  }

  const resultArray = new Uint8Array(inputArray.length);

  for (let i = 0; i < inputArray.length; i += 4) {
    // Reverse the order of bytes within the block
    resultArray[i] = inputArray[i + 3];
    resultArray[i + 1] = inputArray[i + 2];
    resultArray[i + 2] = inputArray[i + 1];
    resultArray[i + 3] = inputArray[i];
  }

  return resultArray;
}

const getDeviceInfoV3 = async (mdFile: Uint8Array): Promise<DeviceV3> => {
  const firmwareVersion = new TextDecoder("utf-8").decode(
    mdFile.slice(2, 2 + 6)
  );
  const SNU = mdFile.slice(26, 26 + 24);
  const serialNumber = new TextDecoder("utf-8").decode(SNU);

  const btBin = mdFile.slice(64, 64 + 32);

  const easKeyRaw = SNU.slice(0, 16);
  const ivRaw = new Uint8Array(16).fill(0);

  const easKey = reverseUint8ArrayBlocks(easKeyRaw);
  const iv = reverseUint8ArrayBlocks(ivRaw);

  console.log("easKey", easKeyRaw, easKey);
  console.log("iv", ivRaw, iv);

  return {
    version: "V3",
    serialNumber,
    firmwareVersion,
    btBin,
    easKey,
    iv,
  } as DeviceV3;
};

export const getDeviceInfo = async (luniiHandle: FileSystemDirectoryHandle) => {
  const deviceInfoHandle = await luniiHandle.getFileHandle(".md");
  const deviceInfo = await deviceInfoHandle.getFile();
  const buffer = await deviceInfo.arrayBuffer();
  const model = getDeviceModel(new Uint8Array(buffer));

  if (model === "V2") {
    return getDeviceInfoV2(new Uint8Array(buffer));
  }
  if (model === "V3") {
    return getDeviceInfoV3(new Uint8Array(buffer));
  }

  throw new Error("Unknown device model");
};
