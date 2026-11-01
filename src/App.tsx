import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
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
import { Alert, AlertDescription } from "./components/ui/alert";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { ScrollArea, ScrollBar } from "./components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Separator } from "./components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { Slider } from "./components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { AnimationCanvas } from "./components/animation-canvas";
import { TopicSidebar } from "./components/topic-sidebar";
import { cn } from "./lib/utils";
import { getCode, languages } from "./code";
import {
  linkedListTrace,
  parseValues,
  quickSortTrace,
  type Language,
  type Operation,
  type Topic,
} from "./trace";

const titles = { "linked-list": "单链表", "quick-sort": "快速排序" };
function readTopic(): Topic {
  return location.hash === "#/linked-list" ? "linked-list" : "quick-sort";
}
function defaultValues(topic: Topic) {
  return topic === "linked-list"
    ? [12, 24, 36, 48]
    : [38, 16, 54, 27, 8, 42, 23];
}
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

export default function App() {
  const [topic, setTopic] = useState<Topic>(readTopic);
  const linked = topic === "linked-list";
  const [language, setLanguage] = useState<Language>("C");
  const [values, setValues] = useState(() => defaultValues(readTopic()));
  const [input, setInput] = useState(values.join(", "));
  const [operation, setOperation] = useState<Operation>("insert");
  const [index, setIndex] = useState(2);
  const [value, setValue] = useState(31);
  const [frames, setFrames] = useState(() =>
    linked ? linkedListTrace(values, "insert", 2, 31) : quickSortTrace(values),
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
    () => getCode(topic, language, operation),
    [topic, language, operation],
  );

  function load(
    nextValues = values,
    nextOperation = operation,
    nextIndex = index,
    nextValue = value,
  ) {
    try {
      const next = linked
        ? linkedListTrace(nextValues, nextOperation, nextIndex, nextValue)
        : quickSortTrace(nextValues);
      setFrames(next);
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
  const navigate = useCallback((next: Topic) => {
    const defaults = defaultValues(next);
    setTopic(next);
    location.hash = `/${next}`;
    setValues(defaults);
    setInput(defaults.join(", "));
    setIndex(2);
    setValue(31);
    setOperation("insert");
    setFrames(
      next === "linked-list"
        ? linkedListTrace(defaults, "insert", 2, 31)
        : quickSortTrace(defaults),
    );
    setStep(0);
    setPreviousStep(null);
    setTraceVersion((version) => version + 1);
    setPlaying(false);
    setStepMode("manual");
    setAnimating(false);
    setError("");
  }, []);
  useEffect(() => {
    const change = () => {
      const next = readTopic();
      if (next !== topic) navigate(next);
    };
    addEventListener("hashchange", change);
    return () => removeEventListener("hashchange", change);
  }, [topic, navigate]);
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
      load(parseValues(input));
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
    <SidebarProvider>
      <TopicSidebar topic={topic} onNavigate={navigate} />
      <SidebarInset className="min-w-0 xl:h-dvh">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4 md:px-6">
          <SidebarTrigger aria-label="切换导航" />
          <Separator orientation="vertical" className="h-4" />
          <h1 className="text-lg font-semibold">{titles[topic]}</h1>
        </header>
        <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6 xl:min-h-0 xl:flex-1">
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
                  <Label htmlFor="values">{linked ? "初始链表" : "数组"}</Label>
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
                {linked && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="operation">操作</Label>
                      <Select
                        value={operation}
                        onValueChange={(selected) => {
                          const next = selected as Operation;
                          if (load(values, next)) setOperation(next);
                        }}
                      >
                        <SelectTrigger id="operation">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="insert">插入</SelectItem>
                          <SelectItem value="delete">删除</SelectItem>
                          <SelectItem value="find">查询</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="index">索引</Label>
                      <Input
                        id="index"
                        type="number"
                        min={0}
                        max={
                          operation === "insert"
                            ? values.length
                            : values.length - 1
                        }
                        value={index}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          setIndex(next);
                          load(values, operation, next);
                        }}
                      />
                    </div>
                    {operation === "insert" && (
                      <div className="space-y-2">
                        <Label htmlFor="node-value">节点值</Label>
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
                  previous={
                    previousStep === null ? undefined : frames[previousStep]
                  }
                  linked={linked}
                  capacity={capacity}
                  duration={1 / speed}
                  paused={!playing && stepMode === "automatic"}
                  onAnimatingChange={setAnimating}
                />
                <div
                  className="flex flex-wrap justify-center gap-2"
                  aria-label="图例"
                >
                  <Badge
                    variant="outline"
                    className="border-blue-300 bg-blue-50 text-blue-700"
                  >
                    当前操作
                  </Badge>
                  <Badge variant="outline">未处理</Badge>
                  {!linked && (
                    <Badge
                      variant="outline"
                      className="border-amber-300 bg-amber-50 text-amber-700"
                    >
                      基准
                    </Badge>
                  )}
                  {!linked && (
                    <Badge
                      variant="outline"
                      className="border-green-300 bg-green-50 text-green-700"
                    >
                      已归位
                    </Badge>
                  )}
                </div>
                {!linked && frame.stack.length > 0 && (
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
              <Tabs
                defaultValue="code"
                className="flex flex-col xl:min-h-0 xl:flex-1"
              >
                <CardHeader>
                  <TabsList
                    aria-label="切换代码与原理"
                    className="grid w-full grid-cols-2"
                  >
                    <TabsTrigger value="code">代码</TabsTrigger>
                    <TabsTrigger value="theory">原理</TabsTrigger>
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
                    <div className="flex items-center gap-2">
                      <TabsList
                        aria-label="代码语言"
                        className="grid w-full grid-cols-5"
                      >
                        {languages.map((lang) => (
                          <TabsTrigger
                            key={lang}
                            value={lang}
                            className="px-1 text-xs sm:px-3 sm:text-sm"
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
                <TabsContent
                  value="theory"
                  className="mt-0 grid content-start gap-6 px-6 pb-6 pt-0 text-sm leading-relaxed md:grid-cols-2 xl:min-h-0 xl:flex-1 xl:grid-cols-1 xl:overflow-y-auto"
                >
                  <article className="space-y-2">
                    <h3 className="font-medium">
                      {linked ? "链式存储" : "分区与递归"}
                    </h3>
                    <p className="text-muted-foreground">
                      {linked
                        ? "每个节点包含 value 和 next。head 指向首节点，尾节点的 next 为空；节点无需连续存储。"
                        : "以末尾元素为基准，将较小元素移到左侧。基准归位后，递归排序两侧，直到区间长度不超过 1。"}
                    </p>
                  </article>
                  <article className="space-y-2">
                    <h3 className="font-medium">
                      {linked ? "指针操作" : "分区不变量"}
                    </h3>
                    <p className="text-muted-foreground">
                      {linked
                        ? "插入时先连接新节点与后继，再更新前驱或 head。删除时让前驱绕过目标节点。索引从 0 开始。"
                        : "Lomuto 分区中，[low, i) 均小于基准，[i, j) 均不小于基准。扫描结束后交换 a[i] 与基准。"}
                    </p>
                  </article>
                  <article className="space-y-2">
                    <h3 className="font-medium">复杂度</h3>
                    <p className="text-muted-foreground">
                      {linked
                        ? "查询及按索引增删为 O(n)；已知前驱时，指针修改为 O(1)。额外空间 O(1)。"
                        : "平均时间 O(n log n)，最坏 O(n²)；平均递归空间 O(log n)，最坏 O(n)。此实现不稳定，有序或重复值较多时可能退化。"}
                    </p>
                  </article>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
