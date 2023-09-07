import { computeSpecificKeyFromUUID } from "../cipher";

export type Device = {
  uuid: Uint8Array;
  uuidHex: string;
  specificKey: Uint8Array;
  serialNumber: string;
  firmwareVersion: string;
};

export const detectVersion = (buffer: ArrayBuffer) => {
  const view = new DataView(buffer);
  return view.getInt16(0, true);
};

const getV3DeviceInfo = (buffer: ArrayBuffer): Device => {
  const firmwareVersionBytes: Uint8Array = new Uint8Array(buffer.slice(2, 24));
  const firmwareVersion: string = new TextDecoder()
    .decode(firmwareVersionBytes)
    .replace(/\00/g, "");

  const serialNumberBytes: Uint8Array = new Uint8Array(buffer.slice(24, 48));
  const serialNumber: string = new TextDecoder()
    .decode(serialNumberBytes)
    .replace(/\00/g, "");

  const uuid: Uint8Array = new Uint8Array(buffer.slice(64, 112));

  console.log({
    firmwareVersion,
    serialNumber,
    uuid,
  });

  return {
    uuid,
    uuidHex: "",
    serialNumber,
    firmwareVersion,
    specificKey: computeSpecificKeyFromUUID(uuid),
  } as Device;
};

const getV2DeviceInfo = (buffer: ArrayBuffer): Device => {
  const view = new DataView(buffer);

  const firmwareVersionMajor = view.getInt16(6, true);
  const firmwareVersionMinor = view.getInt16(8, true);

  console.log(firmwareVersionMajor, firmwareVersionMinor);

  // Manually extract a 64-bit integer using two 32-bit parts (big-endian byte order)
  const highBits = view.getInt32(10, false); // Assuming offset is 10
  const lowBits = view.getInt32(14, false); // Assuming offset is 14

  // Combine the two 32-bit parts into a single 64-bit integer
  const serialNumberRaw = (BigInt(highBits) << 32n) + BigInt(lowBits);

  // Convert the serial number to a formatted string
  const serialNumber = serialNumberRaw.toString().padStart(14, "0");

  const uuid = new Uint8Array(buffer.slice(256, 256 + 256));

  // convert to hex
  let uuidHex = "";
  for (const byte of uuid) {
    uuidHex += byte.toString(16).padStart(2, "0"); // Convert byte to two-digit hexadecimal
  }

  const specificKey = computeSpecificKeyFromUUID(uuid);

  return {
    uuid,
    uuidHex,
    serialNumber,
    firmwareVersion: `${firmwareVersionMajor}.${firmwareVersionMinor}}`,
    specificKey,
  } as Device;
};

export const getDeviceInfo = async (luniiHandle: FileSystemDirectoryHandle) => {
  console.log("getting device info");

  const deviceInfoHandle = await luniiHandle.getFileHandle(".md");
  const deviceInfo = await deviceInfoHandle.getFile();
  const buffer = await deviceInfo.arrayBuffer();
  const mdVersion = detectVersion(buffer);

  switch (mdVersion) {
    // Lunii V3
    case 6:
      return getV3DeviceInfo(buffer);
    // Lunii V2 (hopefully)
    default:
      return getV2DeviceInfo(buffer);
  }
};
