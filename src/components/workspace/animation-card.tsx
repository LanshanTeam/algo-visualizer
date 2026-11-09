import { useMemo } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  ChevronDown,
  Shuffle,
  TriangleAlert,
} from "lucide-react";
import { randomValues } from "../../core/random";
import { AnimationCanvas } from "../animation-canvas";
import { hashChainCapacityOf } from "../hash-layout";
import { treeDepthOf } from "../tree-layout";
import { GraphAnimationCanvas } from "../graph-animation-canvas";
import { IconButton } from "./icon-button";
import { PlaybackBar } from "./playback-bar";
import type { TopicTrace } from "./use-topic-trace";
import type { LegendEntry, ReadyTopic } from "../../topics/types";

const COLUMNS: Record<number, string> = {
  1: "cols-1",
  2: "cols-2",
  3: "cols-3",
  4: "cols-4",
};
const legendTone: Record<LegendEntry["tone"], string> = {
  active: "active",
  pivot: "pivot",
  settled: "settled",
  idle: "idle",
};

function ArrayStage({ array, children }: { array: boolean; children: ReactNode }) {
  // Only array scenes opt into the centered composition.
  if (!array) return <>{children}</>;
  return (
    <div data-array-stage className="stage flex-1 items-center justify-center">
      <div data-array-composition className="stage-stack gap-2">
        {children}
      </div>
    </div>
  );
}

function ValueInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor="node-value">{label}</label>
      <input
        id="node-value"
        className="input"
        type="number"
        min={-999}
        max={999}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export function AnimationCard({ topic, trace }: { topic: ReadyTopic; trace: TopicTrace }) {
  const controls = topic.controls;
  const array = topic.scene === "array";
  const graph = topic.scene === "graph";
  const {
    input,
    setInput,
    values,
    operation,
    setOperation,
    index,
    setIndex,
    value,
    setValue,
    value2,
    setValue2,
    frames,
    previousStep,
    traceVersion,
    playing,
    stepMode,
    speed,
    setAnimating,
    error,
    frame,
    capacity,
    showValue,
    showValue2,
    fieldCount,
    load,
    apply,
  } = trace;
  const treeDepth = useMemo(
    () =>
      topic.scene === "tree" && frames.length
        ? Math.max(...frames.map(treeDepthOf))
        : 0,
    [topic.scene, frames],
  );
  const hashChainCapacity = useMemo(
    () =>
      topic.scene === "hash" && frames.length
        ? Math.max(...frames.map(hashChainCapacityOf))
        : 0,
    [topic.scene, frames],
  );

  return (
    <section className="panel" aria-labelledby="animation-title">
      <header className="panel-head">
        <span className="head-icon"><Activity /></span>
        <div>
          <div className="eyebrow">VISUALIZATION</div>
          <h2 id="animation-title">动画</h2>
        </div>
      </header>
      <div className="panel-body">
        <div data-array-controls={array || undefined} className={array ? "grid grid-cols-[minmax(0,1fr)_6rem] gap-3" : undefined}>
          <div className="field">
            <label className="field-label" htmlFor="values">{controls.dataLabel}</label>
            <div className="data-row">
              <input
                id="values"
                className="input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") apply();
                }}
              />
              <button type="button" className="btn" onClick={apply}>应用</button>
              {controls.randomizable !== false && (
                <IconButton
                  label="随机数据"
                  onClick={() => {
                    // 队列的初始 front 本身占槽位，生成时要一起让出来。
                    const next = randomValues(
                      controls,
                      controls.index?.occupiesSlots ? index : 0,
                    );
                    if (load(next)) setInput(next.join(", "));
                  }}
                >
                  <Shuffle />
                </IconButton>
              )}
            </div>
          </div>
        </div>
        {fieldCount > 0 && (
          <div className={`field-grid ${COLUMNS[fieldCount] ?? "cols-1"}`}>
            {controls.operations && (
              <div className="field">
                <label className="field-label" htmlFor="operation">操作</label>
                <span className="select">
                  <select
                    id="operation"
                    value={operation}
                    onChange={(event) => {
                      const selected = event.target.value;
                      if (load(values, selected)) setOperation(selected);
                    }}
                  >
                    {controls.operations.map((entry) => (
                      <option key={entry.id} value={entry.id}>{entry.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="chev" aria-hidden="true" />
                </span>
              </div>
            )}
            {controls.index && (
              <div className="field">
                <label className="field-label" htmlFor="index">{controls.index.label}</label>
                <input
                  id="index"
                  className="input"
                  type="number"
                  min={0}
                  max={controls.index.max({ length: values.length, operation })}
                  value={index}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setIndex(next);
                    load(values, operation, next);
                  }}
                />
              </div>
            )}
            {showValue && controls.value && (
              <ValueInput
                label={controls.value.label}
                value={value}
                onChange={(next) => {
                  setValue(next);
                  load(values, operation, index, next);
                }}
              />
            )}
            {showValue2 && controls.value2 && (
              <div className="field">
                <label className="field-label" htmlFor="node-value-b">{controls.value2.label}</label>
                <input
                  id="node-value-b"
                  className="input"
                  type="number"
                  min={-999}
                  max={999}
                  value={value2}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setValue2(next);
                    load(values, operation, index, value, next);
                  }}
                />
              </div>
            )}
          </div>
        )}
        {error && (
          <div className="alert" role="alert">
            <TriangleAlert aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        <div data-orientation="horizontal" className="divider" role="none" />
        <ArrayStage array={array}>
          {graph ? (
            <GraphAnimationCanvas
              frame={frame}
              previous={previousStep === null ? undefined : frames[previousStep]}
              duration={1 / speed}
              paused={!playing && stepMode === "automatic"}
              onAnimatingChange={setAnimating}
            />
          ) : (
            <AnimationCanvas
              key={traceVersion}
              frame={frame}
              previous={previousStep === null ? undefined : frames[previousStep]}
              kind={topic.scene}
              treeDepth={treeDepth}
              hashChainCapacity={hashChainCapacity}
              capacity={capacity}
              duration={1 / speed}
              paused={!playing && stepMode === "automatic"}
              onAnimatingChange={setAnimating}
            />
          )}
          {topic.legend && (
            <div className="legend" aria-label="图例">
              {topic.legend.map((entry) => (
                <span key={entry.label} className={`chip ${legendTone[entry.tone]}`}>
                  <span className="swatch" style={{ background: entry.tone === "active" ? "var(--tone-active)" : entry.tone === "pivot" ? "var(--tone-pivot)" : entry.tone === "settled" ? "var(--tone-settled)" : "var(--tone-idle)" }} />
                  {entry.label}
                </span>
              ))}
            </div>
          )}
          {frame.stack.length > 0 && (
            <div className="meta-row">
              <span className="lbl">调用栈</span>
              {frame.stack.map((entry, i) => (
                <span className="chip mono secondary" key={i}>{entry}</span>
              ))}
            </div>
          )}
          {!graph && frame.queue && frame.queue.length > 0 && (
            <div className="meta-row" aria-label="队列">
              <span className="lbl">队列</span>
              {frame.queue.map((entry, index) => (
                <span className="chip mono secondary" key={index}>{entry}</span>
              ))}
            </div>
          )}
        </ArrayStage>
      </div>
      <PlaybackBar
        trace={trace}
        narration={frame.narration}
        total={frames.length}
      />
    </section>
  );
}
