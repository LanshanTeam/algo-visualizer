import type { TopicDefinition } from "../types";
import { array } from "./array";
import { linkedList } from "./linked-list";
import { queue } from "./queue";
import { stack } from "./stack";

/**
 * 一维线性结构专题：数组、链表、栈、队列。
 * 顺序与侧边栏一致：从最基础的连续存储，到链式存储，再到受限的线性表。
 */
export const linearTopics: TopicDefinition[] = [
  array,
  linkedList,
  stack,
  queue,
];
