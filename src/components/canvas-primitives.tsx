import type { ReactNode } from "react";
import {
  motion,
  useIsPresent,
  useTransform,
  type MotionValue,
} from "motion/react";
import { connectionPathAt, sampleTrack } from "./scene-geometry";
import type { AnimationScene, SceneLink } from "./animation-scene";

export const palette = {
  active: { stroke: "#38bdf8", fill: "#0c2a3d" },
  pivot: { stroke: "#fbbf24", fill: "#3a2a0a" },
  settled: { stroke: "#34d399", fill: "#0c2f28" },
  idle: { stroke: "#475569", fill: "#1b2330" },
};
export type ClockProps = { progress: MotionValue<number>; times: number[] };
const nodeRadius = 8;
const nodeFontSize = (value: number) => (Math.abs(value) > 99 ? 19 : 25);

export function SceneNode({
  node,
  linked,
  circular = false,
  progress,
  times,
}: ClockProps & {
  node: AnimationScene["nodes"][number];
  linked: boolean;
  /** 树节点为圆形，用等宽高矩形加圆角实现。 */
  circular?: boolean;
}) {
  const present = useIsPresent();
  const x = useTransform(progress, (p) =>
    present ? sampleTrack(node.x, times, p) : node.x.at(-1)!,
  );
  const y = useTransform(progress, (p) =>
    present ? sampleTrack(node.y, times, p) : node.y.at(-1)!,
  );
  return (
    <motion.g
      data-node-id={node.id}
      style={{ x, y }}
      initial={{
        opacity: node.entering ? 0 : 1,
        scale: node.entering ? 0.85 : 1,
      }}
      animate={{ opacity: node.muted ? 0.35 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15 }}
    >
      <motion.rect
        initial={false}
        width={node.width}
        height={node.height}
        rx={circular ? node.width / 2 : 8}
        animate={{
          ...palette[node.tone],
          strokeWidth:
            node.tone === "active" || node.tone === "pivot" ? 2 : 1.5,
        }}
        transition={{ duration: 0.15 }}
      />
      {linked && (
        <>
          <line x1="54" y1="0" x2="54" y2={node.height} stroke="#475569" />
          <line
            x1="67"
            y1={node.height / 2}
            x2={node.width}
            y2={node.height / 2}
            stroke="#64748b"
            strokeWidth="1.5"
          />
          <circle cx="67" cy={node.height / 2} r="3.5" fill="#64748b" />
        </>
      )}
      <text
        data-current-value
        x={node.valueX}
        y={node.valueY}
        textAnchor="middle"
        fill="#e2e8f0"
        fontFamily="monospace"
        fontSize={node.fontSize}
      >
        {node.value}
      </text>
    </motion.g>
  );
}

/** 顶层比较标记，与节点共享轨迹和时钟，顶部保留描边空间。 */
export function SceneComparisonCrown({ node, progress, times }: ClockProps & {
  node: AnimationScene["nodes"][number];
}) {
  const x = useTransform(progress, p => sampleTrack(node.x, times, p) + node.width / 2 - 9);
  const y = useTransform(progress, p => Math.max(2, sampleTrack(node.y, times, p) - 14));
  return (
    <motion.g data-comparison-crown={node.id} style={{ x, y }} pointerEvents="none" role="img" aria-label="当前比较中较大的数">
      <title>当前比较中较大的数</title>
      <path d="M 1 3 L 5 6 L 9 1 L 13 6 L 17 3 L 15 11 H 3 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M 3 13 H 15" stroke="#b45309" strokeWidth="1.2" strokeLinecap="round" />
    </motion.g>
  );
}

/** Auxiliary copies are not primary identities; visibility uses the shared clock. */
export function AuxiliaryNode({ node, progress, times }: ClockProps & {
  node: NonNullable<AnimationScene["auxiliary"]>["nodes"][number];
}) {
  const opacity = useTransform(progress, p => sampleTrack(node.opacity, times, p));
  return (
    <motion.g data-auxiliary-node-id={node.id} transform={`translate(${node.x} ${node.y})`} style={{ opacity }}>
      <rect width={node.width} height={node.height} rx={nodeRadius} fill={palette.active.fill} stroke={palette.active.stroke} />
      <text x={node.width / 2} y="34" textAnchor="middle" fontFamily="monospace" fontSize={nodeFontSize(node.value)} fill="#e2e8f0">{node.value}</text>
    </motion.g>
  );
}

export function SceneEdge({
  link,
  progress,
  times,
  arrowId,
}: ClockProps & { link: SceneLink; arrowId: string }) {
  const present = useIsPresent();
  const d = useTransform(progress, (p) =>
    connectionPathAt(link, times, present ? p : 1),
  );
  const pathLength = useTransform(progress, (p) =>
    link.existed || !present ? 1 : Math.min(1, p / 0.7),
  );
  return (
    <motion.path
      data-link={link.id}
      d={d}
      style={{ pathLength }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      fill="none"
      stroke={link.highlighted ? palette.active.stroke : "#64748b"}
      strokeWidth="2"
      markerEnd={link.arrow ? `url(#${arrowId})` : undefined}
    />
  );
}

export function SceneTail({
  tail,
  progress,
  times,
  arrowId,
}: ClockProps & { tail: AnimationScene["tails"][number]; arrowId: string }) {
  const x = useTransform(progress, (p) => sampleTrack(tail.x, times, p));
  const y = useTransform(progress, (p) => sampleTrack(tail.y, times, p));
  return (
    <motion.g style={{ x, y }}>
      <path
        d="M 0 0 H 30"
        stroke="#64748b"
        strokeWidth="1.5"
        markerEnd={`url(#${arrowId})`}
      />
      <text
        x="38"
        y="4"
        className="fill-muted-foreground font-mono"
        fontSize="13"
      >
        null
      </text>
    </motion.g>
  );
}

export function Annotation({
  progress,
  revealAfterMotion,
  children,
  index,
  pointer,
  targetId,
}: {
  progress: MotionValue<number>;
  revealAfterMotion: boolean;
  children: ReactNode;
  index?: number;
  pointer?: string;
  targetId?: number;
}) {
  const opacity = useTransform(progress, (p) =>
    revealAfterMotion && p < 1 ? 0 : 1,
  );
  return (
    <motion.g
      data-index={index}
      data-pointer={pointer}
      data-pointer-target={targetId}
      style={{ opacity }}
    >
      {children}
    </motion.g>
  );
}

export function ScenePointer({
  pointer,
  progress,
  times,
}: ClockProps & { pointer: AnimationScene["pointers"][number] }) {
  const x = useTransform(progress, (p) => sampleTrack(pointer.x, times, p));
  const y = useTransform(progress, (p) => sampleTrack(pointer.y, times, p));
  const right = pointer.placement === "right";
  return (
    <Annotation
      pointer={pointer.name}
      targetId={pointer.targetId}
      progress={progress}
      revealAfterMotion={pointer.revealAfterMotion}
    >
      <motion.g style={{ x, y }}>
        {right && (
          <rect
            x="0"
            y="-11"
            width={pointer.width}
            height="22"
            rx="5"
            fill={palette[pointer.tone].fill}
            stroke={palette[pointer.tone].stroke}
            strokeWidth="1.5"
          />
        )}
        {pointer.placement === "below" && (
          <rect
            x={-pointer.width / 2}
            y="-17"
            width={pointer.width}
            height="24"
            rx="5"
            fill={palette[pointer.tone].fill}
          />
        )}
        <text
          x={right ? 8 : 0}
          y={right ? 4 : 0}
          textAnchor={right ? "start" : "middle"}
          fill={palette[pointer.tone].stroke}
          fontFamily="monospace"
          fontSize={pointer.fontSize}
        >
          {pointer.name}
        </text>
        {right && <path d="M 1 -4 L -7 0 L 1 4 Z" fill={palette[pointer.tone].stroke} />}
        {pointer.placement === "below" && (
          <path
            d="M -3 -21 L 0 -26 L 3 -21 Z"
            fill={palette[pointer.tone].stroke}
          />
        )}
      </motion.g>
    </Annotation>
  );
}

/** 哈希表的桶格；空桶虚线，非空桶用箭头接到链头。 */
export function SceneBucket({
  bucket,
  progress,
  times,
  arrowId,
}: ClockProps & {
  bucket: AnimationScene["buckets"][number];
  arrowId: string;
}) {
  const headX = bucket.head?.x ?? [0];
  const headY = bucket.head?.y ?? [0];
  const x2 = useTransform(progress, (p) => sampleTrack(headX, times, p) - 6);
  const y2 = useTransform(progress, (p) => sampleTrack(headY, times, p));
  const tone = bucket.active ? palette.pivot : palette.idle;
  return (
    <g data-bucket-index={bucket.index} data-bucket-active={bucket.active}>
      <motion.rect
        x={bucket.x}
        y={bucket.y}
        width={bucket.width}
        height={bucket.height}
        rx={6}
        animate={{
          fill: tone.fill,
          stroke: tone.stroke,
          strokeWidth: bucket.active ? 2 : 1.5,
        }}
        transition={{ duration: 0.15 }}
        strokeDasharray={bucket.head ? undefined : "3 3"}
      />
      <text
        x={bucket.x + bucket.width / 2}
        y={bucket.y + bucket.height / 2 + 4}
        textAnchor="middle"
        fill={bucket.active ? palette.pivot.stroke : "#94a3b8"}
        fontFamily="monospace"
        fontSize="11"
      >
        {bucket.index}
      </text>
      {bucket.head && (
        <motion.line
          x1={bucket.x + bucket.width}
          y1={bucket.y + bucket.height / 2}
          x2={x2}
          y2={y2}
          stroke={bucket.active ? palette.pivot.stroke : "#64748b"}
          strokeWidth="1.5"
          markerEnd={`url(#${arrowId})`}
        />
      )}
    </g>
  );
}

/** 二叉堆底部的数组格，与上方树节点共享色调。 */
export function SceneHeapCell({
  cell,
}: {
  cell: AnimationScene["heapCells"][number];
}) {
  const tone = palette[cell.tone];
  const fontSize = Math.abs(cell.value) > 99 ? 9 : 10;
  return (
    <g data-heap-index={cell.index} data-heap-id={cell.id}>
      <text
        x={cell.x + cell.width / 2}
        y={cell.y - 4}
        textAnchor="middle"
        className="fill-muted-foreground font-mono"
        fontSize="9"
      >
        {cell.index}
      </text>
      <motion.rect
        x={cell.x}
        y={cell.y}
        width={cell.width}
        height={cell.height}
        rx={5}
        initial={false}
        animate={{
          fill: tone.fill,
          stroke: tone.stroke,
          strokeWidth: cell.tone === "idle" ? 1 : 1.5,
        }}
        transition={{ duration: 0.15 }}
      />
      <text
        x={cell.x + cell.width / 2}
        y={cell.y + cell.height / 2 + fontSize * 0.35}
        textAnchor="middle"
        fill="#e2e8f0"
        fontFamily="monospace"
        fontSize={fontSize}
      >
        {cell.value}
      </text>
    </g>
  );
}

/** 并查集底部的一列：元素标签、parent 格与 rank 格。 */
export function SceneUnionCell({
  column,
}: {
  column: AnimationScene["unionColumns"][number];
}) {
  const tone = palette[column.tone];
  const parentFontSize = Math.abs(column.parent) > 99 ? 8 : 9;
  return (
    <g
      data-union-index={column.index}
      data-union-id={column.id}
      data-union-parent={column.parentId}
      data-union-rank={column.rank}
      data-union-root={column.root}
    >
      <text
        x={column.x + column.width / 2}
        y={column.parentY - 4}
        textAnchor="middle"
        className="fill-muted-foreground font-mono"
        fontSize="9"
      >
        {column.element}
      </text>
      <motion.rect
        x={column.x}
        y={column.parentY}
        width={column.width}
        height={column.parentHeight}
        rx={4}
        initial={false}
        animate={{
          fill: tone.fill,
          stroke: tone.stroke,
          strokeWidth: column.tone === "idle" ? 1 : 1.5,
        }}
        transition={{ duration: 0.15 }}
      />
      <text
        x={column.x + column.width / 2}
        y={column.parentY + column.parentHeight / 2 + 3.5}
        textAnchor="middle"
        fill="#e2e8f0"
        fontFamily="monospace"
        fontSize={parentFontSize}
      >
        {column.parent}
      </text>
      <motion.rect
        x={column.x}
        y={column.rankY}
        width={column.width}
        height={column.rankHeight}
        rx={4}
        initial={false}
        animate={{
          fill: tone.fill,
          stroke: tone.stroke,
          strokeWidth: column.tone === "idle" ? 1 : 1.5,
        }}
        transition={{ duration: 0.15 }}
      />
      <text
        x={column.x + column.width / 2}
        y={column.rankY + column.rankHeight / 2 + 3}
        textAnchor="middle"
        fill="#e2e8f0"
        fontFamily="monospace"
        fontSize="8"
      >
        {column.rank}
      </text>
    </g>
  );
}

/** 并查集左下角的 parent / rank 行名。 */
export function SceneUnionRowLabel({
  row,
}: {
  row: AnimationScene["unionRowLabels"][number];
}) {
  return (
    <text
      x={row.x}
      y={row.y}
      data-union-row={row.label}
      className="fill-muted-foreground font-mono"
      fontSize="10"
    >
      {row.label}
    </text>
  );
}

/** 哈希表顶部的除留余数法公式条。 */
export function SceneFormula({
  formula,
}: {
  formula: AnimationScene["formula"];
}) {
  if (!formula) return null;
  return (
    <g data-hash-formula={formula.text}>
      <rect
        x={formula.x}
        y={formula.y}
        width={formula.width}
        height={formula.height}
        rx={6}
        fill={formula.active ? palette.pivot.fill : "#1b2330"}
        stroke={formula.active ? palette.pivot.stroke : "#475569"}
        strokeWidth={formula.active ? 1.5 : 1}
      />
      <text
        x={formula.x + 10}
        y={formula.y + formula.height / 2 + 4}
        fill={formula.active ? palette.pivot.stroke : "#94a3b8"}
        fontFamily="monospace"
        fontSize="11"
      >
        {formula.text}
      </text>
    </g>
  );
}

/** 跟随当前节点的目标值徽章，树场景使用。 */
export function SceneBadge({
  badge,
  progress,
  times,
}: ClockProps & { badge: AnimationScene["badges"][number] }) {
  const x = useTransform(progress, (p) => sampleTrack(badge.x, times, p));
  const y = useTransform(progress, (p) => sampleTrack(badge.y, times, p));
  return (
    <motion.g
      data-target-badge={badge.text}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15 }}
    >
      <motion.g style={{ x, y }}>
        <rect
          x={-badge.width / 2}
          y={-badge.height / 2}
          width={badge.width}
          height={badge.height}
          rx="5"
          fill={palette[badge.tone].fill}
          stroke={palette[badge.tone].stroke}
          strokeWidth="1.5"
        />
        <text
          textAnchor="middle"
          y={badge.fontSize * 0.35}
          fill={palette[badge.tone].stroke}
          fontFamily="monospace"
          fontSize={badge.fontSize}
        >
          {badge.text}
        </text>
      </motion.g>
    </motion.g>
  );
}
