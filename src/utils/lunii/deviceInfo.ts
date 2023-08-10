import { computeSpecificKeyFromUUID } from "../cipher";

export type Device = {
  mountPoint: string;
  uuid: Uint8Array;
  uuidHex: string;
  specificKey: Uint8Array;
  serialNumber: string;
  firmwareVersionMajor: number;
  firmwareVersionMinor: number;
};

export const getDeviceInfo = async (luniiHandle: FileSystemDirectoryHandle) => {
  const deviceInfoHandle = await luniiHandle.getFileHandle(".md");
  const deviceInfo = await deviceInfoHandle.getFile();
  const buffer = await deviceInfo.arrayBuffer();

  const view = new DataView(buffer);

  const firmwareVersionMajor = view.getInt16(6, true);
  const firmwareVersionMinor = view.getInt16(8, true);

  // Manually extract a 64-bit integer using two 32-bit parts (big-endian byte order)
  const highBits = view.getInt32(10, false); // Assuming offset is 10
  const lowBits = view.getInt32(14, false); // Assuming offset is 14

  // Combine the two 32-bit parts into a single 64-bit integer
  const serialNumberRaw = (BigInt(highBits) << 32n) + BigInt(lowBits);

  // Convert the serial number to a formatted string
  const serialNumber = serialNumberRaw.toString().padStart(14, "0");

  const uuid = new Uint8Array(buffer.slice(256, 512));

  // convert to hex
  let uuidHex = "";
  for (const byte of uuid) {
    uuidHex += byte.toString(16).padStart(2, "0"); // Convert byte to two-digit hexadecimal
  }

  return {
    uuid,
    uuidHex,
    serialNumber,
    firmwareVersionMajor,
    firmwareVersionMinor,
    mountPoint: luniiHandle.name,
    specificKey: computeSpecificKeyFromUUID(uuid),
  } as Device;
};
