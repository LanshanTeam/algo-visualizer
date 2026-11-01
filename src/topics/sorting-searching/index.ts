import { ArrowDownUp, Search } from "lucide-react";
import { plannedTopic, type TopicDefinition } from "../types";
import { quickSort } from "./quick-sort";

/**
 * 成员 B 的领地：排序与搜索。
 * 全部复用 1D 数组场景，只需产出快照与代码锚点。
 */
export const sortingSearchingTopics: TopicDefinition[] = [
  plannedTopic({
    id: "binary-search",
    group: "sorting-searching",
    title: "二分搜索",
    badge: "O(log n)",
    summary: "有序数组上折半收缩搜索区间，对比线性搜索的差距。",
    icon: Search,
  }),
  plannedTopic({
    id: "bubble-sort",
    group: "sorting-searching",
    title: "冒泡排序",
    badge: "O(n²)",
    summary: "相邻比较交换，较大元素逐轮浮到末尾。",
    icon: ArrowDownUp,
  }),
  plannedTopic({
    id: "selection-sort",
    group: "sorting-searching",
    title: "选择排序",
    badge: "O(n²)",
    summary: "每轮扫描未排序区间选出最小值，交换次数最少。",
    icon: ArrowDownUp,
  }),
  plannedTopic({
    id: "insertion-sort",
    group: "sorting-searching",
    title: "插入排序",
    badge: "O(n²)",
    summary: "摸牌式插入，把较大元素依次右移腾出位置。",
    icon: ArrowDownUp,
  }),
  plannedTopic({
    id: "merge-sort",
    group: "sorting-searching",
    title: "归并排序",
    badge: "O(n log n)",
    summary: "分治划分区间，双指针合并两个有序子数组。",
    icon: ArrowDownUp,
  }),
  quickSort,
];
