import { ArrowDownUp } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame, Item } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./merge-sort-templates";

export const mergeSort: ReadyTopic = {
  id: "merge-sort", group: "sorting-searching", title: "归并排序", badge: "O(n log n)",
  summary: "自顶向下递归拆分，借助辅助数组稳定合并两个有序区间。",
  status: "ready", scene: "array", icon: ArrowDownUp,
  controls: { dataLabel: "数组", defaultValues: [38, 16, 54, 27, 8, 42, 23] },
  legend: [
    { label: "当前比较 / 读取", tone: "active" },
    { label: "主数组 / 辅助数组", tone: "idle" },
    { label: "排序完成", tone: "settled" },
  ],
  theory: [
    { title: "分治与调用栈", body: "将闭区间 [low, high] 拆分成左右两半，先递归排序左半，再排序右半，长度不超过 1 时返回。调用栈展示当前尚未完成的区间。" },
    { title: "辅助数组与稳定合并", body: "比较两个有序区间的首项，将较小项逐个写入辅助数组；相等时优先取左侧，保持稳定。某侧耗尽后继续取另一侧，区间合并完成才整体写回。画布清空已写回的辅助槽以突出下一次合并。" },
    { title: "复杂度", body: "最好、平均、最坏时间均为 O(n log n)。辅助数组 O(n)，递归栈 O(log n)，总额外空间 O(n)；此实现稳定但不是原地排序。可视化快照不计入算法空间。" },
  ],
  trace: ({ values }) => mergeSortTrace(values),
  code: language => parseCode(templates[language]),
};

export function mergeSortTrace(values: number[]): Frame[] {
  const items = values.map((value, id) => ({ id, value }));
  const auxiliary: (Item | null)[] = values.map(() => null);
  const frames: Frame[] = [];
  const stack: string[] = [];
  function emit(anchor: string, narration: string, low?: number, high?: number, pointers: Record<string, number> = {}, variables: Frame["variables"] = {}) {
    frames.push({
      items: items.map(item => ({ ...item })),
      auxiliary: { label: "辅助数组", slots: auxiliary.map(item => item ? { ...item } : null) },
      range: low !== undefined && high !== undefined ? { low, high } : undefined,
      anchor, narration, pointers, active: anchor === "start" ? [] : Object.values(pointers),
      settled: anchor === "done" ? items.map((_, index) => index) : [],
      variables, stack: [...stack],
    });
  }
  emit("start", "自顶向下拆分区间，借助辅助数组稳定合并。", 0, items.length - 1, items.length ? { low: 0, high: items.length - 1 } : {});
  function sort(low: number, high: number) {
    if (low > high) return;
    stack.push(`[${low}, ${high}]`);
    if (low === high) {
      emit("base", "区间只有一个元素，直接返回。", low, high);
      stack.pop();
      return;
    }
    const mid = Math.floor((low + high) / 2);
    emit("split", `拆分为 [${low}, ${mid}] 和 [${mid + 1}, ${high}]。`, low, high, { mid }, { low, mid, high });
    emit("left", "递归排序左半区间。", low, high);
    sort(low, mid);
    emit("right", "左半区间已排序，递归排序右半区间。", low, high);
    sort(mid + 1, high);
    let i = low;
    let j = mid + 1;
    emit("merge", "两半区间均有序，依次选择较小元素写入辅助数组。", low, high, { i, j }, { low, mid, high });
    for (let k = low; k <= high; k++) {
      const pointers: Record<string, number> = {};
      if (i <= mid) pointers.i = i;
      if (j <= high) pointers.j = j;
      emit("compare", i > mid ? "左半已耗尽，从右半取值。" : j > high ? "右半已耗尽，从左半取值。" : "比较左右首项；相等时优先取左侧以保持稳定。", low, high, pointers, { i, j, k, low, mid, high });
      const source = i <= mid && (j > high || items[i].value <= items[j].value) ? i++ : j++;
      auxiliary[k] = items[source];
      emit("write", `将 ${items[source].value} 写入辅助数组位置 ${k}，主数组暂不改变。`, low, high, { source }, { i, j, k, low, mid, high });
    }
    for (let k = low; k <= high; k++) {
      items[k] = auxiliary[k]!;
      auxiliary[k] = null;
    }
    emit("copy", `辅助数组中的 [${low}, ${high}] 已合并，整体写回主数组并清空辅助区。`, low, high);
    stack.pop();
  }
  sort(0, items.length - 1);
  emit("done", "排序完成，调用栈清空，相等元素保持原有次序。");
  return frames;
}
