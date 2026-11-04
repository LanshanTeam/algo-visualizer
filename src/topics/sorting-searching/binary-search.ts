import { Search } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./binary-search-templates";
import { binarySearchTheory } from "./binary-search-theory";

export function binarySearchTrace(values: number[], target: number): Frame[] {
  if (!Number.isInteger(target) || target < -999 || target > 999) {
    throw new Error("目标值必须是整数，范围为 -999 到 999。");
  }
  if (values.some((value, index) => index > 0 && value < values[index - 1])) {
    throw new Error("二分搜索要求数组按升序（非递减）排列。");
  }
  const frames: Frame[] = [];
  let low = 0;
  let high = values.length - 1;
  const emit = (anchor: string, narration: string, mid?: number, result = -1) => {
    const pointers: Record<string, number> = {};
    if (low <= high) {
      pointers.low = low;
      pointers.high = high;
    }
    if (mid !== undefined) pointers.mid = mid;
    frames.push({
      items: values.map((value, id) => ({ id, value })),
      active: mid === undefined ? [] : [mid],
      settled: result < 0 ? [] : [result],
      pointers, anchor, narration,
      variables: { low, high, target, result, ...(mid === undefined ? {} : { mid }) },
      stack: [],
    });
  };
  emit("start", `在升序数组中查找目标 ${target}，使用闭区间 [low, high]。`);
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    emit("mid", `取中点 ${mid}，中点值为 ${values[mid]}。`, mid);
    if (values[mid] === target) {
      emit("found", `找到目标 ${target}，返回索引 ${mid}；重复值返回任意匹配。`, mid, mid);
      return frames;
    }
    emit("compare", `比较中点值 ${values[mid]} 与目标 ${target}，确定搜索方向。`, mid);
    if (values[mid] < target) {
      low = mid + 1;
      emit("right", "中点值较小，舍弃中点及左半区间。");
    } else {
      high = mid - 1;
      emit("left", "中点值较大，舍弃中点及右半区间。");
    }
  }
  emit("missing", "搜索区间为空，未找到目标，返回 -1。");
  return frames;
}

export const binarySearch: ReadyTopic = {
  id: "binary-search", group: "sorting-searching", title: "二分搜索",
  badge: "O(log n)", summary: "在升序数组中比较中点，每次排除一半候选区间。",
  status: "ready", scene: "array", icon: Search,
  controls: { dataLabel: "升序数组", sorted: true, defaultValues: [2, 5, 8, 12, 16, 31, 38], value: { label: "目标值" } },
  legend: [{ label: "当前中点", tone: "active" }, { label: "待查找", tone: "idle" }, { label: "匹配位置", tone: "settled" }],
  theory: binarySearchTheory,
  trace: ({ values, value }) => binarySearchTrace(values, value),
  code: (language) => parseCode(templates[language]),
};
