import type { CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
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
  const progress = total <= 1 ? 0 : (step / (total - 1)) * 100;

  return (
    <div className="playback">
      <p className="narration" aria-live="polite">
        {narration}
      </p>
      <div className="progress-row">
        <input
          className="range"
          type="range"
          aria-label="演示进度"
          min={0}
          max={total - 1}
          value={step}
          onChange={(event) => seek(Number(event.target.value))}
          style={{ "--progress": `${progress}%` } as CSSProperties}
        />
        <output>
          {step + 1} / {total}
        </output>
      </div>
      <div data-playback-controls className="transport">
        <IconButton label="重新开始" onClick={() => seek(0)}>
          <RotateCcw size={15} />
        </IconButton>
        <IconButton
          label="上一步"
          className="btn-outline"
          disabled={step === 0 || animating}
          onClick={() => seek(step - 1)}
        >
          <ArrowLeft size={15} />
        </IconButton>
        <button
          type="button"
          className="play-button"
          aria-label={playing ? "暂停" : "播放"}
          onClick={togglePlayback}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
          <span>{playing ? "暂停" : "播放"}</span>
        </button>
        <IconButton
          label="下一步"
          className="btn-outline"
          disabled={step === total - 1 || animating}
          onClick={() => seek(step + 1)}
        >
          <ArrowRight size={15} />
        </IconButton>
        <select
          className="speed"
          value={String(speed)}
          aria-label="播放速度"
          onChange={(event) => setSpeed(Number(event.target.value))}
        >
          {[0.5, 1, 1.5, 2, 4].map((n) => (
            <option key={n} value={String(n)}>
              {n}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
