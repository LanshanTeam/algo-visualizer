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
    // Tighter array columns enlarge the whole SVG at constrained widths;
    // increasing maxWidth alone has no effect when the card is narrower.
    // Keep 10 units between cells and preserve all vertical motion lanes.
    stride = linked ? 112 : 68;
  const extended = !linked && (frame.arraySlots !== undefined || frame.held !== undefined || frame.auxiliary !== undefined);
  const baseline = linked ? 84 : 72;
  // Leave a real gap below the held node without moving the shared main row.
  const heldY = 16;
  const width = Math.max(
    430,
    56 + Math.max(0, capacity - 1) * stride + nodeWidth + (linked ? 72 : 0),
  );
  const position = (state: Frame, id: number) => {
    const index = !linked && state.arraySlots
      ? state.arraySlots.findIndex((item) => item?.id === id)
      : state.items.findIndex((item) => item.id === id);
    if (!linked && state.held?.id === id) return { x: 28, y: heldY };
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
      // Merge's "copy" frame commits the whole buffer. Rewinding that
      // boundary is atomic too; merely carrying an auxiliary row is not.
      const atomicWriteback = frame.anchor === "copy" || previous?.anchor === "copy";
      if (atomicWriteback) return { x: times.map(() => to.x), y: times.map(() => to.y) };
      if (extended && (frame.held || previous?.held)) {
        const held = frame.held?.id === id || previous?.held?.id === id;
        return {
          x: [from.x, from.x, to.x, to.x],
          y: held ? [from.y, heldY, heldY, to.y] : [from.y, from.y, to.y, to.y],
        };
      }
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
    height: !linked && frame.auxiliary ? 284 : 208,
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
