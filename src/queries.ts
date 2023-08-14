import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { state } from "./store";
import { uuidToRef } from "./utils/generators";
import { installPack } from "./utils/lunii/installPack";
import {
  changePackPosition,
  getPackFirstRaster,
  getPacksMetadata,
  removePackUuid,
  syncPacksMetadataFromStore,
} from "./utils/lunii/packs";

export const useGetPacksQuery = () =>
  useQuery(["packs"], () => getPacksMetadata(state.luniiHandle.peek()!));

export const useReorderPackMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationKey: "reorderPacks",
    mutationFn: async (options: { from: number; to: number }) =>
      changePackPosition(state.luniiHandle.peek()!, options.from, options.to),
    onSuccess: () => client.invalidateQueries("packs"),
    onError: (err) =>
      notifications.show({
        title: "Erreur",
        message: (err as Error).message,
        color: "red",
      }),
  });
};

export const useRemovePackMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationKey: "reorderPacks",
    mutationFn: async (packUuid: string) => {
      const deviceHandle = state.luniiHandle.peek()!;
      const contentDir = await deviceHandle.getDirectoryHandle(".content");

      // remove pack uuid from the device index
      await removePackUuid(deviceHandle, packUuid);

      // remove pack content
      await contentDir.removeEntry(uuidToRef(packUuid), {
        recursive: true,
      });

      console.log("Pack removed");
    },
    onError: (err) =>
      notifications.show({
        title: "Erreur",
        message: (err as Error).message,
        color: "red",
      }),
    onSuccess: () => client.invalidateQueries("packs"),
  });
};

export const useInstallPackMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ accept: { "application/zip": [".zip"] } }],
        multiple: false,
      });
      const device = state.device.peek()!;
      await installPack(fileHandle, device.specificKey);
    },
    onSuccess: () =>
      notifications.show({
        title: "Installation terminée",
        message: "Le pack a été installé avec succès",
        color: "green",
      }),
    onError: (err) =>
      notifications.show({
        title: "Erreur",
        message: (err as Error).message,
        color: "red",
      }),
    onSettled: () => {
      client.invalidateQueries("packs");
    },
  });
};

export const useSyncMetadataMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => syncPacksMetadataFromStore(state.luniiHandle.peek()!),
    onSuccess: () =>
      notifications.show({
        title: "Synchronisation terminée",
        message: "Les métadonnées ont été synchronisées avec succès",
        color: "green",
      }),
    onError: (err) =>
      notifications.show({
        title: "Erreur",
        message: (err as Error).message,
        color: "red",
      }),
    onSettled: () => {
      client.invalidateQueries("packs");
    },
  });
};

export const useGetPackFirstRasterQuery = (uuid: string) =>
  useQuery(["pack-raster", uuid], () => {
    const deviceHandle = state.luniiHandle.peek()!;
    return getPackFirstRaster(deviceHandle, uuid);
  });
