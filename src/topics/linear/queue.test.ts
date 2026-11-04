import { describe, expect, it } from "vitest";
import { languages } from "../../core/code";
import { QUEUE_CAPACITY, queue, queueTrace } from "./queue";

describe("顺序队列", () => {
  it("入队在队尾追加，front 不变", () => {
    const frames = queueTrace([14, 28, 42], "enqueue", 56);
    const last = frames.at(-1)!;
    expect(last.items.map((item) => item.value)).toEqual([14, 28, 42, 56]);
    expect(last.variables).toMatchObject({ front: 0, rear: 3, length: 4 });
    expect(last.pointers).toEqual({ front: 0, rear: 3 });
  });
  it("出队移除队头，front 前移一格", () => {
    const frames = queueTrace([14, 28, 42], "dequeue", 0);
    const last = frames.at(-1)!;
    expect(last.items.map((item) => item.value)).toEqual([28, 42]);
    expect(last.items.map((item) => item.id)).toEqual([1, 2]);
    expect(last.variables).toMatchObject({ front: 1, rear: 2 });
  });
  it("连续出队后 front 停在空出的槽位上", () => {
    const frames = queueTrace([14, 28, 42], "dequeue", 0);
    expect(frames[0].variables.front).toBe(0);
    expect(frames.at(-1)!.variables.front).toBe(1);
    const empty = queueTrace([14], "dequeue", 0).at(-1)!;
    expect(empty.items).toHaveLength(0);
    expect(empty.variables.front).toBe(1);
  });
  it("取队头不改变队列", () => {
    const frames = queueTrace([14, 28], "peek", 0);
    expect(frames.at(-1)!.items).toHaveLength(2);
    expect(frames[2].anchor).toBe("front");
    expect(frames[2].narration).toContain("14");
  });
  it("八个槽位占满时是真正的队满", () => {
    const full = Array.from({ length: QUEUE_CAPACITY }, (_, i) => i);
    const frames = queueTrace(full, "enqueue", 9);
    const last = frames.at(-1)!;
    expect(last.anchor).toBe("check");
    expect(last.narration).toContain("队列已满");
    expect(last.narration).not.toContain("假溢出");
    expect(last.items).toHaveLength(QUEUE_CAPACITY);
  });
  it("初始 front 偏移 + 队尾占满才是假溢出", () => {
    const frames = queueTrace(
      [1, 2, 3, 4, 5, 6],
      "enqueue",
      9,
      QUEUE_CAPACITY,
      2,
    );
    const last = frames.at(-1)!;
    expect(last.anchor).toBe("check");
    expect(last.narration).toContain("假溢出");
    expect(last.narration).toContain("空着 2 个槽位");
    // 六个元素占满 2..7，前两个槽位是空的，rear 已经到底
    expect(last.variables).toMatchObject({ front: 2, rear: 7 });
    expect(last.items).toHaveLength(6);
  });
  it("初始 front 只挪动槽位起点，出队入队逻辑不变", () => {
    const frames = queueTrace([1, 2, 3], "dequeue", 0, QUEUE_CAPACITY, 3);
    const last = frames.at(-1)!;
    expect(last.variables).toMatchObject({ front: 4, rear: 5 });
    expect(last.items.map((item) => item.value)).toEqual([2, 3]);
  });
  it("拒绝越界的初始 front", () => {
    expect(() =>
      queueTrace([1, 2, 3], "peek", 0, QUEUE_CAPACITY, 6),
    ).toThrow();
    expect(() => queueTrace([], "peek", 0, QUEUE_CAPACITY, -1)).toThrow();
    expect(() => queueTrace([1], "peek", 0, QUEUE_CAPACITY, 1.5)).toThrow();
  });
  it("空队列出队与取队头只提示下溢", () => {
    for (const operation of ["dequeue", "peek"])
      expect(queueTrace([], operation, 0).at(-1)!.narration).toContain("队列为空");
  });
  it("拒绝超长初始队列与非整数入队值", () => {
    expect(() => queueTrace(Array(9).fill(0), "enqueue", 1)).toThrow();
    expect(() => queueTrace([], "enqueue", 1.5)).toThrow();
  });
  it("所有语言覆盖每个语义步骤", () => {
    for (const operation of ["enqueue", "dequeue", "peek"] as const)
      for (const frame of queueTrace([1, 2, 3], operation, 9))
        for (const language of languages)
          expect(
            queue.code(language, operation).some(
              (line) => line.anchor === frame.anchor,
            ),
          ).toBe(true);
  });
  it("六种语言都用固定数组 + front/rear，不用会自动挪元素的容器", () => {
    for (const language of languages) {
      const source = ["enqueue", "dequeue", "peek"]
        .map((operation) =>
          queue
            .code(language, operation)
            .map((line) => line.text)
            .join("\n"),
        )
        .join("\n");
      // deque / VecDeque 出队不空出槽位，会和动画演示的顺序队列对不上
      expect(source).not.toMatch(
        /\bdeque\b|\bDeque\b|popleft|pop_front|push_back/,
      );
      expect(source).toMatch(/rear\s*\+\s*1\s*>=/);
      expect(source).toMatch(/front\s*>\s*(q->|\*)?rear/);
    }
  });
  it("声明固定槽位数", () => {
    expect(queue.controls.capacity).toBe(QUEUE_CAPACITY);
    expect(queue.scene).toBe("queue");
  });
});
