import { state } from "./store";
import { readPendingOperation } from "./utils/lunii/transactions";

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "L’opération n’a pas pu aboutir. Reconnectez la Lunii et réessayez.";
}
export function isPickerCancelled(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
export async function withDeviceWrite<T>(
  handle: FileSystemDirectoryHandle,
  task: () => Promise<T>,
  recovering = false,
): Promise<T> {
  if (state.isWriting.peek())
    throw new Error(
      "Une opération est déjà en cours. Patientez avant de réessayer.",
    );
  if (!navigator.locks)
    throw new Error(
      "Ce navigateur ne permet pas de sécuriser les écritures. Utilisez une version récente de Chrome ou Edge.",
    );
  state.isWriting.set(true);
  const beforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = "";
  };
  window.addEventListener("beforeunload", beforeUnload);
  try {
    return await navigator.locks.request(
      "lunii-admin-device-write",
      { mode: "exclusive", ifAvailable: true },
      async (lock) => {
        if (!lock)
          throw new Error(
            "Une autre fenêtre modifie une Lunii. Attendez la fin de cette opération.",
          );
        if (!recovering && (await readPendingOperation(handle)))
          throw new Error(
            "Récupérez l’opération interrompue avant de modifier la Lunii.",
          );
        return task();
      },
    );
  } finally {
    state.isWriting.set(false);
    window.removeEventListener("beforeunload", beforeUnload);
  }
}
