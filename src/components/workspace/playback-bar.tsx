import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Slider } from "../ui/slider";
import { IconButton } from "./icon-button";
import type { TopicTrace } from "./use-topic-trace";

export function PlaybackBar({
  trace,
  narration,
  total,
}: {
  trace: TopicTrace;
  narration: string;
  total: number;
}) {
  const { step, playing, animating, speed, setSpeed, seek, togglePlayback } =
    trace;

  return (
    <div className="shrink-0 space-y-3 border-t px-6 pb-6 pt-4">
      <p
        className="min-h-6 text-sm leading-relaxed max-sm:min-h-10"
        aria-live="polite"
      >
        {narration}
      </p>
      <div className="flex items-center gap-4">
        <Slider
          aria-label="演示进度"
          min={0}
          max={total - 1}
          value={[step]}
          onValueChange={([next]) => seek(next)}
        />
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {step + 1} / {total}
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
          disabled={step === total - 1 || animating}
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
  );
}
