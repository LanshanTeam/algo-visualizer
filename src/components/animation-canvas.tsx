import { useId, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import {
  connectionPathAt,
  createAnimationScene,
  sampleTrack,
  type AnimationScene,
  type SceneLink,
} from "./animation-scene";
import type { Frame } from "../trace";

const palette = {
  active: { stroke: "#2563eb", fill: "#eff6ff" },
  pivot: { stroke: "#d97706", fill: "#fffbeb" },
  settled: { stroke: "#15803d", fill: "#f0fdf4" },
  idle: { stroke: "#cbd5e1", fill: "#fff" },
};
type ClockProps = { progress: MotionValue<number>; times: number[] };

function SceneNode({
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
function SceneEdge({
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
function SceneTail({
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
function Annotation({
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

function ScenePointer({
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

export function AnimationCanvas({
  frame,
  previous,
  linked,
  capacity,
  duration,
  paused = false,
  onAnimatingChange,
}: {
  frame: Frame;
  previous?: Frame;
  linked: boolean;
  capacity: number;
  duration: number;
  paused?: boolean;
  onAnimatingChange?: (active: boolean) => void;
}) {
  const reduced = useReducedMotion();
  const arrowId = useId().replace(/:/g, "");
  const scene = useMemo(
    () =>
      createAnimationScene({
        frame,
        previous,
        kind: linked ? "linked-list" : "array",
        capacity,
      }),
    [frame, previous, linked, capacity],
  );
  const progress = useMotionValue(1);
  const last = useRef<{ frame?: Frame; previous?: Frame }>({});
  useLayoutEffect(() => {
    const changed =
      last.current.frame !== frame || last.current.previous !== previous;
    last.current = { frame, previous };
    if (reduced || !scene.hasMotion) {
      progress.set(1);
      onAnimatingChange?.(false);
      return;
    }
    if (changed) progress.set(0);
    const remaining = 1 - progress.get();
    if (remaining <= 0) {
      onAnimatingChange?.(false);
      return;
    }
    onAnimatingChange?.(true);
    if (paused) return;
    const controls = animate(progress, 1, {
      duration: duration * remaining,
      ease: "linear",
      onComplete: () => onAnimatingChange?.(false),
    });
    return () => {
      controls.stop();
      onAnimatingChange?.(false);
    };
  }, [
    frame,
    previous,
    duration,
    paused,
    reduced,
    scene.hasMotion,
    progress,
    onAnimatingChange,
  ]);

  return (
    <ScrollArea className="w-full">
      <svg
        data-animation-stage
        viewBox={`0 0 ${scene.width} ${scene.height}`}
        className="block h-auto w-full min-w-[430px] sm:min-w-0"
        style={{ minWidth: capacity > 8 ? scene.width : undefined }}
        role="img"
        aria-label={
          linked ? "链表节点及 next 指针" : "数组分区、比较与交换动画"
        }
      >
        <defs>
          <marker
            id={arrowId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>
        {scene.range && (
          <rect
            {...scene.range}
            rx="10"
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeDasharray="4 4"
          />
        )}
        {scene.slots.map((slot, index) => (
          <rect
            key={index}
            {...slot}
            rx="8"
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeDasharray="3 3"
          />
        ))}
        {scene.indices.map((slot) => (
          <Annotation
            key={slot.index}
            index={slot.index}
            progress={progress}
            revealAfterMotion={slot.revealAfterMotion}
          >
            <text
              x={slot.x}
              y={slot.y}
              textAnchor="middle"
              className="fill-muted-foreground font-mono"
              fontSize="12"
            >
              {slot.index}
            </text>
          </Annotation>
        ))}
        <AnimatePresence initial={false}>
          {scene.links.map((link) => (
            <SceneEdge
              key={link.id}
              link={link}
              progress={progress}
              times={scene.times}
              arrowId={arrowId}
            />
          ))}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {scene.nodes.map((node) => (
            <SceneNode
              key={node.id}
              node={node}
              linked={linked}
              progress={progress}
              times={scene.times}
            />
          ))}
        </AnimatePresence>
        {scene.pointers.map((pointer) => (
          <ScenePointer
            key={pointer.key}
            pointer={pointer}
            progress={progress}
            times={scene.times}
          />
        ))}
        {scene.tails.map((tail) => (
          <SceneTail
            key={tail.id}
            tail={tail}
            progress={progress}
            times={scene.times}
            arrowId={arrowId}
          />
        ))}
        {scene.nullHead && (
          <text
            x={scene.nullHead.x}
            y={scene.nullHead.y}
            className="fill-muted-foreground font-mono"
            fontSize="13"
          >
            head → null
          </text>
        )}
        {scene.empty && (
          <text
            x={scene.empty.x}
            y={scene.empty.y}
            textAnchor="middle"
            className="fill-muted-foreground font-mono"
            fontSize="16"
          >
            {scene.empty.text}
          </text>
        )}
      </svg>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
