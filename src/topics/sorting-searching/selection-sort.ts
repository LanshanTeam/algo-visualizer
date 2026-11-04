import { ArrowDownUp } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./selection-sort-templates";

export function selectionSortTrace(values: number[]): Frame[] {
  const items = values.map((value, id) => ({ id, value }));
  const frames: Frame[] = [];
  const settled: number[] = [];
  function emit(anchor: string, narration: string, pointers: Record<string, number> = {}, active: number[] = [], variables: Frame["variables"] = {}) {
    frames.push({ items: items.map((item) => ({ ...item })), active, settled: [...settled], pointers: anchor === "start" && items.length ? { low: 0, high: items.length - 1 } : pointers, range: anchor === "start" ? { low: 0, high: items.length - 1 } : undefined, anchor, narration, variables, stack: [] });
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
    { title: "每轮选择最小值", body: "令 i 指向未排序区间首位，min 记录扫描到的最小值索引。扫描完成后仅交换一次；若最小值已经在 i，则无需交换。" },
    { title: "有序前缀与稳定性", body: "每轮结束后 [0, i] 是最终有序前缀。远距离交换可能改变相等元素的相对顺序，因此该实现不稳定。" },
    { title: "复杂度", body: "最好、平均、最坏时间均为 O(n²)，比较次数为 n(n−1)/2，最多交换 n−1 次，额外空间 O(1)。可视化帧存储不计入算法空间。" },
  ],
  trace: ({ values }) => selectionSortTrace(values),
  code: (language) => parseCode(templates[language]),
};
