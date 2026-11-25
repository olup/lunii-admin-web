import { copyAll, readFileAsText, writeFile } from "../fs";
import { uuidToRef } from "../generators";
import { getPackUuids, writePackUuids } from "./packs";

const journalName = ".lunii-admin-operation.json";
export type PendingOperation = { kind: "install" | "delete"; uuid: string };
export const isNotFound = (error: unknown) =>
  error instanceof DOMException && error.name === "NotFoundError";

export class InvalidJournalError extends Error {
  constructor() {
    super(
      "Le journal de récupération est vide ou illisible. Les fichiers de vos packs n’ont pas été modifiés par cette vérification.",
    );
  }
}

export async function readPendingOperation(
  device: FileSystemDirectoryHandle,
): Promise<PendingOperation | null> {
  let contents: string;
  try {
    contents = await readFileAsText(await device.getFileHandle(journalName));
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch {
    throw new InvalidJournalError();
  }
  if (
    typeof value !== "object" ||
    value === null ||
    !("kind" in value) ||
    !("uuid" in value) ||
    (value.kind !== "install" && value.kind !== "delete") ||
    typeof value.uuid !== "string" ||
    !/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value.uuid)
  )
    throw new InvalidJournalError();
  return { kind: value.kind, uuid: value.uuid.toLowerCase() };
}

export async function discardInvalidJournal(device: FileSystemDirectoryHandle) {
  try {
    if (await readPendingOperation(device))
      throw new Error(
        "Ce journal est lisible. Utilisez la récupération de l’opération.",
      );
  } catch (error) {
    if (!(error instanceof InvalidJournalError)) throw error;
    await device.removeEntry(journalName);
  }
}

async function beginOperation(
  device: FileSystemDirectoryHandle,
  operation: PendingOperation,
) {
  try {
    await writeFile(device, journalName, JSON.stringify(operation), true);
  } catch (error) {
    // No pack or index write has started yet, even if closing the journal committed.
    await device.removeEntry(journalName).catch(() => {});
    throw error;
  }
}

async function removeContent(device: FileSystemDirectoryHandle, uuid: string) {
  try {
    const content = await device.getDirectoryHandle(".content");
    await content.removeEntry(uuidToRef(uuid), { recursive: true });
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }
}

// The journal stays on the device until every write has finished. Recovery never
// removes an indexed install, including when close() failed after committing.
export async function recoverDeviceOperation(
  device: FileSystemDirectoryHandle,
) {
  const operation = await readPendingOperation(device);
  if (!operation) return;
  const uuids = await getPackUuids(device);
  if (operation.kind === "delete") {
    await writePackUuids(
      device,
      uuids.filter((uuid) => uuid !== operation.uuid),
    );
    if (
      !uuids.some(
        (uuid) =>
          uuid !== operation.uuid &&
          uuidToRef(uuid) === uuidToRef(operation.uuid),
      )
    )
      await removeContent(device, operation.uuid);
  } else if (
    !uuids.some((uuid) => uuidToRef(uuid) === uuidToRef(operation.uuid))
  ) {
    await removeContent(device, operation.uuid);
  }
  await device.removeEntry(journalName);
}

async function ensureNoPendingOperation(device: FileSystemDirectoryHandle) {
  if (await readPendingOperation(device)) {
    throw new Error(
      "Une opération interrompue doit être récupérée avant de modifier la Lunii.",
    );
  }
}

export async function installPreparedPack(
  device: FileSystemDirectoryHandle,
  uuid: string,
  source: FileSystemDirectoryHandle,
) {
  uuid = uuid.toLowerCase();
  await ensureNoPendingOperation(device);
  const uuids = await getPackUuids(device);
  if (uuids.some((entry) => uuidToRef(entry) === uuidToRef(uuid))) {
    throw new Error(
      "Ce pack est déjà présent, ou son identifiant est utilisé. Aucun fichier n’a été remplacé.",
    );
  }
  const content = await device.getDirectoryHandle(".content");
  try {
    await content.getDirectoryHandle(uuidToRef(uuid));
    throw new Error(
      `Un dossier existe déjà pour ce pack : .content/${uuidToRef(uuid)}. Sauvegardez-le puis déplacez-le hors de la Lunii avant de réessayer. Aucun fichier n’a été remplacé.`,
    );
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }
  await beginOperation(device, { kind: "install", uuid });
  const destination = await content.getDirectoryHandle(uuidToRef(uuid), {
    create: true,
  });
  await copyAll(source, destination);
  await writePackUuids(device, [...uuids, uuid]);
  await device.removeEntry(journalName);
}

export async function deleteDevicePack(
  device: FileSystemDirectoryHandle,
  uuid: string,
) {
  uuid = uuid.toLowerCase();
  await ensureNoPendingOperation(device);
  const uuids = await getPackUuids(device);
  if (!uuids.includes(uuid))
    throw new Error("Ce pack n’est plus présent. Actualisez la bibliothèque.");
  await beginOperation(device, { kind: "delete", uuid });
  await writePackUuids(
    device,
    uuids.filter((entry) => entry !== uuid),
  );
  if (
    !uuids.some(
      (entry) => entry !== uuid && uuidToRef(entry) === uuidToRef(uuid),
    )
  )
    await removeContent(device, uuid);
  await device.removeEntry(journalName);
}
