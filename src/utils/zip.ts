import JSZip from "jszip";
import { getFileHandleFromPath, getRootDirectory } from "./fs";

// Extract zip to opfs
export async function unzipToOpfs(zipFile: File) {
  try {
    const zip = new JSZip();
    const zipData = await zip.loadAsync(zipFile);

    for (const [relativePath, file] of Object.entries(zipData.files)) {
      const unzipDir = await (
        await getRootDirectory()
      ).getDirectoryHandle("unzip", { create: true });
      if (!file.dir) {
        const fileData = await file.async("uint8array");
        // Normalize the path by replacing forward slashes with the appropriate separator
        const normalizedPath = relativePath.replace(/\//g, "/");
        const fileHandle = await getFileHandleFromPath(
          unzipDir,
          normalizedPath,
          true
        );
        const writer = await fileHandle.createWritable();
        await writer.write(fileData);
        await writer.close();
      }
    }

    console.log("All files extracted and written to OPFS successfully.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}
