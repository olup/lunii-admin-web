import { v2ComputeSpecificKeyFromUUID } from "../cipher";

export type mdFileVersion = "1" | "2" | "3";
export type modelVersion = "V2" | "V3";
export type DeviceV2 = {
  version: "V2";
  uuid: Uint8Array;
  specificKey: Uint8Array;
  serialNumber: string;
  firmwareVersion: string;
  stable: boolean;
};

export type DeviceV3 = {
  version: "V3";
  serialNumber: Uint8Array;
  firmwareVersion: string;
  btBin: Uint8Array;
  easKey: Uint8Array;
  iv: Uint8Array;
};

export const getDeviceModel = (mdFile: Uint8Array): mdFileVersion => {
  const view = new DataView(
    mdFile.buffer,
    mdFile.byteOffset,
    mdFile.byteLength
  );
  const mdVersion = view.getUint16(0, true);

  if (mdVersion === 1) {
    return "1";
  }
  if (mdVersion === 3) {
    return "2";
  }
  if (mdVersion === 6 || mdVersion === 7) {
    return "3";
  }

  throw new Error(`Unknown device model metadata version: ${mdVersion}`);
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
    stable: true,
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
  const view = new DataView(
    mdFile.buffer,
    mdFile.byteOffset,
    mdFile.byteLength
  );
  const mdVersion = view.getUint16(0, true);
  const firmwareVersion = new TextDecoder("utf-8")
    .decode(mdFile.slice(2, 2 + 6))
    .replace(/\0/g, "")
    .trim();

  const serialRaw = new TextDecoder("utf-8")
    .decode(mdFile.slice(26, 26 + 14))
    .replace(/\0/g, "");
  const serialDigits = serialRaw.match(/\d+/)?.[0] ?? "";
  if (!serialDigits) {
    throw new Error("Unable to parse device serial number");
  }

  const encoder = new TextEncoder();
  const serialBytesFull = encoder.encode(serialDigits);
  const serialBytes14 = new Uint8Array(14);
  serialBytes14.set(serialBytesFull.slice(0, 14));
  const serialBytes8 = new Uint8Array(8);
  serialBytes8.set(serialBytesFull.slice(0, 8));

  const keySection = mdFile.slice(64, 64 + 32);
  const deviceKey = new Uint8Array(64);

  if (mdVersion === 6) {
    deviceKey.set(serialBytes14, 0);
    deviceKey.set(serialBytes8, 24);
    deviceKey.set(keySection, 32);
  } else if (mdVersion === 7) {
    deviceKey.set(keySection, 0);
    deviceKey.set(serialBytes14, 32);
    deviceKey.set(serialBytes8, 56);
  } else {
    throw new Error(`Unsupported V3 metadata version: ${mdVersion}`);
  }

  const easKey = reverseUint8ArrayBlocks(deviceKey.slice(0, 16));
  const iv = reverseUint8ArrayBlocks(deviceKey.slice(16, 32));
  const btBin = deviceKey.slice(32);

  return {
    version: "V3",
    serialNumber: serialBytes14,
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
  const mdVersion = getDeviceModel(new Uint8Array(buffer));

  if (mdVersion === "1") {
    // this should be very very edge, as V1 should not be mountable
    const device = getDeviceInfoV2(new Uint8Array(buffer));
    device.stable = false;
    return device;
  }

  if (mdVersion === "2") {
    return getDeviceInfoV2(new Uint8Array(buffer));
  }
  if (mdVersion === "3") {
    return getDeviceInfoV3(new Uint8Array(buffer));
  }

  throw new Error("Unknown device model");
};
