import { useId, useMemo } from "react";
import {
  AnimatePresence,
} from "motion/react";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { createAnimationScene } from "./animation-scene";
import type { Frame } from "../core/types";
import {
  Annotation,
  SceneEdge,
  SceneNode,
  ScenePointer,
  SceneTail,
} from "./canvas-primitives";
import { useAnimationClock } from "./workspace/use-animation-clock";

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
  const progress = useAnimationClock({
    frame,
    previous,
    hasMotion: scene.hasMotion,
    duration,
    paused,
    onAnimatingChange,
  });

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
