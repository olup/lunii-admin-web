import { stringify } from "yaml";
import { state } from "../../store";
import { cipherFirstBlockCommonKey } from "../cipher";
import { convertAudioToMP3 } from "../convertors/audio";
import { convertImageToBmp4 } from "../convertors/image";
import {
  copyAll,
  getFileHandleFromPath,
  getRootDirectory,
  readFile,
  writeFile,
} from "../fs";
import {
  getAudioAssetList,
  getImageAssetList,
  getListNodesIndex,
} from "../generators";
import { generateBinaryFromAssetIndex } from "../generators/asset";
import { generateBtBinary } from "../generators/bt";
import { generateLiBinary } from "../generators/li";
import { generateNiBinary } from "../generators/ni";
import { unzip } from "../zip";
import { addPackUuid } from "./packs";
import { PackMetadata, StudioPack } from "./types";

export const installPack = async (
  archive: FileSystemFileHandle,
  deviceSepcificKey: Uint8Array
) => {
  state.installation.isInstalling.set(true);

  try {
    const file = await archive.getFile();
    const root = await getRootDirectory();

    // prepare the directories
    const tempDir = await root.getDirectoryHandle("temp", { create: true });
    const zipDir = await tempDir.getDirectoryHandle("zip", { create: true });
    const outDir = await tempDir.getDirectoryHandle("output", {
      create: true,
    });

    // unzip the archive
    await unzip(file, zipDir);

    // read the pack.json
    const packJson = await readFile(await zipDir.getFileHandle("story.json"));
    const pack: StudioPack = JSON.parse(packJson);

    const packUuid = pack.uuid || pack.stageNodes[0].uuid;
    const metadata: PackMetadata = {
      description: pack.description,
      ref: packUuid.slice(-8).toUpperCase(),
      title: pack.title,
      uuid: packUuid,
      packType: "custom",
      installSource: "lunii-admin",
    };

    state.installation.pack.set(metadata);

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
      listNodesList
    );

    const liBinary = generateLiBinary(listNodesList, pack.stageNodes);

    const btBinary = generateBtBinary(
      cipherFirstBlockCommonKey(riBinary),
      deviceSepcificKey
    );

    // write binaries
    await writeFile(outDir, "ni", niBinary, true);
    await writeFile(outDir, "li", cipherFirstBlockCommonKey(liBinary), true);
    await writeFile(outDir, "ri", cipherFirstBlockCommonKey(riBinary), true);
    await writeFile(outDir, "si", cipherFirstBlockCommonKey(siBinary), true);
    await writeFile(outDir, "bt", btBinary, true);

    console.log("All binaries were successfully generated");

    // convert and write all images to bmp4
    for (const asset of imageAssetList) {
      const handle = await getFileHandleFromPath(
        zipDir,
        "assets/" + asset.name
      );
      const imageFile = await handle.getFile();

      const bmpBlob = await convertImageToBmp4(imageFile);
      const bmp = new Uint8Array(await bmpBlob.arrayBuffer());

      const cipheredBmp = cipherFirstBlockCommonKey(bmp);

      const assetName = asset.position.toString().padStart(8, "0");
      await writeFile(outDir, "rf/000/" + assetName, cipheredBmp, true);
      await writeFile(outDir, "rf/000/" + assetName + ".bmp", bmp, true);
    }
    console.log("All images were successfully converted to bmp4");

    // convert and write all audios to mp3
    for (const asset of audioAssetList) {
      const handle = await getFileHandleFromPath(
        zipDir,
        "assets/" + asset.name
      );
      const audioFile = await handle.getFile();

      const mp3 = await convertAudioToMP3(audioFile);
      const cipheredMp3 = cipherFirstBlockCommonKey(mp3);

      const assetName = asset.position.toString().padStart(8, "0");
      await writeFile(outDir, "sf/000/" + assetName, cipheredMp3, true);
      await writeFile(outDir, "sf/000/" + assetName + ".mp3", mp3, true);
      console.log(
        `Audio file ${asset.position} / ${audioAssetList.length} converted to mp3`
      );
    }
    console.log("All audios were successfully converted to mp3");

    // write yaml metadata
    await writeFile(outDir, "md", stringify(metadata), true);

    console.log("Metadata was successfully generated");

    // copy all temp files to the device
    const deviceHandle = state.luniiHandle.peek();
    const contentDir = await deviceHandle.getDirectoryHandle(".content");
    const packDir = await contentDir.getDirectoryHandle(metadata.ref, {
      create: true,
    });

    await copyAll(outDir, packDir);

    console.log("Generated files were successfully copied to the device");

    // add pack to device pack index
    await addPackUuid(deviceHandle, metadata.uuid);

    console.log("Pack uuid was successfully added to the device index");

    // clean
    await root.removeEntry("temp", { recursive: true });

    console.log("Temporary files were successfully removed");

    state.installation.isInstalling.set(false);
  } catch (error) {
    state.installation.isInstalling.set(false);
    throw error;
  }
};
