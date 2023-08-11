import { ListNode } from ".";
import { StudioStageNode } from "../lunii/types";

export const generateLiBinary = (
  listNodes: ListNode[],
  nodes: StudioStageNode[]
) => {
  const lastListNode = listNodes.at(-1);
  if (!lastListNode) throw new Error("No list node found");

  // length of the buffer is the total number of options in the listNodes array as a 4 bytes
  const bufferLength =
    (lastListNode.absolutePosition + lastListNode.options.length) * 4;

  const buf = new ArrayBuffer(bufferLength);
  const view = new DataView(buf);
  let offset = 0;

  for (const listNode of listNodes) {
    for (const option of listNode.options) {
      const optionIndex = nodes.findIndex((node) => node.uuid === option);
      if (optionIndex === -1)
        throw new Error(`Node ${option} not found in index`);
      view.setUint32(offset, optionIndex, true);
      offset += 4;
    }
  }

  return new Uint8Array(buf);
};
