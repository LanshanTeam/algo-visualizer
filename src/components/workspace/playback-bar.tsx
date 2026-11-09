import { ArrowLeft, ArrowRight, ChevronDown, Pause, Play, RotateCcw } from "lucide-react";
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
    <div className="playback">
      <p className="narration" aria-live="polite">{narration}</p>
      <div className="progress-row">
        <input
          type="range"
          className="range"
          aria-label="演示进度"
          min={0}
          max={total - 1}
          value={step}
          onChange={(event) => seek(Number(event.target.value))}
        />
        <span className="progress-count">{step + 1} / {total}</span>
      </div>
      <div data-playback-controls className="controls">
        <IconButton className="btn-sm" label="重新开始" onClick={() => seek(0)}>
          <RotateCcw />
        </IconButton>
        <IconButton
          className="btn-sm"
          label="上一步"
          disabled={step === 0 || animating}
          onClick={() => seek(step - 1)}
        >
          <ArrowLeft />
        </IconButton>
        <button
          type="button"
          className="btn btn-primary btn-sm btn-play"
          aria-label={playing ? "暂停" : "播放"}
          onClick={togglePlayback}
        >
          {playing ? <Pause /> : <Play />}
          <span>{playing ? "暂停" : "播放"}</span>
        </button>
        <IconButton
          className="btn-sm"
          label="下一步"
          disabled={step === total - 1 || animating}
          onClick={() => seek(step + 1)}
        >
          <ArrowRight />
        </IconButton>
        <span className="select speed">
          <select
            aria-label="播放速度"
            value={String(speed)}
            onChange={(event) => setSpeed(Number(event.target.value))}
          >
            {[0.5, 1, 1.5, 2, 4].map((n) => (
              <option key={n} value={String(n)}>{n}×</option>
            ))}
          </select>
          <ChevronDown className="chev" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
