import { convertAudioToMP3 } from "../convertors/audio";
import { convertImageToBmp4 } from "../convertors/image";
import {
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
import { generateLiBinary } from "../generators/li";
import { generateNiBinary } from "../generators/ni";
import { unzip } from "../zip";
import { StudioPack } from "./types";

export const installPack = async (archive: FileSystemFileHandle) => {
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

  // prepare datas
  const imageAssetList = getImageAssetList(pack);
  const audioAssetList = getAudioAssetList(pack);
  const listNodesList = getListNodesIndex(pack.actionNodes);

  // generate binaries
  const imageAssetListBinary = generateBinaryFromAssetIndex(imageAssetList);
  const audioAssetListBinary = generateBinaryFromAssetIndex(audioAssetList);

  const niBinary = generateNiBinary(
    pack,
    imageAssetList,
    audioAssetList,
    listNodesList
  );

  const liBinary = generateLiBinary(listNodesList, pack.stageNodes);

  // write binaries
  writeFile(outDir, "ri", imageAssetListBinary, true);
  writeFile(outDir, "si", audioAssetListBinary, true);
  writeFile(outDir, "ni", niBinary, true);
  writeFile(outDir, "li", liBinary, true);

  // convert and write all images to bmp4
  for (const asset of imageAssetList) {
    const handle = await getFileHandleFromPath(zipDir, "assets/" + asset.name);
    const imageFile = await handle.getFile();

    const bmp = await convertImageToBmp4(imageFile);

    const assetName = asset.position.toString().padStart(8, "0");
    await writeFile(outDir, "rf/000/" + assetName, bmp, true);
  }
  console.log("All images were successfully converted to bmp4");

  // convert and write all audios to mp3
  for (const asset of audioAssetList) {
    const handle = await getFileHandleFromPath(zipDir, "assets/" + asset.name);
    const audioFile = await handle.getFile();

    const mp3 = await convertAudioToMP3(audioFile);

    const assetName = asset.position.toString().padStart(8, "0");
    await writeFile(outDir, "sf/000/" + assetName, mp3, true);
  }
  console.log("All audios were successfully converted to mp3");
};
