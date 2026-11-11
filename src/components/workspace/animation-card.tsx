import { useMemo } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Shuffle } from "lucide-react";
import { randomValues } from "../../core/random";
import { AnimationCanvas } from "../animation-canvas";
import { hashChainCapacityOf } from "../hash-layout";
import { treeDepthOf } from "../tree-layout";
import { GraphAnimationCanvas } from "../graph-animation-canvas";
import { IconButton } from "./icon-button";
import { PlaybackBar } from "./playback-bar";
import type { TopicTrace } from "./use-topic-trace";
import type { LegendEntry, ReadyTopic } from "../../topics/types";

const legendTone: Record<LegendEntry["tone"], string> = {
  active: "tone-active",
  pivot: "tone-pivot",
  settled: "tone-settled",
  idle: "tone-idle",
};

function ArrayStage({
  array,
  children,
}: {
  array: boolean;
  children: ReactNode;
}) {
  if (!array) return <div className="stage">{children}</div>;
  return (
    <div
      data-array-stage
      className="stage flex min-h-[300px] min-w-0 flex-1 flex-col items-center justify-center py-3"
    >
      <div
        data-array-composition
        className="flex w-full min-w-0 flex-col items-center gap-2"
      >
        {children}
      </div>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label className="control-label" htmlFor={htmlFor}>
      {children}
    </label>
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
    <div className="control-field">
      <FieldLabel htmlFor="node-value">{label}</FieldLabel>
      <input
        id="node-value"
        className="field"
        type="number"
        min={-999}
        max={999}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export function AnimationCard({
  topic,
  trace,
}: {
  topic: ReadyTopic;
  trace: TopicTrace;
}) {
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
    <section
      className="panel animation-panel"
      aria-labelledby="animation-title"
    >
      <div className="panel-head">
        <span className="section-num" aria-hidden="true">
          01
        </span>
        <h2 id="animation-title" className="panel-title">
          动画
        </h2>
        <span className="panel-head-rule" aria-hidden="true" />
      </div>

      <div className="animation-body">
        <div className="controls">
          <div
            data-array-controls={array || undefined}
            className={
              array
                ? "controls-top grid grid-cols-[minmax(0,1fr)_6rem] gap-3"
                : "controls-top"
            }
          >
            <div className="control-field">
              <FieldLabel htmlFor="values">{controls.dataLabel}</FieldLabel>
              <div className="data-row">
                <input
                  id="values"
                  className="field"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") apply();
                  }}
                />
                <button type="button" className="btn btn-primary" onClick={apply}>
                  应用
                </button>
                {controls.randomizable !== false && (
                  <IconButton
                    label="随机数据"
                    className="btn-outline"
                    onClick={() => {
                      const next = randomValues(
                        controls,
                        controls.index?.occupiesSlots ? index : 0,
                      );
                      if (load(next)) setInput(next.join(", "));
                    }}
                  >
                    <Shuffle size={15} />
                  </IconButton>
                )}
              </div>
            </div>
          </div>

          {fieldCount > 0 && (
            <div className="control-grid">
              {controls.operations && (
                <div className="control-field">
                  <FieldLabel htmlFor="operation">操作</FieldLabel>
                  <div className="select-shell">
                    <select
                      id="operation"
                      className="select-field"
                      value={operation}
                      onChange={(event) => {
                        const selected = event.target.value;
                        if (load(values, selected)) setOperation(selected);
                      }}
                    >
                      {controls.operations.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="select-chevron"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              )}
              {controls.index && (
                <div className="control-field">
                  <FieldLabel htmlFor="index">{controls.index.label}</FieldLabel>
                  <input
                    id="index"
                    className="field"
                    type="number"
                    min={0}
                    max={controls.index.max({
                      length: values.length,
                      operation,
                    })}
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
                <div className="control-field">
                  <FieldLabel htmlFor="node-value-b">
                    {controls.value2.label}
                  </FieldLabel>
                  <input
                    id="node-value-b"
                    className="field"
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
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
        </div>

        <div data-orientation="horizontal" role="separator" className="rule" />

        <div className="stage-shell">
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
                  <span
                    key={entry.label}
                    className={`legend-badge ${legendTone[entry.tone]}`}
                  >
                    {entry.label}
                  </span>
                ))}
              </div>
            )}
            {frame.stack.length > 0 && (
              <div className="meta-row">
                <span className="text-muted-foreground">调用栈</span>
                {frame.stack.map((entry, i) => (
                  <span className="chip" key={i}>
                    {entry}
                  </span>
                ))}
              </div>
            )}
            {!graph && frame.queue && frame.queue.length > 0 && (
              <div className="meta-row" aria-label="队列">
                <span className="text-muted-foreground">队列</span>
                {frame.queue.map((entry, index) => (
                  <span className="chip" key={index}>
                    {entry}
                  </span>
                ))}
              </div>
            )}
          </ArrayStage>
        </div>
      </div>

      <PlaybackBar
        trace={trace}
        narration={frame.narration}
        total={frames.length}
      />
    </section>
  );
}
