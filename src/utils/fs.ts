export async function getFileHandleFromPath(
  baseHandle: FileSystemDirectoryHandle,
  filePath: string,
  createIfNotExists = false
) {
  const parts = filePath.split("/").filter((part) => part !== ""); // Split the path into parts
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
        }`
      );
    }
  }

  try {
    return currentHandle.getFileHandle(fileName, { create: createIfNotExists });
  } catch (error) {
    throw new Error(
      `Error creating or writing to file "${filePath}": ${
        (error as Error).message
      }`
    );
  }
}

export const getRootDirectory = () => navigator.storage.getDirectory();

export const cleanAll = async (dir: FileSystemDirectoryHandle) => {
  for await (const entry of dir.values()) {
    if (entry.kind === "file") {
      await dir.removeEntry(entry.name);
    } else {
      await cleanAll(entry);
    }
  }
};

export const rmRf = async (
  parent: FileSystemDirectoryHandle,
  dirName: string
) => {
  const dir = await parent.getDirectoryHandle(dirName);
  await cleanAll(dir);
  await parent.removeEntry(dirName);
};

export const readFile = (file: FileSystemFileHandle) => {
  return file.getFile().then((file) => file.text());
};

export const writeFile = async (
  root: FileSystemDirectoryHandle,
  path: string,
  content: Uint8Array | Blob | string,
  createIfNotExists = false
) => {
  const fileHandle = await getFileHandleFromPath(root, path, createIfNotExists);
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
};
