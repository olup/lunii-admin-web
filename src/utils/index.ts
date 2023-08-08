import { state } from "../store";

export const getLuniiHandle = async () => {
  try {
    const dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    await dirHandle.getFileHandle(".pi");
    state.luniiHandle.set(dirHandle);
  } catch (e) {
    console.error(
      "Could not find the pack index file. Is that really a Lunii mount point?"
    );
  }
};
