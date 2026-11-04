import type { TheoryBlock } from "../types";
import { BookOpen, ScanLine, Gauge, TriangleAlert } from "lucide-react";

export const binarySearchTheory: readonly TheoryBlock[] = [
  {
    title: "核心思路",
    icon: BookOpen,
    body: "因为数组已经按从小到大排好序，每次直接看正中间的数，就能立刻判断目标只可能在左半边还是右半边，一步排除一半候选。本演示采用闭区间 [low, high]（初始 low = 0、high = n - 1），有重复值时命中任意一个即可返回。",
    items: [
      "有序前提：数组必须满足升序（非递减）且支持按下标 O(1) 访问；乱序数组不能直接二分。",
      "闭区间含义：low 和 high 两端都包含在待查范围内；只要 low <= high，说明还有候选元素。",
    ],
  },
  {
    title: "每轮怎么缩圈",
    icon: ScanLine,
    body: "若目标存在，它一定在当前 [low, high] 内。每轮取中点 mid = low + floor((high - low) / 2)，比较 a[mid] 与 target：",
    items: [
      "a[mid] == target：正中目标，直接返回下标 mid。",
      "a[mid] < target：中点及左半边都太小，去右边找，令 low = mid + 1。",
      "a[mid] > target：中点及右半边都太大，去左边找，令 high = mid - 1。",
      "每次未命中都会连同 mid 一起排除；当 low > high 时区间为空，返回 -1。",
    ],
  },
  {
    title: "复杂度",
    icon: Gauge,
    body: "设数组长度为 n（迭代实现）。每次比较砍掉一半候选，100 万个元素最多也只需比约 20 次。下表仅统计查找本身，不含演示前置的 O(n) 升序检查与动画快照。",
    rows: [
      { label: "最好查找时间（首次命中）", value: "O(1)" },
      { label: "平均 / 最坏查找时间", value: "O(log n)" },
      { label: "迭代辅助空间", value: "O(1)" },
    ],
  },
  {
    title: "常见易错点与延伸",
    icon: TriangleAlert,
    body: "写二分最怕边界差 1 或死循环，记住“闭区间怎么定，边界就怎么改”：",
    items: [
      "条件漏等号：low == high 时还剩最后 1 个候选，写成 low < high 会漏检。",
      "边界忘加减 1：a[mid] 已排除，必须写 mid + 1 或 mid - 1；写成 low = mid 可能死循环。",
      "中点防溢出：固定位宽整数下 (low + high) / 2 可能相加溢出，优先写 low + (high - low) / 2。",
      "场景与延伸：适合“一次排序、多次查询”；若要找重复值的第一个/最后一个，或求解满足单调性的“二分答案”，命中后继续收缩单侧边界即可。",
    ],
  },
];
