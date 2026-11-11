import { GraphTreeCanvas } from "./graph-tree-canvas";
import type { Frame } from "../core/types";
import { useAnimationClock } from "./workspace/use-animation-clock";

const POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [120, 100], [360, 48], [360, 196], [620, 38], [690, 210], [785, 122],
];

export function GraphAnimationCanvas({ frame, previous, duration, paused, onAnimatingChange }: { frame: Frame; previous?: Frame; duration: number; paused: boolean; onAnimatingChange: (active: boolean) => void }) {
  const toNodes = (source: Frame) => source.items.map((item, index) => {
    const [x, y] = POSITIONS[index] ?? [120 + index * 120, 100];
    const tone = source.settled.includes(index)
      ? "settled"
      : source.active.includes(index)
        ? "active"
        : "idle";
    const distance = typeof source.variables.distances === "string"
      ? source.variables.distances.split(",")[index]
      : undefined;
    return { id: item.id, label: String.fromCharCode(65 + item.value), x, y, tone, detail: distance ? `d=${distance}` : undefined } as const;
  });
  const nodes = toNodes(frame);
  const previousNodes = previous ? toNodes(previous) : undefined;
  const progress = useAnimationClock({ frame, previous, hasMotion: !!previous, duration, paused, onAnimatingChange });
  return (
    <>
      <GraphTreeCanvas
        nodes={nodes}
        previousNodes={previousNodes}
        progress={progress}
        edges={(frame.links ?? []).map(([from, to]) => ({
          from,
          to,
          weight: frame.edgeWeights?.[`${from}-${to}`],
          tone: frame.variables.edge === `${from}-${to}` || frame.variables.edge === `${to}-${from}` ? "active" : "idle",
        }))}
        width={920}
        height={280}
        ariaLabel="图的节点、边与遍历状态"
      />
      {frame.queue && (
        <div className="meta-row" aria-label="BFS 队列">
          <span className="lbl">队列</span>
          {frame.queue.length === 0 ? (
            <span className="chip mono secondary">空</span>
          ) : frame.queue.map((id) => (
            <span className="chip mono secondary" key={id}>{String.fromCharCode(65 + Number(id))}</span>
          ))}
        </div>
      )}
    </>
  );
}
