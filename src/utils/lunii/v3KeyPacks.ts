import { getPackUuids } from "./packs";

export const v3KeyPacks = [
  {
    name: "Les aventures de Suzanne et Gaston",
    uuid: "v3:packs:1",
    key: "v3:packs:1",
    iv: "v3:packs:1",
  },
];

export const getV3KeyPack = async (luniiHandle: FileSystemDirectoryHandle) => {
  const packUuids = await getPackUuids(luniiHandle);
  const keyPack = v3KeyPacks.find((pack) => packUuids.includes(pack.uuid));
  if (!keyPack) return null;
  return keyPack;
};
