import {
  ArrowDownUp,
  BookOpen,
  Split,
  Gauge,
  TriangleAlert,
} from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./quick-sort-templates";

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
      comparison: anchor === "compare" ? [items[active[0]].id, items[active[1]].id] : undefined,
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
      title: "核心思路",
      icon: BookOpen,
      body: "从区间 [low, high] 挑末尾元素 a[high] 当标尺（基准 pivot），把比它小的数拨到左边、其余留在右边，最后把基准换到交界处。这样基准就一步到位落在了最终排好序的位置，再递归排左右两边，直到子区间长度不超过 1（low >= high）。",
    },
    {
      title: "双指针怎么分区",
      icon: Split,
      body: "Lomuto 分区中，j 是向右探路的扫描指针，i 是“小于基准区”的下一个空位，基准暂存在 high：",
      items: [
        "遇到小元素收进左边：若 a[j] < pivot，交换 a[i] 与 a[j] 并令 i++；否则直接跳过。",
        "扫描中维持三段：[low, i) 全小于 pivot，[i, j) 全大于或等于 pivot，[j, high) 待扫描。",
        "基准归位与递归：j 扫到 high 时交换 a[i] 与 a[high]，基准锁死在 i，随后递归排 [low, i - 1] 和 [i + 1, high]。",
      ],
    },
    {
      title: "复杂度",
      icon: Gauge,
      body: "设元素总数为 n，当前区间长度为 m。单次分区扫一遍耗时 O(m)；若每次划分较均匀，递归约 log n 层，总时间 O(n log n)。空间仅计递归调用栈，不含动画快照。",
      rows: [
        { label: "单次分区", value: "O(m)" },
        { label: "最好 / 平均时间", value: "O(n log n)" },
        { label: "最坏时间", value: "O(n²)" },
        { label: "平衡 / 平均递归栈", value: "O(log n)" },
        { label: "最坏递归栈", value: "O(n)" },
      ],
    },
    {
      title: "易错点与退化取舍",
      icon: TriangleAlert,
      body: "本演示固定选末尾基准且原地交换，实现最简，但需注意边界与退化：",
      items: [
        "别把基准再算进去：扫描循环只到 j < high；递归区间必须跳过已归位的 i。",
        "极端退化 O(n²)：已升序（如 1, 2, 3, 4）或全相等（如 5, 5, 5, 5）时，每轮只归位 1 个端点元素。工程上常用“随机选基准”或“三路分区”避免。",
        "不稳定性：跨位置交换可能改变相等元素的先后顺序；若要求稳定排序，应改用归并排序。",
      ],
    },
  ],
  trace: ({ values }) => quickSortTrace(values),
  code: (language) => parseCode(templates[language]),
};
