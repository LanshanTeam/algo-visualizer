import { ArrowDownUp, BookOpen, Gauge, ScanLine, TriangleAlert } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./selection-sort-templates";

export function selectionSortTrace(values: number[]): Frame[] {
  const items = values.map((value, id) => ({ id, value }));
  const frames: Frame[] = [];
  const settled: number[] = [];
  function emit(anchor: string, narration: string, pointers: Record<string, number> = {}, active: number[] = [], variables: Frame["variables"] = {}) {
    frames.push({ comparison: anchor === "compare" ? [items[active[0]].id, items[active[1]].id] : undefined, items: items.map((item) => ({ ...item })), active, settled: [...settled], pointers: anchor === "start" && items.length ? { low: 0, high: items.length - 1 } : pointers, range: anchor === "start" ? { low: 0, high: items.length - 1 } : undefined, anchor, narration, variables, stack: [] });
  }
  emit("start", "每轮扫描未排序区间，选出最小值放到区间首位。");
  for (let i = 0; i < items.length - 1; i++) {
    let min = i;
    emit("pass", `开始选择索引 ${i} 的元素，暂以当前首位为最小值。`, { i, min }, [i], { low: i, high: items.length - 1, i, min });
    for (let j = i + 1; j < items.length; j++) {
      emit("compare", `比较 ${items[j].value} 与当前最小值 ${items[min].value}。`, { i, j, min }, [j, min], { low: i, high: items.length - 1, i, j, min });
      if (items[j].value < items[min].value) {
        min = j;
        emit("minimum", `找到更小值 ${items[min].value}，更新最小值索引。`, { i, j, min }, [min], { low: i, high: items.length - 1, i, j, min });
      }
    }
    if (min !== i) {
      [items[i], items[min]] = [items[min], items[i]];
      emit("swap", `扫描完成，交换索引 ${i} 与 ${min}，将最小值放到首位。`, { i, min }, [i, min], { low: i, high: items.length - 1, i, min });
    }
    settled.push(i);
    emit("settle", `索引 ${i} 已归位，左侧有序区间扩大。`, { i }, [i], { low: i, high: items.length - 1, i });
  }
  if (items.length) settled.push(items.length - 1);
  emit("done", "排序完成，所有元素按升序排列。");
  return frames;
}

export const selectionSort: ReadyTopic = {
  id: "selection-sort", group: "sorting-searching", title: "选择排序",
  badge: "O(n²)", summary: "每轮找到剩余元素中的最小值，与未排序区间首位交换。",
  status: "ready", scene: "array", icon: ArrowDownUp,
  controls: { dataLabel: "数组", defaultValues: [38, 16, 54, 27, 8, 42, 23] },
  legend: [{ label: "当前比较", tone: "active" }, { label: "未处理", tone: "idle" }, { label: "已归位", tone: "settled" }],
  theory: [
    {
      title: "核心思路",
      icon: BookOpen,
      body: "选择排序将数组划分为已排序前缀 [0, i) 与未排序后缀 [i, n)。第 i 轮从后缀中选出最小元素，与 a[i] 交换；交换后位置 i 的元素处于最终排序位置，已排序前缀扩大一位。",
      items: [
        "i 是当前待归位位置；min 保存当前已扫描部分的最小元素下标。",
        "每轮扫描完成前只更新 min，不移动数组元素；扫描结束后至多交换一次。",
        "当 i 达到 n - 1 时，前 n - 1 个位置均已归位，最后一个位置也随之确定。",
      ],
    },
    {
      title: "循环不变量与选择规则",
      icon: ScanLine,
      body: "每轮开始时，前缀 [0, i) 已按非递减顺序排列，且其中元素均不大于后缀 [i, n) 的元素。扫描过程中，a[min] 是 [i, j) 中的最小值。扫描结束时 min 是整个后缀的最小值下标；交换后不变量扩展至 [0, i + 1)。",
      items: [
        "初始化 min = i；j 从 i + 1 扫描到 n - 1。若 a[j] < a[min]，更新 min = j。",
        "扫描过程中保持 [i, j] 中 a[min] 为最小值；相等时不更新，因此 min 指向最先遇到的最小值。",
        "仅在扫描结束后交换 a[i] 与 a[min]；min = i 时该交换可省略。",
      ],
    },
    {
      title: "复杂度",
      icon: Gauge,
      body: "第 i 轮比较 n - i - 1 次，总比较次数固定为 (n - 1) + ... + 1。初始数据是否有序不会减少扫描量；交换次数至多为 n - 1。",
      rows: [
        { label: "最好时间", value: "O(n²)" },
        { label: "平均时间", value: "O(n²)" },
        { label: "最坏时间", value: "O(n²)" },
        { label: "比较次数", value: "n(n - 1) / 2" },
        { label: "最多交换次数", value: "n - 1" },
        { label: "额外空间", value: "O(1)" },
      ],
    },
    {
      title: "易错点与性质",
      icon: TriangleAlert,
      body: "每轮完成后仅 a[i] 可确认处于最终位置；扫描过程中的 min 只是当前候选最小值下标。",
      items: [
        "min 保存下标而非元素值；比较 a[j] 与 a[min]，更新时赋值 min = j。",
        "交换后只能将边界从 i 移至 i + 1；后缀 [i + 1, n) 仍未整体排序。",
        "选择最小值后进行的远距离交换可改变相等元素的相对顺序，因此标准选择排序不稳定。",
      ],
    },
  ],
  trace: ({ values }) => selectionSortTrace(values),
  code: (language) => parseCode(templates[language]),
};
