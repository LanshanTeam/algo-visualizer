import { GitFork } from "lucide-react";
import { plannedTopic, type TopicDefinition } from "../types";
import { binaryTree } from "./binary-tree";
import { bst } from "./bst";
import { hashTable } from "./hash-table";
import { heap } from "./heap";

/**
 * 树与散列专题：哈希表、二叉树、BST、堆、并查集。
 * 哈希表、二叉树、BST 与堆已接入；并查集仍待实现。
 */
export const treeHashTopics: TopicDefinition[] = [
  hashTable,
  binaryTree,
  bst,
  heap,
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
