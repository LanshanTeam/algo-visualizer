import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import { AnimationCanvas } from "./animation-canvas";
import { cn } from "../lib/utils";
import { languages } from "../core/code";
import { parseValues } from "../core/trace";
import type { Language, TraceInput } from "../core/types";
import type { LegendEntry, ReadyTopic } from "../topics/types";

const DEFAULT_INDEX = 2;
const DEFAULT_VALUE = 31;
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

function IconButton({
  label,
  children,
  ...props
}: ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * 工作台。所有差异都来自 `topic` 的声明，
 * 新增专题不需要改动这里。
 */
export function TopicWorkspace({ topic }: { topic: ReadyTopic }) {
  const controls = topic.controls;
  const linked = topic.scene === "linked-list";
  const initialOperation = controls.operations?.[0]?.id ?? "";
  const [language, setLanguage] = useState<Language>("C");
  const [values, setValues] = useState(controls.defaultValues);
  const [input, setInput] = useState(() => controls.defaultValues.join(", "));
  const [operation, setOperation] = useState(initialOperation);
  const [index, setIndex] = useState(DEFAULT_INDEX);
  const [value, setValue] = useState(DEFAULT_VALUE);
  const [frames, setFrames] = useState(() =>
    topic.trace({
      values: controls.defaultValues,
      operation: initialOperation,
      index: DEFAULT_INDEX,
      value: DEFAULT_VALUE,
    }),
  );
  const [step, setStep] = useState(0);
  const [previousStep, setPreviousStep] = useState<number | null>(null);
  const [traceVersion, setTraceVersion] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [stepMode, setStepMode] = useState<"manual" | "automatic">("manual");
  const [animating, setAnimating] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const frame = frames[step];
  const capacity = useMemo(
    () => Math.max(...frames.map((frame) => frame.items.length)),
    [frames],
  );
  const code = useMemo(
    () => topic.code(language, operation),
    [topic, language, operation],
  );
  const hasTheory = !!topic.theory?.length;
  const showValue =
    !!controls.value &&
    (!controls.value.onlyFor || controls.value.onlyFor.includes(operation));
  const fieldCount =
    (controls.operations ? 1 : 0) + (controls.index ? 1 : 0) + (showValue ? 1 : 0);

  function load(
    nextValues = values,
    nextOperation = operation,
    nextIndex = index,
    nextValue = value,
  ) {
    try {
      const next: TraceInput = {
        values: nextValues,
        operation: nextOperation,
        index: nextIndex,
        value: nextValue,
      };
      setFrames(topic.trace(next));
      setStep(0);
      setPreviousStep(null);
      setTraceVersion((version) => version + 1);
      setPlaying(false);
      setStepMode("manual");
      setAnimating(false);
      setValues(nextValues);
      setError("");
      return true;
    } catch (cause) {
      setError((cause as Error).message);
      return false;
    }
  }
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (step >= frames.length - 1) setPlaying(false);
      else {
        setStepMode("automatic");
        setPreviousStep(step);
        setStep(step + 1);
      }
    }, 1400 / speed);
    return () => clearTimeout(timer);
  }, [playing, step, frames.length, speed]);
  const seek = useCallback(
    (next: number) => {
      setPlaying(false);
      setStepMode("manual");
      const target = Math.max(0, Math.min(frames.length - 1, next));
      if (target === step) return;
      setPreviousStep(
        !animating && Math.abs(target - step) === 1 ? step : null,
      );
      setStep(target);
    },
    [frames.length, step, animating],
  );
  const togglePlayback = useCallback(() => {
    if (!playing && step === frames.length - 1) {
      setPreviousStep(null);
      setStep(0);
    }
    setStepMode("automatic");
    setPlaying((p) => !p);
  }, [playing, step, frames.length]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        (event.target as HTMLElement).closest(
          'input,select,textarea,button,a,[role="slider"],[role="tab"]',
        )
      )
        return;
      if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
      }
      if (animating && ["ArrowRight", "ArrowLeft"].includes(event.key)) {
        event.preventDefault();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        seek(step + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        seek(step - 1);
      }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [step, seek, animating, togglePlayback]);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  function apply() {
    try {
      load(parseValues(input, controls.limit));
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        code.map((line) => line.text).join("\n"),
      );
      setCopied(true);
    } catch {
      setError("复制失败，请手动选择代码。");
    }
  }

  return (
    <div className="flex flex-col gap-6 xl:h-full xl:flex-row">
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
            linked={linked}
            capacity={capacity}
            duration={1 / speed}
            paused={!playing && stepMode === "automatic"}
            onAnimatingChange={setAnimating}
          />
          {topic.legend && (
            <div
              className="flex flex-wrap justify-center gap-2"
              aria-label="图例"
            >
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
        </CardContent>
        <div className="shrink-0 space-y-3 border-t px-6 pb-6 pt-4">
          <p
            className="min-h-6 text-sm leading-relaxed max-sm:min-h-10"
            aria-live="polite"
          >
            {frame.narration}
          </p>
          <div className="flex items-center gap-4">
            <Slider
              aria-label="演示进度"
              min={0}
              max={frames.length - 1}
              value={[step]}
              onValueChange={([next]) => seek(next)}
            />
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {step + 1} / {frames.length}
            </span>
          </div>
          <div
            data-playback-controls
            className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2"
          >
            <IconButton
              className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
              label="重新开始"
              onClick={() => seek(0)}
            >
              <RotateCcw />
            </IconButton>
            <IconButton
              label="上一步"
              className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
              variant="outline"
              disabled={step === 0 || animating}
              onClick={() => seek(step - 1)}
            >
              <ArrowLeft />
            </IconButton>
            <Button
              className="h-8 w-8 shrink-0 px-0 sm:h-9 sm:w-auto sm:px-4"
              aria-label={playing ? "暂停" : "播放"}
              onClick={togglePlayback}
            >
              {playing ? <Pause /> : <Play />}
              <span className="hidden sm:inline">
                {playing ? "暂停" : "播放"}
              </span>
            </Button>
            <IconButton
              label="下一步"
              className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
              variant="outline"
              disabled={step === frames.length - 1 || animating}
              onClick={() => seek(step + 1)}
            >
              <ArrowRight />
            </IconButton>
            <Select
              value={String(speed)}
              onValueChange={(next) => setSpeed(Number(next))}
            >
              <SelectTrigger
                className="h-8 w-[68px] shrink-0 px-2 text-xs sm:h-9 sm:w-20 sm:px-3 sm:text-sm"
                aria-label="播放速度"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0.5, 1, 1.5, 2, 4].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}×
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
      <Card
        className="flex min-w-0 flex-col xl:min-h-0 xl:flex-1"
        aria-labelledby="code-title"
      >
        <h2 id="code-title" className="sr-only">
          代码与原理
        </h2>
        <Tabs defaultValue="code" className="flex flex-col xl:min-h-0 xl:flex-1">
          <CardHeader>
            <TabsList
              aria-label="切换代码与原理"
              className={cn(
                "grid w-full",
                hasTheory ? "grid-cols-2" : "grid-cols-1",
              )}
            >
              <TabsTrigger value="code">代码</TabsTrigger>
              {hasTheory && <TabsTrigger value="theory">原理</TabsTrigger>}
            </TabsList>
          </CardHeader>
          <TabsContent
            value="code"
            className="mt-0 flex min-h-0 flex-col px-6 pb-6 pt-0 xl:flex-1"
          >
            <Tabs
              value={language}
              onValueChange={(next) => setLanguage(next as Language)}
              className="flex min-h-0 flex-col xl:flex-1"
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <TabsList
                  aria-label="代码语言"
                  style={{ "--lang-cols": String(languages.length) } as CSSProperties}
                  className="grid h-auto w-full grid-cols-3 min-[360px]:h-9 min-[360px]:[grid-template-columns:repeat(var(--lang-cols),minmax(0,1fr))]"
                >
                  {languages.map((lang) => (
                    <TabsTrigger
                      key={lang}
                      value={lang}
                      className="px-1 text-[11px] min-[400px]:text-xs sm:px-2 sm:text-sm"
                    >
                      {lang}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <IconButton
                  className="shrink-0"
                  label={copied ? "已复制" : "复制代码"}
                  onClick={copy}
                >
                  {copied ? <Check /> : <Copy />}
                </IconButton>
              </div>
              {languages.map((lang) => (
                <TabsContent
                  key={lang}
                  value={lang}
                  className="flex flex-col xl:min-h-0 xl:flex-1"
                >
                  <ScrollArea
                    className="h-[440px] xl:min-h-0 xl:flex-1"
                    role="region"
                    aria-label={`${lang} 代码`}
                    tabIndex={0}
                  >
                    <pre className="w-max min-w-full py-4 font-mono text-xs leading-7">
                      {code.map((line, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex border-l-2 border-transparent pr-4",
                            line.anchor === frame.anchor &&
                              "border-primary bg-accent text-accent-foreground",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className="w-10 shrink-0 select-none pr-4 text-right text-muted-foreground"
                          >
                            {i + 1}
                          </span>
                          <code>{line.text || " "}</code>
                        </div>
                      ))}
                    </pre>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
          {hasTheory && (
            <TabsContent
              value="theory"
              className="mt-0 grid content-start gap-6 px-6 pb-6 pt-0 text-sm leading-relaxed md:grid-cols-2 xl:min-h-0 xl:flex-1 xl:grid-cols-1 xl:overflow-y-auto"
            >
              {topic.theory?.map((block) => (
                <article className="space-y-2" key={block.title}>
                  <h3 className="font-medium">{block.title}</h3>
                  <p className="text-muted-foreground">{block.body}</p>
                </article>
              ))}
            </TabsContent>
          )}
        </Tabs>
      </Card>
    </div>
  );
}
