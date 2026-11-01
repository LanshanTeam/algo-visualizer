import { Binary, GitFork, Hash, Network, Workflow } from "lucide-react";
import { plannedTopic, type TopicDefinition } from "../types";

/**
 * 树与散列专题：哈希表、二叉树、BST、堆、并查集。
 * 树 / 堆需要 2D 布局，等 scene 层支持 `tree` 后再把 status 改成 ready。
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
  plannedTopic({
    id: "binary-tree",
    group: "tree-hash",
    title: "二叉树遍历",
    badge: "O(n)",
    summary: "前序、中序、后序与层序遍历，对比递归栈与队列。",
    icon: Network,
    scene: "tree",
  }),
  plannedTopic({
    id: "bst",
    group: "tree-hash",
    title: "二叉搜索树",
    badge: "O(log n)",
    summary: "左小右大的有序结构，支持查找、插入与三种删除情形。",
    icon: Binary,
    scene: "tree",
  }),
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
