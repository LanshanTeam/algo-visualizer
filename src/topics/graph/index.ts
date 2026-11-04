import { plannedTopic, type TopicDefinition } from "../types";
import { graphTraversal } from "./graph-traversal";
import { dijkstra } from "./dijkstra";

/**
 * 图论算法专题：图的遍历与最短路径。
 * 这里同时承担 scene 层的 2D 节点 / 边渲染扩展。
 */
export const graphTopics: TopicDefinition[] = [
  graphTraversal,
  dijkstra,
];
