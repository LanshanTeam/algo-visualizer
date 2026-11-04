import { ArrowDownUp } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./bubble-sort-templates";

export function bubbleSortTrace(values: number[]): Frame[] {
  const items = values.map((value, id) => ({ id, value }));
  const frames: Frame[] = [];
  const settled: number[] = [];
  function emit(anchor: string, narration: string, pointers: Record<string, number> = {}, active: number[] = [], variables: Frame["variables"] = {}) {
    frames.push({ items: items.map((item) => ({ ...item })), active, settled: [...settled], pointers: anchor === "start" && items.length ? { low: 0, high: items.length - 1 } : pointers, range: anchor === "start" ? { low: 0, high: items.length - 1 } : undefined, anchor, narration, variables, stack: [] });
  }
  emit("start", "从左到右比较相邻元素，将较大的元素逐步移到右侧。");
  for (let end = items.length - 1; end > 0; end--) {
    let swapped = false;
    emit("pass", `开始一轮冒泡，本轮终点为 ${end}。`, { end }, [], { low: 0, high: end });
    for (let j = 0; j < end; j++) {
      emit("compare", `比较相邻值 ${items[j].value} 和 ${items[j + 1].value}。`, { j, next: j + 1 }, [j, j + 1], { low: 0, high: end, j });
      if (items[j].value > items[j + 1].value) {
        [items[j], items[j + 1]] = [items[j + 1], items[j]];
        swapped = true;
        emit("swap", "左侧值较大，交换相邻元素。", { j, next: j + 1 }, [j, j + 1], { low: 0, high: end, j });
      }
    }
    settled.push(end);
    emit("settle", `本轮最大值已归位到索引 ${end}。`, { end }, [end], { low: 0, high: end });
    if (!swapped) {
      emit("early", "本轮没有交换，剩余区间已经有序，提前结束。", {}, [], { low: 0, high: end, swapped: "否" });
      break;
    }
  }
  for (let i = 0; i < items.length; i++) if (!settled.includes(i)) settled.push(i);
  emit("done", "排序完成，所有元素按升序排列。");
  return frames;
}

export const bubbleSort: ReadyTopic = {
  id: "bubble-sort", group: "sorting-searching", title: "冒泡排序",
  badge: "O(n²)", summary: "比较相邻元素并交换，让每轮最大值逐步冒到右端。",
  status: "ready", scene: "array", icon: ArrowDownUp,
  controls: { dataLabel: "数组", defaultValues: [38, 16, 54, 27, 8, 42, 23] },
  legend: [{ label: "相邻比较", tone: "active" }, { label: "未处理", tone: "idle" }, { label: "已归位", tone: "settled" }],
  theory: [
    { title: "相邻交换", body: "从左到右比较相邻值，仅在左侧严格大于右侧时交换。每轮将剩余区间的最大值送到末尾，下一轮缩短右边界。" },
    { title: "稳定性", body: "相等元素不交换，因此它们的相对顺序保持不变，冒泡排序是稳定排序。" },
    { title: "提前退出与复杂度", body: "一轮没有交换即可提前退出，已有序时最好时间 O(n)；平均与最坏时间 O(n²)，额外空间 O(1)。帧快照占用不计入算法空间。" },
  ],
  trace: ({ values }) => bubbleSortTrace(values),
  code: (language) => parseCode(templates[language]),
};
