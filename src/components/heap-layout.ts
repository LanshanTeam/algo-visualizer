import type { Frame } from "../core/types";
import type { Track } from "./scene-geometry";

const STAGE_HEIGHT = 208;
const MARGIN = 18;
const TREE_TOP = 6;
const TREE_HEIGHT = 156;
const NODE_DIAMETER = 36;
const ARRAY_Y = 174;
const CELL_WIDTH = 32;
const CELL_HEIGHT = 22;
const CELL_GAP = 4;
const CELL_STRIDE = CELL_WIDTH + CELL_GAP;
const MAX_ROW_GAP = 60;

/** 堆的数组顺序：下标为数组下标，值为节点 id。 */
export function readHeapOrder(frame: Frame): number[] {
  const ids = frame.items.map((item) => item.id);
  const known = new Set(ids);
  const order = (frame.heapOrder ?? []).filter((id) => known.has(id));
  const placed = new Set(order);
  for (const id of ids) if (!placed.has(id)) order.push(id);
  return order;
}

/** 按节点数得到需要展示的树层数，根为第 0 层。 */
export function heapDepthOf(capacity: number) {
  return capacity <= 1 ? 0 : Math.floor(Math.log2(capacity));
}

/**
 * 二叉堆双视图布局：上方按数组下标画完全二叉树，下方按同一顺序画数组。
 * `capacity` 取整段 trace 的最大节点数，保证树与数组的尺寸不随帧抖动。
 */
export function createHeapLayout({
  frame,
  previous,
  capacity,
}: {
  frame: Frame;
  previous?: Frame;
  capacity: number;
}) {
  const slots = Math.max(1, capacity);
  const arrayWidth =
    slots * CELL_WIDTH + Math.max(0, slots - 1) * CELL_GAP;
  const width = Math.max(430, MARGIN * 2 + arrayWidth);
  const treeDepth = heapDepthOf(slots);
  const rowGap =
    treeDepth === 0
      ? 0
      : Math.min(
          MAX_ROW_GAP,
          (TREE_HEIGHT - NODE_DIAMETER) / treeDepth,
        );
  const orders = new Map<Frame, number[]>();
  const orderOf = (state: Frame) => {
    let order = orders.get(state);
    if (!order) {
      order = readHeapOrder(state);
      orders.set(state, order);
    }
    return order;
  };
  const position = (state: Frame, id: number) => {
    const order = orderOf(state);
    const index = order.indexOf(id);
    const safeIndex = index < 0 ? 0 : index;
    const depth = heapDepthOf(order.length);
    const offsetY =
      TREE_TOP +
      (TREE_HEIGHT - (NODE_DIAMETER + depth * rowGap)) / 2;
    const level = heapDepthOf(safeIndex + 1);
    const levelStart = 2 ** level - 1;
    const offset = safeIndex - levelStart;
    const levelCount = 2 ** level;
    const centerX =
      MARGIN +
      (offset + 0.5) * ((width - MARGIN * 2) / levelCount);
    return {
      x: centerX - NODE_DIAMETER / 2,
      y: offsetY + level * rowGap,
    };
  };
  const track = (id: number): Track => {
    const to = position(frame, id);
    const from = previous?.items.some((item) => item.id === id)
      ? position(previous, id)
      : to;
    return { x: [from.x, to.x], y: [from.y, to.y] };
  };
  const cell = (index: number) => {
    const order = orderOf(frame);
    const total =
      order.length * CELL_WIDTH + Math.max(0, order.length - 1) * CELL_GAP;
    const startX = (width - total) / 2;
    return {
      x: startX + index * CELL_STRIDE,
      y: ARRAY_Y,
      width: CELL_WIDTH,
      height: CELL_HEIGHT,
    };
  };
  return {
    width,
    height: STAGE_HEIGHT,
    times: [0, 1],
    order: orderOf(frame),
    position,
    track,
    nodeDiameter: NODE_DIAMETER,
    cell,
    cellWidth: CELL_WIDTH,
    cellHeight: CELL_HEIGHT,
    arrayY: ARRAY_Y,
    indexLabelY: ARRAY_Y - 4,
    treeDepth,
  };
}
