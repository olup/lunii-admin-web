import { Asset, GetLisNodeIndexedById, ListNode, boolToInt } from ".";
import { StudioPack } from "../lunii/types";

export const generateNiBinary = (
  pack: StudioPack,
  imageIndex: Asset[],
  audioIndex: Asset[],
  listNodeIndex: ListNode[]
): Uint8Array => {
  const stageNodes = pack.stageNodes;

  // prepare the buffer
  const buf = new ArrayBuffer(512 + stageNodes.length * 44);
  const view = new DataView(buf);

  let offset = 0;

  // Nodes index file format version (1)
  view.setUint16(offset, 1, true);
  offset += 2;

  // Story pack version (1)
  view.setInt16(offset, pack.version, true);
  offset += 2;

  // Address of actual nodes list start in this file (0x200 / 512)
  view.setInt32(offset, 512, true);
  offset += 4;

  // Size of a stage node in this file (0x2C / 44)
  view.setInt32(offset, 44, true);
  offset += 4;

  // Number of stage nodes in this file
  view.setInt32(offset, stageNodes.length, true);
  offset += 4;

  // Number of images (in RI file and rf/ folder)
  view.setInt32(offset, imageIndex.length, true);
  offset += 4;

  // Number of sounds (in SI file and sf/ folder)
  view.setInt32(offset, audioIndex.length, true);
  offset += 4;

  // Is factory pack: byte set to one to avoid pack inspection by official Luniistore application
  view.setInt8(offset, 1);
  offset++;

  // Jump to address 0x200 (512) for the actual list of nodes (already written 25 bytes)
  offset = 512;

  // Write each stage node
  for (const node of stageNodes) {
    // image might be empty
    if (!node.image) {
      view.setInt32(offset, -1, true);
    } else {
      // TODO: if we don't create an index, we don't need the index property on asset
      const imageAsset = imageIndex.find((asset) => asset.name === node.image);
      if (!imageAsset)
        throw new Error(`Image asset ${node.image} not found in index`);
      view.setInt32(offset, imageAsset.position, true);
    }
    offset += 4;

    const audioAsset = audioIndex.find((asset) => asset.name === node.audio);
    if (!audioAsset)
      throw new Error(`Sound asset ${node.audio} not found in index`);
    view.setInt32(offset, audioAsset.position, true);

    offset += 4;

    // okTransition, otherwise set to -1
    if (node.okTransition) {
      const listNode = GetLisNodeIndexedById(
        node.okTransition.actionNode,
        listNodeIndex
      );
      view.setInt32(offset, listNode.absolutePosition, true);
      view.setInt32(offset + 4, listNode.options.length, true);
      view.setInt32(offset + 8, node.okTransition.optionIndex, true);
    } else {
      view.setInt32(offset, -1, true);
      view.setInt32(offset + 4, -1, true);
      view.setInt32(offset + 8, -1, true);
    }
    offset += 12;

    // homeTransition or -1
    if (node.homeTransition) {
      const listNode = GetLisNodeIndexedById(
        node.homeTransition.actionNode,
        listNodeIndex
      );
      view.setInt32(offset, listNode.absolutePosition, true);
      view.setInt32(offset + 4, listNode.options.length, true);
      view.setInt32(offset + 8, node.homeTransition.optionIndex, true);
    } else {
      view.setInt32(offset, -1, true);
      view.setInt32(offset + 4, -1, true);
      view.setInt32(offset + 8, -1, true);
    }
    offset += 12;

    view.setInt16(offset, boolToInt(node.controlSettings.wheel), true);
    view.setInt16(offset + 2, boolToInt(node.controlSettings.ok), true);
    view.setInt16(offset + 4, boolToInt(node.controlSettings.home), true);
    view.setInt16(offset + 6, boolToInt(node.controlSettings.pause), true);
    view.setInt16(offset + 8, boolToInt(node.controlSettings.autoplay), true);
    view.setInt16(offset + 10, 0, true);
    offset += 12;
  }

  return new Uint8Array(buf);
};
