import type { Frame } from "../core/types";
import type { Track } from "./scene-geometry";

export function createSceneLayout({
  frame,
  previous,
  linked,
  capacity,
}: {
  frame: Frame;
  previous?: Frame;
  linked: boolean;
  capacity: number;
}) {
  const nodeHeight = 52,
    nodeWidth = linked ? 80 : 58,
    stride = linked ? 112 : 76;
  const baseline = linked ? 84 : 72;
  const width = Math.max(
    430,
    56 + Math.max(0, capacity - 1) * stride + nodeWidth + (linked ? 72 : 0),
  );
  const position = (state: Frame, id: number) => {
    const index = state.items.findIndex((item) => item.id === id);
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
    : [0, 0.24, 0.76, 1];
  const track = (id: number): Track => {
    const to = position(frame, id);
    const from = previous?.items.some((item) => item.id === id)
      ? position(previous, id)
      : to;
    if (!linked) {
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
    width,
    times,
    position,
    track,
  };
}
