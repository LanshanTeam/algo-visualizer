import { ArrowDownUp, BookOpen, Gauge, ScanLine, TriangleAlert } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame, Item } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./insertion-sort-templates";

export const insertionSort: ReadyTopic = {
  id: "insertion-sort", group: "sorting-searching", title: "插入排序", badge: "O(n²)",
  summary: "暂存当前元素，将有序前缀中的较大元素逐个右移，再填入空位。",
  status: "ready", scene: "array", icon: ArrowDownUp,
  controls: { dataLabel: "数组", defaultValues: [38, 16, 54, 27, 8, 42, 23] },
  legend: [
    { label: "当前比较 / 移动", tone: "active" },
    { label: "未归位", tone: "idle" },
    { label: "排序完成", tone: "settled" },
  ],
  theory: [
    {
      title: "核心思路",
      icon: BookOpen,
      body: "插入排序按原数组次序逐个处理元素，并维护已排序前缀。第 i 轮先将 a[i] 保存为 key，再在 [0, i) 中寻找插入位置；将所有严格大于 key 的元素向右移动一位，最后把 key 写入空出的下标。",
      items: [
        "第 i 轮处理前，[0, i) 是已排序前缀，[i, n) 是尚未处理后缀。",
        "暂存 key 后，数组中的移动不会丢失待插入值；空位由 i 向左移动。",
        "第 i 轮结束后，[0, i + 1) 按非递减顺序排列。",
      ],
    },
    {
      title: "循环不变量与移动条件",
      icon: ScanLine,
      body: "第 i 轮开始时，[0, i) 已按非递减顺序排列。j 从 i - 1 向 0 递减；当 j >= 0 且 a[j] > key 时，执行 a[j + 1] = a[j]。循环停止后，j + 1 是 key 的唯一插入位置。",
      items: [
        "初始前缀 [0, 1) 只含首元素，因此外层循环从 i = 1 开始。",
        "循环条件必须同时检查 j >= 0 与 a[j] > key，避免越界并保留相等元素顺序。",
        "右移范围是从 i - 1 到插入位置的连续后缀；不得使用交换替代右移。",
      ],
    },
    {
      title: "复杂度",
      icon: Gauge,
      body: "每轮的比较和移动次数由 key 在有序前缀中的位置决定。已有序输入时每轮只需一次边界比较；逆序输入时第 i 轮需移动 i 个元素。",
      rows: [
        { label: "最好时间（已有序）", value: "O(n)" },
        { label: "平均时间", value: "O(n²)" },
        { label: "最坏时间（逆序）", value: "O(n²)" },
        { label: "额外空间", value: "O(1)" },
      ],
    },
    {
      title: "易错点与性质",
      icon: TriangleAlert,
      body: "插入操作由暂存、连续右移和写入 key 构成。其正确性依赖移动条件、下标边界和写入位置一致。",
      items: [
        "先保存 key，再按递减下标右移；若先覆盖 a[i]，待插入值将丢失。",
        "右移后写入位置为 j + 1；循环结束时不能误写到 j 或 i。",
        "比较使用严格大于；相等元素不右移，所以该实现稳定。",
      ],
    },
  ],
  trace: ({ values }) => insertionSortTrace(values),
  code: language => parseCode(templates[language]),
};

export function insertionSortTrace(values: number[]): Frame[] {
  let items = values.map((value, id) => ({ id, value }));
  const slots: (Item | null)[] = [...items];
  let held: Item | undefined;
  const frames: Frame[] = [];
  function emit(anchor: string, narration: string, i?: number, j?: number) {
    const pointers: Record<string, number> = {};
    if (i !== undefined) pointers.i = i;
    if (j !== undefined && j >= 0) pointers.j = j;
    frames.push({
      items: items.map(item => ({ ...item })),
      arraySlots: slots.map(item => item ? { ...item } : null),
      held: held ? { ...held } : undefined,
      comparison: anchor === "compare" && held && j !== undefined && slots[j]
        ? [slots[j]!.id, held.id] : undefined,
      anchor, narration, pointers: anchor === "start" && items.length ? { low: 0, high: items.length - 1 } : pointers,
      range: anchor === "start" ? { low: 0, high: items.length - 1 } : undefined,
      active: Object.values(pointers),
      settled: anchor === "done" ? items.map((_, index) => index) : [],
      variables: { ...(i !== undefined ? { i } : {}), ...(j !== undefined ? { j, hole: j + 1 } : {}), ...(held ? { key: held.value } : {}) },
      stack: [],
    });
  }
  emit("start", "左侧前缀保持有序，依次将后续元素插入其中。");
  for (let i = 1; i < items.length; i++) {
    held = slots[i]!;
    slots[i] = null;
    let j = i - 1;
    emit("hold", `暂存 ${held.value}，位置 ${i} 留下空位。`, i, j);
    while (j >= 0) {
      emit("compare", `比较 ${slots[j]!.value} 与暂存值 ${held.value}；相等时不移动。`, i, j);
      if (slots[j]!.value <= held.value) break;
      slots[j + 1] = slots[j];
      slots[j] = null;
      j--;
      emit("shift", `将 ${slots[j + 2]!.value} 右移一格，空位向左移动。`, i, j);
    }
    slots[j + 1] = held;
    held = undefined;
    items = slots.map(item => item!);
    emit("insert", `将暂存元素放入位置 ${j + 1}，有序前缀扩大。`, i, j);
  }
  emit("done", "排序完成，所有元素按升序排列，相等元素保持原有次序。");
  return frames;
}
