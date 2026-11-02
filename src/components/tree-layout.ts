import type { Frame, FrameLinkSide } from "../core/types";
import type { Track } from "./scene-geometry";

const STAGE_HEIGHT = 208;
const MARGIN = 18;
const MAX_DIAMETER = 44;
const MIN_DIAMETER = 8;

interface TreeNodeSlots {
  left?: number;
  right?: number;
}

/** 一帧的森林结构：孩子、根、深度与中序 rank。 */
export interface TreeShape {
  children: Map<number, TreeNodeSlots>;
  roots: number[];
  depth: Map<number, number>;
  rank: Map<number, number>;
  size: number;
}

/**
 * 按 `links` 还原森林。
 * 第三项标记左右孩子；缺省时同一父节点的连线按顺序回退为左、右。
 * 成环或不可达的节点会追加为额外根，保证不丢节点。
 */
export function readTree(frame: Frame): TreeShape {
  const ids = frame.items.map((item) => item.id);
  const known = new Set(ids);
  const children = new Map<number, TreeNodeSlots>();
  for (const id of ids) children.set(id, {});
  const hasParent = new Set<number>();
  for (const [from, to, side] of frame.links ?? []) {
    if (!known.has(from) || !known.has(to) || from === to) continue;
    const slots = children.get(from)!;
    let target: FrameLinkSide | undefined = side;
    if (!target) {
      if (slots.left === undefined) target = "left";
      else if (slots.right === undefined) target = "right";
      else continue;
    }
    if (target === "left") {
      if (slots.left !== undefined) continue;
      slots.left = to;
    } else {
      if (slots.right !== undefined) continue;
      slots.right = to;
    }
    hasParent.add(to);
  }

  const roots: number[] = [];
  const rootSet = new Set<number>();
  const addRoot = (id: number) => {
    if (rootSet.has(id)) return;
    rootSet.add(id);
    roots.push(id);
  };
  if (typeof frame.rootId === "number" && known.has(frame.rootId))
    addRoot(frame.rootId);
  for (const id of ids) if (!hasParent.has(id)) addRoot(id);

  const depth = new Map<number, number>();
  const rank = new Map<number, number>();
  const visited = new Set<number>();
  let nextRank = 0;
  const walk = (id: number, level: number) => {
    if (visited.has(id)) return;
    visited.add(id);
    depth.set(id, level);
    const slots = children.get(id);
    if (slots?.left !== undefined) walk(slots.left, level + 1);
    rank.set(id, nextRank++);
    if (slots?.right !== undefined) walk(slots.right, level + 1);
  };
  for (const root of roots) walk(root, 0);
  for (const id of ids) {
    if (visited.has(id)) continue;
    addRoot(id);
    walk(id, 0);
  }
  return { children, roots, depth, rank, size: ids.length };
}

function maxDepthOf(shape: TreeShape) {
  let max = 0;
  for (const level of shape.depth.values()) max = Math.max(max, level);
  return max;
}

/** 整段演示的最大深度（根为 0，空树为 0），用于稳定节点直径与行距。 */
export function treeDepthOf(frame: Frame) {
  return maxDepthOf(readTree(frame));
}

/**
 * 二维树布局：中序 rank 定 x，深度定 y。
 * `treeDepth` 取整段 trace 的最大深度，避免创建过程中尺寸抖动。
 */
export function createTreeLayout({
  frame,
  previous,
  capacity,
  treeDepth,
}: {
  frame: Frame;
  previous?: Frame;
  capacity: number;
  treeDepth: number;
}) {
  const shape = readTree(frame);
  const depth = Math.max(0, treeDepth);
  const frameDepth = maxDepthOf(shape);
  const diameter =
    depth === 0
      ? MAX_DIAMETER
      : Math.min(
          MAX_DIAMETER,
          Math.max(MIN_DIAMETER, (172 - depth * 4) / (depth + 1)),
        );
  const rowGap = depth === 0 ? 0 : (172 - diameter) / depth;
  const slot = Math.max(diameter + 10, 34);
  const width = Math.max(430, 2 * MARGIN + capacity * slot);
  const shapes = new Map<Frame, TreeShape>();
  shapes.set(frame, shape);
  if (previous) shapes.set(previous, readTree(previous));
  const shapeOf = (state: Frame) => {
    let result = shapes.get(state);
    if (!result) {
      result = readTree(state);
      shapes.set(state, result);
    }
    return result;
  };
  const position = (state: Frame, id: number) => {
    const stateShape = shapeOf(state);
    const stateDepth = maxDepthOf(stateShape);
    const offsetX =
      (width - (2 * MARGIN + state.items.length * slot)) / 2;
    const offsetY =
      (STAGE_HEIGHT - (diameter + stateDepth * rowGap)) / 2;
    return {
      x:
        offsetX +
        MARGIN +
        (stateShape.rank.get(id) ?? 0) * slot +
        (slot - diameter) / 2,
      y: offsetY + (stateShape.depth.get(id) ?? 0) * rowGap,
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
    diameter,
    slot,
    rowGap,
    width,
    height: STAGE_HEIGHT,
    treeDepth: depth,
    frameDepth,
    times: [0, 1],
    position,
    track,
  };
}
