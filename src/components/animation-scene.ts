import type { Frame } from "../trace";

type Track = { x: number[]; y: number[] };
type Box = { x: number; y: number; width: number; height: number };
type Tone = "idle" | "active" | "pivot" | "settled";
export type SceneLink = {
  id: string;
  from: Track;
  to: Track;
  sourceWidth: number;
  targetWidth: number;
  targetHeight: number;
  portY: number;
  existed: boolean;
  highlighted: boolean;
  obstacles: Track[];
};

// 渲染和测试使用同一插值函数；全部几何由一个 0..1 时钟驱动。
export function sampleTrack(
  values: number[],
  times: number[],
  progress: number,
) {
  const t = Math.max(0, Math.min(1, progress));
  const end = times.findIndex((time, index) => index > 0 && t <= time);
  const index = end < 0 ? times.length - 2 : end - 1;
  const fraction = (t - times[index]) / (times[index + 1] - times[index]);
  const eased = fraction * fraction * (3 - 2 * fraction);
  return values[index] + (values[index + 1] - values[index]) * eased;
}
export function connectionPathAt(
  link: SceneLink,
  times: number[],
  progress: number,
) {
  const ax = sampleTrack(link.from.x, times, progress) + link.sourceWidth;
  const ay = sampleTrack(link.from.y, times, progress) + link.portY;
  const bx = sampleTrack(link.to.x, times, progress);
  const by = sampleTrack(link.to.y, times, progress) + link.portY;
  // 上方节点接入后继的顶边；同层链路进入左边。端点沿外边界过渡，不穿过节点。
  const elevated = Math.max(0, Math.min(1, (by - ay) / 64));
  const ex =
    elevated >= 0.5
      ? bx - 6 + (link.targetWidth / 2 + 6) * (elevated * 2 - 1)
      : bx - 6;
  const ey =
    elevated >= 0.5
      ? by - link.targetHeight / 2 - 6
      : by -
        link.targetHeight / 2 -
        6 +
        (link.targetHeight / 2 + 6) * (1 - elevated * 2);
  // 改接 next 时，被绕过的节点可能尚未离开主行；连线从上方绕行。
  const blockers = link.obstacles
    .map((track) => ({
      x: sampleTrack(track.x, times, progress),
      y: sampleTrack(track.y, times, progress),
    }))
    .filter(
      (box) =>
        box.x > ax &&
        box.x + link.targetWidth < bx &&
        box.y + link.targetHeight > Math.min(ay, ey) - 2,
    );
  if (blockers.length) {
    const ceiling = Math.min(...blockers.map((box) => box.y)) - 36;
    const lift = Math.max(0, (Math.max(ay, ey) - ceiling) / 0.75);
    return `M ${ax} ${ay} C ${ax + 24} ${ay - lift}, ${ex - 24} ${ey - lift}, ${ex} ${ey}`;
  }
  return `M ${ax} ${ay} C ${ax + 24} ${ay}, ${ex - 24 * (1 - elevated)} ${ey - 24 * elevated}, ${ex} ${ey}`;
}
function overlaps(a: Box, b: Box) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

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
  const low = Number(frame.variables.low),
    high = Number(frame.variables.high);
  const nodes = frame.items.map((item, index) => {
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
  const hasMotion =
    !!previous &&
    (nodes.some(
      (node) =>
        node.entering || new Set(node.x).size > 1 || new Set(node.y).size > 1,
    ) ||
      previous.items.some(
        (old) => !frame.items.some((item) => item.id === old.id),
      ) ||
      JSON.stringify(previous.links) !== JSON.stringify(frame.links));
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
    { id: number; index: number; names: string[] }
  >();
  for (const [name, index] of Object.entries(frame.pointers)) {
    const item = frame.items[index];
    if (!item) continue;
    const key = linked ? item.id : index;
    const group = groups.get(key) ?? { id: item.id, index, names: [] };
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
    const owner = track(id);
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
  const indices = frame.items
    .filter((item) => frame.detached !== item.id)
    .map((item, index) => {
      const x = position(frame, item.id).x + nodeWidth / 2,
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
    height: 208,
    times,
    linked,
    nodes,
    pointers,
    indices,
    links,
    tails,
    hasMotion,
    range:
      !linked &&
      frame.items.length > 0 &&
      Number.isFinite(low) &&
      Number.isFinite(high)
        ? {
            x: 18 + low * stride,
            y: baseline - 8,
            width: (high - low) * stride + nodeWidth + 20,
            height: nodeHeight + 16,
          }
        : undefined,
    slots: !linked
      ? frame.items.map((_, index) => ({
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
