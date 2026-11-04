import { Workflow } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame, FrameLink, TraceInput } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./heap-templates";

export const MAX_NODES = 15;
export const DEFAULT_VALUES = [50, 30, 70, 20, 40, 60, 80];
const DEFAULT_INPUT = "50, 30, 70, 20, 40, 60, 80";
const EMPTY_MESSAGE = "请输入键序列，例如 `50, 30, 70, 20, 40, 60, 80`。";
const INVALID_MESSAGE = `请输入最多 ${MAX_NODES} 个整数，范围 -999 到 999。`;
const INSERT_VALUE_MESSAGE = "插入值须为 -999 到 999 的整数。";
const FULL_MESSAGE = `最多展示 ${MAX_NODES} 个节点，无法继续插入。`;
const OPERATIONS = ["create", "insert", "extract"] as const;
type HeapOperation = (typeof OPERATIONS)[number];

interface HeapNode {
  id: number;
  value: number;
}

function validateValues(values: number[], limit = MAX_NODES) {
  if (!values.length) throw new Error(EMPTY_MESSAGE);
  if (values.length > limit)
    throw new Error(`最多展示 ${limit} 个节点，请减小输入规模。`);
  for (const value of values)
    if (!Number.isInteger(value) || Math.abs(value) > 999)
      throw new Error(INVALID_MESSAGE);
}

export function parseHeapInput(text: string, limit = MAX_NODES): number[] {
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

/** 数组下标 i 的父节点下标；根节点没有父节点。 */
export function parentIndex(index: number) {
  return Math.floor((index - 1) / 2);
}

function linksOf(heap: HeapNode[]): FrameLink[] {
  const links: FrameLink[] = [];
  for (let index = 1; index < heap.length; index++)
    links.push([
      heap[parentIndex(index)].id,
      heap[index].id,
      index % 2 === 1 ? "left" : "right",
    ]);
  return links;
}

function snapshot(
  heap: HeapNode[],
  {
    anchor,
    narration,
    active = [],
    settled = [],
    index,
  }: {
    anchor: string;
    narration: string;
    active?: number[];
    settled?: number[];
    /** 当前调整到的数组下标。 */
    index?: number;
  },
): Frame {
  // items 按 id 升序，active / settled 用 items 下标；heapOrder 与连线用节点 id。
  const items = [...heap].sort((a, b) => a.id - b.id);
  const indexOf = new Map(items.map((node, position) => [node.id, position]));
  const toIndices = (ids: number[]) => [
    ...new Set(
      ids
        .map((id) => indexOf.get(id) ?? -1)
        .filter((position) => position >= 0),
    ),
  ];
  return {
    items: items.map(({ id, value }) => ({ id, value })),
    active: toIndices(active),
    settled: toIndices(settled),
    pointers: {},
    anchor,
    narration,
    variables: {
      size: heap.length,
      ...(index === undefined ? {} : { index }),
    },
    stack: [],
    queue: [],
    links: linksOf(heap),
    heapOrder: heap.map((node) => node.id),
    rootId: heap[0]?.id ?? null,
  };
}

/** 把值追加到数组末尾；调用方已经检查过容量。 */
function appendNode(heap: HeapNode[], id: number, value: number): HeapNode {
  const node: HeapNode = { id, value };
  heap.push(node);
  return node;
}

/**
 * 从末尾节点开始上浮，逐帧记录比较与交换。
 * settled 保存已经比较过、被留在下方的父节点。
 */
function siftUpFrames(heap: HeapNode[], frames: Frame[], start: number) {
  let index = start;
  const movingId = heap[index].id;
  const settled: number[] = [];
  while (index > 0) {
    const parent = parentIndex(index);
    const current = heap[index];
    const above = heap[parent];
    const needSwap = current.value < above.value;
    frames.push(
      snapshot(heap, {
        anchor: "compare",
        narration: `比较 ${current.value} 与父节点 ${above.value}：${
          current.value
        } ${needSwap ? "<" : ">="} ${above.value}，${
          needSwap ? "需要上浮。" : "堆序满足，停止上浮。"
        }`,
        active: [movingId],
        settled,
        index,
      }),
    );
    if (!needSwap) break;
    heap[parent] = current;
    heap[index] = above;
    settled.push(above.id);
    frames.push(
      snapshot(heap, {
        anchor: "swap",
        narration: `交换 ${current.value} 与 ${above.value}，${current.value} 上浮到下标 ${parent}。`,
        active: [movingId],
        settled,
        index: parent,
      }),
    );
    index = parent;
  }
}

function appendSuffix(frames: Frame[], suffix: string) {
  const last = frames.at(-1);
  if (last) last.narration += suffix;
}

function createFrames(values: number[]): Frame[] {
  const heap: HeapNode[] = [];
  const frames: Frame[] = [];
  values.forEach((value, id) => {
    const node = appendNode(heap, id, value);
    frames.push(
      snapshot(heap, {
        anchor: "append",
        narration: `把 ${value} 放到数组下标 ${heap.length - 1}。`,
        active: [node.id],
        index: heap.length - 1,
      }),
    );
    siftUpFrames(heap, frames, heap.length - 1);
  });
  appendSuffix(frames, `建堆完成，共 ${heap.length} 个节点。`);
  return frames;
}

function buildHeap(values: number[]): HeapNode[] {
  const heap: HeapNode[] = [];
  values.forEach((value, id) => {
    appendNode(heap, id, value);
    let index = heap.length - 1;
    while (index > 0) {
      const parent = parentIndex(index);
      if (heap[parent].value <= heap[index].value) break;
      [heap[parent], heap[index]] = [heap[index], heap[parent]];
      index = parent;
    }
  });
  return heap;
}

function insertFrames(values: number[], target: number): Frame[] {
  const heap = buildHeap(values);
  if (heap.length >= MAX_NODES) throw new Error(FULL_MESSAGE);
  const frames: Frame[] = [
    snapshot(heap, {
      anchor: "start",
      narration: `准备插入 ${target}：把 ${target} 追加到数组末尾。`,
    }),
  ];
  const node = appendNode(heap, values.length, target);
  frames.push(
    snapshot(heap, {
      anchor: "append",
      narration: `把 ${target} 放到数组下标 ${heap.length - 1}。`,
      active: [node.id],
      index: heap.length - 1,
    }),
  );
  siftUpFrames(heap, frames, heap.length - 1);
  appendSuffix(frames, `插入完成，共 ${heap.length} 个节点。`);
  return frames;
}

function extractFrames(values: number[]): Frame[] {
  const heap = buildHeap(values);
  const frames: Frame[] = [];
  const minimum = heap[0];
  const last = heap[heap.length - 1];
  frames.push(
    snapshot(heap, {
      anchor: "start",
      narration: `准备删除堆顶：记录堆顶 ${minimum.value}，把末元素 ${last.value} 移到堆顶。`,
    }),
  );

  if (heap.length === 1) {
    heap.length = 0;
    frames.push(
      snapshot(heap, {
        anchor: "replace",
        narration: `删除堆顶 ${minimum.value}，堆变空。删除完成，堆为空。`,
      }),
    );
    return frames;
  }

  heap.pop();
  heap[0] = last;
  frames.push(
    snapshot(heap, {
      anchor: "replace",
      narration: `把末元素 ${last.value} 移到堆顶，堆大小变为 ${heap.length}。`,
      active: [last.id],
      index: 0,
    }),
  );

  let index = 0;
  const settled: number[] = [];
  while (true) {
    const left = 2 * index + 1;
    if (left >= heap.length) break;
    let childIndex = left;
    if (
      left + 1 < heap.length &&
      heap[left + 1].value < heap[left].value
    )
      childIndex = left + 1;
    const current = heap[index];
    const child = heap[childIndex];
    const needSwap = current.value > child.value;
    frames.push(
      snapshot(heap, {
        anchor: "compare",
        narration: `比较 ${current.value} 与较小孩子 ${child.value}：${
          current.value
        } ${needSwap ? ">" : "<="} ${child.value}，${
          needSwap ? "需要下沉。" : "堆序满足，停止下沉。"
        }`,
        active: [current.id],
        settled,
        index,
      }),
    );
    if (!needSwap) break;
    heap[index] = child;
    heap[childIndex] = current;
    settled.push(child.id);
    frames.push(
      snapshot(heap, {
        anchor: "swap",
        narration: `交换 ${current.value} 与 ${child.value}，${current.value} 下沉到下标 ${childIndex}。`,
        active: [current.id],
        settled,
        index: childIndex,
      }),
    );
    index = childIndex;
  }

  const top = heap[0];
  appendSuffix(
    frames,
    top ? `删除完成，当前堆顶为 ${top.value}。` : "删除完成，堆为空。",
  );
  return frames;
}

export function heapTrace(
  values: number[],
  operation: string,
  value = 0,
): Frame[] {
  validateValues(values);
  if (!OPERATIONS.includes(operation as HeapOperation))
    throw new Error("未知操作。");
  if (
    operation === "insert" &&
    (!Number.isInteger(value) || Math.abs(value) > 999)
  )
    throw new Error(INSERT_VALUE_MESSAGE);

  if (operation === "create") return createFrames(values);
  if (operation === "insert") return insertFrames(values, value);
  return extractFrames(values);
}

export const heap: ReadyTopic = {
  id: "heap",
  group: "tree-hash",
  title: "二叉堆",
  badge: "O(log n)",
  summary: "完全二叉树的上浮与下沉，是优先队列的实现基础。",
  status: "ready",
  scene: "heap",
  icon: Workflow,
  controls: {
    dataLabel: "键序列",
    defaultValues: DEFAULT_VALUES,
    defaultInput: DEFAULT_INPUT,
    parseInput: parseHeapInput,
    limit: MAX_NODES,
    defaultOperation: "insert",
    randomizable: false,
    operations: [
      { id: "create", label: "创建" },
      { id: "insert", label: "插入" },
      { id: "extract", label: "删除堆顶" },
    ],
    value: {
      label: "插入值",
      onlyFor: ["insert"],
      defaultValue: 15,
    },
  },
  legend: [
    { label: "当前节点 / 当前下标", tone: "pivot" },
    { label: "已比较", tone: "active" },
    { label: "未访问", tone: "idle" },
  ],
  theory: [
    {
      title: "完全二叉树与数组",
      body: "堆是一棵完全二叉树，按层序紧密地存进数组：下标 i 的父节点是 (i - 1) / 2，左孩子是 2i + 1，右孩子是 2i + 2。树的形状不会出现空洞。",
    },
    {
      title: "上浮",
      body: "插入时先把新值放到数组末尾，再与父节点比较。小顶堆里若新值更小就交换，继续向上，直到到达根或父节点不大于它。",
    },
    {
      title: "下沉与复杂度",
      body: "删除堆顶时把末元素移到根，再与较小的孩子比较并交换，直到叶子或堆序恢复。上浮和下沉都只走一条根到叶的路径，复杂度 O(log n)。",
    },
  ],
  trace: ({ values, operation, value }: TraceInput) =>
    heapTrace(values, operation, value),
  code: (language, operation) =>
    parseCode(
      templates[language][operation] ?? templates[language].insert,
    ),
};
