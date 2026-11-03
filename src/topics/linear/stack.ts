import { Layers } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./stack-templates";

/** 画布上的定长容量，同时也是输入上限。 */
export const STACK_CAPACITY = 6;
const MAX_VALUE = 999;

/**
 * 栈的演示轨迹：只操作栈顶。
 * 元素身份稳定，栈底元素的下标始终不变，入栈出栈都发生在末尾。
 */
export function stackTrace(
  values: number[],
  operation: string,
  value: number,
  capacity = STACK_CAPACITY,
): Frame[] {
  if (values.length > capacity)
    throw new Error(`栈容量为 ${capacity}，请减少初始元素。`);
  if (
    operation === "push" &&
    (!Number.isInteger(value) || Math.abs(value) > MAX_VALUE)
  )
    throw new Error(`入栈值须为 -${MAX_VALUE} 到 ${MAX_VALUE} 的整数。`);
  let items = values.map((item, id) => ({ id, value: item }));
  const frames: Frame[] = [];
  function emit(
    anchor: string,
    narration: string,
    active: number[] = [],
    pointers: Record<string, number> = {},
  ) {
    const top = items.length - 1;
    frames.push({
      items: items.map((item) => ({ ...item })),
      active,
      settled: [],
      pointers: top < 0 ? {} : { top, ...pointers },
      anchor,
      narration,
      variables: { top, length: items.length, capacity },
      stack: [],
    });
  }
  const top = items.length - 1;
  emit(
    "start",
    top < 0
      ? "空栈：top = -1，栈底固定在数组起点。"
      : `栈只在一端操作：top = ${top} 指向栈顶，栈底固定不动。`,
    [],
    top < 0 ? {} : { top },
  );
  if (operation === "push") {
    if (items.length >= capacity) {
      emit(
        "check",
        `栈满：top = ${capacity - 1}，push 造成栈溢出，操作失败。`,
        [],
        { top },
      );
      return frames;
    }
    emit(
      "check",
      `检查栈满：top = ${top} < ${capacity - 1}，栈内还有空位。`,
      [],
      { top },
    );
    const at = items.length;
    items = [...items, { id: values.length, value }];
    emit(
      "push",
      `top 后移一格指向索引 ${at}，把 ${value} 写入栈顶。`,
      [at],
      { top: at },
    );
  }
  if (operation === "pop") {
    if (top < 0) {
      emit("check", "栈空：top = -1，pop 造成下溢，操作失败。");
      return frames;
    }
    emit(
      "check",
      `检查栈空：top = ${top} ≥ 0，栈顶元素可以弹出。`,
      [],
      { top },
    );
    emit(
      "top",
      `读取栈顶 a[${top}] = ${items[top].value}，这是唯一可以删除的位置。`,
      [top],
      { top },
    );
    items = items.filter((_, i) => i !== top);
    emit("pop", "top 下移一格，栈顶元素出栈，其余元素位置不变。");
  }
  if (operation === "peek") {
    if (top < 0) {
      emit("check", "栈空：top = -1，无栈顶可读。");
      return frames;
    }
    emit("check", `检查栈空：top = ${top} ≥ 0，可以读取栈顶。`, [], { top });
    emit(
      "top",
      `读取栈顶 a[${top}] = ${items[top].value}，只读操作不改变栈。`,
      [top],
      { top },
    );
  }
  const end = items.length - 1;
  emit(
    "done",
    end < 0
      ? "操作完成，栈已清空，top = -1。"
      : `操作完成：长度 ${items.length}，top = ${end}。`,
  );
  return frames;
}

export const stack: ReadyTopic = {
  id: "stack",
  group: "linear",
  title: "栈",
  badge: "LIFO",
  summary: "只在一端压入和弹出，后进先出。",
  status: "ready",
  scene: "stack",
  icon: Layers,
  controls: {
    dataLabel: "初始栈（栈底在前）",
    defaultValues: [43, 27, 65],
    limit: STACK_CAPACITY,
    capacity: STACK_CAPACITY,
    operations: [
      { id: "push", label: "入栈" },
      { id: "pop", label: "出栈" },
      { id: "peek", label: "取栈顶" },
    ],
    value: { label: "入栈值", onlyFor: ["push"] },
  },
  legend: [
    { label: "当前操作", tone: "active" },
    { label: "栈内元素", tone: "idle" },
  ],
  theory: [
    {
      title: "后进先出",
      body: "栈只允许在栈顶插入和删除，最先压入的元素最后才被弹出。栈底固定不动，插入删除都发生在同一端。",
    },
    {
      title: "栈顶指针",
      body: "用 top 记录栈顶下标，空栈时 top = -1。入栈是 top 加一后写入，出栈是先读 top 再把它减一。",
    },
    {
      title: "复杂度与溢出",
      body: "入栈、出栈、取栈顶都是 O(1)，额外空间 O(1)。定长顺序栈满后再入栈会溢出，空栈出栈会下溢，两者都要在代码里判断。",
    },
  ],
  trace: ({ values, operation, value }) =>
    stackTrace(values, operation, value),
  code: (language, operation) =>
    parseCode(templates[language][operation] ?? templates[language].push),
};
