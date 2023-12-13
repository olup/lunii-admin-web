import { computeSpecificKeyFromUUID } from "../cipher";

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
  keyPackReference: {
    uuid: string;
    bt: Uint8Array;
    key: Uint8Array;
    iv: Uint8Array;
  } | null;
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

  const specificKey = computeSpecificKeyFromUUID(uuid);

  return {
    version: "V2",
    uuid,
    serialNumber,
    firmwareVersion,
    specificKey,
  } as DeviceV2;
};

const getDeviceInfoV3 = (mdFile: Uint8Array): DeviceV3 => {
  const firmwareVersion = new TextDecoder("utf-8").decode(
    mdFile.slice(2, 2 + 6)
  );
  const serialNumber = new TextDecoder("utf-8").decode(
    mdFile.slice(26, 26 + 24)
  );

  return {
    version: "V3",
    serialNumber,
    firmwareVersion,
    keyPackReference: null,
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
};
