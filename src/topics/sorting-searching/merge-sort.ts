import { ArrowDownUp, BookOpen, Gauge, ScanLine, TriangleAlert } from "lucide-react";
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
    {
      title: "核心思路",
      icon: BookOpen,
      body: "归并排序采用分治策略。对长度大于 1 的区间，将其划分为两个连续且不重叠的子区间，递归排序后再合并；长度为 0 或 1 的区间作为递归基例。合并使用辅助数组暂存结果，再写回原区间。",
      items: [
        "输入区间为 [low, high]，长度为 high - low + 1。",
        "划分保持原元素集合不变；左右子区间并集等于原区间，交集为空。",
        "每层递归将问题规模近似减半，直至到达基例。",
      ],
    },
    {
      title: "递归关系与合并不变量",
      icon: ScanLine,
      body: "本实现取 mid = floor((low + high) / 2)，递归处理 [low, mid] 与 [mid + 1, high]。合并时，i 和 j 分别指向左右有序子区间中首个未处理元素，k 指向辅助数组中的下一个写入位置。",
      items: [
        "合并不变量：辅助区间 [low, k) 已按非递减顺序排列，且由两个子区间中最小的 k - low 个元素组成。",
        "当 i <= mid 且 j <= high 时比较 a[i] 与 a[j]；一侧耗尽后，顺序复制另一侧的剩余元素。",
        "仅在 [low, high] 全部写入辅助数组后执行整体写回；本实现写回后清空对应辅助槽位。",
      ],
    },
    {
      title: "复杂度",
      icon: Gauge,
      body: "递归树约有 log n 层，每层合并的总处理量为 n，因此各层工作量之和为 O(n log n)。递归深度为 O(log n)；辅助数组容量与输入长度成正比。",
      rows: [
        { label: "最好时间", value: "O(n log n)" },
        { label: "平均时间", value: "O(n log n)" },
        { label: "最坏时间", value: "O(n log n)" },
        { label: "辅助数组", value: "O(n)" },
        { label: "递归调用栈", value: "O(log n)" },
        { label: "总额外空间", value: "O(n)" },
      ],
    },
    {
      title: "易错点与性质",
      icon: TriangleAlert,
      body: "正确性依赖两项条件：划分完整覆盖原区间且子区间互不重叠；合并阶段按序读取两个已排序子区间的全部元素。",
      items: [
        "左右边界必须是 [low, mid] 和 [mid + 1, high]；边界偏移会造成元素遗漏或重复处理。",
        "两侧键值相等时先取左侧，保留相等元素的原始相对次序，因此本实现稳定。",
        "写回前不得清空或覆盖仍需读取的辅助值；使用 O(n) 辅助空间，因此不是原地排序。",
      ],
    },
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
      comparison: anchor === "compare" && pointers.i !== undefined && pointers.j !== undefined
        ? [items[pointers.i].id, items[pointers.j].id] : undefined,
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
