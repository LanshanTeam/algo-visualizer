import type { TopicDefinition } from "../types";
import { binaryTree } from "./binary-tree";
import { bst } from "./bst";
import { hashTable } from "./hash-table";
import { heap } from "./heap";
import { unionFind } from "./union-find";

/**
 * 树与散列专题：哈希表、二叉树、BST、堆、并查集。
 * 哈希表、二叉树、BST、堆与并查集均已接入。
 */
export const treeHashTopics: TopicDefinition[] = [
  hashTable,
  binaryTree,
  bst,
  heap,
  unionFind,
];
