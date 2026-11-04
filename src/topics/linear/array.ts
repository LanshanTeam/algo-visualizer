import { Boxes } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./array-templates";

/** 画布上的定长容量：槽位数量固定，长度随插入删除变化。 */
export const ARRAY_CAPACITY = 8;
const MAX_VALUE = 999;

/**
 * 顺序表（数组）的演示轨迹。
 * 元素身份稳定，插入右移、删除左移都沿真实轨迹移动。
 */
export function arrayTrace(
  values: number[],
  operation: string,
  index: number,
  value: number,
  capacity = ARRAY_CAPACITY,
): Frame[] {
  if (values.length > capacity)
    throw new Error(`顺序表容量为 ${capacity}，请减少元素个数。`);
  if (operation === "insert") {
    if (!Number.isInteger(index) || index < 0 || index > values.length)
      throw new Error("插入位置须在 0 到当前长度之间。");
    if (values.length >= capacity)
      throw new Error(`顺序表已满（容量 ${capacity}），无法插入。`);
    if (!Number.isInteger(value) || Math.abs(value) > MAX_VALUE)
      throw new Error(`元素值须为 -${MAX_VALUE} 到 ${MAX_VALUE} 的整数。`);
  } else if (!Number.isInteger(index) || index < 0 || index >= values.length) {
    throw new Error(
      operation === "delete"
        ? "删除位置超出顺序表范围。"
        : "查询位置超出顺序表范围。",
    );
  }
  const target = values[index];
  let items = values.map((item, id) => ({ id, value: item }));
  const frames: Frame[] = [];
  function emit(
    anchor: string,
    narration: string,
    active: number[] = [],
    pointers: Record<string, number> = {},
  ) {
    frames.push({
      items: items.map((item) => ({ ...item })),
      active,
      settled: [],
      pointers,
      anchor,
      narration,
      variables: { index, length: items.length, capacity },
      stack: [],
    });
  }
  emit(
    "start",
    `顺序表占用连续内存：a[i] 的地址 = 首地址 + i × 元素大小。容量 ${capacity}，当前长度 ${items.length}。`,
  );
  if (operation === "insert") {
    emit(
      "capacity",
      `检查容量与位置：长度 ${items.length} < 容量 ${capacity}，索引 ${index} 合法。`,
    );
    if (index < items.length)
      emit(
        "locate",
        `直接寻址定位 a[${index}] = ${target}，插入后它及其后的元素都要右移。`,
        [index],
        { index },
      );
    else emit("locate", "索引等于当前长度，新元素追加到表尾，无需移动已有元素。");
    items = [
      ...items.slice(0, index),
      { id: values.length, value },
      ...items.slice(index),
    ];
    emit(
      "shift",
      `从表尾开始逐个右移一格，为索引 ${index} 腾出空位。`,
      [index],
    );
    emit("write", `把 ${value} 写入 a[${index}]，长度加一。`, [index]);
  }
  if (operation === "delete") {
    emit(
      "locate",
      `直接寻址定位 a[${index}] = ${target}，随机访问只需一次地址计算。`,
      [index],
      { index },
    );
    items = items.filter((_, i) => i !== index);
    emit(
      "shift",
      `删除 a[${index}]，其后的元素整体左移一格填补空位。`,
      index < items.length ? [index] : [],
    );
  }
  if (operation === "find")
    emit(
      "locate",
      `直接寻址读出 a[${index}] = ${target}，不必从头遍历。`,
      [index],
      { index },
    );
  emit(
    "done",
    operation === "find"
      ? `查询完成，a[${index}] = ${target}，时间复杂度 O(1)。`
      : `操作完成。长度 ${items.length}，容量 ${capacity} 不变。`,
  );
  return frames;
}

export const array: ReadyTopic = {
  id: "array",
  group: "linear",
  title: "顺序表（数组）",
  badge: "O(1)",
  summary: "连续内存与随机访问；插入删除要成段移动元素。",
  status: "ready",
  scene: "array",
  icon: Boxes,
  controls: {
    dataLabel: "顺序表",
    defaultValues: [23, 47, 15, 62, 38],
    limit: ARRAY_CAPACITY,
    capacity: ARRAY_CAPACITY,
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
    value: { label: "元素值", onlyFor: ["insert"] },
  },
  legend: [
    { label: "当前操作", tone: "active" },
    { label: "未处理", tone: "idle" },
  ],
  theory: [
    {
      title: "顺序存储",
      body: "元素在内存中连续存放，逻辑相邻即物理相邻。容量固定，长度可变：容量决定槽位数量，长度记录已用槽位。",
    },
    {
      title: "随机访问",
      body: "第 i 个元素的地址 = 首地址 + i × 元素大小，与 i 无关，所以按索引读写是 O(1)，不需要遍历。",
    },
    {
      title: "插入与删除",
      body: "在索引 i 插入需要把索引 i 及其后的元素整体右移一格；删除则整体左移一格。移动次数为 O(n)，表尾增删是 O(1)。",
    },
  ],
  trace: ({ values, operation, index, value }) =>
    arrayTrace(values, operation, index, value),
  code: (language, operation) =>
    parseCode(templates[language][operation] ?? templates[language].insert),
};
