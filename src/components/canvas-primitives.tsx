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
  active: { stroke: "#2563eb", fill: "#eff6ff" },
  pivot: { stroke: "#d97706", fill: "#fffbeb" },
  settled: { stroke: "#15803d", fill: "#f0fdf4" },
  idle: { stroke: "#cbd5e1", fill: "#fff" },
};
export type ClockProps = { progress: MotionValue<number>; times: number[] };

export function SceneNode({
  node,
  linked,
  progress,
  times,
}: ClockProps & { node: AnimationScene["nodes"][number]; linked: boolean }) {
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
        rx="8"
        animate={{
          ...palette[node.tone],
          strokeWidth:
            node.tone === "active" || node.tone === "pivot" ? 2 : 1.5,
        }}
        transition={{ duration: 0.15 }}
      />
      {linked && (
        <>
          <line x1="54" y1="0" x2="54" y2={node.height} stroke="#cbd5e1" />
          <line
            x1="67"
            y1={node.height / 2}
            x2={node.width}
            y2={node.height / 2}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          <circle cx="67" cy={node.height / 2} r="3.5" fill="#94a3b8" />
        </>
      )}
      <text
        data-current-value
        x={node.valueX}
        y={node.valueY}
        textAnchor="middle"
        fill="#1e293b"
        fontFamily="monospace"
        fontSize={node.fontSize}
      >
        {node.value}
      </text>
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
      stroke={link.highlighted ? palette.active.stroke : "#94a3b8"}
      strokeWidth="2"
      markerEnd={`url(#${arrowId})`}
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
        stroke="#94a3b8"
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
  return (
    <Annotation
      pointer={pointer.name}
      targetId={pointer.targetId}
      progress={progress}
      revealAfterMotion={pointer.revealAfterMotion}
    >
      <motion.g style={{ x, y }}>
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
          textAnchor="middle"
          fill={palette[pointer.tone].stroke}
          fontFamily="monospace"
          fontSize={pointer.fontSize}
        >
          {pointer.name}
        </text>
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
