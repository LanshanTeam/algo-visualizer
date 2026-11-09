import { BookOpen, Gauge, ListChecks, TriangleAlert } from "lucide-react";
import type { TheoryBlock } from "../types";

export const dijkstraTheory: readonly TheoryBlock[] = [
  {
    title: "核心思路",
    icon: BookOpen,
    body: "Dijkstra 用来计算一个起点到其他顶点的最短距离。开始时起点距离为 0，其余顶点为无穷大；每轮选择当前距离最小的未确定顶点，把它的距离固定下来，再用它尝试更新邻居。",
    items: [
      "dist[v] 表示目前找到的起点到 v 的最短候选距离，初始值为 ∞。",
      "选择最小未确定顶点后，它的距离已经不可能再被更短路径改写，可以标记为 settled。",
      "经过当前顶点更近时就更新邻居，这个动作叫松弛（relax）。",
    ],
  },
  {
    title: "每一步怎么走",
    icon: ListChecks,
    body: "每一轮都按相同顺序处理：先选择当前距离最小的未确定顶点，再确定它，随后扫描相邻边并尝试松弛。动画会展示每轮的候选距离变化。",
    items: [
      "选择：从未确定顶点中找到 dist 最小者。",
      "确定：把选中的顶点标记为 settled，表示当前距离已经确定。",
      "扫描并松弛：计算经过当前顶点到达邻居的新候选距离；只有新距离严格小于 dist[v] 时才更新 dist[v]。",
      "如果同一个顶点有多条候选路径，就逐一比较它们的总距离，保留更小的那一个；距离相同时可以保持原记录。",
    ],
  },
  {
    title: "复杂度",
    icon: Gauge,
    body: "当前演示使用邻接表保存边，并在线性扫描中寻找最小未确定顶点，所以每轮选择需要 O(V)，总复杂度为 O(V² + E)。使用优先队列可以把常见实现优化到 O((V + E) log V)。",
    rows: [
      { label: "当前演示：选择最小距离顶点", value: "O(V²)" },
      { label: "当前演示：扫描边", value: "O(E)" },
      { label: "当前实现总时间", value: "O(V² + E)" },
      { label: "距离、确定状态等辅助空间", value: "O(V)" },
    ],
  },
  {
    title: "易错点与适用条件",
    icon: TriangleAlert,
    body: "Dijkstra 的贪心选择依赖非负边权。只要存在负权边，已经确定的顶点仍可能被更短路径改写，算法就不再可靠。",
    items: [
      "不能把未连通顶点的 ∞ 当成普通数字继续松弛；选不到有限距离时应停止。",
      "本演示只计算并展示距离；如果还要还原完整路径，需要另外记录每次更新对应的前驱顶点。",
      "边权必须非负；需要处理负权边时，应考虑 Bellman-Ford 等算法。",
      "Dijkstra 求的是单源最短路径，不会自动给出任意两点之间的全部最短路。",
    ],
  },
];
