import { ArrowDownUp } from "lucide-react";
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
    { title: "暂存、右移与插入", body: "从第二项开始暂存当前值，留下空位。逐个将左侧较大元素右移，最后将暂存项填入空位；不是相邻交换。" },
    { title: "有序前缀与稳定性", body: "每轮开始时 [0, i) 已有序，但其中元素不一定处于最终位置。只右移严格大于暂存值的元素，相等元素不越过彼此，因此排序稳定。" },
    { title: "复杂度", body: "最好时间 O(n)（已经有序），平均与最坏 O(n²)；算法额外空间 O(1)，适合小数组或近乎有序的数据。可视化快照的存储不计入算法空间。" },
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
