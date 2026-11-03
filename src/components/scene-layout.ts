import type { Frame, ImplementedSceneKind } from "../core/types";
import type { Track } from "./scene-geometry";

/** 竖排栈最多展示 6 个槽位，再多会超出 208 的逻辑高度。 */
const STACK_SLOTS_MAX = 6;
/** 栈底槽位的下边缘。 */
const STACK_BOTTOM = 184;
/** 竖排栈的列左边缘，另外留出左侧下标与右侧 top 标注。 */
const STACK_COLUMN_X = 168;

export function createSceneLayout({
  frame,
  previous,
  kind,
  capacity,
}: {
  frame: Frame;
  previous?: Frame;
  kind: ImplementedSceneKind;
  capacity: number;
}) {
  const linked = kind === "linked-list";
  const vertical = kind === "stack";
  const nodeHeight = vertical ? 26 : 52,
    nodeWidth = linked ? 80 : vertical ? 104 : 58,
    stride = vertical ? 30 : linked ? 112 : 76;
  const baseline = linked ? 84 : 72;
  const slots = linked
    ? 0
    : Math.max(1, vertical ? Math.min(capacity, STACK_SLOTS_MAX) : capacity);
  // 左侧留 28，右侧留 28；栈是竖排，宽度固定。
  const width = linked
    ? Math.max(430, 56 + Math.max(0, capacity - 1) * stride + nodeWidth + 72)
    : vertical
      ? 430
      : Math.max(430, 56 + Math.max(0, slots - 1) * stride + nodeWidth);
  const front = (state: Frame) => Number(state.variables.front ?? 0);
  const position = (state: Frame, id: number) => {
    const index = state.items.findIndex((item) => item.id === id);
    if (vertical)
      return {
        x: STACK_COLUMN_X,
        y: STACK_BOTTOM - nodeHeight - index * stride,
      };
    // 顺序队列按槽位摆放：出队只让 front 右移，元素原地不动。
    if (kind === "queue")
      return { x: 28 + (front(state) + index) * stride, y: baseline };
    const preparingInsert =
      linked &&
      state.detached !== undefined &&
      ["allocate", "connect"].includes(state.anchor);
    const insertionIndex = Number(state.variables.index);
    const column =
      linked && state.detached === id
        ? insertionIndex
        : preparingInsert && index >= insertionIndex
          ? index + 1
          : index;
    return {
      x: 28 + column * stride,
      y: linked && state.detached === id ? 20 : baseline,
    };
  };
  const joining =
    linked &&
    previous?.detached !== undefined &&
    frame.detached !== previous.detached &&
    frame.items.some((item) => item.id === previous.detached);
  const leaving =
    linked &&
    frame.detached !== undefined &&
    previous?.detached !== frame.detached &&
    previous?.items.some((item) => item.id === frame.detached);
  const times = linked
    ? joining
      ? [0, 0.65, 1]
      : leaving
        ? [0, 0.35, 1]
        : [0, 1]
    : kind === "array"
      ? [0, 0.24, 0.76, 1]
      : [0, 1];
  const track = (id: number): Track => {
    const to = position(frame, id);
    const seen = previous?.items.some((item) => item.id === id) ?? false;
    const from = seen ? position(previous!, id) : to;
    if (!linked) {
      // 新元素不从邻居所在的那一行凭空出现：数组从下方升入，栈与队列从上方落入。
      // 只有存在上一帧时才需要入场轨迹，跳转或首帧直接落在目标位置。
      if (previous && !seen) {
        if (kind === "array")
          return {
            x: [to.x, to.x, to.x, to.x],
            y: [to.y + 56, to.y + 56, to.y, to.y],
          };
        const lift = vertical ? Math.min(56, to.y) : 56;
        return { x: [to.x, to.x], y: [to.y - lift, to.y] };
      }
      // 只有数组会在同一行内左右挪动，走上下轨道避让；栈与队列只做竖直或槽位对齐。
      if (kind !== "array") return { x: [from.x, to.x], y: [from.y, to.y] };
      const lane = from.x === to.x ? 0 : from.x < to.x ? -64 : 64;
      return {
        x: [from.x, from.x, to.x, to.x],
        y: [from.y, from.y + lane, from.y + lane, to.y],
      };
    }
    if (joining)
      return id === previous!.detached
        ? { x: [from.x, from.x, to.x], y: [from.y, from.y, to.y] }
        : { x: [from.x, to.x, to.x], y: [from.y, to.y, to.y] };
    if (leaving)
      return id === frame.detached
        ? { x: [from.x, to.x, to.x], y: [from.y, to.y, to.y] }
        : { x: [from.x, from.x, to.x], y: [from.y, from.y, to.y] };
    return { x: [from.x, to.x], y: [from.y, to.y] };
  };
  return {
    nodeHeight,
    nodeWidth,
    stride,
    baseline,
    slots,
    columnX: STACK_COLUMN_X,
    bottom: STACK_BOTTOM,
    width,
    times,
    position,
    track,
  };
}
