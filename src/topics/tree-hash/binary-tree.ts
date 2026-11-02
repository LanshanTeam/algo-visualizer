import { Network } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame, FrameLink, TraceInput } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./binary-tree-templates";

const MAX_TOKENS = 31;
const MAX_NODES = 15;
const DEFAULT_INPUT = "1, 2, 4, #, #, 5, #, #, 3, 6, #, #, 7, #, #";

interface TreeNode {
  id: number;
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
  parent: TreeNode | null;
  side: "left" | "right" | null;
  depth: number;
}

/** 把前序序列解析为记号数组；`NaN` 作为 `#` 空位哨兵。 */
export function parseTreeInput(text: string, limit = MAX_TOKENS): number[] {
  const tokens = text
    .trim()
    .split(/[,，\s]+/)
    .filter(Boolean);
  if (!tokens.length)
    throw new Error("请输入前序序列，例如 `1, 2, #, #, 3, #, #`。");
  if (tokens.length > limit)
    throw new Error("最多展示 15 个节点，请减小输入规模。");
  let count = 0;
  return tokens.map((token) => {
    if (token === "#" || token.toLowerCase() === "null") return NaN;
    if (!/^[+-]?\d+$/.test(token))
      throw new Error(`无法识别记号 \`${token}\`，请使用整数或 \`#\`。`);
    const value = Number(token);
    if (Math.abs(value) > 999)
      throw new Error("节点值须为 -999 到 999 的整数。");
    count++;
    if (count > MAX_NODES)
      throw new Error("最多展示 15 个节点，请减小输入规模。");
    return value;
  });
}

function buildTree(tokens: number[]) {
  let pos = 0;
  const nodes: TreeNode[] = [];
  const build = (
    parent: TreeNode | null,
    side: "left" | "right" | null,
    depth: number,
  ): TreeNode | null => {
    if (pos >= tokens.length)
      throw new Error(
        "前序序列不完整：请为每个节点补齐左右孩子（用 `#` 表示空）。",
      );
    const token = tokens[pos++];
    if (Number.isNaN(token)) return null;
    if (nodes.length >= MAX_NODES)
      throw new Error("最多展示 15 个节点，请减小输入规模。");
    const node: TreeNode = {
      id: nodes.length,
      value: token,
      left: null,
      right: null,
      parent,
      side,
      depth,
    };
    nodes.push(node);
    node.left = build(node, "left", depth + 1);
    node.right = build(node, "right", depth + 1);
    return node;
  };
  const root = build(null, null, 0);
  if (!root) throw new Error("根节点不能为空。");
  if (pos < tokens.length)
    throw new Error("前序序列有多余记号：请检查 `#` 的数量。");
  return { nodes, root };
}

const RECURSIVE = {
  preorder: {
    name: "前序",
    order: "「根 → 左 → 右」",
    fn: "preorder",
    narration: (value: number) => `访问 ${value}，然后递归左子树、右子树。`,
  },
  inorder: {
    name: "中序",
    order: "「左 → 根 → 右」",
    fn: "inorder",
    narration: (value: number) => `左子树处理完，访问 ${value}，然后递归右子树。`,
  },
  postorder: {
    name: "后序",
    order: "「左 → 右 → 根」",
    fn: "postorder",
    narration: (value: number) => `左右子树处理完，访问 ${value}。`,
  },
} as const;

type RecursiveOperation = keyof typeof RECURSIVE;

export function binaryTreeTrace(values: number[], operation: string): Frame[] {
  if (!values.length)
    throw new Error("请输入前序序列，例如 `1, 2, #, #, 3, #, #`。");
  if (values.length > MAX_TOKENS)
    throw new Error("最多展示 15 个节点，请减小输入规模。");
  if (
    operation !== "create" &&
    operation !== "levelorder" &&
    !(operation in RECURSIVE)
  )
    throw new Error("未知操作。");
  const { nodes, root } = buildTree(values);
  const total = nodes.length;
  const items = nodes.map(({ id, value }) => ({ id, value }));
  const links = (visible: (node: TreeNode) => boolean) => {
    const result: FrameLink[] = [];
    for (const node of nodes) {
      if (!visible(node)) continue;
      if (node.left && visible(node.left))
        result.push([node.id, node.left.id, "left"]);
      if (node.right && visible(node.right))
        result.push([node.id, node.right.id, "right"]);
    }
    return result;
  };
  const allLinks = links(() => true);

  if (operation === "create") {
    return nodes.map((node) => {
      const done = node.id === total - 1;
      const where =
        node.side === null
          ? "创建根节点"
          : `作为 ${node.parent!.value} 的${node.side === "left" ? "左" : "右"}孩子`;
      return {
        items: items.slice(0, node.id + 1),
        links: links((candidate) => candidate.id <= node.id),
        active: [node.id],
        settled: [],
        pointers: {},
        anchor: node.side ?? "root",
        narration: `读取 ${node.value}，${where}。${done ? `建树完成，共 ${total} 个节点。` : ""}`,
        variables: { created: node.id + 1, total },
        stack: [],
        queue: [],
        rootId: 0,
      };
    });
  }

  const prepare = (queue: string[], narration: string): Frame => ({
    items,
    links: allLinks,
    active: [],
    settled: [],
    pointers: {},
    anchor: "start",
    narration,
    variables: { visited: 0, total },
    stack: [],
    queue,
    rootId: 0,
  });

  if (operation === "levelorder") {
    const frames: Frame[] = [
      prepare(
        [String(root.value)],
        `准备层序遍历：根节点 ${root.value} 入队，逐层访问。`,
      ),
    ];
    const queue: TreeNode[] = [root];
    const visited: number[] = [];
    while (queue.length) {
      const node = queue.shift()!;
      visited.push(node.id);
      const children: string[] = [];
      if (node.left) {
        queue.push(node.left);
        children.push(`左孩子 ${node.left.value}`);
      }
      if (node.right) {
        queue.push(node.right);
        children.push(`右孩子 ${node.right.value}`);
      }
      const done = queue.length === 0;
      frames.push({
        items,
        links: allLinks,
        active: [node.id],
        settled: visited.slice(0, -1),
        pointers: {},
        anchor: "visit",
        narration: `出队 ${node.value}，访问；${
          children.length ? `${children.join("、")}入队` : "没有孩子入队"
        }。${done ? "层序遍历完成。" : ""}`,
        variables: { visited: visited.length, total },
        stack: [],
        queue: queue.map((entry) => String(entry.value)),
        rootId: 0,
      });
    }
    return frames;
  }

  const config = RECURSIVE[operation as RecursiveOperation];
  const frames: Frame[] = [
    prepare([], `准备${config.name}遍历：顺序为${config.order}。`),
  ];
  const path: number[] = [];
  const visits: { id: number; stack: number[] }[] = [];
  const walk = (node: TreeNode | null) => {
    if (!node) return;
    path.push(node.id);
    if (operation === "preorder") visits.push({ id: node.id, stack: [...path] });
    walk(node.left);
    if (operation === "inorder") visits.push({ id: node.id, stack: [...path] });
    walk(node.right);
    if (operation === "postorder") visits.push({ id: node.id, stack: [...path] });
    path.pop();
  };
  walk(root);
  visits.forEach((visit, index) => {
    const done = index === visits.length - 1;
    frames.push({
      items,
      links: allLinks,
      active: [visit.id],
      settled: visits.slice(0, index).map((entry) => entry.id),
      pointers: {},
      anchor: "visit",
      narration: `${config.narration(nodes[visit.id].value)}${done ? `${config.name}遍历完成。` : ""}`,
      variables: { visited: index + 1, total },
      stack: visit.stack.map((id) => `${config.fn}(${nodes[id].value})`),
      queue: [],
      rootId: 0,
    });
  });
  return frames;
}

export const binaryTree: ReadyTopic = {
  id: "binary-tree",
  group: "tree-hash",
  title: "二叉树遍历",
  badge: "O(n)",
  summary: "前序、中序、后序与层序遍历，对比递归栈与队列。",
  status: "ready",
  scene: "tree",
  icon: Network,
  controls: {
    dataLabel: "前序序列",
    defaultValues: [1, 2, 4, 5, 3, 6, 7],
    defaultInput: DEFAULT_INPUT,
    parseInput: parseTreeInput,
    limit: MAX_TOKENS,
    defaultOperation: "preorder",
    randomizable: false,
    operations: [
      { id: "create", label: "创建" },
      { id: "preorder", label: "前序" },
      { id: "inorder", label: "中序" },
      { id: "postorder", label: "后序" },
      { id: "levelorder", label: "层序" },
    ],
  },
  legend: [
    { label: "当前节点", tone: "pivot" },
    { label: "已访问", tone: "active" },
    { label: "未访问", tone: "idle" },
  ],
  theory: [
    {
      title: "前序建树",
      body: "输入按「根、左子树、右子树」书写，`#` 表示空子树。递归读取记号，就能唯一还原整棵树。",
    },
    {
      title: "四种遍历",
      body: "前序在进入节点时访问，中序在左子树返回后访问，后序在左右子树都返回后访问；层序用队列逐层访问。",
    },
    {
      title: "复杂度",
      body: "每个节点恰好访问一次，时间 O(n)；递归栈或队列最多占用 O(n) 空间。",
    },
  ],
  trace: ({ values, operation }: TraceInput) =>
    binaryTreeTrace(values, operation),
  code: (language, operation) =>
    parseCode(templates[language][operation] ?? templates[language].preorder),
};
