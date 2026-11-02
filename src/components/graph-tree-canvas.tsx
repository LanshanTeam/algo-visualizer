import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

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
}

const colors: Record<GraphTreeTone, { stroke: string; fill: string; text: string }> = {
  idle: { stroke: "#94a3b8", fill: "#ffffff", text: "#1e293b" },
  active: { stroke: "#2563eb", fill: "#eff6ff", text: "#1e3a8a" },
  settled: { stroke: "#15803d", fill: "#f0fdf4", text: "#14532d" },
  pivot: { stroke: "#d97706", fill: "#fffbeb", text: "#78350f" },
  muted: { stroke: "#cbd5e1", fill: "#f8fafc", text: "#94a3b8" },
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

/** Shared two-dimensional SVG stage for graph and tree topics. */
export function GraphTreeCanvas({
  nodes,
  edges,
  width = 680,
  height = 360,
  nodeRadius = 25,
  ariaLabel = "图或树的节点与连线",
  className,
}: GraphTreeCanvasProps) {
  const reduced = useReducedMotion();
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const markerId = `graph-tree-arrow-${useId().replace(/:/g, "")}`;

  return (
    <ScrollArea className={className ?? "w-full"}>
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
        {edges.map((edge, index) => {
          const path = edgePath(edge, nodeMap, nodeRadius);
          if (!path) return null;
          const tone = colors[edge.tone ?? "idle"];
          return (
            <motion.g key={`${String(edge.from)}-${String(edge.to)}-${index}`} animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>
              <motion.path
                d={path.d}
                fill="none"
                stroke={tone.stroke}
                strokeWidth={edge.tone === "active" ? 3 : 2}
                strokeDasharray={edge.dashed ? "6 5" : undefined}
                markerEnd={edge.directed ? `url(#${markerId})` : undefined}
                animate={{ d: path.d, stroke: tone.stroke }}
                transition={{ duration: reduced ? 0 : 0.3 }}
              />
              {edge.weight !== undefined && (
                <g pointerEvents="none">
                  <text x={path.x} y={path.y + 2} textAnchor="middle" className="fill-muted-foreground font-mono" fontSize="12">
                    {edge.weight}
                  </text>
                </g>
              )}
            </motion.g>
          );
        })}
        {nodes.map((node) => {
          const tone = colors[node.tone ?? "idle"];
          return (
            <motion.g
              key={node.id}
              data-node-id={node.id}
              initial={false}
              animate={{ x: node.x, y: node.y, opacity: node.tone === "muted" ? 0.4 : 1 }}
              transition={{ duration: reduced ? 0 : 0.3 }}
            >
              <circle r={nodeRadius} fill={tone.fill} stroke={tone.stroke} strokeWidth={node.tone === "active" || node.tone === "pivot" ? 3 : 2} />
              <text y="5" textAnchor="middle" fill={tone.text} fontFamily="monospace" fontSize="16">{node.label}</text>
              {node.detail !== undefined && (
                <g pointerEvents="none">
                  <rect x={-18} y={nodeRadius + 5} width="36" height="17" rx="4" fill="white" opacity="0.92" />
                  <text y={nodeRadius + 17} textAnchor="middle" className="fill-muted-foreground font-mono" fontSize="12">{node.detail}</text>
                </g>
              )}
            </motion.g>
          );
        })}
      </svg>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
