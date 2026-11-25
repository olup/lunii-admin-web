import { stringify } from "yaml";
import { BLANK_MP3_FILE } from "..";
import { resetPackInstallationState, state } from "../../store";
import { encryptFirstBlock, v2CommonKey } from "../cipher";
import { convertAudioToMP3 } from "../converters/audio";
import { convertImageToBmp4 } from "../converters/image";
import { encryptAes } from "../crypto/aes";
import { encryptXxtea } from "../crypto/xxtea";
import {
  getFileHandleFromPath,
  getRootDirectory,
  readFileAsText,
  writeFile,
} from "../fs";
import {
  getAudioAssetList,
  getImageAssetList,
  getListNodesIndex,
  uuidToRef,
} from "../generators";
import { generateBinaryFromAssetIndex } from "../generators/asset";
import { v2GenerateBtBinary, v3GenerateBtBinary } from "../generators/bt";
import { generateLiBinary } from "../generators/li";
import { generateNiBinary } from "../generators/ni";
import { unzip } from "../zip";
import { DeviceV2, DeviceV3 } from "./deviceInfo";
import { installPreparedPack } from "./transactions";
import { PackMetadata, StudioPack } from "./types";

export const installPack = async (
  archive: FileSystemFileHandle,
  device: DeviceV2 | DeviceV3,
  deviceHandle: FileSystemDirectoryHandle,
) => {
  // identify the encryption method according to the device
  let encrypt: (block: Uint8Array) => Promise<Uint8Array | null>;

  if (device.version === "V2") {
    encrypt = encryptXxtea(v2CommonKey);
  } else if (device.version === "V3") {
    encrypt = encryptAes(device.easKey, device.iv);
  } else {
    throw new Error("Unknown device version");
  }

  state.installation.step.set("UNZIPPING");

  const file = await archive.getFile();
  const root = await getRootDirectory();

  // All callers hold the cross-tab device-write lock before entering this function.
  for await (const entry of root.values()) {
    if (
      entry.kind === "directory" &&
      (entry.name === "temp" || entry.name.startsWith("lunii-install-"))
    ) {
      await root.removeEntry(entry.name, { recursive: true });
    }
  }
  const tempName = `lunii-install-${crypto.randomUUID()}`;
  const tempDir = await root.getDirectoryHandle(tempName, { create: true });
  try {
    // Each attempt owns its staging directory, including after a tab crash.
    const zipDir = await tempDir.getDirectoryHandle("zip", { create: true });
    const outDir = await tempDir.getDirectoryHandle("output", {
      create: true,
    });

    // unzip the archive
    await unzip(file, zipDir);

    // read the pack.json
    const packJson = await readFileAsText(
      await zipDir.getFileHandle("story.json"),
    );
    const pack: StudioPack = JSON.parse(packJson);

    if (
      (pack.title != null && typeof pack.title !== "string") ||
      (pack.description != null && typeof pack.description !== "string")
    ) {
      throw new Error(
        "Le titre et la description du pack doivent être du texte.",
      );
    }
    const packUuid = pack.uuid || pack.stageNodes?.[0]?.uuid;
    if (
      !/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(packUuid) ||
      !Array.isArray(pack.stageNodes) ||
      !pack.stageNodes.length ||
      !Array.isArray(pack.actionNodes)
    ) {
      throw new Error("Ce fichier ne contient pas un pack STUdio valide.");
    }
    const metadata: PackMetadata = {
      description: pack.description || "",
      ref: uuidToRef(packUuid),
      title: pack.title || "",
      uuid: packUuid,
      packType: "custom",
      installSource: "lunii-admin",
    };

    state.installation.pack.set(metadata);
    state.installation.step.set("PREPARING");

    // prepare datas
    const imageAssetList = getImageAssetList(pack);
    const audioAssetList = getAudioAssetList(pack);
    const listNodesList = getListNodesIndex(pack.actionNodes);

    // generate binaries
    const riBinary = generateBinaryFromAssetIndex(imageAssetList);
    const siBinary = generateBinaryFromAssetIndex(audioAssetList);

    const niBinary = generateNiBinary(
      pack,
      imageAssetList,
      audioAssetList,
      listNodesList,
    );

    const liBinary = generateLiBinary(listNodesList, pack.stageNodes);

    const btBinary =
      device.version == "V3"
        ? await v3GenerateBtBinary()
        : await v2GenerateBtBinary(
            await encryptFirstBlock(riBinary, encrypt),
            (device as DeviceV2).specificKey,
          );

    if (!btBinary) throw new Error("Failed to generate bt binary");

    // write binaries
    await writeFile(outDir, "ni", niBinary, true);
    console.log("about to write li, ri, si");
    await writeFile(
      outDir,
      "li",
      await encryptFirstBlock(liBinary, encrypt),
      true,
    );
    await writeFile(
      outDir,
      "ri",
      await encryptFirstBlock(riBinary, encrypt),
      true,
    );
    await writeFile(
      outDir,
      "si",
      await encryptFirstBlock(siBinary, encrypt),
      true,
    );
    await writeFile(outDir, "bt", btBinary, true);

    console.log("All binaries were successfully generated");

    state.installation.step.set("IMAGES");

    // convert and write all images to bmp4
    for (const asset of imageAssetList) {
      const handle = await getFileHandleFromPath(
        zipDir,
        "assets/" + asset.name,
      );
      const imageFile = await handle.getFile();

      const bmpBlob = await convertImageToBmp4(imageFile);
      const bmp = new Uint8Array(await bmpBlob.arrayBuffer());

      const cipheredBmp = await encryptFirstBlock(bmp, encrypt);

      const assetName = asset.position.toString().padStart(8, "0");
      await writeFile(outDir, "rf/000/" + assetName, cipheredBmp, true);
      // await writeFile(outDir, "rf/000/" + assetName + "-debug.bmp", bmp, true); // debug
    }
    console.log("All images were successfully converted to bmp4");

    state.installation.audioFileGenerationProgress.totalCount.set(
      audioAssetList.length,
    );

    state.installation.step.set("CONVERTING");
    // convert and write all audios to mp3
    for (const asset of audioAssetList) {
      const assetName = asset.position.toString().padStart(8, "0");

      // insert blank mp3 when we find an empty audio
      if (asset.name === "BLANK_MP3") {
        const cipheredMp3 = await encryptFirstBlock(BLANK_MP3_FILE, encrypt);
        await writeFile(outDir, "sf/000/" + assetName, cipheredMp3, true);
        state.installation.audioFileGenerationProgress.doneCount.set(
          asset.position + 1,
        );
        continue;
      }

      // otherwise convert the file
      const handle = await getFileHandleFromPath(
        zipDir,
        "assets/" + asset.name,
      );
      const audioFile = await handle.getFile();

      const mp3 = await convertAudioToMP3(audioFile);
      const cipheredMp3 = await encryptFirstBlock(mp3, encrypt);

      await writeFile(outDir, "sf/000/" + assetName, cipheredMp3, true);
      // await writeFile(outDir, "sf/000/" + assetName + "-debug.mp3", mp3, true); //debug
      console.log(
        `Audio file ${asset.position} / ${audioAssetList.length} converted to mp3`,
      );
      state.installation.audioFileGenerationProgress.doneCount.set(
        asset.position + 1,
      );
    }
    console.log("All audios were successfully converted to mp3");

    // write yaml metadata
    await writeFile(outDir, "md", stringify(metadata), true);

    console.log("Metadata was successfully generated");

    state.installation.step.set("COPYING");
    await installPreparedPack(deviceHandle, metadata.uuid, outDir);

    const hasTitle = typeof pack.title === "string" && pack.title.trim() !== "";
    return { hasTitle, archiveSize: file.size };
  } finally {
    // clean
    await root.removeEntry(tempName, { recursive: true }).catch(() => {});
    console.log("Temporary files were successfully removed");
    resetPackInstallationState();
  }
};
