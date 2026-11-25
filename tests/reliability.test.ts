import { describe, expect, it, vi } from "vitest";
import { MemoryDirectory, type Fault } from "./filesystem";
import {
  getPackUuids,
  writePackUuids,
  changePackPosition,
  readUUIDsFromBuffer,
  syncPacksMetadataFromStore,
} from "../src/utils/lunii/packs";
import {
  deleteDevicePack,
  installPreparedPack,
  readPendingOperation,
  recoverDeviceOperation,
} from "../src/utils/lunii/transactions";
import { getFileHandleFromPath, writeFile } from "../src/utils/fs";
import { unzip } from "../src/utils/zip";

const A = "00000000-0000-0000-0000-000000000001";
const B = "00000000-0000-0000-0000-000000000002";
const C = "00000000-0000-0000-0000-000000000003";
async function device(fault?: Fault) {
  const dir = new MemoryDirectory("device", "", fault);
  await dir.getFileHandle(".pi", { create: true });
  await dir.getDirectoryHandle(".content", { create: true });
  return dir;
}
async function prepared() {
  const dir = new MemoryDirectory("prepared");
  await writeFile(dir.handle(), "story", "new story", true);
  return dir;
}

describe("device integrity", () => {
  it("writes UUIDs in byte order and rejects incomplete indexes", async () => {
    const dir = await device();
    await writePackUuids(dir.handle(), [A, B]);
    expect(await getPackUuids(dir.handle())).toEqual([A, B]);
    const bytes = new Uint8Array(
      await (
        await dir.getFileHandle(".pi")
      )
        .getFile()
        .then((f) => f.arrayBuffer()),
    );
    expect([...bytes]).toEqual([
      ...new Array(15).fill(0),
      1,
      ...new Array(15).fill(0),
      2,
    ]);
    expect(() => readUUIDsFromBuffer(new ArrayBuffer(17))).toThrow("incomplet");
  });
  it("moves the requested UUID against the current index", async () => {
    const dir = await device();
    await writePackUuids(dir.handle(), [A, B, C]);
    await changePackPosition(dir.handle(), C, "up");
    await changePackPosition(dir.handle(), C, "up");
    expect(await getPackUuids(dir.handle())).toEqual([C, A, B]);
    await changePackPosition(dir.handle(), C, "up");
    expect(await getPackUuids(dir.handle())).toEqual([C, A, B]);
  });
  it("does not index a failed copy, and recovery removes only its incomplete directory", async () => {
    let failing = true;
    const dir = await device((path, op) => {
      if (failing && path.endsWith("/story") && op === "write")
        throw new Error("Unplugged");
    });
    await expect(
      installPreparedPack(dir.handle(), A, (await prepared()).handle()),
    ).rejects.toThrow("Unplugged");
    expect(await getPackUuids(dir.handle())).toEqual([]);
    expect(await readPendingOperation(dir.handle())).toEqual({
      kind: "install",
      uuid: A,
    });
    failing = false;
    await recoverDeviceOperation(dir.handle());
    expect(await readPendingOperation(dir.handle())).toBeNull();
    expect((await dir.getDirectoryHandle(".content")).entries.size).toBe(0);
  });
  it("propagates index write failure and safely recovers", async () => {
    let failing = true;
    const dir = await device((path, op) => {
      if (failing && path === "/.pi" && op === "close")
        throw new Error("Disk full");
    });
    await expect(
      installPreparedPack(dir.handle(), A, (await prepared()).handle()),
    ).rejects.toThrow("Disk full");
    failing = false;
    await recoverDeviceOperation(dir.handle());
    expect(await getPackUuids(dir.handle())).toEqual([]);
    expect((await dir.getDirectoryHandle(".content")).entries.size).toBe(0);
  });
  it("preserves a committed install when closing reports a failure after committing", async () => {
    let failing = true;
    const dir = await device((path, op) => {
      if (failing && path === "/.pi" && op === "after-close")
        throw new Error("Disconnected");
    });
    await expect(
      installPreparedPack(dir.handle(), A, (await prepared()).handle()),
    ).rejects.toThrow();
    failing = false;
    await recoverDeviceOperation(dir.handle());
    expect(await getPackUuids(dir.handle())).toEqual([A]);
    expect(
      (await dir.getDirectoryHandle(".content")).entries.has("00000001"),
    ).toBe(true);
  });
  it("refuses overwriting an existing pack or an untracked directory", async () => {
    const dir = await device();
    const src = await prepared();
    await installPreparedPack(dir.handle(), A, src.handle());
    await expect(
      installPreparedPack(dir.handle(), A, src.handle()),
    ).rejects.toThrow("déjà présent");
    await (
      await dir.getDirectoryHandle(".content")
    ).getDirectoryHandle("00000002", { create: true });
    await expect(
      installPreparedPack(dir.handle(), B, src.handle()),
    ).rejects.toThrow("dossier existe");
    expect(await getPackUuids(dir.handle())).toEqual([A]);
  });
  it("finishes an interrupted deletion even though its index entry is already gone", async () => {
    let failing = false;
    const dir = await device((path, op) => {
      if (failing && path.endsWith("/00000001") && op === "remove")
        throw new Error("Unplugged");
    });
    await installPreparedPack(dir.handle(), A, (await prepared()).handle());
    failing = true;
    await expect(deleteDevicePack(dir.handle(), A)).rejects.toThrow(
      "Unplugged",
    );
    expect(await getPackUuids(dir.handle())).toEqual([]);
    failing = false;
    await recoverDeviceOperation(dir.handle());
    await recoverDeviceOperation(dir.handle());
    expect((await dir.getDirectoryHandle(".content")).entries.size).toBe(0);
  });
  it("does not continue after corrupt ZIP data", async () => {
    await expect(
      unzip(new File(["invalid"], "bad.zip"), new MemoryDirectory().handle()),
    ).rejects.toThrow("ZIP");
  });
  it("rejects traversal before creating files", async () => {
    const dir = await device();
    await expect(
      getFileHandleFromPath(dir.handle(), "../escape", true),
    ).rejects.toThrow("Chemin");
  });
  it("does not report metadata sync success when a metadata write fails", async () => {
    const dir = await device((path, op) => {
      if (path.endsWith("/md") && op === "close")
        throw new Error("Metadata write failed");
    });
    await writePackUuids(dir.handle(), [A]);
    await (
      await dir.getDirectoryHandle(".content")
    ).getDirectoryHandle("00000001", { create: true });
    const entries = [
      {
        uuid: A,
        localized_infos: {
          fr_FR: { title: "Title", description: "Description" },
        },
      },
    ];
    vi.stubGlobal(
      "DOMParser",
      class {
        parseFromString(text: string) {
          return { body: { textContent: text } };
        }
      },
    );
    await expect(
      syncPacksMetadataFromStore(dir.handle(), entries),
    ).rejects.toThrow("Metadata write failed");
    vi.unstubAllGlobals();
  });
});

describe("journal initialization", () => {
  it("removes a journal whose first write failed before touching packs", async () => {
    const dir = await device((path, operation) => {
      if (path === "/.lunii-admin-operation.json" && operation === "write")
        throw new Error("Full device");
    });
    await expect(
      installPreparedPack(dir.handle(), A, (await prepared()).handle()),
    ).rejects.toThrow("Full device");
    expect(await readPendingOperation(dir.handle())).toBeNull();
    expect((await dir.getDirectoryHandle(".content")).entries.size).toBe(0);
    expect(await getPackUuids(dir.handle())).toEqual([]);
  });
  it("can discard an unreadable journal without altering indexed files", async () => {
    const { discardInvalidJournal, InvalidJournalError } =
      await import("../src/utils/lunii/transactions");
    const dir = await device();
    await installPreparedPack(dir.handle(), A, (await prepared()).handle());
    await writeFile(dir.handle(), ".lunii-admin-operation.json", "", true);
    await expect(readPendingOperation(dir.handle())).rejects.toBeInstanceOf(
      InvalidJournalError,
    );
    await discardInvalidJournal(dir.handle());
    expect(await getPackUuids(dir.handle())).toEqual([A]);
    expect(
      (await dir.getDirectoryHandle(".content")).entries.has("00000001"),
    ).toBe(true);
  });
  it("preserves an uppercase UUID install after a post-commit failure", async () => {
    let fail = true;
    const dir = await device((path, op) => {
      if (fail && path === "/.pi" && op === "after-close")
        throw new Error("Interrupted");
    });
    const uuid = "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA";
    await expect(
      installPreparedPack(dir.handle(), uuid, (await prepared()).handle()),
    ).rejects.toThrow();
    fail = false;
    await recoverDeviceOperation(dir.handle());
    expect(await getPackUuids(dir.handle())).toEqual([uuid.toLowerCase()]);
    expect(
      (await dir.getDirectoryHandle(".content")).entries.has("AAAAAAAA"),
    ).toBe(true);
  });
});

describe("isolated metadata failures", () => {
  it("keeps healthy packs visible beside empty metadata and missing content", async () => {
    const { getPacksMetadata } = await import("../src/utils/lunii/packs");
    const dir = await device();
    await writePackUuids(dir.handle(), [A, B, C]);
    const content = await dir.getDirectoryHandle(".content");
    const healthy = await content.getDirectoryHandle("00000001", {
      create: true,
    });
    await writeFile(
      healthy.handle(),
      "md",
      "title: Healthy\ndescription: null\ninstallSource: external\n",
      true,
    );
    const broken = await content.getDirectoryHandle("00000002", {
      create: true,
    });
    await writeFile(broken.handle(), "md", "", true);
    const packs = await getPacksMetadata(dir.handle());
    expect(packs).toHaveLength(3);
    expect(packs[0].metadata).toMatchObject({
      title: "Healthy",
      description: "",
      packType: "unknown",
      installSource: "external",
    });
    expect(packs[1].metadataError?.kind).toBe("invalid");
    expect(packs[2].metadataError?.kind).toBe("missing-content");
  });
  it("does not overwrite unreadable metadata during title sync", async () => {
    const dir = await device();
    await writePackUuids(dir.handle(), [A]);
    const pack = await (
      await dir.getDirectoryHandle(".content")
    ).getDirectoryHandle("00000001", { create: true });
    await writeFile(pack.handle(), "md", "title: 123", true);
    await syncPacksMetadataFromStore(dir.handle(), [
      {
        uuid: A,
        localized_infos: {
          fr_FR: { title: "Official", description: "Official" },
        },
      },
    ]);
    expect(
      await (
        await pack.getFileHandle("md")
      )
        .getFile()
        .then((file) => file.text()),
    ).toBe("title: 123");
  });
  it("preserves files still referenced by another indexed UUID when deleting", async () => {
    const dir = await device();
    await installPreparedPack(dir.handle(), A, (await prepared()).handle());
    const alias = "11111111-1111-1111-1111-111100000001";
    await writePackUuids(dir.handle(), [A, alias]);
    await deleteDevicePack(dir.handle(), A);
    expect(await getPackUuids(dir.handle())).toEqual([alias]);
    expect(
      (await dir.getDirectoryHandle(".content")).entries.has("00000001"),
    ).toBe(true);
  });
});

it("recovery preserves content shared with a remaining UUID after interrupted deletion", async () => {
  let fail = false;
  const dir = await device((path, operation) => {
    if (
      fail &&
      path === "/.lunii-admin-operation.json" &&
      operation === "remove"
    )
      throw new Error("Disconnected");
  });
  await installPreparedPack(dir.handle(), A, (await prepared()).handle());
  const alias = "11111111-1111-1111-1111-111100000001";
  await writePackUuids(dir.handle(), [A, alias]);
  fail = true;
  await expect(deleteDevicePack(dir.handle(), A)).rejects.toThrow(
    "Disconnected",
  );
  fail = false;
  await recoverDeviceOperation(dir.handle());
  expect(await getPackUuids(dir.handle())).toEqual([alias]);
  expect(
    (await dir.getDirectoryHandle(".content")).entries.has("00000001"),
  ).toBe(true);
});
