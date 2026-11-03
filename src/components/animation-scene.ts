import type { Frame, ImplementedSceneKind } from "../core/types";
import {
  overlaps,
  type Box,
  type SceneBadge,
  type SceneBucket,
  type SceneFormula,
  type SceneLink,
  type Tone,
} from "./scene-geometry";
import { createHashLayout } from "./hash-layout";
import { createSceneLayout } from "./scene-layout";
import { createTreeLayout } from "./tree-layout";

export { connectionPathAt, sampleTrack } from "./scene-geometry";
export type { SceneLink } from "./scene-geometry";

// 固定的紧凑舞台同时容纳单元格、近邻标注和交换轨迹，不改变页面高度。
// 标注只在被轨迹穿过时避让；链表接入先让位再接入，回退顺序相反。
export function createAnimationScene({
  frame,
  previous,
  kind,
  capacity,
  treeDepth = 0,
  hashChainCapacity = 0,
}: {
  frame: Frame;
  previous?: Frame;
  kind: ImplementedSceneKind;
  capacity: number;
  treeDepth?: number;
  hashChainCapacity?: number;
}) {
  if (kind === "hash")
    return createHashScene({ frame, previous, chainCapacity: hashChainCapacity });
  if (kind === "tree")
    return createTreeScene({ frame, previous, capacity, treeDepth });
  const linked = kind === "linked-list";
  const {
    nodeHeight,
    nodeWidth,
    stride,
    baseline,
    width,
    times,
    position,
    track,
  } = createSceneLayout({ frame, previous, linked, capacity });
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
    geometry: "next",
    sourceHeight: 0,
    arrow: true,
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
    badges: [],
    indices,
    links,
    tails,
    buckets: [],
    formula: undefined,
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
function createHashScene({
  frame,
  previous,
  chainCapacity,
}: {
  frame: Frame;
  previous?: Frame;
  chainCapacity: number;
}) {
  const layout = createHashLayout({
    frame,
    previous,
    chainCapacity,
  });
  const indexOf = (id: number) =>
    frame.items.findIndex((item) => item.id === id);
  const nodes = frame.items.map((item, index) => {
    const tone: Tone = frame.active.includes(index)
      ? "pivot"
      : frame.settled.includes(index)
        ? "active"
        : "idle";
    const fontSize = Math.abs(item.value) > 99 ? 10 : 11;
    return {
      ...item,
      ...layout.track(item.id),
      width: layout.nodeWidth,
      height: layout.nodeHeight,
      tone,
      muted: false,
      entering: !!previous && !previous.items.some((old) => old.id === item.id),
      valueX: layout.nodeWidth / 2,
      valueY: layout.nodeHeight / 2 + fontSize * 0.35,
      fontSize,
    };
  });
  const links: SceneLink[] = (frame.links ?? [])
    .filter(([from, to]) => indexOf(from) >= 0 && indexOf(to) >= 0)
    .map(([from, to]) => {
      const child = indexOf(to);
      return {
        id: `${from}-${to}`,
        geometry: "hash",
        sourceHeight: layout.nodeHeight,
        arrow: true,
        highlighted:
          child >= 0 &&
          (frame.active.includes(child) || frame.settled.includes(child)),
        obstacles: [],
        from: layout.track(from),
        to: layout.track(to),
        sourceWidth: layout.nodeWidth,
        targetWidth: layout.nodeWidth,
        targetHeight: layout.nodeHeight,
        portY: layout.nodeHeight / 2,
        existed:
          previous?.links?.some(
            (link) => link[0] === from && link[1] === to,
          ) ?? true,
      };
    });
  const heads = frame.bucketHeads ?? [];
  const buckets: SceneBucket[] = Array.from(
    { length: 7 },
    (_, bucket) => {
      const headId = heads[bucket];
      const hasHead =
        typeof headId === "number" &&
        frame.items.some((item) => item.id === headId);
      const owner = hasHead ? layout.track(headId) : undefined;
      return {
        index: bucket,
        x: layout.bucketX,
        y: layout.bucketRowY(bucket),
        width: layout.bucketWidth,
        height: layout.bucketHeight,
        active: frame.activeBuckets?.includes(bucket) ?? false,
        head: owner
          ? {
              x: owner.x,
              y: owner.y.map((y) => y + layout.nodeHeight / 2),
            }
          : undefined,
      };
    },
  );
  const key = Number(frame.variables.key);
  const bucket = Number(frame.variables.bucket);
  const calculated =
    frame.variables.key !== undefined &&
    frame.variables.bucket !== undefined &&
    Number.isInteger(key) &&
    Number.isInteger(bucket) &&
    bucket >= 0 &&
    bucket < 7;
  const formula: SceneFormula = {
    text: calculated
      ? `h(${key}) = ((${key} % 7) + 7) % 7 = ${bucket}`
      : "除留余数法  h(key) = ((key % 7) + 7) % 7",
    ...layout.formula,
    active: calculated,
  };
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
      JSON.stringify(previous.bucketHeads) !==
        JSON.stringify(frame.bucketHeads));
  return {
    width: layout.width,
    height: layout.height,
    times: layout.times,
    linked: false,
    nodes,
    pointers: [],
    badges: [],
    indices: [],
    links,
    tails: [],
    buckets,
    formula,
    hasMotion,
    range: undefined,
    slots: [],
    empty: undefined,
    nullHead: undefined,
  };
}

function createTreeScene({
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
  const { diameter, width, times, position, track } = createTreeLayout({
    frame,
    previous,
    capacity,
    treeDepth,
  });
  const indexOf = (id: number) =>
    frame.items.findIndex((item) => item.id === id);
  const nodes = frame.items.map((item, index) => {
    // 树把“已访问”映射成蓝色 active、当前节点映射成琥珀 pivot。
    const tone: Tone = frame.active.includes(index)
      ? "pivot"
      : frame.settled.includes(index)
        ? "active"
        : "idle";
    const base = Math.min(20, Math.max(7, diameter * 0.45));
    const fontSize = Math.abs(item.value) > 99 ? base * 0.75 : base;
    return {
      ...item,
      ...track(item.id),
      width: diameter,
      height: diameter,
      tone,
      muted: false,
      entering: !!previous && !previous.items.some((old) => old.id === item.id),
      valueX: diameter / 2,
      valueY: diameter / 2 + fontSize * 0.35,
      fontSize,
    };
  });
  const activeIndex = frame.active[0];
  const activeItem =
    activeIndex === undefined ? undefined : frame.items[activeIndex];
  let badges: SceneBadge[] = [];
  if (frame.target !== undefined && activeItem) {
    const text = `target = ${frame.target}`;
    const fontSize = 11;
    const height = 20;
    const badgeWidth = Math.max(48, Math.ceil(text.length * 6.2 + 12));
    const place = (state: Frame, id: number) => {
      const node = position(state, id);
      let left = node.x + diameter + 6;
      let placement: SceneBadge["placement"] = "upper-right";
      if (left + badgeWidth > width - 4) {
        left = node.x - 6 - badgeWidth;
        placement = "upper-left";
      }
      left = Math.max(4, Math.min(width - badgeWidth - 4, left));
      const top = Math.max(4, node.y - height);
      return {
        x: left + badgeWidth / 2,
        y: top + height / 2,
        placement,
      };
    };
    const to = place(frame, activeItem.id);
    const previousIndex = previous?.active[0];
    const previousItem =
      previousIndex === undefined ? undefined : previous?.items[previousIndex];
    const from =
      previous?.target !== undefined && previousItem
        ? place(previous, previousItem.id)
        : to;
    badges = [
      {
        key: "target",
        text,
        targetId: activeItem.id,
        x: [from.x, to.x],
        y: [from.y, to.y],
        width: badgeWidth,
        height,
        fontSize,
        tone: "pivot",
        placement: to.placement,
      },
    ];
  }
  const badgeMotion = badges.some(
    (badge) => badge.x[0] !== badge.x[1] || badge.y[0] !== badge.y[1],
  );
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
      badgeMotion);
  const links: SceneLink[] = (frame.links ?? [])
    .filter(
      ([from, to]) => indexOf(from) >= 0 && indexOf(to) >= 0,
    )
    .map(([from, to]) => {
      const child = indexOf(to);
      return {
        id: `${from}-${to}`,
        geometry: "tree",
        sourceHeight: diameter,
        arrow: false,
        highlighted:
          child >= 0 &&
          (frame.active.includes(child) || frame.settled.includes(child)),
        obstacles: [],
        from: track(from),
        to: track(to),
        sourceWidth: diameter,
        targetWidth: diameter,
        targetHeight: diameter,
        portY: 0,
        existed:
          previous?.links?.some(
            (link) => link[0] === from && link[1] === to,
          ) ?? true,
      };
    });
  return {
    width,
    height: 208,
    times,
    linked: false,
    nodes,
    pointers: [],
    badges,
    indices: [],
    links,
    tails: [],
    buckets: [],
    formula: undefined,
    hasMotion,
    range: undefined,
    slots: [],
    empty: !frame.items.length
      ? { text: "空树", x: width / 2, y: 108 }
      : undefined,
    nullHead: undefined,
  };
}
export type AnimationScene = ReturnType<typeof createAnimationScene>;
