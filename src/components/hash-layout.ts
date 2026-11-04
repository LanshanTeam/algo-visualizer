import type { Frame } from "../core/types";
import { HASH_BUCKET_COUNT, hashSlot } from "../core/hash";
import type { Track } from "./scene-geometry";

const STAGE_HEIGHT = 208;
const MARGIN = 18;
const FORMULA_Y = 4;
const FORMULA_HEIGHT = 20;
const ROW_TOP = 30;
const ROW_PITCH = 24;
const NODE_WIDTH = 36;
const NODE_HEIGHT = 20;
const NODE_GAP = 20;
const BUCKET_WIDTH = 36;
const BUCKET_GAP = 20;
const STRIDE = NODE_WIDTH + NODE_GAP;
const FIRST_NODE_X = MARGIN + BUCKET_WIDTH + BUCKET_GAP;

interface HashShape {
  chains: number[][];
  place: Map<number, { bucket: number; index: number }>;
}

/**
 * 按 `bucketHeads` 与链边还原 7 条链。
 * 无法从桶头到达的条目按自身桶号补到链尾，避免布局丢节点。
 */
export function readHashChains(frame: Frame): number[][] {
  const ids = new Set(frame.items.map((item) => item.id));
  const next = new Map<number, number>();
  for (const [from, to] of frame.links ?? []) {
    if (from === to || !ids.has(from) || !ids.has(to)) continue;
    if (!next.has(from)) next.set(from, to);
  }
  const heads = frame.bucketHeads ?? [];
  const visited = new Set<number>();
  const chains: number[][] = Array.from(
    { length: HASH_BUCKET_COUNT },
    () => [],
  );
  for (let bucket = 0; bucket < HASH_BUCKET_COUNT; bucket++) {
    let id = heads[bucket];
    while (typeof id === "number" && ids.has(id) && !visited.has(id)) {
      chains[bucket].push(id);
      visited.add(id);
      id = next.get(id) ?? null;
    }
  }
  for (const item of frame.items) {
    if (visited.has(item.id)) continue;
    chains[hashSlot(item.value)].push(item.id);
    visited.add(item.id);
  }
  return chains;
}

/** 整段 trace 中最长链的长度，用来稳定画布宽度。 */
export function hashChainCapacityOf(frame: Frame) {
  return Math.max(0, ...readHashChains(frame).map((chain) => chain.length));
}

/** 7 行桶布局：左侧桶格，右侧冲突链；顶部留出公式条。 */
export function createHashLayout({
  frame,
  previous,
  chainCapacity,
}: {
  frame: Frame;
  previous?: Frame;
  chainCapacity: number;
}) {
  const slots = Math.max(0, chainCapacity);
  const width =
    slots === 0
      ? 430
      : Math.max(
          430,
          MARGIN +
            BUCKET_WIDTH +
            BUCKET_GAP +
            (slots - 1) * STRIDE +
            NODE_WIDTH +
            MARGIN,
        );
  const shapes = new Map<Frame, HashShape>();
  const shapeOf = (state: Frame): HashShape => {
    let shape = shapes.get(state);
    if (!shape) {
      const chains = readHashChains(state);
      const place = new Map<number, { bucket: number; index: number }>();
      chains.forEach((chain, bucket) =>
        chain.forEach((id, index) => place.set(id, { bucket, index })),
      );
      shape = { chains, place };
      shapes.set(state, shape);
    }
    return shape;
  };
  const position = (state: Frame, id: number) => {
    const place = shapeOf(state).place.get(id) ?? { bucket: 0, index: 0 };
    return {
      x: FIRST_NODE_X + place.index * STRIDE,
      y: ROW_TOP + place.bucket * ROW_PITCH,
    };
  };
  const track = (id: number): Track => {
    const to = position(frame, id);
    const from = previous?.items.some((item) => item.id === id)
      ? position(previous, id)
      : to;
    return { x: [from.x, to.x], y: [from.y, to.y] };
  };
  return {
    width,
    height: STAGE_HEIGHT,
    times: [0, 1],
    chains: readHashChains(frame),
    position,
    track,
    bucketX: MARGIN,
    bucketWidth: BUCKET_WIDTH,
    bucketHeight: NODE_HEIGHT,
    bucketRowY: (bucket: number) => ROW_TOP + bucket * ROW_PITCH,
    nodeWidth: NODE_WIDTH,
    nodeHeight: NODE_HEIGHT,
    formula: {
      x: MARGIN,
      y: FORMULA_Y,
      width: width - MARGIN * 2,
      height: FORMULA_HEIGHT,
    },
  };
}
