import { useId, useLayoutEffect, useMemo, useRef } from "react";
import {
  AnimatePresence,
  animate,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { createAnimationScene } from "./animation-scene";
import type { Frame } from "../core/types";
import {
  Annotation,
  AuxiliaryNode,
  SceneEdge,
  SceneNode,
  ScenePointer,
  SceneTail,
} from "./canvas-primitives";

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
    <ScrollArea className={linked ? "w-full" : "w-full [&_[data-radix-scroll-area-viewport]>div]:!block"}>
      <svg
        data-animation-stage
        viewBox={`0 0 ${scene.width} ${scene.height}`}
        width={scene.width}
        height={scene.height}
        preserveAspectRatio={linked ? "xMinYMin meet" : "xMidYMid meet"}
        className={linked ? "block h-auto w-full min-w-[430px] sm:min-w-0" : "mx-auto block h-auto min-w-[516px] sm:min-w-0"}
        // Scale the previous responsive display, not the logical motion lanes.
        // Overflow stays inside ScrollArea; nodes, text and auxiliary rows scale together.
        style={linked
          ? { minWidth: capacity > 8 ? scene.width : undefined }
          : { width: "120%", minWidth: capacity > 8 ? scene.width * 1.2 : undefined, maxWidth: scene.width * 1.2 }}
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
        {scene.heldLabel && (
          <text x={scene.heldLabel.x} y={scene.heldLabel.y} fontSize="12" className="fill-muted-foreground">{scene.heldLabel.text}</text>
        )}
        {scene.auxiliary && (
          <g data-auxiliary-row>
            <text x={scene.auxiliary.labelX} y={scene.auxiliary.labelY} fontSize="12" className="fill-muted-foreground">{scene.auxiliary.label}</text>
            {scene.auxiliary.slots.map((slot, index) => (
              <g key={index}>
                <rect data-auxiliary-slot={index} {...slot} rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x={slot.x + slot.width / 2} y={slot.y + slot.height + 16} textAnchor="middle" fontSize="12" className="fill-muted-foreground font-mono">{index}</text>
              </g>
            ))}
            {scene.auxiliary.nodes.map(node => (
              <AuxiliaryNode key={`${node.index}-${node.id}`} node={node} progress={progress} times={scene.times} />
            ))}
          </g>
        )}
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
