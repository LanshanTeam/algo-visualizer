import { GitFork } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame, FrameLink, TraceInput } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./union-find-templates";

export const MAX_ELEMENTS = 15;
export const DEFAULT_VALUES = [0, 1, 2, 3, 4, 5, 6, 7];
const DEFAULT_INPUT = "{0,1,2,3}, {4,5}, {6,7}";
const EMPTY_MESSAGE = "请输入集合，例如 `{0,1,2}, {3,4}`。";
const BRACES_MESSAGE = "请用 `{}` 划分集合，例如 `{0,1,2}, {3,4}`。";
const INVALID_MESSAGE = `请输入最多 ${MAX_ELEMENTS} 个整数，范围 -999 到 999。`;
const LIMIT_MESSAGE = `最多展示 ${MAX_ELEMENTS} 个元素，请减小输入规模。`;
const OPERATIONS = ["create", "find", "union", "connected"] as const;
type UnionOperation = (typeof OPERATIONS)[number];

interface UnionState {
  items: { id: number; value: number }[];
  parent: number[];
  rank: number[];
  idByValue: Map<number, number>;
}

function validateGroups(groups: number[][], limit = MAX_ELEMENTS) {
  const flat = groups.flat();
  if (flat.length > limit) throw new Error(LIMIT_MESSAGE);
  const seen = new Set<number>();
  for (const value of flat) {
    if (!Number.isInteger(value) || Math.abs(value) > 999)
      throw new Error(INVALID_MESSAGE);
    if (seen.has(value))
      throw new Error(
        `元素 ${value} 重复出现，集合之间不能重叠。`,
      );
    seen.add(value);
  }
}

function parseGroups(text: string, limit = MAX_ELEMENTS): number[][] {
  const trimmed = text.trim();
  if (!trimmed) throw new Error(EMPTY_MESSAGE);
  if (!trimmed.includes("{")) throw new Error(BRACES_MESSAGE);
  const groups: number[][] = [];
  let cursor = 0;
  const skipSeparators = () => {
    while (
      cursor < trimmed.length &&
      /[\s,，]/.test(trimmed[cursor])
    )
      cursor += 1;
  };
  skipSeparators();
  while (cursor < trimmed.length) {
    if (trimmed[cursor] !== "{") throw new Error(BRACES_MESSAGE);
    const close = trimmed.indexOf("}", cursor + 1);
    if (close < 0) throw new Error(BRACES_MESSAGE);
    const body = trimmed.slice(cursor + 1, close).trim();
    if (!body) throw new Error("集合不能为空。");
    const tokens = body.split(/[,，\s]+/).filter(Boolean);
    if (tokens.some((token) => !/^-?\d+$/.test(token)))
      throw new Error(INVALID_MESSAGE);
    groups.push(tokens.map(Number));
    cursor = close + 1;
    skipSeparators();
    if (cursor < trimmed.length && trimmed[cursor] !== "{")
      throw new Error(BRACES_MESSAGE);
  }
  if (!groups.length) throw new Error(EMPTY_MESSAGE);
  validateGroups(groups, limit);
  return groups;
}

/** 用 `NaN` 哨兵分隔集合，返回可以直接放进 `TraceInput.values` 的数组。 */
export function parseUnionFindInput(
  text: string,
  limit = MAX_ELEMENTS,
): number[] {
  const groups = parseGroups(text, limit);
  return groups.flatMap((group, index) =>
    index < groups.length - 1 ? [...group, NaN] : group,
  );
}

/** 从 `values` 还原集合；没有 `NaN` 时整段视为一个集合。 */
export function unionFindGroups(
  values: number[],
  limit = MAX_ELEMENTS,
): number[][] {
  if (!values.length) throw new Error(EMPTY_MESSAGE);
  const groups: number[][] = [];
  let current: number[] = [];
  for (const value of values) {
    if (Number.isNaN(value)) {
      if (!current.length) throw new Error("集合不能为空。");
      groups.push(current);
      current = [];
    } else current.push(value);
  }
  if (!current.length) throw new Error("集合不能为空。");
  groups.push(current);
  validateGroups(groups, limit);
  return groups;
}

function makeState(groups: number[][]): UnionState {
  const items = groups
    .flat()
    .map((value, id) => ({ id, value }));
  const idByValue = new Map(
    items.map((item) => [item.value, item.id] as const),
  );
  return {
    items,
    parent: items.map((item) => item.id),
    rank: items.map(() => 0),
    idByValue,
  };
}

function valueOf(state: UnionState, id: number) {
  return state.items[id]?.value ?? id;
}

function snapshot(
  state: UnionState,
  {
    anchor,
    narration,
    active = [],
    settled = [],
  }: {
    anchor: string;
    narration: string;
    active?: number[];
    settled?: number[];
  },
): Frame {
  const indexOf = new Map(
    state.items.map((item, index) => [item.id, index] as const),
  );
  const toIndices = (ids: number[]) => [
    ...new Set(
      ids
        .map((id) => indexOf.get(id) ?? -1)
        .filter((index) => index >= 0),
    ),
  ];
  const links: FrameLink[] = state.parent.flatMap((parent, id) =>
    parent === id ? [] : [[id, parent] as FrameLink],
  );
  return {
    items: state.items.map(({ id, value }) => ({ id, value })),
    active: toIndices(active),
    settled: toIndices(settled),
    pointers: {},
    anchor,
    narration,
    variables: {
      size: state.items.length,
      sets: state.parent.filter((parent, id) => parent === id).length,
    },
    stack: [],
    queue: [],
    links,
    unionParents: [...state.parent],
    unionRanks: [...state.rank],
  };
}

/** 沿父指针上溯，返回不含根的路径。 */
function pathToRoot(state: UnionState, id: number) {
  const path: number[] = [];
  let node = id;
  while (state.parent[node] !== node) {
    path.push(node);
    node = state.parent[node];
  }
  return { path, root: node };
}

function appendSuffix(frames: Frame[], suffix: string) {
  const last = frames.at(-1);
  if (last) last.narration += suffix;
}

/**
 * 查找并记录访问与压缩帧。
 * 根节点直接发 root 帧；已经直接指向根的路径节点不再重复发压缩帧。
 */
function findFrames(
  state: UnionState,
  id: number,
  frames: Frame[],
) {
  const { path, root } = pathToRoot(state, id);
  const visited: number[] = [];
  for (const node of path) {
    const parent = state.parent[node];
    frames.push(
      snapshot(state, {
        anchor: "visit",
        narration: `元素 ${valueOf(state, node)} 的父节点是 ${valueOf(
          state,
          parent,
        )}，继续上溯。`,
        active: [node],
        settled: visited,
      }),
    );
    visited.push(node);
  }
  const route = [...path, root]
    .map((node) => valueOf(state, node))
    .join(" → ");
  frames.push(
    snapshot(state, {
      anchor: "root",
      narration: path.length
        ? `找到根 ${valueOf(state, root)}，路径为 ${route}。`
        : `元素 ${valueOf(state, id)} 本身是根。`,
      active: [root],
      settled: visited,
    }),
  );
  for (const node of path) {
    if (state.parent[node] === root) continue;
    const before = state.parent[node];
    state.parent[node] = root;
    frames.push(
      snapshot(state, {
        anchor: "compress",
        narration: `路径压缩：parent[${valueOf(
          state,
          node,
        )}] 由 ${valueOf(state, before)} 改为 ${valueOf(state, root)}。`,
        active: [node],
        settled: [...visited, root],
      }),
    );
  }
  return { root, path };
}

/** 查找两个根、比较 rank 并挂接；同根时不修改结构。 */
function uniteFrames(
  state: UnionState,
  a: number,
  b: number,
  frames: Frame[],
) {
  const sideA = findFrames(state, a, frames);
  const sideB = findFrames(state, b, frames);
  const rootA = sideA.root;
  const rootB = sideB.root;
  const pathSettled = [...sideA.path, ...sideB.path];
  if (rootA === rootB) {
    frames.push(
      snapshot(state, {
        anchor: "compare",
        narration: `两个元素的根都是 ${valueOf(
          state,
          rootA,
        )}，已在同一集合，无需合并。`,
        active: [rootA],
        settled: pathSettled,
      }),
    );
    return { root: rootA, linked: false };
  }
  const rankA = state.rank[rootA];
  const rankB = state.rank[rootB];
  const equal = rankA === rankB;
  const newRoot = rankA < rankB ? rootB : rootA;
  const attached = rankA < rankB ? rootA : rootB;
  const comparison =
    rankA === rankB
      ? `比较根 ${valueOf(state, rootA)} 与根 ${valueOf(
          state,
          rootB,
        )}：rank 都是 ${rankA}，把 ${valueOf(
          state,
          rootB,
        )} 挂到 ${valueOf(state, rootA)} 下，rank[${valueOf(
          state,
          rootA,
        )}] 加一。`
      : rankA < rankB
        ? `比较根 ${valueOf(state, rootA)}（rank ${rankA}）与根 ${valueOf(
            state,
            rootB,
          )}（rank ${rankB}）：${valueOf(
            state,
            rootA,
          )} 更矮，把 ${valueOf(state, rootA)} 挂到 ${valueOf(
            state,
            rootB,
          )} 下。`
        : `比较根 ${valueOf(state, rootA)}（rank ${rankA}）与根 ${valueOf(
            state,
            rootB,
          )}（rank ${rankB}）：${valueOf(
            state,
            rootB,
          )} 更矮，把 ${valueOf(state, rootB)} 挂到 ${valueOf(
            state,
            rootA,
          )} 下。`;
  frames.push(
    snapshot(state, {
      anchor: "compare",
      narration: comparison,
      active: [rootA, rootB],
      settled: pathSettled,
    }),
  );
  state.parent[attached] = newRoot;
  if (equal) state.rank[newRoot] += 1;
  frames.push(
    snapshot(state, {
      anchor: "link",
      narration: `把根 ${valueOf(state, attached)} 挂到根 ${valueOf(
        state,
        newRoot,
      )} 下，rank[${valueOf(state, newRoot)}] = ${
        state.rank[newRoot]
      }。`,
      active: [newRoot],
      settled: [attached, ...pathSettled],
    }),
  );
  return { root: newRoot, linked: true };
}

/** 创建时静默合并两个根，不产生帧。 */
function mergeSilently(state: UnionState, a: number, b: number) {
  if (a === b) return a;
  const rankA = state.rank[a];
  const rankB = state.rank[b];
  const root = rankA < rankB ? b : a;
  const attached = rankA < rankB ? a : b;
  state.parent[attached] = root;
  if (rankA === rankB) state.rank[root] += 1;
  return root;
}

function buildGroupSilently(
  state: UnionState,
  group: number[],
): number {
  if (group.length === 1) return group[0];
  const mid = Math.floor(group.length / 2);
  const a = buildGroupSilently(state, group.slice(0, mid));
  const b = buildGroupSilently(state, group.slice(mid));
  return mergeSilently(state, a, b);
}

function initialState(groups: number[][]) {
  const state = makeState(groups);
  for (const group of groups) buildGroupSilently(state, group);
  return state;
}

function buildGroupWithFrames(
  state: UnionState,
  group: number[],
  frames: Frame[],
): number {
  if (group.length === 1) return group[0];
  const mid = Math.floor(group.length / 2);
  const a = buildGroupWithFrames(state, group.slice(0, mid), frames);
  const b = buildGroupWithFrames(state, group.slice(mid), frames);
  return uniteFrames(state, a, b, frames).root;
}

function createFrames(groups: number[][]) {
  const state = makeState(groups);
  const frames: Frame[] = [
    snapshot(state, {
      anchor: "init",
      narration: `初始化：${state.items.length} 个元素各自成为一个集合。`,
    }),
  ];
  for (const group of groups) {
    const ids = group.map((value) => state.idByValue.get(value)!);
    buildGroupWithFrames(state, ids, frames);
  }
  appendSuffix(
    frames,
    `创建完成：共 ${state.items.length} 个元素、${state.parent.filter(
      (parent, id) => parent === id,
    ).length} 个集合。`,
  );
  return frames;
}

function lookup(
  state: UnionState,
  value: number,
  label: string,
) {
  if (!Number.isInteger(value) || Math.abs(value) > 999)
    throw new Error(`${label} 须为 -999 到 999 的整数。`);
  const id = state.idByValue.get(value);
  if (id === undefined)
    throw new Error(`${label} ${value} 不在集合中。`);
  return id;
}

function findOperation(state: UnionState, id: number) {
  const frames: Frame[] = [
    snapshot(state, {
      anchor: "start",
      narration: `准备查找 ${valueOf(
        state,
        id,
      )}：从该元素开始沿父指针上溯。`,
      active: [id],
    }),
  ];
  const { root } = findFrames(state, id, frames);
  appendSuffix(
    frames,
    `查找完成：${valueOf(state, id)} 的根是 ${valueOf(state, root)}。`,
  );
  return frames;
}

function unionOperation(state: UnionState, a: number, b: number) {
  const frames: Frame[] = [
    snapshot(state, {
      anchor: "start",
      narration: `准备合并 ${valueOf(state, a)} 与 ${valueOf(
        state,
        b,
      )}：先查找两个根。`,
      active: [a, b],
    }),
  ];
  const { root, linked } = uniteFrames(state, a, b, frames);
  appendSuffix(
    frames,
    linked
      ? `合并完成：${valueOf(state, a)} 与 ${valueOf(
          state,
          b,
        )} 连通，根为 ${valueOf(state, root)}。`
      : `合并完成：${valueOf(state, a)} 与 ${valueOf(
          state,
          b,
        )} 已连通，根为 ${valueOf(state, root)}。`,
  );
  return frames;
}

function connectedOperation(state: UnionState, a: number, b: number) {
  const frames: Frame[] = [
    snapshot(state, {
      anchor: "start",
      narration: `准备判断 ${valueOf(state, a)} 与 ${valueOf(
        state,
        b,
      )} 是否连通：分别查找根。`,
      active: [a, b],
    }),
  ];
  const sideA = findFrames(state, a, frames);
  const sideB = findFrames(state, b, frames);
  const connected = sideA.root === sideB.root;
  frames.push(
    snapshot(state, {
      anchor: "answer",
      narration: `${valueOf(state, a)} 的根是 ${valueOf(
        state,
        sideA.root,
      )}，${valueOf(state, b)} 的根是 ${valueOf(
        state,
        sideB.root,
      )}：${connected ? "连通" : "不连通"}。`,
      active: [sideA.root, sideB.root],
      settled: [...sideA.path, ...sideB.path],
    }),
  );
  appendSuffix(
    frames,
    `连通性判断完成：${valueOf(state, a)} 与 ${valueOf(state, b)} ${
      connected ? "连通" : "不连通"
    }。`,
  );
  return frames;
}

export function unionFindTrace(
  values: number[],
  operation: string,
  value = 0,
  value2 = 0,
): Frame[] {
  const groups = unionFindGroups(values);
  if (!OPERATIONS.includes(operation as UnionOperation))
    throw new Error("未知操作。");
  if (operation === "create") return createFrames(groups);
  const state = initialState(groups);
  if (operation === "find") {
    const id = lookup(state, value, "查找元素");
    return findOperation(state, id);
  }
  const a = lookup(state, value, "元素 a");
  const b = lookup(state, value2, "元素 b");
  return operation === "union"
    ? unionOperation(state, a, b)
    : connectedOperation(state, a, b);
}

export const unionFind: ReadyTopic = {
  id: "union-find",
  group: "tree-hash",
  title: "并查集",
  badge: "近 O(1)",
  summary: "按秩合并与路径压缩，快速判断集合连通性。",
  status: "ready",
  scene: "union-find",
  icon: GitFork,
  controls: {
    dataLabel: "集合",
    defaultValues: DEFAULT_VALUES,
    defaultInput: DEFAULT_INPUT,
    parseInput: parseUnionFindInput,
    limit: MAX_ELEMENTS,
    defaultOperation: "find",
    randomizable: false,
    operations: [
      { id: "create", label: "创建" },
      { id: "find", label: "查找" },
      { id: "union", label: "合并" },
      { id: "connected", label: "连通" },
    ],
    value: {
      label: "元素 a",
      onlyFor: ["find", "union", "connected"],
      defaultValue: 3,
    },
    value2: {
      label: "元素 b",
      onlyFor: ["union", "connected"],
      defaultValue: 7,
    },
  },
  legend: [
    { label: "当前元素", tone: "pivot" },
    { label: "路径已访问", tone: "active" },
    { label: "根节点", tone: "settled" },
    { label: "未访问", tone: "idle" },
  ],
  theory: [
    {
      title: "父指针表示",
      body: "每个元素只保存 parent。parent[x] = x 表示 x 是根；沿父指针一直走就能找到集合编号。",
    },
    {
      title: "按秩合并",
      body: "合并时把较矮的树挂到较高的树下；rank 只在两棵树等高时加一，因此树高不会超过 log n。",
    },
    {
      title: "路径压缩",
      body: "查找结束后把路径上的节点直接接到根上。之后再查同一路径只需一步。",
    },
    {
      title: "复杂度",
      body: "两种优化同时使用时，单次操作的均摊复杂度为 O(α(n))，可以近似看作常数；空间为 O(n)。",
    },
  ],
  trace: ({ values, operation, value, value2 }: TraceInput) =>
    unionFindTrace(values, operation, value, value2),
  code: (language, operation) =>
    parseCode(
      templates[language][operation] ?? templates[language].find,
    ),
};
