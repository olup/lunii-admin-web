import { parse } from "yaml";
import { PackMetadata } from "./types";

export type PackShell = {
  uuid: string;
  metadata?: PackMetadata;
};

export const getPackUuids = async (luniHandle: FileSystemDirectoryHandle) => {
  const packIndexHandle = await luniHandle.getFileHandle(".pi");
  const packIndex = await packIndexHandle.getFile();
  const bytes = await packIndex.arrayBuffer();
  return readUUIDsFromBuffer(bytes);
};
export function readUUIDsFromBuffer(buffer: ArrayBuffer) {
  const uuids = [];
  for (let i = 0; i < buffer.byteLength; i += 16) {
    const uuidBytes = buffer.slice(i, i + 16);
    const uuid = bytesToUUID(new Uint8Array(uuidBytes));
    uuids.push(uuid);
  }
  return uuids;
}

function bytesToUUID(bytes: Uint8Array) {
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function uuidToBytes(uuid: string) {
  const hex = uuid.replace(/-/g, "");
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export const getPacksMetadata = async (
  luniiHandle: FileSystemDirectoryHandle
): Promise<PackShell[]> => {
  console.log("getPacksMetadata");
  const packUuids = await getPackUuids(luniiHandle);
  const contentHandle = await luniiHandle.getDirectoryHandle(".content");

  const packsMetadata = await Promise.all(
    packUuids.map(async (uuid) => {
      try {
        const packDirectoryHandle = await contentHandle.getDirectoryHandle(
          uuid.slice(-8).toUpperCase()
        );
        const packMetadataHandle = await packDirectoryHandle.getFileHandle(
          "md"
        );
        const packMetadataFile = await packMetadataHandle.getFile();
        const packMetadataYaml = await packMetadataFile.text();
        return {
          uuid,
          metadata: parse(packMetadataYaml) as PackMetadata,
        };
      } catch (e) {
        console.error(e);
        return {
          uuid,
        } as PackShell;
      }
    })
  );

  return packsMetadata;
};

export const writePackUuids = async (
  luniiHandle: FileSystemDirectoryHandle,
  uuids: string[]
) => {
  const packUuidsHandle = await luniiHandle.getFileHandle(".pi", {
    create: true,
  });
  const packUuidsFile = await packUuidsHandle.createWritable();
  for (const uuid of uuids) {
    const bytes = uuidToBytes(uuid);
    await packUuidsFile.write(bytes);
  }
  await packUuidsFile.close();
};

export const changePackPosition = async (
  luniiHandle: FileSystemDirectoryHandle,
  currentPosition: number,
  newPosition: number
) => {
  const uuids = await getPackUuids(luniiHandle);
  if (
    currentPosition < 0 ||
    currentPosition >= uuids.length ||
    newPosition < 0 ||
    newPosition >= uuids.length
  ) {
    throw new Error("Invalid position");
  }
  const uuid = uuids.splice(currentPosition, 1)[0];
  uuids.splice(newPosition, 0, uuid);

  await writePackUuids(luniiHandle, uuids);
};

export const addPackUuid = async (
  luniiHandle: FileSystemDirectoryHandle,
  uuid: string
) => {
  const uuids = await getPackUuids(luniiHandle);
  uuids.push(uuid);
  await writePackUuids(luniiHandle, uuids);
};

export const removePackUuid = async (
  luniiHandle: FileSystemDirectoryHandle,
  uuid: string
) => {
  const uuids = await getPackUuids(luniiHandle);
  const index = uuids.indexOf(uuid);
  if (index === -1) {
    throw new Error("Pack not found");
  }
  uuids.splice(index, 1);
  await writePackUuids(luniiHandle, uuids);
};
