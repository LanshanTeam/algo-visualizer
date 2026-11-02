import { useMemo } from "react";
import { Shuffle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { AnimationCanvas } from "../animation-canvas";
import { treeDepthOf } from "../tree-layout";
import { IconButton } from "./icon-button";
import { PlaybackBar } from "./playback-bar";
import type { TopicTrace } from "./use-topic-trace";
import type { LegendEntry, ReadyTopic } from "../../topics/types";

const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};
const legendTone: Record<LegendEntry["tone"], string> = {
  active: "border-blue-300 bg-blue-50 text-blue-700",
  pivot: "border-amber-300 bg-amber-50 text-amber-700",
  settled: "border-green-300 bg-green-50 text-green-700",
  idle: "",
};

export function AnimationCard({ topic, trace }: { topic: ReadyTopic; trace: TopicTrace }) {
  const controls = topic.controls;
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

  return (
    <Card
      className="flex min-w-0 flex-col xl:min-h-0 xl:flex-1"
      aria-labelledby="animation-title"
    >
      <CardHeader>
        <CardTitle>
          <h2 id="animation-title">动画</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        <div className="space-y-2">
          <Label htmlFor="values">{controls.dataLabel}</Label>
          <div className="flex gap-2">
            <Input
              id="values"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") apply();
              }}
            />
            <Button variant="outline" onClick={apply}>
              应用
            </Button>
            {controls.randomizable !== false && (
              <IconButton
                label="随机数据"
                onClick={() => {
                  const next = Array.from(
                    { length: 7 },
                    () => Math.floor(Math.random() * 90) + 10,
                  );
                  setInput(next.join(", "));
                  load(next);
                }}
              >
                <Shuffle />
              </IconButton>
            )}
          </div>
        </div>
        {fieldCount > 0 && (
          <div className={`grid gap-3 ${COLUMNS[fieldCount]}`}>
            {controls.operations && (
              <div className="space-y-2">
                <Label htmlFor="operation">操作</Label>
                <Select
                  value={operation}
                  onValueChange={(selected) => {
                    if (load(values, selected)) setOperation(selected);
                  }}
                >
                  <SelectTrigger id="operation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {controls.operations.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {controls.index && (
              <div className="space-y-2">
                <Label htmlFor="index">{controls.index.label}</Label>
                <Input
                  id="index"
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
              <div className="space-y-2">
                <Label htmlFor="node-value">{controls.value.label}</Label>
                <Input
                  id="node-value"
                  type="number"
                  min={-999}
                  max={999}
                  value={value}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setValue(next);
                    load(values, operation, index, next);
                  }}
                />
              </div>
            )}
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Separator className="-mx-6 w-auto" />
        <AnimationCanvas
          key={traceVersion}
          frame={frame}
          previous={previousStep === null ? undefined : frames[previousStep]}
          kind={topic.scene}
          capacity={capacity}
          treeDepth={treeDepth}
          duration={1 / speed}
          paused={!playing && stepMode === "automatic"}
          onAnimatingChange={setAnimating}
        />
        {topic.legend && (
          <div className="flex flex-wrap justify-center gap-2" aria-label="图例">
            {topic.legend.map((entry) => (
              <Badge
                key={entry.label}
                variant="outline"
                className={legendTone[entry.tone] || undefined}
              >
                {entry.label}
              </Badge>
            ))}
          </div>
        )}
        {frame.stack.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">调用栈</span>
            {frame.stack.map((entry, i) => (
              <Badge variant="secondary" className="font-mono" key={i}>
                {entry}
              </Badge>
            ))}
          </div>
        )}
        {frame.queue && frame.queue.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-2 text-xs"
            aria-label="队列"
          >
            <span className="text-muted-foreground">队列</span>
            {frame.queue.map((entry, i) => (
              <Badge variant="secondary" className="font-mono" key={i}>
                {entry}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <PlaybackBar
        trace={trace}
        narration={frame.narration}
        total={frames.length}
      />
    </Card>
  );
}
