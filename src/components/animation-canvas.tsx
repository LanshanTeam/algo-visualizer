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
  SceneEdge,
  SceneNode,
  ScenePointer,
  SceneTail,
} from "./canvas-primitives";

const LABELS: Record<ImplementedSceneKind, string> = {
  array: "数组分区、比较与交换动画",
  "linked-list": "链表节点及 next 指针",
  stack: "栈的槽位与栈顶指针",
  queue: "队列的槽位与队头队尾指针",
};

export function AnimationCanvas({
  frame,
  previous,
  kind,
  capacity,
  duration,
  paused = false,
  onAnimatingChange,
}: {
  frame: Frame;
  previous?: Frame;
  kind: ImplementedSceneKind;
  capacity: number;
  duration: number;
  paused?: boolean;
  onAnimatingChange?: (active: boolean) => void;
}) {
  const reduced = useReducedMotion();
  const arrowId = useId().replace(/:/g, "");
  const linked = kind === "linked-list";
  const scene = useMemo(
    () => createAnimationScene({ frame, previous, kind, capacity }),
    [frame, previous, kind, capacity],
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
        aria-label={LABELS[kind]}
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
        {scene.container && (
          <rect
            {...scene.container}
            rx="10"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeDasharray="6 4"
          />
        )}
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
            rx={scene.vertical ? "6" : "8"}
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
              {slot.label}
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
        {scene.captions.map((caption) => (
          <text
            key={caption.text}
            x={caption.x}
            y={caption.y}
            textAnchor={caption.anchor}
            className="fill-muted-foreground font-mono"
            fontSize="11"
          >
            {caption.text}
          </text>
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
