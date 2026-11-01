import { Route, Share2 } from "lucide-react";
import { plannedTopic, type TopicDefinition } from "../types";

/**
 * 图论算法专题：图的遍历与最短路径。
 * 这里同时承担 scene 层的 2D 节点 / 边渲染扩展。
 */
export const graphTopics: TopicDefinition[] = [
  plannedTopic({
    id: "graph-traversal",
    group: "graph",
    title: "图的遍历",
    badge: "O(V+E)",
    summary: "BFS 用队列逐层扩展，DFS 用栈一路到底再回溯。",
    icon: Share2,
    scene: "graph",
  }),
  plannedTopic({
    id: "dijkstra",
    group: "graph",
    title: "最短路径",
    badge: "Dijkstra",
    summary: "非负权图上按距离松弛，逐步确定最短路。",
    icon: Route,
    scene: "graph",
  }),
];
