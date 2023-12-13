import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { resetInstallationState, state } from "./store";
import { uuidToRef } from "./utils/generators";
import { installPack } from "./utils/lunii/installPack";
import {
  changePackPosition,
  getPackFirstRaster,
  getPacksMetadata,
  removePackUuid,
  savePackMetadata,
  syncPacksMetadataFromStore,
} from "./utils/lunii/packs";
import { PackMetadata } from "./utils/lunii/types";

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

export const useInstallPack = () => {
  const client = useQueryClient();
  return async () => {
    try {
      const fileHandles = await window.showOpenFilePicker({
        types: [{ accept: { "application/zip": [".zip"] } }],
        multiple: true,
      });
      const device = state.device.peek()!;
      const installation = state.installation;
      installation.isInstalling.set(true);
      installation.packInstallationProgress.totalCount.set(fileHandles.length);

      for (const fileHandle of fileHandles) {
        await installPack(fileHandle, device);
        installation.packInstallationProgress.doneCount.set(
          installation.packInstallationProgress.doneCount.peek() + 1
        );
      }
      notifications.show({
        title: "Installation terminée",
        message: `Les packs ont été installés avec succès`,
        color: "green",
      });
    } catch (err) {
      console.log(err);
      notifications.show({
        title: "Erreur",
        message: (err as Error).message,
        color: "red",
      });
    } finally {
      resetInstallationState();
      client.invalidateQueries("packs");
    }
  };
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

export const useSavePackMetadataMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationKey: "updatePackMetadata",
    onSettled: () => {
      client.invalidateQueries("packs");
    },
    mutationFn: async ({
      uuid,
      metadata,
      shouldCreate = false,
    }: {
      uuid: string;
      metadata: PackMetadata;
      shouldCreate?: boolean;
    }) => {
      const deviceHandle = state.luniiHandle.peek()!;
      await savePackMetadata(deviceHandle, uuid, metadata, shouldCreate);
    },
  });
};
