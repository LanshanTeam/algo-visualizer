import { GitFork, Workflow } from "lucide-react";
import { plannedTopic, type TopicDefinition } from "../types";
import { binaryTree } from "./binary-tree";
import { bst } from "./bst";
import { hashTable } from "./hash-table";

/**
 * 树与散列专题：哈希表、二叉树、BST、堆、并查集。
 * 哈希表、二叉树与 BST 已接入；堆与并查集仍待实现。
 */
export const treeHashTopics: TopicDefinition[] = [
  hashTable,
  binaryTree,
  bst,
  plannedTopic({
    id: "heap",
    group: "tree-hash",
    title: "二叉堆",
    badge: "O(log n)",
    summary: "完全二叉树的上浮与下沉，是优先队列的实现基础。",
    icon: Workflow,
    scene: "tree",
  }),
  plannedTopic({
    id: "union-find",
    group: "tree-hash",
    title: "并查集",
    badge: "近 O(1)",
    summary: "按秩合并与路径压缩，快速判断集合连通性。",
    icon: GitFork,
    scene: "tree",
  }),
];
