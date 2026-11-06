import {
  BookOpen,
  Gauge,
  Layers,
  ListOrdered,
  TriangleAlert,
} from "lucide-react";
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
      title: "核心思路",
      icon: BookOpen,
      body: "栈像一叠盘子：新盘子只能放在最上面，取盘子也只能从最上面拿。最后放入的元素最先离开，所以称为「后进先出」（LIFO，Last In First Out）。",
      items: [
        "固定不动的一端叫栈底，允许操作的一端叫栈顶。入栈（push）是在栈顶加入元素，出栈（pop）是移除栈顶元素。",
        "取栈顶（peek）只读取、不移除，因此操作前后栈的内容和 top 都不变。",
        "栈不能从中间随意插入或删除；正是这个限制，让每次操作都只需关注一个位置。",
      ],
    },
    {
      title: "看懂 top 的变化",
      icon: ListOrdered,
      body: "本页用数组保存栈，并用 top 记录栈顶元素的下标。空栈时 top = -1；有一个元素时 top = 0，之后每入栈一个元素，top 就增加 1。",
      items: [
        "入栈：先判断栈是否已满，再执行 top = top + 1，最后把新值写入 data[top]。",
        "出栈：先判断栈是否为空，读取 data[top]，再执行 top = top - 1。旧槽位里的数值不再属于当前栈。",
        "取栈顶：只读取 data[top]，不修改 top。画布上 top 徽标跟随移动，对应的就是这些变化。",
      ],
    },
    {
      title: "复杂度",
      icon: Gauge,
      body: "所有操作都发生在 top 指向的位置，不需要遍历，也不需要移动栈底或其他元素。",
      rows: [
        { label: "入栈 push", value: "O(1)" },
        { label: "出栈 pop", value: "O(1)" },
        { label: "取栈顶 peek", value: "O(1)" },
        { label: "判空或判满", value: "O(1)" },
        { label: "单次操作所需额外空间", value: "O(1)" },
      ],
    },
    {
      title: "易错点",
      icon: TriangleAlert,
      body: "top 是下标，不是元素个数；操作时还要分清「先动 top」还是「先读写数据」。",
      items: [
        "入栈若先写 data[top]，会覆盖原栈顶，所以应先让 top 加 1，再写入新元素。",
        "出栈若先让 top 减 1，再读 data[top]，读到的就是下一个元素，所以应先读取，再移动 top。",
        "空栈出栈会下溢，栈满入栈会溢出。本页容量为 6，两种情况都会给出提示帧，而不是继续执行非法操作。",
        "出栈后旧数值可能还留在数组里，但 top 以下的位置才是有效栈内容；不要把残留数值当成仍在栈中。",
      ],
    },
  ],
  trace: ({ values, operation, value }) =>
    stackTrace(values, operation, value),
  code: (language, operation) =>
    parseCode(templates[language][operation] ?? templates[language].push),
};
