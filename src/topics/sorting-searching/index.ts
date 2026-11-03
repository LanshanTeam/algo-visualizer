import type { TopicDefinition } from "../types";
import { binarySearch } from "./binary-search";
import { bubbleSort } from "./bubble-sort";
import { selectionSort } from "./selection-sort";
import { insertionSort } from "./insertion-sort";
import { mergeSort } from "./merge-sort";
import { quickSort } from "./quick-sort";

/** 排序与搜索专题，顺序即侧边栏顺序。 */
export const sortingSearchingTopics: TopicDefinition[] = [
  binarySearch,
  bubbleSort,
  selectionSort,
  insertionSort,
  mergeSort,
  quickSort,
];
