import { getLuniiStoreDb } from "./utils/db";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resetInstallationState, state } from "./store";
import { captureUsage } from "./usage";
import { installPack } from "./utils/lunii/installPack";
import {
  changePackPosition,
  getPackFirstRaster,
  getPacksMetadata,
  savePackMetadata,
  syncPacksMetadataFromStore,
} from "./utils/lunii/packs";
import { PackMetadata } from "./utils/lunii/types";
import {
  deleteDevicePack,
  discardInvalidJournal,
  readPendingOperation,
  recoverDeviceOperation,
} from "./utils/lunii/transactions";
import {
  errorMessage,
  isPickerCancelled,
  withDeviceWrite,
} from "./device-operations";

function deviceHandle() {
  const handle = state.luniiHandle.peek();
  if (!handle) throw new Error("Connectez votre Lunii pour continuer.");
  return handle;
}
const showError = (error: unknown) =>
  notifications.show({
    title: "Opération non terminée",
    message: errorMessage(error),
    color: "red",
  });
const deviceKey = () => ["device", state.connectionId.peek()];
export const useGetPacksQuery = () =>
  useQuery({
    queryKey: [...deviceKey(), "packs"],
    queryFn: () => getPacksMetadata(deviceHandle()),
    retry: false,
    refetchOnWindowFocus: false,
  });
export const useOtherWriterQuery = (enabled: boolean) =>
  useQuery({
    queryKey: ["other-device-writer"],
    enabled,
    refetchInterval: 2000,
    queryFn: async () =>
      !state.isWriting.peek() &&
      !!(await navigator.locks.query()).held?.some(
        (lock) => lock.name === "lunii-admin-device-write",
      ),
  });
export const useRecoveryQuery = () =>
  useQuery({
    queryKey: [...deviceKey(), "recovery"],
    queryFn: () => readPendingOperation(deviceHandle()),
    retry: false,
    refetchOnWindowFocus: false,
  });
function useRefreshDevice() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: deviceKey() });
}
export const useDiscardJournalMutation = () => {
  const refresh = useRefreshDevice();
  return useMutation({
    mutationFn: () =>
      withDeviceWrite(
        deviceHandle(),
        () => discardInvalidJournal(deviceHandle()),
        true,
      ),
    onError: showError,
    onSettled: refresh,
  });
};
export const useRecoverMutation = () => {
  const refresh = useRefreshDevice();
  return useMutation({
    mutationFn: () =>
      withDeviceWrite(
        deviceHandle(),
        () => recoverDeviceOperation(deviceHandle()),
        true,
      ),
    onError: showError,
    onSettled: refresh,
  });
};
export const useReorderPackMutation = () => {
  const refresh = useRefreshDevice();
  return useMutation({
    mutationFn: (options: {
      uuid: string;
      direction: "up" | "down" | "first";
    }) =>
      withDeviceWrite(deviceHandle(), () =>
        changePackPosition(deviceHandle(), options.uuid, options.direction),
      ),
    onSuccess: (_, { direction }) =>
      captureUsage("lunii_pack_reordered", {
        device_generation: state.device.peek()?.version,
        move_direction: direction === "down" ? "down" : "up",
      }),
    onError: showError,
    onSettled: refresh,
  });
};
export const useRemovePackMutation = () => {
  const refresh = useRefreshDevice();
  return useMutation({
    mutationFn: (uuid: string) =>
      withDeviceWrite(deviceHandle(), () =>
        deleteDevicePack(deviceHandle(), uuid),
      ),
    onSuccess: () =>
      captureUsage("lunii_pack_removed", {
        device_generation: state.device.peek()?.version,
      }),
    onError: showError,
    onSettled: refresh,
  });
};
export const useInstallPack = () => {
  const refresh = useRefreshDevice();
  return async () => {
    const handle = deviceHandle();
    const device = state.device.peek();
    if (!device || state.isWriting.peek()) return;
    try {
      const fileHandles = await window.showOpenFilePicker({
        types: [{ accept: { "application/zip": [".zip"] } }],
        multiple: true,
      });
      if (state.luniiHandle.peek() !== handle)
        throw new Error("La Lunii a changé. Sélectionnez vos packs à nouveau.");
      await withDeviceWrite(handle, async () => {
        resetInstallationState();
        const installation = state.installation;
        installation.isInstalling.set(true);
        installation.packInstallationProgress.totalCount.set(
          fileHandles.length,
        );
        try {
          for (const fileHandle of fileHandles) {
            const startedAt = performance.now();
            try {
              const { hasTitle, archiveSize } = await installPack(
                fileHandle,
                device,
                handle,
              );
              captureUsage("lunii_pack_installed", {
                device_generation: device.version,
                has_pack_title: hasTitle,
                archive_size_mib: Math.ceil(archiveSize / (1024 * 1024)),
                install_duration_ms: Math.round(performance.now() - startedAt),
              });
              installation.results.push({
                name: fileHandle.name,
                status: "success",
                message: "Installé sur la Lunii",
              });
              installation.packInstallationProgress.doneCount.set(
                installation.packInstallationProgress.doneCount.peek() + 1,
              );
            } catch (error) {
              installation.results.push({
                name: fileHandle.name,
                status: "error",
                message: errorMessage(error),
              });
              break;
            }
          }
        } finally {
          installation.isInstalling.set(false);
        }
      });
    } catch (error) {
      if (!isPickerCancelled(error)) showError(error);
    } finally {
      await refresh();
    }
  };
};
export const useSyncMetadataMutation = () => {
  const refresh = useRefreshDevice();
  return useMutation({
    mutationFn: async () => {
      const handle = deviceHandle();
      const entries = await getLuniiStoreDb();
      if (handle !== state.luniiHandle.peek())
        throw new Error(
          "La Lunii a changé. Relancez l’actualisation des titres.",
        );
      return withDeviceWrite(handle, () =>
        syncPacksMetadataFromStore(handle, entries),
      );
    },
    onSuccess: () => {
      captureUsage("lunii_metadata_synced", {
        device_generation: state.device.peek()?.version,
      });
      notifications.show({
        title: "Titres actualisés",
        message: "Les informations disponibles ont été enregistrées.",
        color: "teal",
      });
    },
    onError: showError,
    onSettled: refresh,
  });
};
export const useGetPackFirstRasterQuery = (uuid: string, enabled = true) =>
  useQuery({
    queryKey: [...deviceKey(), "pack-raster", uuid],
    queryFn: () => getPackFirstRaster(deviceHandle(), uuid),
    enabled: enabled && state.device.peek()?.version === "V2",
    retry: false,
    staleTime: Infinity,
  });
export const useSavePackMetadataMutation = () => {
  const refresh = useRefreshDevice();
  return useMutation({
    mutationFn: ({
      uuid,
      metadata,
    }: {
      uuid: string;
      metadata: PackMetadata;
    }) =>
      withDeviceWrite(deviceHandle(), () =>
        savePackMetadata(deviceHandle(), uuid, metadata, true),
      ),
    onSuccess: refresh,
  });
};
