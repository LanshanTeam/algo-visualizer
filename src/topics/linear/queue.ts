import { ListOrdered } from "lucide-react";
import { parseCode } from "../../core/code";
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
    !Number.isInteger(startFront) ||
    startFront < 0 ||
    startFront + values.length > capacity
  )
    throw new Error(
      `初始 front 须为 0 到 ${Math.max(0, capacity - values.length)} 的整数。`,
    );
  if (
    operation === "enqueue" &&
    (!Number.isInteger(value) || Math.abs(value) > MAX_VALUE)
  )
    throw new Error(`入队值须为 -${MAX_VALUE} 到 ${MAX_VALUE} 的整数。`);
  let items = values.map((item, id) => ({ id, value: item }));
  let front = startFront;
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
      max: ({ length }) => Math.max(0, QUEUE_CAPACITY - length),
    },
    value: { label: "入队值", onlyFor: ["enqueue"] },
  },
  legend: [
    { label: "当前操作", tone: "active" },
    { label: "未处理", tone: "idle" },
  ],
  theory: [
    {
      title: "先进先出",
      body: "队列在队尾入队、在队头出队，先进入的元素先离开。判空条件是 front 越过 rear。",
    },
    {
      title: "front 与 rear",
      body: "front 记录队头所在槽位，rear 记录队尾（新元素写入的位置）。出队只把 front 后移一格，其余元素原地不动，所以出队也是 O(1)。",
    },
    {
      title: "假溢出与循环队列",
      body: "front 左侧的槽位出队后就再也用不上了，rear 一撞到末端，即使前面空着也入不了队，这叫假溢出。把「初始 front」调大、元素填到队尾，就能复现这一幕；把 front 和 rear 改成对容量取模的循环队列即可复用空槽。",
    },
  ],
  trace: ({ values, operation, value, index }) =>
    queueTrace(values, operation, value, QUEUE_CAPACITY, index),
  code: (language, operation) =>
    parseCode(templates[language][operation] ?? templates[language].enqueue),
};
