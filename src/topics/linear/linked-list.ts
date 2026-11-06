import {
  BookOpen,
  Gauge,
  GitBranch,
  Link2,
  TriangleAlert,
} from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./linked-list-templates";

export function linkedListTrace(
  values: number[],
  operation: string,
  index: number,
  value: number,
): Frame[] {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index > values.length ||
    (operation !== "insert" && index === values.length)
  )
    throw new Error("操作位置超出链表范围。");
  if (!Number.isInteger(value) || Math.abs(value) > 999)
    throw new Error("节点值须为 -999 到 999 的整数。");
  if (operation === "insert" && values.length >= 12)
    throw new Error("最多展示 12 个节点。");
  let items = values.map((value, id) => ({ id, value }));
  let links: Array<[number, number]> = items
    .slice(1)
    .map((item, i) => [items[i].id, item.id]);
  const frames: Frame[] = [];
  let headId: number | null = items[0]?.id ?? null;
  function emit(
    anchor: string,
    narration: string,
    active: number[] = [],
    pointers: Record<string, number> = {},
    detached?: number,
  ) {
    frames.push({
      items: items.map((item) => ({ ...item })),
      links: links.map((link) => [...link] as [number, number]),
      active,
      pointers: {
        ...(headId === null
          ? {}
          : { head: items.findIndex((item) => item.id === headId) }),
        ...pointers,
      },
      detached,
      headId,
      settled: [],
      anchor,
      narration,
      variables:
        operation === "insert"
          ? { index, value, length: items.length }
          : { index, length: items.length },
      stack: [],
    });
  }
  emit(
    "start",
    "head 指向首节点，每个节点通过 next 连接后继。",
    [],
    items.length ? { head: 0 } : {},
  );
  const context = {
    ...(index > 0 ? { prev: index - 1 } : {}),
    ...(index < values.length ? { curr: index } : {}),
  };
  for (let current = 1; current <= index; current++) {
    const atEnd = current === values.length;
    emit(
      "walk",
      atEnd
        ? "抵达尾部，curr 为空。"
        : `沿 next 移到索引 ${current}，节点值为 ${items[current].value}。`,
      [atEnd ? current - 1 : current],
      {
        ...(operation !== "find" ? { prev: current - 1 } : {}),
        ...(atEnd ? {} : { curr: current }),
      },
    );
  }
  if (operation === "find")
    emit(
      "result",
      `找到索引 ${index}，节点值为 ${items[index].value}。`,
      [index],
      { curr: index },
    );
  if (operation === "insert") {
    const newNode = { id: values.length, value };
    items = [...items, newNode];
    const newNodeIndex = items.length - 1;
    emit(
      "allocate",
      `创建值为 ${value} 的新节点。`,
      [newNodeIndex],
      { ...context, newNode: newNodeIndex },
      newNode.id,
    );
    if (index < values.length) links.push([newNode.id, index]);
    emit(
      "connect",
      "先让新节点指向原来的后继，保留后续链路。",
      [newNodeIndex],
      { ...context, newNode: newNodeIndex },
      newNode.id,
    );
    if (index > 0) {
      links = links.filter(([from]) => from !== index - 1);
      links.push([index - 1, newNode.id]);
    }
    items = [...items.slice(0, index), newNode, ...items.slice(index, -1)];
    if (index === 0) headId = newNode.id;
    emit(
      "commit",
      index === 0
        ? "更新 head，让它指向新节点。"
        : "将前驱的 next 指向新节点，插入完成。",
      [index],
      { ...(index > 0 ? { prev: index - 1 } : {}), newNode: index },
    );
  }
  if (operation === "delete") {
    const target = items[index];
    links = links.filter(([, to]) => to !== target.id);
    if (index > 0 && index + 1 < items.length)
      links.push([items[index - 1].id, items[index + 1].id]);
    if (index === 0) headId = items[index + 1]?.id ?? null;
    emit(
      "bypass",
      index === 0
        ? "将 head 移到后继节点。"
        : "让前驱绕过目标节点，直接连接后继。",
      [index],
      context,
      target.id,
    );
    items = items.filter((item) => item.id !== target.id);
    links = links.filter(([from]) => from !== target.id);
    emit(
      "remove",
      "移除目标节点，后续链路保持完整。",
      [],
      items.length ? { head: 0 } : {},
    );
  }
  emit("done", "操作完成。");
  return frames;
}

export const linkedList: ReadyTopic = {
  id: "linked-list",
  group: "linear",
  title: "单链表",
  badge: "O(n)",
  summary: "按索引沿 next 遍历，插入与删除只改指针。",
  status: "ready",
  scene: "linked-list",
  icon: GitBranch,
  controls: {
    dataLabel: "初始链表",
    defaultValues: [12, 24, 36, 48],
    operations: [
      { id: "insert", label: "插入" },
      { id: "delete", label: "删除" },
      { id: "find", label: "查询" },
    ],
    index: {
      label: "索引",
      max: ({ length, operation }) =>
        operation === "insert" ? length : Math.max(0, length - 1),
    },
    value: { label: "节点值", onlyFor: ["insert"] },
  },
  legend: [
    { label: "当前操作", tone: "active" },
    { label: "未处理", tone: "idle" },
  ],
  theory: [
    {
      title: "核心思路",
      icon: BookOpen,
      body: "单链表像一串用线索连接起来的车厢：每个节点既保存自己的值 value，也用 next 指向下一个节点。节点不必挨着存放，只要沿着 next 就能按顺序找到整条链。",
      items: [
        "head 指向第一个节点；空链表的 head 为空。最后一个节点的 next 也为空，表示链表结束。",
        "单链表只能顺着 next 向前走，不能按下标直接跳到目标节点，也不能从当前节点直接找到前驱。",
        "插入和删除的本质不是搬动元素，而是修改少量 next 指针，让节点接入或离开这条链。",
      ],
    },
    {
      title: "指针怎么接",
      icon: Link2,
      body: "要在下标 i 插入新节点，先从头走 i 步定位，再处理指针。若已找到前驱 prev，插入顺序是：newNode.next = prev.next，然后 prev.next = newNode。",
      items: [
        "第一步先让新节点接住原来的后继，第二步再让前驱指向新节点；动画中的「先接入、后连接」正是在展示这个顺序。",
        "删除 curr 时，让 prev.next = curr.next，前驱便绕过 curr，直接连到它的后继。",
        "在表头插入或删除时没有前驱，需要单独更新 head。本页已处理这个边界，可以把下标设为 0 对照观察。",
      ],
    },
    {
      title: "复杂度",
      icon: Gauge,
      body: "链表省去了移动元素，却增加了按位置查找的开销。要把「找位置」和「改指针」分开计算，不能只记一个 O(1)。",
      rows: [
        { label: "按下标查询", value: "O(n)" },
        { label: "按下标插入或删除（含定位）", value: "O(n)" },
        { label: "已知前驱后的插入或删除", value: "O(1)" },
        { label: "在表头插入或删除", value: "O(1)" },
        { label: "单次操作所需额外空间", value: "O(1)" },
      ],
    },
    {
      title: "易错点",
      icon: TriangleAlert,
      body: "指针一旦接错，后面的节点可能再也访问不到，因此操作顺序比代码长短更重要。",
      items: [
        "不要先执行 prev.next = newNode 再设置 newNode.next；此时原来的后继地址已经丢失，链表会断成两截。",
        "定位前驱和定位目标节点不是一回事：在第 i 项前插入通常要找第 i - 1 项，但表头操作必须特判。",
        "遍历时常用 curr = curr.next 前进；循环继续前必须确认 curr 非空，不能访问空节点的 next。",
        "下标从 0 开始，查询或删除要求 i < length，插入则允许 i = length，即追加到表尾。",
      ],
    },
  ],
  trace: ({ values, operation, index, value }) =>
    linkedListTrace(values, operation, index, value),
  code: (language, operation) =>
    parseCode(templates[language][operation] ?? templates[language].insert),
};
