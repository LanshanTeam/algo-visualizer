import {
  BookOpen,
  Boxes,
  Gauge,
  ListOrdered,
  TriangleAlert,
} from "lucide-react";
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
      title: "核心思路",
      icon: BookOpen,
      body: "把顺序表想成一排连续编号的储物格：第 0 格、第 1 格……依次排好。元素在内存中也连续存放，所以知道首地址和下标，就能直接算出目标元素的位置，不必从前往后逐个寻找。",
      items: [
        "下标（index）表示元素的位置，本页从 0 开始；长度（length）表示已经装了多少个元素。",
        "容量（capacity）表示一共有多少个槽位。本页固定为 8，长度可以小于容量，但不能超过容量。",
        "查询只需按地址直接读取；插入和删除为了保持元素连续、顺序不变，可能需要移动其他元素。",
      ],
    },
    {
      title: "跟着动画做一次",
      icon: ListOrdered,
      body: "以在下标 i 插入 x 为例：先确认表未满且 0 ≤ i ≤ length，再从最后一个元素开始，把下标 i 到 length - 1 的元素依次右移一格，最后把 x 写入下标 i，并将 length 加 1。",
      items: [
        "插入必须从后往前移动。若先移动下标 i，它的值会覆盖下一格，后续元素就可能被错误复制。",
        "删除下标 i 时则相反：从下标 i + 1 开始依次左移，覆盖被删元素，再将 length 减 1。",
        "表尾插入不需要让位，表尾删除也不需要补齐空位，因此这两种情况不必移动元素。",
      ],
    },
    {
      title: "复杂度",
      icon: Gauge,
      body: "下标访问快，中间增删慢，原因正是「直接定位」与「保持连续」这两个特点。下面的 n 是当前元素个数。",
      rows: [
        { label: "按下标查询或修改", value: "O(1)" },
        { label: "表尾插入或删除", value: "O(1)" },
        { label: "一般位置插入或删除", value: "O(n)" },
        { label: "按值查找（未排序）", value: "O(n)" },
        { label: "操作所需额外空间", value: "O(1)" },
      ],
    },
    {
      title: "易错点",
      icon: TriangleAlert,
      body: "顺序表最容易混淆的是下标与长度、插入与删除的移动方向。",
      items: [
        "合法查询下标是 0 到 length - 1；合法插入位置还包括 length，因为新元素可以追加到表尾。",
        "length 是元素个数，不是最后一个元素的下标；最后一个元素的下标是 length - 1。",
        "插入前必须检查表满，删除或查询前必须检查下标有效；否则可能越界写入或读取不存在的元素。",
        "本页使用定长数组，不会自动扩容。真实工程中的动态数组扩容是另一种机制，不要与本页模型混为一谈。",
      ],
    },
  ],
  trace: ({ values, operation, index, value }) =>
    arrayTrace(values, operation, index, value),
  code: (language, operation) =>
    parseCode(templates[language][operation] ?? templates[language].insert),
};
