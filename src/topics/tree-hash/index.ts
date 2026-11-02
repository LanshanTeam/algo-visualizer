import { GitFork, Hash, Workflow } from "lucide-react";
import { plannedTopic, type TopicDefinition } from "../types";
import { binaryTree } from "./binary-tree";
import { bst } from "./bst";

/**
 * 树与散列专题：哈希表、二叉树、BST、堆、并查集。
 * 二叉树已接入 tree 布局；BST、堆与并查集仍待实现。
 */
export const treeHashTopics: TopicDefinition[] = [
  plannedTopic({
    id: "hash-table",
    group: "tree-hash",
    title: "哈希表",
    badge: "O(1)",
    summary: "哈希函数映射桶位，用链地址法或开放寻址处理冲突。",
    icon: Hash,
  }),
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
