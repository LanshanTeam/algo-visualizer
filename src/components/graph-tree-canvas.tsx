import { useId } from "react";
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { palette } from "./canvas-primitives";
import { cn } from "../lib/utils";

export type GraphTreeTone = "idle" | "active" | "settled" | "pivot" | "muted";

export interface GraphTreeNode {
  id: string | number;
  label: string;
  x: number;
  y: number;
  tone?: GraphTreeTone;
  /** Optional secondary value, useful for Dijkstra distances or tree metadata. */
  detail?: string;
}

export interface GraphTreeEdge {
  from: string | number;
  to: string | number;
  directed?: boolean;
  weight?: number | string;
  tone?: Extract<GraphTreeTone, "active" | "settled" | "idle">;
  dashed?: boolean;
}

export interface GraphTreeCanvasProps {
  nodes: readonly GraphTreeNode[];
  edges: readonly GraphTreeEdge[];
  width?: number;
  height?: number;
  nodeRadius?: number;
  ariaLabel?: string;
  className?: string;
  progress?: MotionValue<number>;
  previousNodes?: readonly GraphTreeNode[];
}

const colors: Record<GraphTreeTone, { stroke: string; fill: string; text: string }> = {
  idle: { ...palette.idle, text: "#e2e8f0" },
  active: { ...palette.active, text: "#bae6fd" },
  settled: { ...palette.settled, text: "#a7f3d0" },
  pivot: { ...palette.pivot, text: "#fde68a" },
  muted: { stroke: "#475569", fill: "#1b2330", text: "#64748b" },
};

function edgePath(
  edge: GraphTreeEdge,
  nodes: Map<string | number, GraphTreeNode>,
  radius: number,
) {
  const from = nodes.get(edge.from);
  const to = nodes.get(edge.to);
  if (!from || !to) return null;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const startX = from.x + ux * radius;
  const startY = from.y + uy * radius;
  const endX = to.x - ux * radius;
  const endY = to.y - uy * radius;
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const normalX = -uy * 10;
  const normalY = ux * 10;
  return {
    d: `M ${startX} ${startY} L ${endX} ${endY}`,
    x: midX + normalX,
    y: midY + normalY,
  };
}

function GraphTreeNodeView({
  node,
  previous,
  progress,
  reduced,
  nodeRadius,
}: {
  node: GraphTreeNode;
  previous: GraphTreeNode;
  progress?: MotionValue<number>;
  reduced: boolean | null;
  nodeRadius: number;
}) {
  const tone = colors[node.tone ?? "idle"];
  const staticProgress = useMotionValue(1);
  const clock = progress ?? staticProgress;
  const x = useTransform(clock, (value) => previous.x + (node.x - previous.x) * value);
  const y = useTransform(clock, (value) => previous.y + (node.y - previous.y) * value);
  return (
    <motion.g
      data-node-id={node.id}
      style={{ x, y }}
      initial={false}
      animate={{ opacity: node.tone === "muted" ? 0.4 : 1 }}
      transition={{ duration: reduced ? 0 : 0.3 }}
    >
      <circle r={nodeRadius} fill={tone.fill} stroke={tone.stroke} strokeWidth={node.tone === "active" || node.tone === "pivot" ? 3 : 2} />
      <text y="5" textAnchor="middle" fill={tone.text} fontFamily="monospace" fontSize="16">{node.label}</text>
      {node.detail !== undefined && (
        <g pointerEvents="none">
          <rect x={-18} y={nodeRadius + 5} width="36" height="17" rx="4" fill="#0f1620" opacity="0.92" />
          <text y={nodeRadius + 17} textAnchor="middle" className="fill-muted-foreground font-mono" fontSize="12">{node.detail}</text>
        </g>
      )}
    </motion.g>
  );
}

function GraphTreeEdgeView({
  edge,
  nodes,
  previousNodes,
  progress,
  nodeRadius,
  markerId,
  reduced,
}: {
  edge: GraphTreeEdge;
  nodes: Map<string | number, GraphTreeNode>;
  previousNodes: Map<string | number, GraphTreeNode>;
  progress?: MotionValue<number>;
  nodeRadius: number;
  markerId: string;
  reduced: boolean | null;
}) {
  const currentPath = edgePath(edge, nodes, nodeRadius);
  if (!currentPath) return null;
  const start = previousNodes.get(edge.from) ?? nodes.get(edge.from)!;
  const end = previousNodes.get(edge.to) ?? nodes.get(edge.to)!;
  const from = nodes.get(edge.from)!;
  const to = nodes.get(edge.to)!;
  const d = progress
    ? useTransform(progress, (value) => {
        const interpolated = new Map([
          [edge.from, { ...start, x: start.x + (from.x - start.x) * value, y: start.y + (from.y - start.y) * value }],
          [edge.to, { ...end, x: end.x + (to.x - end.x) * value, y: end.y + (to.y - end.y) * value }],
        ]);
        return edgePath(edge, interpolated, nodeRadius)?.d ?? currentPath.d;
      })
    : currentPath.d;
  const tone = colors[edge.tone ?? "idle"];
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 0.18 }}>
      <motion.path d={d} fill="none" stroke={tone.stroke} strokeWidth={edge.tone === "active" ? 3 : 2} strokeDasharray={edge.dashed ? "6 5" : undefined} markerEnd={edge.directed ? `url(#${markerId})` : undefined} />
      {edge.weight !== undefined && <text x={currentPath.x} y={currentPath.y + 2} textAnchor="middle" className="fill-muted-foreground font-mono" fontSize="12">{edge.weight}</text>}
    </motion.g>
  );
}

/** Shared two-dimensional SVG stage for graph and tree topics. */
export function GraphTreeCanvas({
  nodes,
  edges,
  width = 680,
  height = 360,
  nodeRadius = 25,
  ariaLabel = "图或树的节点与连线",
  className,
  progress,
  previousNodes,
}: GraphTreeCanvasProps) {
  const reduced = useReducedMotion();
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const previousNodeMap = new Map((previousNodes ?? nodes).map((node) => [node.id, node]));
  const markerId = `graph-tree-arrow-${useId().replace(/:/g, "")}`;

  return (
    <ScrollArea className={cn("av-stage w-full p-3", className)}>
      <svg
        data-graph-tree-stage
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto min-w-[430px] w-full"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>
        {edges.map((edge, index) => <GraphTreeEdgeView key={`${String(edge.from)}-${String(edge.to)}-${index}`} edge={edge} nodes={nodeMap} previousNodes={previousNodeMap} progress={progress} nodeRadius={nodeRadius} markerId={markerId} reduced={reduced} />)}
        {nodes.map((node) => {
          const previous = previousNodes?.find((entry) => entry.id === node.id) ?? node;
          return <GraphTreeNodeView key={node.id} node={node} previous={previous} progress={progress} reduced={reduced} nodeRadius={nodeRadius} />;
        })}
      </svg>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
