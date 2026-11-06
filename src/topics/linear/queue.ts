import {
  BookOpen,
  Gauge,
  ListOrdered,
  Repeat2,
  TriangleAlert,
} from "lucide-react";
import { parseCode } from "../../core/code";
import { clampIndex } from "../../core/trace";
import type { Frame } from "../../core/types";
import type { ReadyTopic } from "../types";
import { templates } from "./queue-templates";

/** 画布上的槽位数，同时也是输入上限。 */
export const QUEUE_CAPACITY = 8;
const MAX_VALUE = 999;

/**
 * 顺序队列的演示轨迹。
 * `front` 记录队头所在槽位，出队只移动 front，元素本身不搬家；
 * `startFront` 给出初始已空出的槽位数，用来复现 front > 0 且 rear 已到末端的情形。
 * 超出可用范围的 startFront 会被夹到边界（元素占满时 front 只能是 0），
 * 这样工作台换数据、点随机按钮时都不会因为旧 front 越界而报错。
 */
export function queueTrace(
  values: number[],
  operation: string,
  value: number,
  capacity = QUEUE_CAPACITY,
  startFront = 0,
): Frame[] {
  if (values.length > capacity)
    throw new Error(`队列容量为 ${capacity}，请减少初始元素。`);
  if (
    operation === "enqueue" &&
    (!Number.isInteger(value) || Math.abs(value) > MAX_VALUE)
  )
    throw new Error(`入队值须为 -${MAX_VALUE} 到 ${MAX_VALUE} 的整数。`);
  let items = values.map((item, id) => ({ id, value: item }));
  let front = clampIndex(startFront, capacity - Math.max(values.length, 1));
  const frames: Frame[] = [];
  function emit(
    anchor: string,
    narration: string,
    active: number[] = [],
  ) {
    frames.push({
      items: items.map((item) => ({ ...item })),
      active,
      settled: [],
      pointers:
        items.length === 0
          ? {}
          : { front: 0, rear: items.length - 1 },
      anchor,
      narration,
      variables: {
        front,
        rear: front + items.length - 1,
        length: items.length,
        capacity,
      },
      stack: [],
    });
  }
  const rear = front + items.length - 1;
  emit(
    "start",
    items.length
      ? `front = ${front} 指向队头，rear = ${rear} 指向队尾，元素占据连续槽位。`
      : `队列为空：front = ${front}、rear = ${rear}，两者错开一位。`,
  );
  if (operation === "enqueue") {
    if (rear + 1 >= capacity) {
      emit(
        "check",
        front > 0
          ? `rear + 1 = ${rear + 1} 已到槽位末端，而 front = ${front} 左侧还空着 ${front} 个槽位。顺序队列的 rear 不会回退，这些空位用不上，这就是假溢出——要靠循环队列把 rear 绕回开头。`
          : `队列已满：rear + 1 = ${rear + 1} 到达容量 ${capacity}，队尾没有空槽，入队失败。`,
      );
      return frames;
    }
    emit(
      "check",
      `检查队满：rear + 1 = ${rear + 1} < 容量 ${capacity}，队尾还有空槽。`,
    );
    const at = items.length;
    items = [...items, { id: values.length, value }];
    emit(
      "write",
      `rear 后移到槽位 ${front + at}，把 ${value} 写入队尾。`,
      [at],
    );
  }
  if (operation === "dequeue") {
    if (items.length === 0) {
      emit(
        "check",
        `队列为空（front = ${front} > rear = ${rear}），出队失败：队列下溢。`,
      );
      return frames;
    }
    emit(
      "check",
      `检查队空：front = ${front} ≤ rear = ${rear}，队头元素可以出队。`,
    );
    emit(
      "front",
      `读取队头 a[${front}] = ${items[0].value}，只有这一个位置可以出队。`,
      [0],
    );
    items = items.slice(1);
    front += 1;
    emit(
      "dequeue",
      `front 后移到槽位 ${front}：元素原地不动，只把队头槽位空出来。`,
      items.length ? [0] : [],
    );
  }
  if (operation === "peek") {
    if (items.length === 0) {
      emit("check", `队列为空（front = ${front}），无队头可读。`);
      return frames;
    }
    emit(
      "check",
      `检查队空：front = ${front} ≤ rear = ${rear}，可以读取队头。`,
    );
    emit(
      "front",
      `读取队头 a[${front}] = ${items[0].value}，只读操作不改变队列。`,
      [0],
    );
  }
  emit(
    "done",
    items.length
      ? `操作完成：长度 ${items.length}，front = ${front}，rear = ${front + items.length - 1}。`
      : `操作完成：队列已空，front = rear + 1 = ${front}。`,
  );
  return frames;
}

export const queue: ReadyTopic = {
  id: "queue",
  group: "linear",
  title: "队列",
  badge: "FIFO",
  summary: "队尾入队、队头出队，先进先出。",
  status: "ready",
  scene: "queue",
  icon: ListOrdered,
  controls: {
    dataLabel: "初始队列（队头在前）",
    defaultValues: [14, 28, 42],
    limit: QUEUE_CAPACITY,
    capacity: QUEUE_CAPACITY,
    operations: [
      { id: "enqueue", label: "入队" },
      { id: "dequeue", label: "出队" },
      { id: "peek", label: "取队头" },
    ],
    index: {
      label: "初始 front",
      default: 0,
      occupiesSlots: true,
      // 空队列时 front 也停在真实槽位上，不能顶到容量之外
      max: ({ length }) =>
        Math.max(0, QUEUE_CAPACITY - Math.max(length, 1)),
    },
    value: { label: "入队值", onlyFor: ["enqueue"] },
  },
  legend: [
    { label: "当前操作", tone: "active" },
    { label: "未处理", tone: "idle" },
  ],
  theory: [
    {
      title: "核心思路",
      icon: BookOpen,
      body: "队列像排队买票：新来的人排到队尾，队头的人先办理、先离开。最早进入的元素最先离开，所以称为「先进先出」（FIFO，First In First Out）。",
      items: [
        "入队（enqueue）只在队尾添加元素，出队（dequeue）只移除队头元素，取队头（peek）只读取、不移除。",
        "队列不允许从中间随意插入或删除；操作位置固定，因此不需要像顺序表那样让整段元素搬家。",
        "本页用定长数组和两个下标 front、rear 表示队列，画布中的元素顺序就是它们入队的先后顺序。",
      ],
    },
    {
      title: "看懂 front 与 rear",
      icon: ListOrdered,
      body: "本页约定 front 指向当前队头元素，rear 指向当前队尾元素，而不是下一个待写位置。按这个约定，空队列满足 front > rear。",
      items: [
        "入队：先检查 rear + 1 是否越界，再把新元素写入 rear + 1 对应的槽位，最后让 rear 加 1。",
        "出队：先检查队列是否为空，读取 front 指向的元素，再让 front 加 1；其余元素保持不动。",
        "取队头只读取 data[front]。本页还有「初始 front」控件，用来让队列从数组中间的槽位开始，观察左侧空槽的影响。",
      ],
    },
    {
      title: "复杂度",
      icon: Gauge,
      body: "front 和 rear 直接给出操作位置，每次只读取一个元素或移动一个下标，与队列中有多少元素无关。",
      rows: [
        { label: "入队 enqueue", value: "O(1)" },
        { label: "出队 dequeue", value: "O(1)" },
        { label: "取队头 peek", value: "O(1)" },
        { label: "判空或判满", value: "O(1)" },
        { label: "单次操作所需额外空间", value: "O(1)" },
      ],
    },
    {
      title: "易错点",
      icon: TriangleAlert,
      body: "front、rear 的具体含义必须在整个程序中保持一致。本页的 rear 是队尾下标，因此判空与判满都围绕这个约定书写。",
      items: [
        "判空看 front > rear，不是 front === rear；只有一个元素时 front 与 rear 恰好相等。",
        "本页判满看 rear + 1 >= 容量。若把 rear 改成指向下一个空槽，判空、判满和更新顺序都要随之调整。",
        "取队头不等于出队：peek 后 front 和 rear 不变，dequeue 后 front 必须向后移动。",
        "出队只是让 front 越过旧元素，不一定要把旧槽位清零；旧数值即使还在数组中，也已经不属于队列。",
      ],
    },
    {
      title: "假溢出与循环队列",
      icon: Repeat2,
      body: "普通顺序队列的 front 和 rear 只向后走。出队会留下左侧空槽，但 rear 到达数组末端后仍无法入队，这种「前面有空位却装不下」的现象叫假溢出。",
      items: [
        "把「初始 front」调大，再让元素一直填到数组末端，就能在本页复现假溢出；若所有槽位都有有效元素，则是真正队满。",
        "循环队列把数组首尾相接，用取模让 front、rear 从末端回到 0，从而复用空槽。本页代码演示普通顺序队列，循环队列只在这里介绍。",
      ],
    },
  ],
  trace: ({ values, operation, value, index }) =>
    queueTrace(values, operation, value, QUEUE_CAPACITY, index),
  code: (language, operation) =>
    parseCode(templates[language][operation] ?? templates[language].enqueue),
};
