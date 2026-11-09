import { ArrowDownUp, BookOpen, Gauge, ScanLine, TriangleAlert } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./bubble-sort-templates";

export function bubbleSortTrace(values: number[]): Frame[] {
  const items = values.map((value, id) => ({ id, value }));
  const frames: Frame[] = [];
  const settled: number[] = [];
  function emit(anchor: string, narration: string, pointers: Record<string, number> = {}, active: number[] = [], variables: Frame["variables"] = {}) {
    frames.push({ comparison: anchor === "compare" ? [items[active[0]].id, items[active[1]].id] : undefined, items: items.map((item) => ({ ...item })), active, settled: [...settled], pointers: anchor === "start" && items.length ? { low: 0, high: items.length - 1 } : pointers, range: anchor === "start" ? { low: 0, high: items.length - 1 } : undefined, anchor, narration, variables, stack: [] });
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
    {
      title: "核心思路",
      icon: BookOpen,
      body: "冒泡排序是基于相邻比较与交换的比较排序。对升序排序，每轮从左向右扫描未排序前缀，比较相邻元素 a[j] 与 a[j + 1]；当且仅当 a[j] > a[j + 1] 时交换。连续交换使本轮扫描过的最大元素移动到当前区间右端。",
      items: [
        "设 n 为数组长度，end 为当前未排序区间的右边界；本实现初始 end = n - 1。",
        "内层下标 j 从 0 扫描到 end - 1，比较范围为 [0, end]。",
        "一轮结束后，a[end] 已处于最终位置；下一轮将 end 减 1。",
      ],
    },
    {
      title: "循环不变量与提前终止",
      icon: ScanLine,
      body: "第 r 轮开始前，后缀 [end + 1, n) 已按非递减顺序排列，且其中每个元素均不小于前缀 [0, end] 的元素。完成该轮后，不变量扩展至 [end, n)。",
      items: [
        "循环条件为 j < end，保证 j + 1 不越过当前右边界。",
        "本实现用 swapped 记录整轮是否发生交换；只有完整扫描后 swapped 仍为 false，才能判定数组已有序并结束。",
        "某一次比较没有交换不构成终止条件；后续相邻元素仍可能逆序。",
      ],
    },
    {
      title: "复杂度",
      icon: Gauge,
      body: "未排序区间每轮缩短 1。未提前结束时，比较次数为 (n - 1) + (n - 2) + ... + 1；已有序输入可由交换标志在首轮后终止。",
      rows: [
        { label: "最好时间（已有序）", value: "O(n)" },
        { label: "平均时间", value: "O(n²)" },
        { label: "最坏时间", value: "O(n²)" },
        { label: "额外空间", value: "O(1)" },
      ],
    },
    {
      title: "易错点与性质",
      icon: TriangleAlert,
      body: "本实现按升序排序，且只交换严格逆序对；循环边界和比较条件共同决定正确性与稳定性。",
      items: [
        "比较上界必须是 j < end；使用 j <= end 会访问 a[end + 1]。",
        "若交换条件改成 a[j] >= a[j + 1]，相等元素也会交换，稳定性随之丧失。",
        "本实现原地交换，额外空间为 O(1)；稳定性来自相等元素不交换。",
      ],
    },
  ],
  trace: ({ values }) => bubbleSortTrace(values),
  code: (language) => parseCode(templates[language]),
};
