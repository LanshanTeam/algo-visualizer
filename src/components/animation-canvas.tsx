import { useId, useMemo } from "react";
import {
  AnimatePresence,
} from "motion/react";
import { createAnimationScene } from "./animation-scene";
import type { Frame, ImplementedSceneKind } from "../core/types";
import {
  Annotation,
  SceneBadge,
  SceneBucket,
  AuxiliaryNode,
  SceneEdge,
  SceneFormula,
  SceneHeapCell,
  SceneNode,
  ScenePointer,
  SceneTail,
  SceneUnionCell,
  SceneUnionRowLabel,
} from "./canvas-primitives";
import { useAnimationClock } from "./workspace/use-animation-clock";

const LABELS: Record<ImplementedSceneKind, string> = {
  array: "数组分区、比较与交换动画",
  "linked-list": "链表节点及 next 指针",
  stack: "栈的槽位与栈顶指针",
  queue: "队列的槽位与队头队尾指针",
  graph: "图节点、边与遍历顺序",
  tree: "二叉树节点与父子边",
  hash: "哈希表桶、冲突链与除留余数法公式",
  heap: "二叉堆的完全二叉树与数组表示",
  "union-find": "并查集森林与 parent、rank 数组",
};

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
  const linked = kind === "linked-list";
  const array = kind === "array";
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
  const progress = useAnimationClock({
    frame,
    previous,
    hasMotion: scene.hasMotion,
    duration,
    paused,
    onAnimatingChange,
  });

  return (
    <div className={array ? "stage-scroll w-full [&_[data-radix-scroll-area-viewport]>div]:!block" : "stage-scroll w-full"}>
      <svg
        data-animation-stage
        viewBox={`0 0 ${scene.width} ${scene.height}`}
        width={scene.width}
        height={scene.height}
        preserveAspectRatio={linked ? "xMinYMin meet" : "xMidYMid meet"}
        className={array ? "mx-auto block h-auto min-w-0" : "block h-auto w-full min-w-[430px] sm:min-w-0"}
        // Ordinary arrays fit the viewport, including their boundary pointers.
        // Only long inputs retain an enlarged minimum width and internal scrolling.
        style={array
          ? { width: "100%", minWidth: capacity > 8 ? scene.width * 1.2 : undefined, maxWidth: scene.width * 1.2 }
          : { minWidth: ["hash", "heap", "union-find"].includes(kind)
              ? scene.width > 430 ? scene.width : undefined
              : capacity > 8 ? scene.width : undefined }}
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
        {scene.formula && <SceneFormula formula={scene.formula} />}
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
              {slot.label}
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
    </div>
  );
}
