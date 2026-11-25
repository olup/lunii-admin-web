import { state } from "../store";
import { writeFile } from "../utils/fs";
import { writePackUuids } from "../utils/lunii/packs";
import { stringify } from "yaml";

// Development-only fixtures use the browser's private storage, never USB files.
export async function loadDemo() {
  const root = await navigator.storage.getDirectory();
  const name = `lunii-demo-${crypto.randomUUID()}`;
  const handle = await root.getDirectoryHandle(name, { create: true });
  await handle.getFileHandle(".pi", { create: true });
  const content = await handle.getDirectoryHandle(".content", { create: true });
  const stories = [
    [
      "La forêt des petits secrets",
      "Lila suit une luciole au cœur de la forêt. Chaque chemin réserve une nouvelle rencontre.",
    ],
    [
      "Un voyage jusqu’à la Lune",
      "Une fusée, un équipage inattendu et une mission à inventer ensemble.",
    ],
    [
      "Le mystère du phare",
      "Sur la côte, une lumière s’allume chaque soir. Qui habite dans le vieux phare ?",
    ],
    ["", ""],
  ];
  const ids: string[] = [];
  if (new URLSearchParams(location.search).get("demo") !== "empty") {
    for (const [index, [title, description]] of stories.entries()) {
      const uuid = `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`;
      ids.push(uuid);
      const ref = uuid.slice(-8);
      const dir = await content.getDirectoryHandle(ref, { create: true });
      await writeFile(
        dir,
        "md",
        stringify({
          uuid,
          ref,
          title,
          description,
          packType: "custom",
          installSource: "fixture",
        }),
        true,
      );
    }
  }
  await writePackUuids(handle, ids);
  state.device.set({
    version: "V2",
    uuid: new Uint8Array(),
    specificKey: new Uint8Array(16),
    serialNumber: "demo",
    firmwareVersion: "Démo",
    stable: true,
  });
  state.connectionId.set(name);
  state.luniiHandle.set(handle);
  window.addEventListener(
    "pagehide",
    () => {
      void root.removeEntry(name, { recursive: true }).catch(() => {});
    },
    { once: true },
  );
}

export { state as demoState };
