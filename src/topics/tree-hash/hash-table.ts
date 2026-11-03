import { Hash } from "lucide-react";
import { parseCode } from "../../core/code";
import { HASH_BUCKET_COUNT, hashSlot } from "../../core/hash";
import type { Frame, FrameLink, TraceInput } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./hash-table-templates";

export const MAX_KEYS = 15;
export const DEFAULT_VALUES = [50, 23, 15, 36, 44, 8, 60];
const DEFAULT_INPUT = "50, 23, 15, 36, 44, 8, 60";
const EMPTY_MESSAGE = "请输入键序列，例如 `50, 23, 15, 36, 44, 8, 60`。";
const INVALID_MESSAGE = `请输入最多 ${MAX_KEYS} 个整数，范围 -999 到 999。`;
const TARGET_MESSAGE = "目标键须为 -999 到 999 的整数。";
const OPERATIONS = ["create", "search", "insert", "delete"] as const;
type HashOperation = (typeof OPERATIONS)[number];

interface HashNode {
  id: number;
  key: number;
  next: HashNode | null;
}

type HashTable = (HashNode | null)[];

function validateValues(values: number[], limit = MAX_KEYS) {
  if (!values.length) throw new Error(EMPTY_MESSAGE);
  if (values.length > limit)
    throw new Error(`最多展示 ${limit} 个键，请减小输入规模。`);
  const seen = new Set<number>();
  for (const key of values) {
    if (!Number.isInteger(key) || Math.abs(key) > 999)
      throw new Error(INVALID_MESSAGE);
    if (seen.has(key))
      throw new Error(`键序列包含重复键 ${key}，哈希表不接受重复键。`);
    seen.add(key);
  }
}

export function parseHashInput(text: string, limit = MAX_KEYS): number[] {
  const tokens = text
    .trim()
    .split(/[,，\s]+/)
    .filter(Boolean);
  if (!tokens.length) throw new Error(EMPTY_MESSAGE);
  if (tokens.length > limit)
    throw new Error(`最多展示 ${limit} 个键，请减小输入规模。`);
  if (tokens.some((token) => !/^-?\d+$/.test(token)))
    throw new Error(INVALID_MESSAGE);
  const values = tokens.map(Number);
  validateValues(values, limit);
  return values;
}

function makeTable(): HashTable {
  return Array.from({ length: HASH_BUCKET_COUNT }, () => null);
}

/** 尾插法，保证冲突键按插入顺序排列。 */
function appendNode(table: HashTable, bucket: number, node: HashNode) {
  const head = table[bucket];
  if (!head) {
    table[bucket] = node;
    return;
  }
  let current = head;
  while (current.next) current = current.next;
  current.next = node;
}

function buildTable(values: number[]): HashTable {
  const table = makeTable();
  values.forEach((key, id) => {
    appendNode(table, hashSlot(key), { id, key, next: null });
  });
  return table;
}

function chainOf(table: HashTable, bucket: number): HashNode[] {
  const chain: HashNode[] = [];
  for (let node = table[bucket]; node; node = node.next) chain.push(node);
  return chain;
}

/** 当前存活节点，按 id 升序；items 与 active / settled 的下标依赖这个顺序。 */
function collectNodes(table: HashTable): HashNode[] {
  const nodes: HashNode[] = [];
  const seen = new Set<number>();
  for (let bucket = 0; bucket < HASH_BUCKET_COUNT; bucket++)
    for (let node = table[bucket]; node; node = node.next)
      if (!seen.has(node.id)) {
        seen.add(node.id);
        nodes.push(node);
      }
  return nodes.sort((a, b) => a.id - b.id);
}

function linksOf(table: HashTable): FrameLink[] {
  const links: FrameLink[] = [];
  for (let bucket = 0; bucket < HASH_BUCKET_COUNT; bucket++)
    for (let node = table[bucket]; node; node = node.next)
      if (node.next) links.push([node.id, node.next.id]);
  return links;
}

function snapshot(
  table: HashTable,
  {
    anchor,
    narration,
    key,
    bucket,
    active = [],
    settled = [],
    activeBuckets = [],
    compared = 0,
  }: {
    anchor: string;
    narration: string;
    key: number;
    bucket: number;
    active?: number[];
    settled?: number[];
    activeBuckets?: number[];
    compared?: number;
  },
): Frame {
  const nodes = collectNodes(table);
  const indexOf = new Map(nodes.map((node, index) => [node.id, index]));
  const toIndices = (ids: number[]) => [
    ...new Set(
      ids
        .map((id) => indexOf.get(id) ?? -1)
        .filter((index) => index >= 0),
    ),
  ];
  return {
    items: nodes.map(({ id, key }) => ({ id, value: key })),
    active: toIndices(active),
    settled: toIndices(settled),
    pointers: {},
    anchor,
    narration,
    variables: {
      key,
      bucket,
      compared,
      size: nodes.length,
    },
    stack: [],
    queue: [],
    links: linksOf(table),
    bucketHeads: table.map((node) => node?.id ?? null),
    activeBuckets,
  };
}

function hashLine(key: number, bucket: number) {
  return `h(${key}) = ${key} mod 7 = ${bucket}，定位到 ${bucket} 号桶。`;
}

function createFrames(values: number[]): Frame[] {
  const table = makeTable();
  const frames: Frame[] = [];
  let nextId = 0;
  values.forEach((key, index) => {
    const bucket = hashSlot(key);
    const last = index === values.length - 1;
    frames.push(
      snapshot(table, {
        anchor: "hash",
        narration: `插入 ${key}：${hashLine(key, bucket)}`,
        key,
        bucket,
        activeBuckets: [bucket],
      }),
    );
    const chain = chainOf(table, bucket);
    const compared: number[] = [];
    chain.forEach((node) => {
      frames.push(
        snapshot(table, {
          anchor: "compare",
          narration: `比较 ${key} 与 ${node.key}：不相等，沿链继续。`,
          key,
          bucket,
          active: [node.id],
          settled: compared,
          activeBuckets: [bucket],
          compared: compared.length + 1,
        }),
      );
      compared.push(node.id);
    });
    const node: HashNode = { id: nextId++, key, next: null };
    appendNode(table, bucket, node);
    frames.push(
      snapshot(table, {
        anchor: "insert",
        narration: `在 ${bucket} 号桶链尾插入 ${key}。${
          last ? `建表完成，共 ${values.length} 个键。` : ""
        }`,
        key,
        bucket,
        active: [node.id],
        settled: compared,
        activeBuckets: [bucket],
        compared: compared.length,
      }),
    );
  });
  return frames;
}

function searchFrames(table: HashTable, target: number): Frame[] {
  const bucket = hashSlot(target);
  const frames: Frame[] = [
    snapshot(table, {
      anchor: "start",
      narration: `准备查找 ${target}：先计算桶号。`,
      key: target,
      bucket,
    }),
    snapshot(table, {
      anchor: "hash",
      narration: hashLine(target, bucket),
      key: target,
      bucket,
      activeBuckets: [bucket],
    }),
  ];
  const chain = chainOf(table, bucket);
  if (!chain.length) {
    frames.push(
      snapshot(table, {
        anchor: "miss",
        narration: `${bucket} 号桶为空，未找到 ${target}。`,
        key: target,
        bucket,
        activeBuckets: [bucket],
      }),
    );
    return frames;
  }
  const compared: number[] = [];
  for (let i = 0; i < chain.length; i++) {
    const node = chain[i];
    const count = compared.length + 1;
    if (node.key === target) {
      frames.push(
        snapshot(table, {
          anchor: "found",
          narration: `在 ${bucket} 号桶找到 ${target}。`,
          key: target,
          bucket,
          active: [node.id],
          settled: compared,
          activeBuckets: [bucket],
          compared: count,
        }),
      );
      return frames;
    }
    if (i === chain.length - 1) {
      frames.push(
        snapshot(table, {
          anchor: "miss",
          narration: `比较 ${target} 与 ${node.key}：不相等，链结束，未找到 ${target}。`,
          key: target,
          bucket,
          active: [node.id],
          settled: compared,
          activeBuckets: [bucket],
          compared: count,
        }),
      );
      return frames;
    }
    frames.push(
      snapshot(table, {
        anchor: "compare",
        narration: `比较 ${target} 与 ${node.key}：不相等，沿链继续。`,
        key: target,
        bucket,
        active: [node.id],
        settled: compared,
        activeBuckets: [bucket],
        compared: count,
      }),
    );
    compared.push(node.id);
  }
  return frames;
}

function insertFrames(
  table: HashTable,
  target: number,
  nextId: number,
): Frame[] {
  const bucket = hashSlot(target);
  const frames: Frame[] = [
    snapshot(table, {
      anchor: "start",
      narration: `准备插入 ${target}：先计算桶号。`,
      key: target,
      bucket,
    }),
    snapshot(table, {
      anchor: "hash",
      narration: hashLine(target, bucket),
      key: target,
      bucket,
      activeBuckets: [bucket],
    }),
  ];
  const chain = chainOf(table, bucket);
  const compared: number[] = [];
  for (const node of chain) {
    const count = compared.length + 1;
    if (node.key === target) {
      frames.push(
        snapshot(table, {
          anchor: "exists",
          narration: `比较 ${target} 与 ${node.key}：相等，键已存在，不重复插入。`,
          key: target,
          bucket,
          active: [node.id],
          settled: compared,
          activeBuckets: [bucket],
          compared: count,
        }),
      );
      return frames;
    }
    frames.push(
      snapshot(table, {
        anchor: "compare",
        narration: `比较 ${target} 与 ${node.key}：不相等，沿链继续。`,
        key: target,
        bucket,
        active: [node.id],
        settled: compared,
        activeBuckets: [bucket],
        compared: count,
      }),
    );
    compared.push(node.id);
  }
  if (collectNodes(table).length >= MAX_KEYS)
    throw new Error(`最多展示 ${MAX_KEYS} 个键，无法继续插入。`);
  const node: HashNode = { id: nextId, key: target, next: null };
  appendNode(table, bucket, node);
  frames.push(
    snapshot(table, {
      anchor: "insert",
      narration: `在 ${bucket} 号桶链尾插入 ${target}。插入完成，共 ${
        collectNodes(table).length
      } 个键。`,
      key: target,
      bucket,
      active: [node.id],
      settled: compared,
      activeBuckets: [bucket],
      compared: compared.length,
    }),
  );
  return frames;
}

function deleteFrames(table: HashTable, target: number): Frame[] {
  const bucket = hashSlot(target);
  const frames: Frame[] = [
    snapshot(table, {
      anchor: "start",
      narration: `准备删除 ${target}：先查找目标键。`,
      key: target,
      bucket,
    }),
    snapshot(table, {
      anchor: "hash",
      narration: hashLine(target, bucket),
      key: target,
      bucket,
      activeBuckets: [bucket],
    }),
  ];
  const chain = chainOf(table, bucket);
  if (!chain.length) {
    frames.push(
      snapshot(table, {
        anchor: "miss",
        narration: `${bucket} 号桶为空，未找到 ${target}。`,
        key: target,
        bucket,
        activeBuckets: [bucket],
      }),
    );
    return frames;
  }
  const compared: number[] = [];
  for (let i = 0; i < chain.length; i++) {
    const node = chain[i];
    const count = compared.length + 1;
    if (node.key === target) {
      frames.push(
        snapshot(table, {
          anchor: "found",
          narration: `找到 ${target}，准备从 ${bucket} 号桶删除。`,
          key: target,
          bucket,
          active: [node.id],
          settled: compared,
          activeBuckets: [bucket],
          compared: count,
        }),
      );
      const prev = i > 0 ? chain[i - 1] : null;
      const next = node.next;
      if (prev) prev.next = next;
      else table[bucket] = next;
      const unique = chain.length === 1;
      let narration: string;
      let active: number[] = [];
      if (unique) {
        narration = `删除 ${bucket} 号桶中唯一的键 ${target}，桶变空。删除完成。`;
      } else if (!prev) {
        narration = `删除 ${bucket} 号桶的链头 ${target}，链头改为 ${next!.key}。删除完成。`;
        active = [next!.id];
      } else {
        narration = `在 ${bucket} 号桶中删除 ${target}，前驱 ${prev.key} 指向${
          next ? `后继 ${next.key}` : "空"
        }。删除完成。`;
        active = [prev.id];
      }
      frames.push(
        snapshot(table, {
          anchor: "remove",
          narration,
          key: target,
          bucket,
          active,
          settled: compared,
          activeBuckets: [bucket],
          compared: count,
        }),
      );
      return frames;
    }
    if (i === chain.length - 1) {
      frames.push(
        snapshot(table, {
          anchor: "miss",
          narration: `未找到 ${target}，删除取消。`,
          key: target,
          bucket,
          active: [node.id],
          settled: compared,
          activeBuckets: [bucket],
          compared: count,
        }),
      );
      return frames;
    }
    frames.push(
      snapshot(table, {
        anchor: "compare",
        narration: `比较 ${target} 与 ${node.key}：不相等，沿链继续。`,
        key: target,
        bucket,
        active: [node.id],
        settled: compared,
        activeBuckets: [bucket],
        compared: count,
      }),
    );
    compared.push(node.id);
  }
  return frames;
}

export function hashTableTrace(
  values: number[],
  operation: string,
  value = 0,
): Frame[] {
  validateValues(values);
  if (!OPERATIONS.includes(operation as HashOperation))
    throw new Error("未知操作。");
  if (
    operation !== "create" &&
    (!Number.isInteger(value) || Math.abs(value) > 999)
  )
    throw new Error(TARGET_MESSAGE);

  if (operation === "create") return createFrames(values);
  const table = buildTable(values);
  const nextId = values.length;
  if (operation === "search") return searchFrames(table, value);
  if (operation === "insert") return insertFrames(table, value, nextId);
  return deleteFrames(table, value);
}

export const hashTable: ReadyTopic = {
  id: "hash-table",
  group: "tree-hash",
  title: "哈希表",
  badge: "O(1)",
  summary: "除留余数法定位桶，链地址法处理冲突，支持创建、查找、插入与删除。",
  status: "ready",
  scene: "hash",
  icon: Hash,
  controls: {
    dataLabel: "键序列",
    defaultValues: DEFAULT_VALUES,
    defaultInput: DEFAULT_INPUT,
    parseInput: parseHashInput,
    limit: MAX_KEYS,
    defaultOperation: "search",
    randomizable: false,
    operations: [
      { id: "create", label: "创建" },
      { id: "search", label: "查找" },
      { id: "insert", label: "插入" },
      { id: "delete", label: "删除" },
    ],
    value: {
      label: "目标键",
      onlyFor: ["search", "insert", "delete"],
      defaultValue: 8,
    },
  },
  legend: [
    { label: "当前桶 / 当前键", tone: "pivot" },
    { label: "已比较", tone: "active" },
    { label: "空桶 / 未访问", tone: "idle" },
  ],
  theory: [
    {
      title: "除留余数法",
      body: "h(key) = key mod 7；对负键先加 7 再取模，保证桶号落在 0..6。桶数固定，便于观察冲突分布。",
    },
    {
      title: "链地址法",
      body: "同一个桶的键按插入顺序挂在一条链上。查找先定位桶，再沿链逐个比较，冲突越多链越长。",
    },
    {
      title: "复杂度",
      body: "设负载因子 α = n / 7，平均查找 O(1 + α)；最坏所有键同桶，退化为 O(n)。空间为键数加 7 个桶。",
    },
  ],
  trace: ({ values, operation, value }: TraceInput) =>
    hashTableTrace(values, operation, value),
  code: (language, operation) =>
    parseCode(
      templates[language][operation] ?? templates[language].search,
    ),
};
