import { toArrayBuffer } from "./buffer";

export async function getFileHandleFromPath(
  baseHandle: FileSystemDirectoryHandle,
  filePath: string,
  createIfNotExists = false,
) {
  const parts = filePath.split("/").filter((part) => part !== "");
  if (
    parts.some((part) => part === "." || part === ".." || part.includes("\\"))
  ) {
    throw new Error("Chemin de fichier invalide dans le pack.");
  }
  const fileName = parts.pop();
  if (!fileName) throw new Error(`Invalid file path: ${filePath}`);

  let currentHandle = baseHandle;

  for (const part of parts) {
    try {
      currentHandle = await currentHandle.getDirectoryHandle(part, {
        create: createIfNotExists,
      });
    } catch (error) {
      throw new Error(
        `Error getting or creating directory handle for "${part}": ${
          (error as Error).message
        }`,
        { cause: error },
      );
    }
  }

  try {
    return currentHandle.getFileHandle(fileName, { create: createIfNotExists });
  } catch (error) {
    throw new Error(
      `Error creating or writing to file "${filePath}": ${
        (error as Error).message
      }`,
      { cause: error },
    );
  }
}

export const getRootDirectory = () => navigator.storage.getDirectory();

export const readFileAsText = (file: FileSystemFileHandle) => {
  return file.getFile().then((file) => file.text());
};

export const writeFile = async (
  root: FileSystemDirectoryHandle,
  path: string,
  content: Uint8Array | Blob | string,
  createIfNotExists = false,
) => {
  const fileHandle = await getFileHandleFromPath(root, path, createIfNotExists);
  const writable = await fileHandle.createWritable();
  const chunk =
    content instanceof Uint8Array ? toArrayBuffer(content) : content;
  try {
    await writable.write(chunk);
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => {});
    throw error;
  }
};

export const copyAll = async (
  source: FileSystemDirectoryHandle,
  destination: FileSystemDirectoryHandle,
) => {
  for await (const entry of source.values()) {
    if (entry.kind === "file") {
      const file = await entry.getFile();
      await writeFile(destination, entry.name, file, true);
    } else {
      const dir = await destination.getDirectoryHandle(entry.name, {
        create: true,
      });
      await copyAll(entry, dir);
    }
  }
};
