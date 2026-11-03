export type Track = { x: number[]; y: number[] };
export type Box = { x: number; y: number; width: number; height: number };
export type Tone = "idle" | "active" | "pivot" | "settled";
/** 连线走向：next 为链表，tree 为二叉树的父子边，hash 为同桶冲突链。 */
export type LinkGeometry = "next" | "tree" | "hash";
export type SceneLink = {
  id: string;
  geometry: LinkGeometry;
  from: Track;
  to: Track;
  sourceWidth: number;
  /** tree 使用父节点高度；next 不使用。 */
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  /** next 使用右边缘中点；tree 不使用。 */
  portY: number;
  /** 树形父子关系不画箭头，避免视觉噪声。 */
  arrow: boolean;
  existed: boolean;
  highlighted: boolean;
  obstacles: Track[];
};

/** 跟随当前节点的目标值徽章；树场景专用。 */
export type SceneBadge = {
  key: string;
  text: string;
  targetId: number;
  x: number[];
  y: number[];
  width: number;
  height: number;
  fontSize: number;
  tone: Tone;
  placement: "upper-right" | "upper-left";
};

/** 哈希表的一个桶格；head 是链头节点左边缘中点的轨迹。 */
export type SceneBucket = {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  head?: { x: number[]; y: number[] };
};

/** 哈希表顶部的除留余数法公式条。 */
export type SceneFormula = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
};

/** 二叉堆底部数组的一格，与树节点共享节点 id 和色调。 */
export type SceneHeapCell = {
  index: number;
  id: number;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
  tone: Tone;
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
  // 树边从父节点底边中点直连子节点顶边中点。
  if (link.geometry === "tree") {
    const ax = sampleTrack(link.from.x, times, progress) + link.sourceWidth / 2;
    const ay = sampleTrack(link.from.y, times, progress) + link.sourceHeight;
    const bx = sampleTrack(link.to.x, times, progress) + link.targetWidth / 2;
    const by = sampleTrack(link.to.y, times, progress);
    return `M ${ax} ${ay} L ${bx} ${by}`;
  }
  // 哈希链从源节点右边缘中点直连目标左边缘前 6 单位。
  if (link.geometry === "hash") {
    const ax = sampleTrack(link.from.x, times, progress) + link.sourceWidth;
    const ay =
      sampleTrack(link.from.y, times, progress) + link.sourceHeight / 2;
    const bx = sampleTrack(link.to.x, times, progress);
    const by = sampleTrack(link.to.y, times, progress) + link.targetHeight / 2;
    return `M ${ax} ${ay} L ${bx - 6} ${by}`;
  }
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
export function overlaps(a: Box, b: Box) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
