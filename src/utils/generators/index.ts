import { StudioActionNode, StudioPack } from "../lunii/types";

export type Asset = {
  nodeUuid: string;
  position: number;
  name: string;
};

export const getImageAssetList = (pack: StudioPack) => {
  const imageAssetList: Asset[] = [];
  let position = 0;
  pack.stageNodes.forEach((stageNode) => {
    if (stageNode.image) {
      imageAssetList.push({
        nodeUuid: stageNode.uuid,
        position,
        name: stageNode.image,
      });
      position++;
    }
  });
  return imageAssetList;
};

export type ListNode = {
  id: string;
  options: string[];
  position: number;
  absolutePosition: number;
};
export const getListNodesIndex = (
  actionNodes: StudioActionNode[]
): ListNode[] => {
  let cursor = 0;
  return actionNodes.map((actionNode, i) => {
    const node = {
      id: actionNode.id,
      options: actionNode.options,
      position: i,
      absolutePosition: cursor,
    };
    cursor += actionNode.options.length;
    return node;
  });
};

export const GetLisNodeIndexedById = (
  id: string,
  listNodeIndex: ListNode[]
) => {
  const index = listNodeIndex.findIndex((listNode) => listNode.id === id);
  if (index === -1) throw new Error(`List node ${id} not found in index`);
  return listNodeIndex[index];
};

export const boolToInt = (bool: boolean) => (bool ? 1 : 0);

export const getAudioAssetList = (pack: StudioPack) => {
  const imageAssetList: Asset[] = [];
  let position = 0;
  pack.stageNodes.forEach((stageNode) => {
    if (stageNode.audio) {
      imageAssetList.push({
        nodeUuid: stageNode.uuid,
        position,
        name: stageNode.audio,
      });
    } else {
      imageAssetList.push({
        nodeUuid: stageNode.uuid,
        position,
        name: "BLANK_MP3",
      });
      stageNode.audio = "BLANK_MP3";
    }
    position++;
  });
  return imageAssetList;
};

export const uuidToRef = (uuid: string) => uuid.slice(-8).toUpperCase();
