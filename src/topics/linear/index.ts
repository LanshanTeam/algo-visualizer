import { Boxes, Layers, ListOrdered } from "lucide-react";
import { plannedTopic, type TopicDefinition } from "../types";
import { linkedList } from "./linked-list";

/**
 * 一维线性结构专题：数组、链表、栈、队列。
 * 把 `plannedTopic(...)` 换成同名模块导出的 ready 定义即可上线。
 */
export const linearTopics: TopicDefinition[] = [
  plannedTopic({
    id: "array",
    group: "linear",
    title: "顺序表（数组）",
    badge: "O(1)",
    summary: "连续内存与随机访问；插入删除需要成段移动元素。",
    icon: Boxes,
  }),
  linkedList,
  plannedTopic({
    id: "stack",
    group: "linear",
    title: "栈",
    badge: "LIFO",
    summary: "只在一端压入和弹出，后进先出。",
    icon: Layers,
  }),
  plannedTopic({
    id: "queue",
    group: "linear",
    title: "队列",
    badge: "FIFO",
    summary: "队尾入队、队头出队，先进先出。",
    icon: ListOrdered,
  }),
];
