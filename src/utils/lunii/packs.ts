import { parse, stringify } from "yaml";
import type { LuniiDbEntry } from "../db";
import { getFileHandleFromPath, readFileAsText, writeFile } from "../fs";
import { PackMetadata } from "./types";
import { decryptFirstBlock, v2CommonKey } from "../cipher";
import { uuidToRef } from "../generators";
import { stripHtmlTags } from "..";
import { decryptXxtea } from "../crypto/xxtea";

export type PackShell = { uuid: string } & (
  | { metadata?: PackMetadata; metadataError?: never }
  | {
      metadata?: never;
      metadataError: { kind: "invalid" | "missing-content"; message: string };
    }
);

export const getPackUuids = async (luniHandle: FileSystemDirectoryHandle) => {
  const packIndexHandle = await luniHandle.getFileHandle(".pi");
  const packIndex = await packIndexHandle.getFile();
  const bytes = await packIndex.arrayBuffer();
  return readUUIDsFromBuffer(bytes);
};
export function readUUIDsFromBuffer(buffer: ArrayBuffer) {
  if (buffer.byteLength % 16 !== 0)
    throw new Error(
      "L’index de la Lunii est incomplet. Aucune modification n’a été effectuée.",
    );
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
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16,
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
  luniiHandle: FileSystemDirectoryHandle,
): Promise<PackShell[]> => {
  const uuids = await getPackUuids(luniiHandle);
  return Promise.all(
    uuids.map(async (uuid): Promise<PackShell> => {
      let directory: FileSystemDirectoryHandle;
      try {
        const content = await luniiHandle.getDirectoryHandle(".content");
        directory = await content.getDirectoryHandle(uuidToRef(uuid));
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotFoundError")
          return {
            uuid,
            metadataError: {
              kind: "missing-content",
              message:
                "Le dossier de ce pack est absent. Restaurez-le depuis une sauvegarde ou retirez ce pack de la liste.",
            },
          };
        throw error;
      }
      let text: string;
      try {
        text = await readFileAsText(await directory.getFileHandle("md"));
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotFoundError")
          return { uuid };
        throw error;
      }
      try {
        const value: unknown = parse(text);
        if (typeof value !== "object" || value === null || Array.isArray(value))
          throw new Error("Métadonnées invalides.");
        if (
          ("title" in value &&
            value.title != null &&
            typeof value.title !== "string") ||
          ("description" in value &&
            value.description != null &&
            typeof value.description !== "string")
        )
          throw new Error("Titre ou description invalide.");
        return {
          uuid,
          metadata: {
            ...value,
            uuid,
            ref: uuidToRef(uuid),
            title:
              "title" in value && typeof value.title === "string"
                ? value.title
                : "",
            description:
              "description" in value && typeof value.description === "string"
                ? value.description
                : "",
            packType:
              "packType" in value && typeof value.packType === "string"
                ? value.packType
                : "unknown",
          },
        };
      } catch {
        return {
          uuid,
          metadataError: {
            kind: "invalid",
            message:
              "Les informations de ce pack sont illisibles. Ses fichiers audio et sa position sont conservés.",
          },
        };
      }
    }),
  );
};

export const savePackMetadata = async (
  luniiHandle: FileSystemDirectoryHandle,
  uuid: string,
  metadata: PackMetadata,
  create = false,
) => {
  const contentHandle = await luniiHandle.getDirectoryHandle(".content");
  const packDirectoryHandle = await contentHandle.getDirectoryHandle(
    uuidToRef(uuid),
  );
  await writeFile(packDirectoryHandle, "md", stringify(metadata), create);
};

export const writePackUuids = async (
  luniiHandle: FileSystemDirectoryHandle,
  uuids: string[],
) => {
  const bytes = new Uint8Array(uuids.length * 16);
  uuids.forEach((uuid, index) => {
    if (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(uuid))
      throw new Error("Identifiant de pack invalide.");
    bytes.set(uuidToBytes(uuid), index * 16);
  });
  await writeFile(luniiHandle, ".pi", bytes);
};

export const changePackPosition = async (
  luniiHandle: FileSystemDirectoryHandle,
  uuid: string,
  direction: "up" | "down" | "first",
) => {
  const uuids = await getPackUuids(luniiHandle);
  const from = uuids.indexOf(uuid);
  if (from < 0)
    throw new Error("Ce pack n’est plus présent. Actualisez la bibliothèque.");
  const to = direction === "first" ? 0 : from + (direction === "up" ? -1 : 1);
  if (to < 0 || to >= uuids.length || from === to) return;
  uuids.splice(from, 1);
  uuids.splice(to, 0, uuid);
  await writePackUuids(luniiHandle, uuids);
};

export const syncPacksMetadataFromStore = async (
  luniHandle: FileSystemDirectoryHandle,
  luniiStoreEntries: LuniiDbEntry[],
) => {
  const packs = await getPacksMetadata(luniHandle);

  for (const pack of packs) {
    if (pack.metadataError || pack.metadata?.title) continue;

    const entry = luniiStoreEntries.find((entry) => entry.uuid === pack.uuid);
    if (!entry?.localized_infos.fr_FR) continue;

    const metadata: PackMetadata = {
      ...pack.metadata,
      description: stripHtmlTags(entry.localized_infos.fr_FR.description),
      title: entry.localized_infos.fr_FR.title,
      uuid: entry.uuid,
      ref: uuidToRef(entry.uuid),
      packType: "lunii",
    };

    await savePackMetadata(luniHandle, pack.uuid, metadata, true);
  }
};

export const getPackFirstRaster = async (
  handle: FileSystemDirectoryHandle,
  uuid: string,
) => {
  const ref = uuidToRef(uuid);
  const riHandle = await getFileHandleFromPath(handle, `.content/${ref}/ri`);
  const ri = await riHandle
    .getFile()
    .then((f) => f.arrayBuffer())
    .then((ab) => new Uint8Array(ab));
  const decodedRi = await decryptFirstBlock(ri, decryptXxtea(v2CommonKey));
  const fistRasterAdress = new TextDecoder()
    .decode(decodedRi.slice(0, 12))
    .replace("\\", "/");
  const rasterFile = await getFileHandleFromPath(
    handle,
    `.content/${ref}/rf/${fistRasterAdress}`,
  );
  const raster = await rasterFile
    .getFile()
    .then((f) => f.arrayBuffer())
    .then((ab) => new Uint8Array(ab));

  return decryptFirstBlock(raster, decryptXxtea(v2CommonKey));
};
