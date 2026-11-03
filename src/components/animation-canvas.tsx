import { useId, useLayoutEffect, useMemo, useRef } from "react";
import {
  AnimatePresence,
  animate,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { createAnimationScene } from "./animation-scene";
import type { Frame, ImplementedSceneKind } from "../core/types";
import {
  Annotation,
  SceneBadge,
  SceneBucket,
  SceneEdge,
  SceneFormula,
  SceneHeapCell,
  SceneNode,
  ScenePointer,
  SceneTail,
  SceneUnionCell,
  SceneUnionRowLabel,
} from "./canvas-primitives";

export function AnimationCanvas({
  frame,
  previous,
  kind,
  capacity,
  treeDepth = 0,
  hashChainCapacity = 0,
  duration,
  paused = false,
  onAnimatingChange,
}: {
  frame: Frame;
  previous?: Frame;
  kind: ImplementedSceneKind;
  capacity: number;
  treeDepth?: number;
  hashChainCapacity?: number;
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
        kind,
        capacity,
        treeDepth,
        hashChainCapacity,
      }),
    [frame, previous, kind, capacity, treeDepth, hashChainCapacity],
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
        style={{
          minWidth:
            kind === "hash" || kind === "heap" || kind === "union-find"
              ? scene.width > 430
                ? scene.width
                : undefined
              : capacity > 8
                ? scene.width
                : undefined,
        }}
        role="img"
        aria-label={
          kind === "linked-list"
            ? "链表节点及 next 指针"
            : kind === "tree"
              ? "二叉树节点与父子边"
              : kind === "hash"
                ? "哈希表桶、冲突链与除留余数法公式"
                : kind === "heap"
                  ? "二叉堆的完全二叉树与数组表示"
                  : kind === "union-find"
                    ? "并查集森林与 parent、rank 数组"
                    : "数组分区、比较与交换动画"
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
        {scene.formula && <SceneFormula formula={scene.formula} />}
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
        {scene.buckets.map((bucket) => (
          <SceneBucket
            key={bucket.index}
            bucket={bucket}
            progress={progress}
            times={scene.times}
            arrowId={arrowId}
          />
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
              linked={kind === "linked-list"}
              circular={
                kind === "tree" ||
                kind === "heap" ||
                kind === "union-find"
              }
              progress={progress}
              times={scene.times}
            />
          ))}
        </AnimatePresence>
        {scene.heapCells.map((cell) => (
          <SceneHeapCell key={cell.id} cell={cell} />
        ))}
        {scene.unionColumns.map((column) => (
          <SceneUnionCell key={column.id} column={column} />
        ))}
        {scene.unionRowLabels.map((row) => (
          <SceneUnionRowLabel key={row.label} row={row} />
        ))}
        {scene.pointers.map((pointer) => (
          <ScenePointer
            key={pointer.key}
            pointer={pointer}
            progress={progress}
            times={scene.times}
          />
        ))}
        <AnimatePresence initial={false}>
          {scene.badges.map((badge) => (
            <SceneBadge
              key={badge.key}
              badge={badge}
              progress={progress}
              times={scene.times}
            />
          ))}
        </AnimatePresence>
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
