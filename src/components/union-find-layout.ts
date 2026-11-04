import type { Frame } from "../core/types";
import type { Track } from "./scene-geometry";

const STAGE_HEIGHT = 208;
const MARGIN = 18;
const TREE_TOP = 6;
const TREE_HEIGHT = 126;
const NODE_DIAMETER = 28;
const PARENT_Y = 146;
const PARENT_HEIGHT = 22;
const RANK_Y = 177;
const RANK_HEIGHT = 18;
const CELL_WIDTH = 30;
const CELL_GAP = 3;
const CELL_STRIDE = CELL_WIDTH + CELL_GAP;
const ROW_LABEL_WIDTH = 44;

/** 按秩合并的树高上限：n 个元素最多 floor(log2 n) 层。 */
export function unionDepthOf(capacity: number) {
  return capacity <= 1 ? 0 : Math.floor(Math.log2(capacity));
}

/** 按 `unionParents` 还原当前帧的森林。 */
function readForest(frame: Frame) {
  const ids = frame.items.map((item) => item.id);
  const known = new Set(ids);
  const parents = new Map<number, number>();
  const children = new Map<number, number[]>();
  for (const id of ids) {
    children.set(id, []);
    parents.set(id, id);
  }
  frame.items.forEach((item, index) => {
    const parent = frame.unionParents?.[index] ?? item.id;
    if (known.has(parent) && parent !== item.id) {
      parents.set(item.id, parent);
      children.get(parent)!.push(item.id);
    }
  });
  const roots = ids.filter((id) => parents.get(id) === id);
  return { ids, parents, children, roots };
}

type UnionForest = ReturnType<typeof readForest>;

/**
 * 并查集布局：上方是森林，下方是 parent / rank 两行数组。
 * 宽度按整段 trace 的元素数固定，树层数按 rank 的理论上限预留。
 */
export function createUnionFindLayout({
  frame,
  previous,
  capacity,
}: {
  frame: Frame;
  previous?: Frame;
  capacity: number;
}) {
  const slots = Math.max(1, capacity);
  const tableWidth =
    slots * CELL_WIDTH + Math.max(0, slots - 1) * CELL_GAP;
  const width = Math.max(
    430,
    MARGIN * 2 + ROW_LABEL_WIDTH + tableWidth,
  );
  const tableStart = (width - (ROW_LABEL_WIDTH + tableWidth)) / 2;
  const cellsStart = tableStart + ROW_LABEL_WIDTH;
  const treeDepth = unionDepthOf(slots);
  const rowGap =
    treeDepth === 0
      ? 0
      : (TREE_HEIGHT - NODE_DIAMETER) / treeDepth;
  const offsetY =
    TREE_TOP +
    (TREE_HEIGHT - (NODE_DIAMETER + treeDepth * rowGap)) / 2;
  const available = width - MARGIN * 2;

  const forests = new WeakMap<Frame, UnionForest>();
  const forestOf = (state: Frame) => {
    let forest = forests.get(state);
    if (!forest) {
      forest = readForest(state);
      forests.set(state, forest);
    }
    return forest;
  };

  const positions = new WeakMap<
    Frame,
    Map<number, { x: number; y: number }>
  >();
  const layoutOf = (state: Frame) => {
    const cached = positions.get(state);
    if (cached) return cached;
    const forest = forestOf(state);
    const leaves = new Map<number, number>();
    const countLeaves = (id: number): number => {
      const cached = leaves.get(id);
      if (cached !== undefined) return cached;
      const kids = forest.children.get(id) ?? [];
      const count = kids.length
        ? kids.reduce((sum, child) => sum + countLeaves(child), 0)
        : 1;
      leaves.set(id, count);
      return count;
    };
    const totalLeaves = Math.max(
      1,
      forest.roots.reduce((sum, root) => sum + countLeaves(root), 0),
    );
    const unit = available / totalLeaves;
    const centers = new Map<number, number>();
    let cursor = 0;
    const place = (id: number): { min: number; max: number } => {
      const kids = forest.children.get(id) ?? [];
      if (!kids.length) {
        const x = MARGIN + (cursor + 0.5) * unit;
        cursor += 1;
        centers.set(id, x);
        return { min: x, max: x };
      }
      const spans = kids.map(place);
      const min = spans[0].min;
      const max = spans[spans.length - 1].max;
      centers.set(id, (min + max) / 2);
      return { min, max };
    };
    for (const root of forest.roots) place(root);
    const levelOf = (id: number) => {
      let level = 0;
      let node = id;
      const seen = new Set<number>();
      while (
        forest.parents.get(node) !== node &&
        !seen.has(node) &&
        seen.size <= forest.ids.length
      ) {
        seen.add(node);
        node = forest.parents.get(node) ?? node;
        level += 1;
      }
      return level;
    };
    const result = new Map<number, { x: number; y: number }>();
    for (const id of forest.ids) {
      const center = centers.get(id) ?? MARGIN + unit / 2;
      result.set(id, {
        x: center - NODE_DIAMETER / 2,
        y: offsetY + levelOf(id) * rowGap,
      });
    }
    positions.set(state, result);
    return result;
  };
  const position = (state: Frame, id: number) =>
    layoutOf(state).get(id) ?? { x: MARGIN, y: offsetY };
  const track = (id: number): Track => {
    const to = position(frame, id);
    const from = previous?.items.some((item) => item.id === id)
      ? position(previous, id)
      : to;
    return { x: [from.x, to.x], y: [from.y, to.y] };
  };
  const column = (index: number) => ({
    x: cellsStart + index * CELL_STRIDE,
    parentY: PARENT_Y,
    rankY: RANK_Y,
    width: CELL_WIDTH,
    parentHeight: PARENT_HEIGHT,
    rankHeight: RANK_HEIGHT,
  });
  const rowLabels = [
    {
      label: "parent",
      x: tableStart,
      y: PARENT_Y + PARENT_HEIGHT / 2 + 3.5,
    },
    {
      label: "rank",
      x: tableStart,
      y: RANK_Y + RANK_HEIGHT / 2 + 3.5,
    },
  ];
  return {
    width,
    height: STAGE_HEIGHT,
    times: [0, 1],
    nodeDiameter: NODE_DIAMETER,
    treeDepth,
    position,
    track,
    column,
    rowLabels,
    parentY: PARENT_Y,
    rankY: RANK_Y,
  };
}
