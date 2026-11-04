import { Binary } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame, FrameLink, TraceInput } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./bst-templates";

export const MAX_NODES = 15;
export const DEFAULT_VALUES = [50, 30, 70, 20, 40, 60, 80];
const DEFAULT_INPUT = "50, 30, 70, 20, 40, 60, 80";
const EMPTY_MESSAGE = "请输入插入序列，例如 `50, 30, 70, 20, 40, 60, 80`。";
const INVALID_MESSAGE = `请输入最多 ${MAX_NODES} 个整数，范围 -999 到 999。`;
const TARGET_MESSAGE = "目标值须为 -999 到 999 的整数。";
const OPERATIONS = ["create", "search", "insert", "delete"] as const;
type BstOperation = (typeof OPERATIONS)[number];

interface BstNode {
  id: number;
  value: number;
  left: BstNode | null;
  right: BstNode | null;
  parent: BstNode | null;
  side: "left" | "right" | null;
}

function validateValues(values: number[], limit = MAX_NODES) {
  if (!values.length) throw new Error(EMPTY_MESSAGE);
  if (values.length > limit)
    throw new Error(`最多展示 ${limit} 个节点，请减小输入规模。`);
  const seen = new Set<number>();
  for (const value of values) {
    if (!Number.isInteger(value) || Math.abs(value) > 999)
      throw new Error(INVALID_MESSAGE);
    if (seen.has(value))
      throw new Error(
        `插入序列包含重复值 ${value}，二叉搜索树不接受重复节点。`,
      );
    seen.add(value);
  }
}

export function parseBstInput(text: string, limit = MAX_NODES): number[] {
  const tokens = text
    .trim()
    .split(/[,，\s]+/)
    .filter(Boolean);
  if (!tokens.length) throw new Error(EMPTY_MESSAGE);
  if (tokens.length > limit)
    throw new Error(`最多展示 ${limit} 个节点，请减小输入规模。`);
  if (tokens.some((token) => !/^-?\d+$/.test(token)))
    throw new Error(INVALID_MESSAGE);
  const values = tokens.map(Number);
  validateValues(values, limit);
  return values;
}

function makeNode(id: number, value: number): BstNode {
  return { id, value, left: null, right: null, parent: null, side: null };
}

/** 按输入顺序插入，建立一棵没有重复值的 BST。 */
function buildTree(values: number[]) {
  let root: BstNode | null = null;
  const nodes: BstNode[] = [];
  for (const value of values) {
    const node = makeNode(nodes.length, value);
    nodes.push(node);
    if (!root) {
      root = node;
      continue;
    }
    let current = root;
    while (true) {
      if (value < current.value) {
        if (!current.left) {
          current.left = node;
          node.parent = current;
          node.side = "left";
          break;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = node;
          node.parent = current;
          node.side = "right";
          break;
        }
        current = current.right;
      }
    }
  }
  return { root, nodes };
}

/** 当前存活节点，按 id 升序；items 与 active / settled 的下标依赖这个顺序。 */
function collectNodes(root: BstNode | null): BstNode[] {
  const nodes: BstNode[] = [];
  const walk = (node: BstNode | null) => {
    if (!node) return;
    walk(node.left);
    nodes.push(node);
    walk(node.right);
  };
  walk(root);
  return nodes.sort((a, b) => a.id - b.id);
}

function linksOf(nodes: BstNode[]): FrameLink[] {
  const links: FrameLink[] = [];
  for (const node of nodes) {
    if (node.left) links.push([node.id, node.left.id, "left"]);
    if (node.right) links.push([node.id, node.right.id, "right"]);
  }
  return links;
}

function snapshot(
  root: BstNode | null,
  {
    anchor,
    narration,
    active = [],
    settled = [],
    target,
    goal,
    compared = 0,
    total,
  }: {
    anchor: string;
    narration: string;
    active?: number[];
    settled?: number[];
    /** 只有需要显示目标徽章的帧才设置。 */
    target?: number;
    /** 写入 variables.target 的操作目标值。 */
    goal: number;
    compared?: number;
    total?: number;
  },
): Frame {
  const nodes = collectNodes(root);
  const indexOf = (id: number) => nodes.findIndex((node) => node.id === id);
  const toIndices = (ids: number[]) => [
    ...new Set(ids.map(indexOf).filter((index) => index >= 0)),
  ];
  return {
    items: nodes.map(({ id, value }) => ({ id, value })),
    active: toIndices(active),
    settled: toIndices(settled),
    pointers: {},
    anchor,
    narration,
    variables: {
      target: goal,
      compared,
      total: total ?? nodes.length,
    },
    stack: [],
    queue: [],
    links: linksOf(nodes),
    rootId: root?.id ?? null,
    ...(target === undefined ? {} : { target }),
  };
}

function detachNode(root: BstNode | null, node: BstNode): BstNode | null {
  const parent = node.parent;
  if (!parent) {
    node.parent = null;
    node.side = null;
    return null;
  }
  if (parent.left === node) parent.left = null;
  else if (parent.right === node) parent.right = null;
  node.parent = null;
  node.side = null;
  return root;
}

function replaceNode(
  root: BstNode | null,
  node: BstNode,
  child: BstNode | null,
): BstNode | null {
  const parent = node.parent;
  if (!parent) {
    if (child) {
      child.parent = null;
      child.side = null;
    }
    node.parent = null;
    node.side = null;
    return child;
  }
  if (parent.left === node) parent.left = child;
  else if (parent.right === node) parent.right = child;
  if (child) {
    child.parent = parent;
    child.side = node.side;
  }
  node.parent = null;
  node.side = null;
  return root;
}

function createFrames(values: number[]): Frame[] {
  const frames: Frame[] = [];
  let root: BstNode | null = null;
  let nextId = 0;
  values.forEach((value, index) => {
    const last = index === values.length - 1;
    if (!root) {
      const node = makeNode(nextId++, value);
      root = node;
      frames.push(
        snapshot(root, {
          anchor: "insert",
          narration: `创建根节点 ${value}。${last ? `建树完成，共 1 个节点。` : ""}`,
          active: [node.id],
          target: value,
          goal: value,
          total: 1,
        }),
      );
      return;
    }
    let current = root;
    const settled: number[] = [];
    let compared = 0;
    while (true) {
      compared++;
      const goLeft = value < current.value;
      const relation = goLeft ? "<" : ">";
      const side = goLeft ? "左" : "右";
      frames.push(
        snapshot(root, {
          anchor: "compare",
          narration: `插入 ${value}：${value} ${relation} ${current.value}，进入${side}子树。`,
          active: [current.id],
          settled,
          target: value,
          goal: value,
          compared,
        }),
      );
      const next = goLeft ? current.left : current.right;
      if (!next) {
        const node = makeNode(nextId++, value);
        if (goLeft) current.left = node;
        else current.right = node;
        node.parent = current;
        node.side = goLeft ? "left" : "right";
        const total = collectNodes(root).length;
        frames.push(
          snapshot(root, {
            anchor: "insert",
            narration: `在 ${current.value} 的${side}子树创建 ${value}。${
              last ? `建树完成，共 ${total} 个节点。` : ""
            }`,
            active: [node.id],
            settled: [...settled, current.id],
            target: value,
            goal: value,
            compared,
            total,
          }),
        );
        break;
      }
      settled.push(current.id);
      current = next;
    }
  });
  return frames;
}

function searchFrames(root: BstNode | null, target: number): Frame[] {
  const total = collectNodes(root).length;
  const frames: Frame[] = [
    snapshot(root, {
      anchor: "start",
      narration: `准备查找 ${target}：从根节点开始比较。`,
      goal: target,
      total,
    }),
  ];
  let current = root;
  const settled: number[] = [];
  let compared = 0;
  while (current) {
    compared++;
    if (target === current.value) {
      frames.push(
        snapshot(root, {
          anchor: "found",
          narration: `比较 ${target} 与 ${current.value}：相等，找到目标节点。`,
          active: [current.id],
          settled,
          target,
          goal: target,
          compared,
          total,
        }),
      );
      return frames;
    }
    const goLeft = target < current.value;
    const relation = goLeft ? "<" : ">";
    const side = goLeft ? "左" : "右";
    const next = goLeft ? current.left : current.right;
    if (!next) {
      frames.push(
        snapshot(root, {
          anchor: "miss",
          narration: `比较 ${target} 与 ${current.value}：${target} ${relation} ${current.value}，${side}孩子为空，未找到。`,
          active: [current.id],
          settled,
          target,
          goal: target,
          compared,
          total,
        }),
      );
      return frames;
    }
    frames.push(
      snapshot(root, {
        anchor: "compare",
        narration: `比较 ${target} 与 ${current.value}：${target} ${relation} ${current.value}，进入${side}子树。`,
        active: [current.id],
        settled,
        target,
        goal: target,
        compared,
        total,
      }),
    );
    settled.push(current.id);
    current = next;
  }
  return frames;
}

function insertFrames(root: BstNode | null, target: number, nextId: number) {
  const total = collectNodes(root).length;
  const frames: Frame[] = [
    snapshot(root, {
      anchor: "start",
      narration: `准备插入 ${target}：先沿搜索路径找到空位。`,
      goal: target,
      total,
    }),
  ];
  let current = root;
  const settled: number[] = [];
  let compared = 0;
  while (current) {
    compared++;
    if (target === current.value) {
      frames.push(
        snapshot(root, {
          anchor: "exists",
          narration: `比较 ${target} 与 ${current.value}：相等，值已存在，不重复插入。`,
          active: [current.id],
          settled,
          target,
          goal: target,
          compared,
          total,
        }),
      );
      return frames;
    }
    const goLeft = target < current.value;
    const relation = goLeft ? "<" : ">";
    const side = goLeft ? "左" : "右";
    const next = goLeft ? current.left : current.right;
    frames.push(
      snapshot(root, {
        anchor: "compare",
        narration: `比较 ${target} 与 ${current.value}：${target} ${relation} ${current.value}，进入${side}子树。`,
        active: [current.id],
        settled,
        target,
        goal: target,
        compared,
        total,
      }),
    );
    if (!next) {
      if (total >= MAX_NODES)
        throw new Error("最多展示 15 个节点，无法继续插入。");
      const node = makeNode(nextId, target);
      if (goLeft) current.left = node;
      else current.right = node;
      node.parent = current;
      node.side = goLeft ? "left" : "right";
      frames.push(
        snapshot(root, {
          anchor: "insert",
          narration: `在 ${current.value} 的${side}子树创建 ${target}。插入完成，共 ${total + 1} 个节点。`,
          active: [node.id],
          settled: [...settled, current.id],
          target,
          goal: target,
          compared,
          total: total + 1,
        }),
      );
      return frames;
    }
    settled.push(current.id);
    current = next;
  }
  return frames;
}

function deleteFrames(
  root: BstNode | null,
  target: number,
): { frames: Frame[]; root: BstNode | null } {
  let nextRoot = root;
  const total = collectNodes(root).length;
  const frames: Frame[] = [
    snapshot(root, {
      anchor: "start",
      narration: `准备删除 ${target}：先查找目标节点。`,
      goal: target,
      total,
    }),
  ];
  let current = root;
  const settled: number[] = [];
  let compared = 0;
  while (current) {
    compared++;
    if (target === current.value) {
      frames.push(
        snapshot(root, {
          anchor: "found",
          narration: `找到 ${target}，根据孩子数量选择删除方式。`,
          active: [current.id],
          settled,
          target,
          goal: target,
          compared,
          total,
        }),
      );
      break;
    }
    const goLeft = target < current.value;
    const relation = goLeft ? "<" : ">";
    const side = goLeft ? "左" : "右";
    const next = goLeft ? current.left : current.right;
    if (!next) {
      frames.push(
        snapshot(root, {
          anchor: "miss",
          narration: `未找到 ${target}，删除取消。`,
          active: [current.id],
          settled,
          target,
          goal: target,
          compared,
          total,
        }),
      );
      return { frames, root: nextRoot };
    }
    frames.push(
      snapshot(root, {
        anchor: "compare",
        narration: `比较 ${target} 与 ${current.value}：${target} ${relation} ${current.value}，进入${side}子树。`,
        active: [current.id],
        settled,
        target,
        goal: target,
        compared,
        total,
      }),
    );
    settled.push(current.id);
    current = next;
  }
  if (!current) return { frames, root: nextRoot };

  if (!current.left && !current.right) {
    nextRoot = detachNode(nextRoot, current);
    frames.push(
      snapshot(nextRoot, {
        anchor: "leaf",
        narration: `${target} 是叶子节点，直接删除。删除完成。`,
        settled,
        goal: target,
        compared,
      }),
    );
  } else if (!current.left || !current.right) {
    const child = (current.left ?? current.right)!;
    nextRoot = replaceNode(nextRoot, current, child);
    frames.push(
      snapshot(nextRoot, {
        anchor: "one_child",
        narration: `${target} 只有一个孩子，用 ${child.value} 接替。删除完成。`,
        active: [child.id],
        settled,
        goal: target,
        compared,
      }),
    );
  } else {
    let successor = current.right;
    while (successor.left) successor = successor.left;
    const successorValue = successor.value;
    frames.push(
      snapshot(nextRoot, {
        anchor: "successor",
        narration: `${target} 有两个孩子，右子树最小节点是 ${successorValue}。`,
        active: [successor.id],
        settled: [...settled, current.id],
        goal: target,
        compared,
      }),
    );
    current.value = successorValue;
    frames.push(
      snapshot(nextRoot, {
        anchor: "copy",
        narration: `把 ${successorValue} 写入 ${target} 所在节点。`,
        active: [current.id],
        settled,
        goal: target,
        compared,
      }),
    );
    nextRoot = replaceNode(nextRoot, successor, successor.right);
    frames.push(
      snapshot(nextRoot, {
        anchor: "remove",
        narration: `删除后继节点 ${successorValue}。删除完成。`,
        active: [current.id],
        settled,
        goal: target,
        compared,
      }),
    );
  }
  return { frames, root: nextRoot };
}

export function bstTrace(
  values: number[],
  operation: string,
  value = 0,
): Frame[] {
  validateValues(values);
  if (!OPERATIONS.includes(operation as BstOperation))
    throw new Error("未知操作。");
  if (
    operation !== "create" &&
    (!Number.isInteger(value) || Math.abs(value) > 999)
  )
    throw new Error(TARGET_MESSAGE);

  if (operation === "create") return createFrames(values);
  const { root } = buildTree(values);
  if (operation === "search") return searchFrames(root, value);
  if (operation === "insert") return insertFrames(root, value, values.length);
  return deleteFrames(root, value).frames;
}

export const bst: ReadyTopic = {
  id: "bst",
  group: "tree-hash",
  title: "二叉搜索树",
  badge: "O(log n)",
  summary: "左小右大的有序结构，支持查找、插入与三种删除情形。",
  status: "ready",
  scene: "tree",
  icon: Binary,
  controls: {
    dataLabel: "插入序列",
    defaultValues: DEFAULT_VALUES,
    defaultInput: DEFAULT_INPUT,
    parseInput: parseBstInput,
    limit: MAX_NODES,
    defaultOperation: "search",
    randomizable: false,
    operations: [
      { id: "create", label: "创建" },
      { id: "search", label: "查找" },
      { id: "insert", label: "插入" },
      { id: "delete", label: "删除" },
    ],
    value: {
      label: "目标值",
      onlyFor: ["search", "insert", "delete"],
      defaultValue: 40,
    },
  },
  legend: [
    { label: "当前节点", tone: "pivot" },
    { label: "搜索路径", tone: "active" },
    { label: "未访问", tone: "idle" },
  ],
  theory: [
    {
      title: "有序性质",
      body: "任意节点的左子树都小于它，右子树都大于它。中序遍历会得到升序序列，查找时每比较一次就能排除一侧子树。",
    },
    {
      title: "查找与插入",
      body: "从根开始，目标更小走左孩子，更大走右孩子；相等即命中。插入沿同一条路径找到空位，再把新节点接到父节点上。",
    },
    {
      title: "删除",
      body: "先搜索目标。叶子直接移除；只有一个孩子时让孩子接替；有两个孩子时复制右子树最小节点，再删除那个后继。平均复杂度 O(log n)，最坏 O(n)。",
    },
  ],
  trace: ({ values, operation, value }: TraceInput) =>
    bstTrace(values, operation, value),
  code: (language, operation) =>
    parseCode(templates[language][operation] ?? templates[language].search),
};
