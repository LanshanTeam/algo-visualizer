import { ArrowDownUp } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame, Language } from "../../core/types";
import type { ReadyTopic } from "../types";

const templates: Record<Language, string> = {
  C: `void quickSort(int a[], int low, int high) { // @start
  if (low >= high) return; // @base
  int pivot = a[high]; // @pivot
  int i = low;
  for (int j = low; j < high; j++) {
    if (a[j] < pivot) { // @compare
      int temp = a[i]; a[i] = a[j]; a[j] = temp; // @swap
      i++; // @advance
    }
  }
  int temp = a[i]; a[i] = a[high]; a[high] = temp; // @place
  quickSort(a, low, i - 1); // @recurse
  quickSort(a, i + 1, high);
} // @done`,
  Python: `def quick_sort(a, low, high): # @start
    if low >= high: return # @base
    pivot = a[high] # @pivot
    i = low
    for j in range(low, high):
        if a[j] < pivot: # @compare
            a[i], a[j] = a[j], a[i] # @swap
            i += 1 # @advance
    a[i], a[high] = a[high], a[i] # @place
    quick_sort(a, low, i - 1) # @recurse
    quick_sort(a, i + 1, high)
# @done`,
  "C++": `void quickSort(vector<int>& a, int low, int high) { // @start
  if (low >= high) return; // @base
  int pivot = a[high]; // @pivot
  int i = low;
  for (int j = low; j < high; ++j) {
    if (a[j] < pivot) { // @compare
      std::swap(a[i], a[j]); // @swap
      ++i; // @advance
    }
  }
  std::swap(a[i], a[high]); // @place
  quickSort(a, low, i - 1); // @recurse
  quickSort(a, i + 1, high);
} // @done`,
  Go: `func quickSort(a []int, low, high int) { // @start
    if low >= high { return } // @base
    pivot := a[high] // @pivot
    i := low
    for j := low; j < high; j++ {
        if a[j] < pivot { // @compare
            a[i], a[j] = a[j], a[i] // @swap
            i++ // @advance
        }
    }
    a[i], a[high] = a[high], a[i] // @place
    quickSort(a, low, i - 1) // @recurse
    quickSort(a, i + 1, high)
} // @done`,
  Rust: `fn quick_sort(a: &mut [i32]) { // @start
    if a.len() <= 1 { return; } // @base
    let high = a.len() - 1;
    let pivot = a[high]; // @pivot
    let mut i = 0;
    for j in 0..high {
        if a[j] < pivot { // @compare
            a.swap(i, j); // @swap
            i += 1; // @advance
        }
    }
    a.swap(i, high); // @place
    let (left, right) = a.split_at_mut(i);
    quick_sort(left); // @recurse
    quick_sort(&mut right[1..]);
} // @done`,
};

export function quickSortTrace(values: number[]): Frame[] {
  const items = values.map((value, id) => ({ id, value }));
  const frames: Frame[] = [];
  const settled: number[] = [];
  const stack: string[] = [];
  function emit(
    anchor: string,
    narration: string,
    pointers: Record<string, number> = {},
    active: number[] = [],
    variables: Frame["variables"] = {},
  ) {
    frames.push({
      items: items.map((item) => ({ ...item })),
      anchor,
      narration,
      pointers,
      active,
      variables,
      settled: [...settled],
      stack: [...stack],
    });
  }
  emit(
    "start",
    values.length > 1
      ? "从 low 到 high，对当前区间进行分区。"
      : "区间长度不超过 1，无需分区。",
    values.length ? { low: 0, high: values.length - 1 } : {},
    [],
    { low: 0, high: values.length - 1 },
  );
  function sort(low: number, high: number) {
    if (low > high) return;
    if (low === high) {
      settled.push(low);
      emit("base", "区间只有一个元素，无需排序。", {}, [low]);
      return;
    }
    stack.push(`[${low}, ${high}]`);
    const pivot = items[high].value;
    let i = low;
    emit(
      "pivot",
      `以 ${pivot} 为基准，i 标记下一个较小元素的位置。`,
      { i, pivot: high },
      [high],
      { low, high, pivot, i },
    );
    for (let j = low; j < high; j++) {
      emit(
        "compare",
        `比较 ${items[j].value} 与基准 ${pivot}。`,
        { i, j, pivot: high },
        [j, high],
        { low, high, pivot, i, j },
      );
      if (items[j].value < pivot) {
        [items[i], items[j]] = [items[j], items[i]];
        emit(
          "swap",
          i === j
            ? `位置 ${i} 已在较小元素区间，保持原位。`
            : `将较小元素移到左侧分区，交换位置 ${i} 和 ${j}。`,
          { i, j, pivot: high },
          [i, j],
          { low, high, pivot, i, j },
        );
        i++;
        emit(
          "advance",
          "左侧分区扩大，i 向右移动。",
          { i, j, pivot: high },
          [],
          { low, high, pivot, i, j },
        );
      }
    }
    [items[i], items[high]] = [items[high], items[i]];
    settled.push(i);
    emit("place", `基准 ${pivot} 归位到索引 ${i}。`, { pivot: i }, [i], {
      low,
      high,
      pivot,
      i,
    });
    emit("recurse", "分别排序基准左侧和右侧的子区间。", {}, [], {
      low,
      high,
      i,
    });
    sort(low, i - 1);
    sort(i + 1, high);
    stack.pop();
  }
  sort(0, items.length - 1);
  emit("done", "排序完成，所有元素按升序排列。");
  return frames;
}

export const quickSort: ReadyTopic = {
  id: "quick-sort",
  group: "sorting-searching",
  title: "快速排序",
  badge: "O(n log n)",
  summary: "以末尾元素为基准做 Lomuto 分区，再递归排序两侧。",
  status: "ready",
  scene: "array",
  icon: ArrowDownUp,
  controls: {
    dataLabel: "数组",
    defaultValues: [38, 16, 54, 27, 8, 42, 23],
  },
  legend: [
    { label: "当前操作", tone: "active" },
    { label: "未处理", tone: "idle" },
    { label: "基准", tone: "pivot" },
    { label: "已归位", tone: "settled" },
  ],
  theory: [
    {
      title: "分区与递归",
      body: "以末尾元素为基准，将较小元素移到左侧。基准归位后，递归排序两侧，直到区间长度不超过 1。",
    },
    {
      title: "分区不变量",
      body: "Lomuto 分区中，[low, i) 均小于基准，[i, j) 均不小于基准。扫描结束后交换 a[i] 与基准。",
    },
    {
      title: "复杂度",
      body: "平均时间 O(n log n)，最坏 O(n²)；平均递归空间 O(log n)，最坏 O(n)。此实现不稳定，有序或重复值较多时可能退化。",
    },
  ],
  trace: ({ values }) => quickSortTrace(values),
  code: (language) => parseCode(templates[language]),
};
