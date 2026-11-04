import { useCallback, useEffect, useMemo, useState } from "react";
import { clampIndex, parseValues } from "../../core/trace";
import type { Language, TraceInput } from "../../core/types";
import type { ReadyTopic } from "../../topics/types";

const DEFAULT_INDEX = 2;
const DEFAULT_VALUE = 31;

export function useTopicTrace(topic: ReadyTopic) {
  const controls = topic.controls;
  const initialText = controls.defaultInput ?? controls.defaultValues.join(", ");
  const initialOperation =
    controls.operations?.find((entry) => entry.id === controls.defaultOperation)
      ?.id ??
    controls.operations?.[0]?.id ??
    "";
  const initialValue = controls.value?.defaultValue ?? DEFAULT_VALUE;
  const initialValue2 = controls.value2?.defaultValue ?? DEFAULT_VALUE;
  const initialValues = useMemo(
    () =>
      controls.parseInput
        ? controls.parseInput(initialText, controls.limit)
        : controls.defaultValues,
    [controls, initialText],
  );
  // 专题可以自带初始索引（队列的初始 front 默认 0），越界时先夹住再建轨迹。
  const initialIndex = useMemo(() => {
    const base = controls.index?.default ?? DEFAULT_INDEX;
    if (!controls.index) return base;
    return clampIndex(
      base,
      controls.index.max({ length: initialValues.length, operation: initialOperation }),
    );
  }, [controls, initialOperation, initialValues]);
  const [language, setLanguage] = useState<Language>("C");
  const [values, setValues] = useState(initialValues);
  const [input, setInput] = useState(initialText);
  const [operation, setOperation] = useState(initialOperation);
  const [index, setIndex] = useState(initialIndex);
  const [value, setValue] = useState(initialValue);
  const [value2, setValue2] = useState(initialValue2);
  const [frames, setFrames] = useState(() =>
    topic.trace({
      values: initialValues,
      operation: initialOperation,
      index: initialIndex,
      value: initialValue,
      value2: initialValue2,
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
    () =>
      Math.max(
        controls.capacity ?? 0,
        ...frames.map((frame) => frame.items.length),
      ),
    [controls.capacity, frames],
  );
  const code = useMemo(
    () => topic.code(language, operation),
    [topic, language, operation],
  );
  const hasTheory = !!topic.theory?.length;
  const showValue =
    !!controls.value &&
    (!controls.value.onlyFor || controls.value.onlyFor.includes(operation));
  const showValue2 =
    !!controls.value2 &&
    (!controls.value2.onlyFor || controls.value2.onlyFor.includes(operation));
  const fieldCount =
    (controls.operations ? 1 : 0) +
    (controls.index ? 1 : 0) +
    (showValue ? 1 : 0) +
    (showValue2 ? 1 : 0);

  function load(
    nextValues = values,
    nextOperation = operation,
    nextIndex = index,
    nextValue = value,
    nextValue2 = value2,
  ) {
    try {
      // 数据或操作变了以后旧索引可能越界（队列的前部槽位被占满、删除时上界变小），
      // 先夹到合法区间，保证输入框和画布用的是同一个值。
      const max = controls.index?.max({
        length: nextValues.length,
        operation: nextOperation,
      });
      const clamped = max === undefined ? nextIndex : clampIndex(nextIndex, max);
      const next: TraceInput = {
        values: nextValues,
        operation: nextOperation,
        index: clamped,
        value: nextValue,
        value2: nextValue2,
      };
      setFrames(topic.trace(next));
      setStep(0);
      setPreviousStep(null);
      setTraceVersion((version) => version + 1);
      setPlaying(false);
      setStepMode("manual");
      setAnimating(false);
      setValues(nextValues);
      setIndex(clamped);
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
      load((controls.parseInput ?? parseValues)(input, controls.limit));
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

  return {
    language,
    setLanguage,
    values,
    input,
    setInput,
    operation,
    setOperation,
    index,
    setIndex,
    value,
    setValue,
    value2,
    setValue2,
    frames,
    step,
    previousStep,
    traceVersion,
    playing,
    stepMode,
    animating,
    setAnimating,
    speed,
    setSpeed,
    error,
    copied,
    frame,
    capacity,
    code,
    hasTheory,
    showValue,
    showValue2,
    fieldCount,
    load,
    seek,
    togglePlayback,
    apply,
    copy,
  };
}

export type TopicTrace = ReturnType<typeof useTopicTrace>;
