import type { Frame } from "../core/types";
import {
  overlaps,
  type Box,
  type SceneLink,
  type Tone,
} from "./scene-geometry";
import { createSceneLayout } from "./scene-layout";

export { connectionPathAt, sampleTrack } from "./scene-geometry";
export type { SceneLink } from "./scene-geometry";

// 固定的紧凑舞台同时容纳单元格、近邻标注和交换轨迹，不改变页面高度。
// 标注只在被轨迹穿过时避让；链表接入先让位再接入，回退顺序相反。
export function createAnimationScene({
  frame,
  previous,
  kind,
  capacity,
}: {
  frame: Frame;
  previous?: Frame;
  kind: "array" | "linked-list";
  capacity: number;
}) {
  const linked = kind === "linked-list";
  const {
    height,
    nodeHeight,
    nodeWidth,
    stride,
    baseline,
    width,
    times,
    position,
    track,
  } = createSceneLayout({ frame, previous, linked, capacity });
  const slots = !linked ? frame.arraySlots ?? frame.items : frame.items;
  const low = frame.range?.low ?? Number(frame.variables.low),
    high = frame.range?.high ?? Number(frame.variables.high);
  const nodes = frame.items.map((item, itemIndex) => {
    const index = linked ? itemIndex : slots.findIndex(slot => slot?.id === item.id);
    const tone: Tone =
      !linked && index === frame.pointers.pivot
        ? "pivot"
        : frame.settled.includes(index)
          ? "settled"
          : frame.active.includes(index)
            ? "active"
            : "idle";
    return {
      ...item,
      ...track(item.id),
      width: nodeWidth,
      height: nodeHeight,
      tone,
      muted:
        !linked &&
        Number.isFinite(low) &&
        (index < low || index > high) &&
        tone !== "settled",
      entering: !!previous && !previous.items.some((old) => old.id === item.id),
      valueX: linked ? 27 : nodeWidth / 2,
      valueY: 34,
      fontSize: Math.abs(item.value) > 99 ? 19 : 25,
    };
  });
  const auxiliary = !linked && frame.auxiliary ? {
    label: frame.auxiliary.label,
    labelX: 28, labelY: 196,
    slots: frame.auxiliary.slots.map((_, index) => ({
      x: 28 + index * stride, y: 208, width: nodeWidth, height: nodeHeight,
    })),
    nodes: frame.auxiliary.slots.flatMap((item, index) => {
      const old = previous?.auxiliary?.slots[index];
      const entries = item ? [item] : old ? [old] : [];
      return entries.map(value => ({
        ...value, index, x: 28 + index * stride, y: 208,
        width: nodeWidth, height: nodeHeight,
        opacity: !previous ? [1,1,1,1] : !item ? [1,1,0,0] : old?.id === item.id ? [1,1,1,1] : [0,0,1,1],
      }));
    }),
  } : undefined;
  const hasMotion =
    !!previous &&
    (nodes.some(
      (node) =>
        node.entering || new Set(node.x).size > 1 || new Set(node.y).size > 1,
    ) ||
      previous.items.some(
        (old) => !frame.items.some((item) => item.id === old.id),
      ) ||
      JSON.stringify(previous.links) !== JSON.stringify(frame.links) ||
      (!linked && JSON.stringify(previous.auxiliary) !== JSON.stringify(frame.auxiliary)));
  const crossedByMotion = (box: Box) =>
    hasMotion &&
    nodes.some((node) =>
      overlaps(
        {
          x: Math.min(...node.x),
          y: Math.min(...node.y),
          width: Math.max(...node.x) - Math.min(...node.x) + nodeWidth,
          height: Math.max(...node.y) - Math.min(...node.y) + nodeHeight,
        },
        box,
      ),
    );
  const groups = new Map<
    number,
    { id: number | undefined; index: number; names: string[] }
  >();
  for (const [name, index] of Object.entries(frame.pointers)) {
    const item = slots[index];
    if (index < 0 || index >= slots.length || (linked && !item)) continue;
    const key = linked ? item!.id : index;
    const group = groups.get(key) ?? { id: item?.id, index, names: [] };
    group.names.push(name);
    groups.set(key, group);
  }
  const pointers = [...groups].map(([key, { id, index, names }]) => {
    const name = names.join(",");
    const above =
      linked && (frame.detached === id || names.includes("newNode"));
    const fontSize = above ? 12 : name.length > 6 ? 11 : 13;
    const badgeWidth = Math.max(
      40,
      Math.ceil(name.length * fontSize * 0.62 + 12),
    );
    const owner = id === undefined ? { x: times.map(() => 28 + index * stride), y: times.map(() => baseline) } : track(id);
    const x = linked
      ? owner.x.map((x) => x + nodeWidth / 2)
      : times.map(() => 28 + index * stride + nodeWidth / 2);
    const y = above
      ? owner.y.map((y) => y - 8)
      : times.map(() => baseline + nodeHeight + 46);
    return {
      key: String(key),
      targetId: id,
      name,
      x,
      y,
      width: badgeWidth,
      fontSize,
      placement: above ? ("above" as const) : ("below" as const),
      tone: names.includes("pivot") ? ("pivot" as const) : ("active" as const),
      revealAfterMotion:
        !linked &&
        crossedByMotion({
          x: x[0] - badgeWidth / 2,
          y: y[0] - 27,
          width: badgeWidth,
          height: 34,
        }),
    };
  });
  const indices = slots
    .filter((item) => !linked || frame.detached !== item?.id)
    .map((item, index) => {
      const x = (linked ? position(frame, item!.id).x : 28 + index * stride) + nodeWidth / 2,
        y = baseline + nodeHeight + 16;
      return {
        index,
        x,
        y,
        revealAfterMotion: crossedByMotion({
          x: x - 8,
          y: y - 12,
          width: 16,
          height: 16,
        }),
      };
    });
  const changedFrom =
    frame.anchor === "connect"
      ? frame.detached
      : ["commit", "bypass"].includes(frame.anchor)
        ? frame.items[frame.pointers.prev]?.id
        : undefined;
  const links: SceneLink[] = (frame.links ?? []).map(([from, to]) => ({
    id: `${from}-${to}`,
    highlighted: from === changedFrom,
    obstacles: frame.items
      .filter((item) => item.id !== from && item.id !== to)
      .map((item) => track(item.id)),
    from: track(from),
    to: track(to),
    sourceWidth: nodeWidth,
    targetWidth: nodeWidth,
    targetHeight: nodeHeight,
    portY: nodeHeight / 2,
    existed:
      previous?.links?.some((link) => link[0] === from && link[1] === to) ??
      true,
  }));
  const tails = linked
    ? nodes
        .filter((node) => !frame.links?.some(([from]) => from === node.id))
        .map((node) => ({
          id: node.id,
          x: node.x.map((x) => x + nodeWidth),
          y: node.y.map((y) => y + nodeHeight / 2),
        }))
    : [];
  return {
    width,
    height,
    times,
    linked,
    nodes,
    auxiliary,
    heldLabel: !linked && frame.held ? { x: 28, y: 10, text: "暂存 key" } : undefined,
    pointers,
    indices,
    links,
    tails,
    hasMotion,
    range:
      !linked &&
      frame.items.length > 0 &&
      Number.isFinite(low) &&
      Number.isFinite(high) &&
      low <= high
        ? {
            x: 18 + low * stride,
            y: baseline - 8,
            width: (high - low) * stride + nodeWidth + 20,
            height: nodeHeight + 16,
          }
        : undefined,
    slots: !linked
      ? slots.map((_, index) => ({
          x: 28 + index * stride,
          y: baseline,
          width: nodeWidth,
          height: nodeHeight,
        }))
      : [],
    empty: !frame.items.length
      ? {
          text: linked ? "head → null" : "空数组",
          x: width / 2,
          y: baseline + 32,
        }
      : undefined,
    nullHead:
      linked && frame.headId === null && frame.items.length > 0
        ? { x: 28, y: baseline + 32 }
        : undefined,
  };
}
export type AnimationScene = ReturnType<typeof createAnimationScene>;
