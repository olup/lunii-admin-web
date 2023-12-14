import { getPackUuids } from "./packs";

console.log(import.meta.env.VITE_KEY_PACKS);
export const v3KeyPacks: {
  uuid: string;
  key: string;
  iv: string;
  name: string;
}[] = JSON.parse(import.meta.env.VITE_KEY_PACKS || "[]");

export const getV3KeyPack = async (luniiHandle: FileSystemDirectoryHandle) => {
  const packUuids = await getPackUuids(luniiHandle);
  const keyPack = v3KeyPacks.find((pack) =>
    packUuids.includes(pack.uuid.toLowerCase())
  );
  return keyPack || null;
};
